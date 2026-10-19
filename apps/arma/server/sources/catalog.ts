// The current app's catalog, read-only (public.sets, cards, card_prices): set keys, its own card pictures
// and the TCGplayer variants stored with the prices
import { normNumber, variantFromTcgplayer, type ArmaVariant, type Claim } from '@pokenitsu/core';
import { crossTcgdex, nameKey, tdSetId } from '@pokenitsu/inventory';
import { pool } from '../db.ts';
import { fetchJson } from './http.ts';

export { nameKey };

interface SetRow {
  id: string;
  name: string;
  name_en: string | null;
  code: string | null;
  source: string;
  release_date: Date | null;
  tcgdex_en: string | null;
}
export interface Catalog {
  sets: Map<string, SetRow>;
  /** international set by its name (Bulbapedia's enset) */
  intlByName: Map<string, string>;
  /** Japanese set by its English collector name (PokeCottage, Bulbapedia's jpset) */
  jaByName: Map<string, string>;
  /** the international sets only TCGdex has (catalogo-desde-tcgdex), by their name */
  tdByName: Map<string, string>;
  /** TCGdex's international set id → our set id */
  fromTcgdex: Map<string, string>;
  /** "set|number" → our card id */
  cardIds: Map<string, string>;
}

export async function loadCatalog(): Promise<Catalog> {
  const { rows: sets } = await pool.query<SetRow>(
    `SELECT id, name, name_en, code, source, release_date, tcgdex_en FROM public.sets WHERE source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en')`,
  );
  const { rows: cards } = await pool.query<{ id: string; set_id: string; number_norm: string }>(
    `SELECT c.id, c.set_id, c.number_norm FROM public.cards c JOIN public.sets s ON s.id = c.set_id
     WHERE s.source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en')`,
  );
  const intl = sets.filter(s => s.source === 'ptcg');
  const onlyTd = sets.filter(s => s.source === 'tcgdex-en');
  // by tcgdex_en, by name and by id, as the catalog does (sellos-y-cruce-de-expansiones)
  const td = (await fetchJson<{ id: string; name: string }[]>('https://api.tcgdex.net/v2/en/sets')) || [];
  const fromTcgdex = crossTcgdex(intl, td);
  // and what did not cross is its own set in the catalog when it has it (catalogo-desde-tcgdex): tk-xy-sy → td-tk-xy-sy
  const ids = new Set(onlyTd.map(s => s.id));
  for (const x of td) if (!fromTcgdex.has(x.id) && ids.has(tdSetId(x.id))) fromTcgdex.set(x.id, tdSetId(x.id));
  return {
    sets: new Map(sets.map(s => [s.id, s])),
    intlByName: new Map(intl.map(s => [nameKey(s.name), s.id])),
    tdByName: new Map(onlyTd.map(s => [nameKey(s.name), s.id])),
    jaByName: new Map(sets.filter(s => s.source === 'tcgdex-ja' && s.name_en).map(s => [nameKey(s.name_en), s.id])),
    fromTcgdex,
    cardIds: new Map(cards.map(c => [`${c.set_id}|${c.number_norm}`, c.id])),
  };
}
/** the cards of these sets, added to the catalog once they are downloaded (an import that brought them first) */
export async function addCards(cat: Catalog, setIds: string[]) {
  if (!setIds.length) return;
  const { rows } = await pool.query<{ id: string; set_id: string; number_norm: string }>(
    `SELECT id, set_id, number_norm FROM public.cards WHERE set_id = ANY ($1)`,
    [setIds],
  );
  for (const c of rows) cat.cardIds.set(`${c.set_id}|${c.number_norm}`, c.id);
}
/** an international set by its name, also without the "EX " prefix Bulbapedia uses for the EX era */
export const intlSetByName = (cat: Catalog, name: unknown) =>
  cat.intlByName.get(nameKey(name)) ?? cat.intlByName.get(nameKey(String(name ?? '').replace(/^EX /, '')));
