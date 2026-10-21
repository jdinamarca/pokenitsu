// An expansion's cards, downloaded the first time they're needed: pokemontcg.io for the international ones,
// TCGdex for the Japanese ones (sets "ja-…"). Moved from apps/api/src/catalog.js (cargar-e-inventario-en-arma).
import { normNumber } from '@pokenitsu/core';
import JA_NAMES_JSON from './ja-sets.json' with { type: 'json' };
import { bad, type Db } from './db.js';

export const PTCG_API = 'https://api.pokemontcg.io/v2';
export const TCGDEX_JA = 'https://api.tcgdex.net/v2/ja';
export const TCGDEX_EN = 'https://api.tcgdex.net/v2/en';
/** card number as the index compares it ("025" → "25") */
export const norm = normNumber;

// the APIs return intermittent 502s, so retry with backoff
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJSON(url: string, tries = 5): Promise<any> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
      last = new Error(`HTTP ${r.status} en ${url}`);
    } catch (e) {
      last = e;
    }
    await new Promise(r => setTimeout(r, 700 * (i + 1)));
  }
  throw last;
}

// English collector names of Japanese sets (TCGdex only has the Japanese one), Japanese names TCGdex has wrong, and junk entries
// to leave out (by set code): the CS* sets are empty placeholders all named トリプレットビート, and SM1+ / sm2+ / SM3+ / SM4+ / SM5+
// are empty duplicates of SM1p… SM5p, which have the cards
export const JA_NAMES = JA_NAMES_JSON as { en: Record<string, string>; fixJa: Record<string, string>; hidden?: string[] };
export const jaName = (code: string, name: string): string => JA_NAMES.fixJa[code] || name;
export const jaNameEn = (code: string): string | null => JA_NAMES.en[code] || null;
export const JA_HIDDEN = new Set(JA_NAMES.hidden || []);
export const JA_SUPERTYPE: Record<string, string> = { Pokemon: 'Pokémon', Trainer: 'Trainer', Energy: 'Energy' };
export const jaImg = (base: string | null | undefined, size: string): string | null => (base ? `${base}/${size}.webp` : null);

interface PtcgCard {
  id: string;
  name: string;
  number: string;
  nationalPokedexNumbers?: number[];
  artist?: string;
  rarity?: string;
  supertype?: string;
  images?: { small?: string; large?: string };
}

// ---------- international sets only TCGdex has (catalogo-desde-tcgdex) ----------
/** a set name as two sources compare it: "HS—Undaunted" → "hsundaunted" */
export const nameKey = (x: unknown) =>
  String(x ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
export interface OurSet {
  id: string;
  name: string;
  tcgdex_en: string | null;
}
/**
 * TCGdex's international set id → ours: by sets.tcgdex_en, then by name when it is unambiguous on both sides, then by
 * the same id when nobody took it ("Undaunted" is our "HS—Undaunted", hgss3). Shared by the Full and the catalog.
 */
export function crossTcgdex(ours: readonly OurSet[], theirs: readonly { id: string; name: string }[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const s of ours) if (s.tcgdex_en) out.set(s.tcgdex_en, s.id);
  const tdByName = new Map<string, string[]>();
  for (const x of theirs) tdByName.set(nameKey(x.name), [...(tdByName.get(nameKey(x.name)) || []), x.id]);
  const ourByName = new Map<string, OurSet[]>();
  for (const s of ours) ourByName.set(nameKey(s.name), [...(ourByName.get(nameKey(s.name)) || []), s]);
  for (const [k, o] of ourByName) {
    const t = tdByName.get(k);
    if (o.length === 1 && t?.length === 1 && !out.has(t[0]!) && !o[0]!.tcgdex_en) out.set(t[0]!, o[0]!.id);
  }
  const taken = new Set(out.values());
  const ids = new Set(ours.map(s => s.id));
  for (const x of theirs) if (!out.has(x.id) && ids.has(x.id) && !taken.has(x.id)) out.set(x.id, x.id);
  return out;
}
/** our id of a set only TCGdex has */
export const tdSetId = (tcgdexId: string) => `td-${tcgdexId}`;
// a trainer kit's or a McDonald's collection's era, which TCGdex files under its own series
const TD_SERIES: [RegExp, string][] = [
  [/^tk-dp/, 'Diamond & Pearl'],
  [/^tk-hs/, 'HeartGold & SoulSilver'],
  [/^tk-bw/, 'Black & White'],
  [/^tk-xy/, 'XY'],
  [/^tk-sm/, 'Sun & Moon'],
  [/sv$/, 'Scarlet & Violet'],
  [/^fut2020$/, 'Sword & Shield'],
];
export interface TdSet {
  id: string;
  name: string;
  releaseDate?: string;
  serie?: { id?: string; name?: string };
  cardCount?: { total?: number; official?: number };
  abbreviation?: { official?: string };
  symbol?: string;
  cards?: { id: string; localId: string; name: string; image?: string }[];
}
/** the row of a set only TCGdex has, or null when it is left out: Pokémon TCG Pocket (digital) and sets without cards */
export function tdSetRow(s: TdSet) {
  if (s.serie?.id === 'tcgp' || !s.cards?.length) return null;
  return {
    id: tdSetId(s.id),
    name: s.name,
    series: TD_SERIES.find(([re]) => re.test(s.id))?.[1] || s.serie?.name || null,
    code: s.abbreviation?.official || null,
    release_date: s.releaseDate || null,
    total: s.cardCount?.total ?? s.cards.length,
    printed_total: s.cardCount?.official ?? null,
    symbol_url: s.symbol ? `${s.symbol}.webp` : null,
  };
}
export interface TdCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
  illustrator?: string;
  dexId?: number[];
  category?: string;
}
/** the row of one of its cards */
export const tdCardRow = (setId: string, x: TdCard) => ({
  id: tdSetId(x.id),
  set_id: setId,
  number: x.localId,
  number_norm: norm(x.localId),
  name: x.name,
  supertype: (x.category && JA_SUPERTYPE[x.category]) || x.category || null,
  rarity: x.rarity && x.rarity !== 'None' ? x.rarity : null,
  artist: x.illustrator || null,
  dex: x.dexId || [],
  image_small: jaImg(x.image, 'low'),
  image_large: jaImg(x.image, 'high'),
});
// Pokémon TCG Pocket's ids (A1, B2a, P-A): left out before asking for their details
const POCKET = /^(A\d|B\d|P-[A-Z])/;

