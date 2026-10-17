// An expansion's cards, downloaded the first time they're needed: pokemontcg.io for the international ones,
// TCGdex for the Japanese ones (sets "ja-…"). Moved from apps/api/src/catalog.js (cargar-e-inventario-en-arma).
import { normNumber } from '@pokenitsu/core';
import JA_NAMES_JSON from './ja-sets.json' with { type: 'json' };
import { bad, type Db } from './db.js';

export const PTCG_API = 'https://api.pokemontcg.io/v2';
export const TCGDEX_JA = 'https://api.tcgdex.net/v2/ja';
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

  const syncing = new Map<string, Promise<void>>();
  /** Downloads a set's cards the first time they're needed (or when forced) */
  async function ensureSetCards(setId: string, force = false): Promise<void> {
    const { rows } = await db.query<{ cards_synced_at: Date | null; source: string }>(
      'SELECT cards_synced_at, source FROM sets WHERE id = $1',
      [setId],
    );
    if (!rows.length) throw bad(`La expansión ${setId} no existe`, 404);
    // typed by hand, or left from the old PokeCottage checklists (in use, so kept): nothing to download
    if (['manual', 'pokecottage'].includes(rows[0]!.source) || (!force && rows[0]!.cards_synced_at)) return;
    const sync = rows[0]!.source === 'tcgdex-ja' ? syncJaSet : syncSetCards;
    if (!syncing.has(setId))
      syncing.set(
        setId,
        sync(setId).finally(() => syncing.delete(setId)),
      );
    return syncing.get(setId);
  }

  return { ensureSetCards };
}
export type Catalog = ReturnType<typeof createCatalog>;