/**
 * A set only TCGdex has, by its name or, for a trainer kit, by its Pokémon (catalogo-desde-tcgdex): PokeCottage's
 * "XY Trainer Kit: Sylveon Half Deck" is TCGdex's "XY trainer Kit (Sylveon)"
 */
export function tdSetByName(cat: Catalog, name: unknown): string | undefined {
  const hit = cat.tdByName.get(nameKey(name));
  if (hit) return hit;
  const kit = String(name ?? '').match(/^(.*?)\s*Trainer Kit:?\s*(.+?)(?:\s+Half Deck)?$/i);
  if (!kit) return undefined;
  const want = nameKey(`${kit[1]} trainer kit (${kit[2]})`);
  return cat.tdByName.get(want);
}
// "Undaunted" is our "HS—Undaunted": the only set whose name ends with it after a series prefix
export function bySeriesSuffix(cat: Catalog, english: string): string | undefined {
  const k = nameKey(english);
  const hits = [...cat.intlByName].filter(([name]) => name.endsWith(k) && name !== k);
  return hits.length === 1 ? hits[0]![1] : undefined;
}
export const cardIdOf = (cat: Catalog, setKey: string, number: string) => cat.cardIds.get(`${setKey}|${normNumber(number)}`);

// standard variants the catalog knows for a card (cards.variants, from TCGdex) when it has no TCGplayer prices
const STANDARD: Record<string, ArmaVariant> = {
  normal: { finish: 'normal', stamp: null },
  holo: { finish: 'holo', stamp: null },
  reverse: { finish: 'reverse', stamp: null },
  firstedition: { finish: 'normal', stamp: '1st-edition' },
};

/** Claims from the current catalog: pokemontcg.io cards (with our own pictures) and TCGplayer's variants and prices */
export async function catalogClaims(dex: number): Promise<Claim[]> {
  const { rows } = await pool.query<{
    id: string;
    set_id: string;
    number: string;
    name: string;
    artist: string | null;
    image_large: string | null;
    variants: string[] | null;
    set_name: string;
    release_date: Date | null;
    usd: Record<string, number | { market?: number; mid?: number } | null> | null;
  }>(
    `SELECT c.id, c.set_id, c.number, c.name, c.artist, c.image_large, c.variants, s.name AS set_name, s.release_date,
            CASE WHEN jsonb_typeof(p.usd) = 'object' THEN p.usd END AS usd
     FROM public.cards c JOIN public.sets s ON s.id = c.set_id LEFT JOIN public.card_prices p ON p.card_id = c.id
     WHERE $1 = ANY (c.dex) AND s.source = 'ptcg'`,
    [dex],
  );
  const out: Claim[] = [];
  for (const r of rows) {
    const base = {
      setKey: r.set_id,
      number: r.number,
      lang: 'EN',
      name: r.name,
      setName: r.set_name,
      cardId: r.id,
      ...(r.artist ? { artist: r.artist } : {}),
      ...(r.release_date ? { release: r.release_date.toISOString().slice(0, 10) } : {}),
    };
    // our own copy of the picture (images.pokemontcg.io), never a third party's
    const image = r.image_large && r.image_large.startsWith('/img/') ? { image: r.image_large } : {};
    const tp = Object.keys(r.usd || {})
      .map(k => ({ k, v: variantFromTcgplayer(k) }))
      .filter((x): x is { k: string; v: ArmaVariant } => !!x.v);
    for (const { k, v } of tp) {
      const raw = r.usd?.[k];
      // stored as a plain number (or, older, as {market, mid})
      const price = typeof raw === 'number' ? raw : (raw?.market ?? raw?.mid);
      out.push({ ...base, ...v, source: 'tcgplayer', ref: `${r.id}:${k}`, ...(price ? { price: `US$ ${price.toFixed(2)}` } : {}) });
    }
    const own = tp.length ? tp.map(x => x.v) : (r.variants || ['normal']).map(v => STANDARD[v]).filter((x): x is ArmaVariant => !!x);
    for (const v of own.length ? own : [STANDARD.normal!]) out.push({ ...base, ...image, ...v, source: 'pokemontcg', ref: r.id });
  }
  return out;
}