/** The catalog half: downloads an expansion's cards once (one download per expansion at a time, per process). */
export function createCatalog(db: Db) {
  async function syncSetCards(setId: string): Promise<void> {
    let page = 1,
      got = 0,
      total = Infinity;
    const all: PtcgCard[] = [];
    while (got < total) {
      const j = await fetchJSON(
        `${PTCG_API}/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&select=id,name,number,nationalPokedexNumbers,artist,rarity,images,supertype`,
      );
      total = j.totalCount;
      if (!j.data.length) break;
      all.push(...j.data);
      got += j.data.length;
      page++;
    }
    if (!got || got < total) throw new Error(`descarga incompleta de la expansión ${setId} (${got}/${total})`);
    // a few sets repeat a number (e.g. cel25c); keep the first card with each one
    const seen = new Set<string>();
    const unique = all.filter(x => !seen.has(x.number) && seen.add(x.number));
    await db.tx(async c => {
      for (const x of unique) {
        await c.query(
          `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (id) DO UPDATE SET number=$3, number_norm=$4, name=$5, supertype=$6, rarity=$7, artist=$8, dex=$9,
             -- a picture we already copied (/img/…, imagenes.js) stays
             image_small=CASE WHEN cards.image_small LIKE '/img/%' THEN cards.image_small ELSE $10 END, image_large=CASE WHEN cards.image_large LIKE '/img/%' THEN cards.image_large ELSE $11 END`,
          [
            x.id,
            setId,
            x.number,
            norm(x.number),
            x.name,
            x.supertype || null,
            x.rarity || null,
            x.artist || null,
            x.nationalPokedexNumbers || [],
            x.images?.small || null,
            x.images?.large || null,
          ],
        );
      }
      await c.query('UPDATE sets SET cards_synced_at = now() WHERE id = $1', [setId]);
    });
  }

  // Set details (date, series) and the basic data of all its cards; detailed card data comes later (syncJaDex)
  async function syncJaSet(setId: string): Promise<void> {
    const s = await fetchJSON(`${TCGDEX_JA}/sets/${encodeURIComponent(setId.replace(/^ja-/, ''))}`);
    await db.tx(async c => {
      await c.query(
        `INSERT INTO sets (id, name, series, code, release_date, total, printed_total, source, lang, cards_synced_at, name_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'tcgdex-ja', 'JA', now(), $8)
         ON CONFLICT (id) DO UPDATE SET name = $2, series = $3, release_date = $5, total = $6, printed_total = $7, cards_synced_at = now(), name_en = $8`,
        [
          'ja-' + s.id,
          jaName(s.id, s.name),
          s.serie?.name || null,
          s.id,
          s.releaseDate || null,
          s.cardCount?.total || null,
          s.cardCount?.official || null,
          jaNameEn(s.id),
        ],
      );
      for (const x of s.cards || []) {
        await c.query(
          `INSERT INTO cards (id, set_id, number, number_norm, name, image_small, image_large)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
          ['ja-' + x.id, 'ja-' + s.id, x.localId, norm(x.localId), x.name, jaImg(x.image, 'low'), jaImg(x.image, 'high')],
        );
      }
    });
  }

  /**
   * The international sets only TCGdex has, added or updated as `tcgdex-en` (catalogo-desde-tcgdex): every TCGdex set
   * that does not cross with pokemontcg.io's, but Pocket's and the empty ones; one request per set, one after the other
   */
  async function syncTdSets(): Promise<number> {
    const list = (await fetchJSON(`${TCGDEX_EN}/sets`)) as { id: string; name: string }[];
    const { rows: ours } = await db.query<OurSet>(`SELECT id, name, tcgdex_en FROM sets WHERE source = 'ptcg'`);
    const crossed = crossTcgdex(ours, list);
    let n = 0;
    for (const x of list) {
      if (crossed.has(x.id) || POCKET.test(x.id)) continue;
      const row = tdSetRow((await fetchJSON(`${TCGDEX_EN}/sets/${encodeURIComponent(x.id)}`)) as TdSet);
      if (!row) continue;
      await db.query(
        `INSERT INTO sets (id, name, series, code, release_date, total, printed_total, symbol_url, source, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'tcgdex-en', now())
         ON CONFLICT (id) DO UPDATE SET name = $2, series = $3, code = $4, release_date = $5, total = $6, printed_total = $7,
           symbol_url = $8, synced_at = now()`,
        [row.id, row.name, row.series, row.code, row.release_date, row.total, row.printed_total, row.symbol_url],
      );
      n++;
    }
    return n;
  }
  /** a `tcgdex-en` set's cards: the set's list, then each card's details (Pokédex, rarity, illustrator, kind) */
  async function syncTdSet(setId: string): Promise<void> {
    const s = (await fetchJSON(`${TCGDEX_EN}/sets/${encodeURIComponent(setId.replace(/^td-/, ''))}`)) as TdSet;
    const cards: TdCard[] = [];
    for (const x of s.cards || []) cards.push((await fetchJSON(`${TCGDEX_EN}/cards/${encodeURIComponent(x.id)}`)) as TdCard);
    await db.tx(async c => {
      for (const x of cards) {
        const r = tdCardRow(setId, x);
        await c.query(
          `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET number = $3, number_norm = $4, name = $5, supertype = $6, rarity = $7, artist = $8, dex = $9,
             image_small = CASE WHEN cards.image_small LIKE '/img/%' THEN cards.image_small ELSE coalesce($10, cards.image_small) END,
             image_large = CASE WHEN cards.image_large LIKE '/img/%' THEN cards.image_large ELSE coalesce($11, cards.image_large) END`,
          [r.id, r.set_id, r.number, r.number_norm, r.name, r.supertype, r.rarity, r.artist, r.dex, r.image_small, r.image_large],
        );
      }
      await c.query('UPDATE sets SET cards_synced_at = now() WHERE id = $1', [setId]);
    });
  }

  const syncing = new Map<string, Promise<void>>();
  /** Downloads a set's cards the first time they're needed (or when forced) */
  async function ensureSetCards(setId: string, force = false): Promise<void> {
    const { rows } = await db.query<{ cards_synced_at: Date | null; source: string }>(
      'SELECT cards_synced_at, source FROM sets WHERE id = $1',
      [setId],
    );
    if (!rows.length) throw bad(`La expansión ${setId} no existe`, 404);
    // typed by hand, left from the old PokeCottage checklists (in use, so kept) or built by Arma (asia): nothing to download
    if (['manual', 'pokecottage', 'asia'].includes(rows[0]!.source) || (!force && rows[0]!.cards_synced_at)) return;
    const sync = rows[0]!.source === 'tcgdex-ja' ? syncJaSet : rows[0]!.source === 'tcgdex-en' ? syncTdSet : syncSetCards;
    if (!syncing.has(setId))
      syncing.set(
        setId,
        sync(setId).finally(() => syncing.delete(setId)),
      );
    return syncing.get(setId);
  }

  return { ensureSetCards, syncTdSets };
}
export type Catalog = ReturnType<typeof createCatalog>;
