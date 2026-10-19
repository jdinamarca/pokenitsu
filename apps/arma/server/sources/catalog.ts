// The current app's catalog, read-only (public.sets, cards, card_prices): set keys, its own card pictures
// and the TCGplayer variants stored with the prices
import { normNumber, variantFromTcgplayer, type ArmaVariant, type Claim } from '@pokenitsu/core';
import { pool } from '../db.ts';
import { fetchJson } from './http.ts';

export const nameKey = (x: unknown) =>
  String(x ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

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
  /** TCGdex's international set id → our set id */
  fromTcgdex: Map<string, string>;
  /** "set|number" → our card id */
  cardIds: Map<string, string>;
}

export async function loadCatalog(): Promise<Catalog> {
  const { rows: sets } = await pool.query<SetRow>(
    `SELECT id, name, name_en, code, source, release_date, tcgdex_en FROM public.sets WHERE source IN ('ptcg', 'tcgdex-ja')`,
  );
  const { rows: cards } = await pool.query<{ id: string; set_id: string; number_norm: string }>(
    `SELECT c.id, c.set_id, c.number_norm FROM public.cards c JOIN public.sets s ON s.id = c.set_id WHERE s.source IN ('ptcg', 'tcgdex-ja')`,
  );
  const intl = sets.filter(s => s.source === 'ptcg');
  const fromTcgdex = new Map<string, string>();
  for (const s of intl) if (s.tcgdex_en) fromTcgdex.set(s.tcgdex_en, s.id);
  // the rest by name, the way the API does it (prices.js), only when the name is unambiguous on both sides
  const td = (await fetchJson<{ id: string; name: string }[]>('https://api.tcgdex.net/v2/en/sets')) || [];
  const tdByName = new Map<string, string[]>();
  for (const x of td) tdByName.set(nameKey(x.name), [...(tdByName.get(nameKey(x.name)) || []), x.id]);
  const ourByName = new Map<string, SetRow[]>();
  for (const s of intl) ourByName.set(nameKey(s.name), [...(ourByName.get(nameKey(s.name)) || []), s]);
  for (const [k, ours] of ourByName) {
    const theirs = tdByName.get(k);
    if (ours.length === 1 && theirs?.length === 1 && !fromTcgdex.has(theirs[0]!) && !ours[0]!.tcgdex_en)
      fromTcgdex.set(theirs[0]!, ours[0]!.id);
  }
  // what did not cross by name, by its id when one of ours has it and nobody took it (sellos-y-cruce-de-expansiones):
  // TCGdex's "Undaunted" (hgss3) is our "HS—Undaunted", its "SVP Black Star Promos" (svp) our Scarlet & Violet ones
  const taken = new Set(fromTcgdex.values());
  const ourIds = new Set(intl.map(s => s.id));
  for (const x of td) if (!fromTcgdex.has(x.id) && ourIds.has(x.id) && !taken.has(x.id)) fromTcgdex.set(x.id, x.id);
  return {
    sets: new Map(sets.map(s => [s.id, s])),
    intlByName: new Map(intl.map(s => [nameKey(s.name), s.id])),
    jaByName: new Map(sets.filter(s => s.source === 'tcgdex-ja' && s.name_en).map(s => [nameKey(s.name_en), s.id])),
    fromTcgdex,
    cardIds: new Map(cards.map(c => [`${c.set_id}|${c.number_norm}`, c.id])),
  };
}
/** an international set by its name, also without the "EX " prefix Bulbapedia uses for the EX era */
export const intlSetByName = (cat: Catalog, name: unknown) =>
  cat.intlByName.get(nameKey(name)) ?? cat.intlByName.get(nameKey(String(name ?? '').replace(/^EX /, '')));
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
