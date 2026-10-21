// Photos for local use only of the Japanese catalog (fotos-solo-local-en-catalogo, fotos-pokecottage-en-catalogo): of
// each card with no photo of the catalog, ours nor its printing's, Limitless TCG's scan (per expansion) and, for what
// Limitless lacks, PokeCottage's (per Pokémon, by hand only, one request at a time). Downloaded once to LOCAL_IMAGE_DIR
// (never IMAGE_DIR) and recorded in arma.card_photos with its source (permission 'local').
import { basename, join } from 'node:path';
import { pool } from './db.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { fillJaSetFromLimitless } from './jaLists.ts';
import { limitlessFile, limitlessUrl } from './limitless.ts';
import { fileOf } from './localPhotos.ts';
import { loadCatalog } from './sources/catalog.ts';
import { downloadOnce, SourceBusy, stats } from './sources/http.ts';
import { billsPage, billsSlug, matchBills, type BillsCard } from './sources/billsarchive.ts';
import { matchPokecottage, pokecottageAlbum, type PcCard } from './sources/pokecottage.ts';
import { speciesNames } from './sources/tcgdex.ts';

/** the photos of the Full's printings of a catalog card (card_id, source_id, src, stamp, finish, code): only in the
 *  card's language (a Taiwanese printing tied to a Japanese card isn't its photo) and not one marked as showing another variant */
export const PRINTED_PHOTOS = `(SELECT p.card_id, f.source_id, f.value AS src, p.stamp, p.finish, p.code
  FROM arma.printings p JOIN cards c ON c.id = p.card_id JOIN sets k ON k.id = c.set_id
  JOIN arma.facts f ON f.printing_code = p.code AND f.field = 'image' AND f.value IS NOT NULL
  LEFT JOIN arma.photo_marks m ON m.src = f.value
  WHERE p.lang = coalesce(nullif(k.lang, ''), 'EN') AND coalesce(m.shows, '') = coalesce(p.stamp, ''))`;

export interface SetPhotos {
  set: string;
  /** cards without a photo when it started */
  cards: number;
  fetched: number;
  existing: number;
  missing: number;
  failed: number;
  /** Limitless doesn't have the expansion: its first cards were all missing, the rest weren't asked */
  skipped: boolean;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// the first cards answer whether Limitless has the expansion at all (1997–2005 sets: it doesn't)
const PROBE = 4;

const running = new Map<string, Promise<SetPhotos | null>>();
// cards the source doesn't have, and expansions it doesn't have: not asked again while this server runs
const notThere = new Set<string>();
const setNotThere = new Set<string>();
/** downloads what an expansion lacks (only: just the cards of those Pokémon); null when the photos are off or the
 *  expansion isn't Japanese */
export function ensureLocalCardPhotos(setId: string, only: number[] | null = null): Promise<SetPhotos | null> {
  if (!localPhotosOn() || !setId.startsWith('ja-') || setNotThere.has(setId)) return Promise.resolve(null);
  const key = only ? `${setId}|${only.join(',')}` : setId;
  if (!running.has(key))
    running.set(
      key,
      run(setId, only).finally(() => running.delete(key)),
    );
  return running.get(key)!;
}

async function run(setId: string, only: number[] | null): Promise<SetPhotos> {
  const { rows } = await pool.query<{ id: string; number: string }>(
    `SELECT c.id, c.number FROM cards c
     WHERE c.set_id = $1 AND c.image_small IS NULL AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
       AND ($2::int[] IS NULL OR c.dex && $2)
     ORDER BY c.number_norm ~ '^[0-9]+$' DESC, nullif(regexp_replace(c.number_norm, '[^0-9]', '', 'g'), '')::int NULLS LAST, c.number`,
    [setId, only],
  );
  // the probe only says "Limitless doesn't have it" for an expansion with no photo from it yet: one that has some is
  // there, and its pending cards are the ones it lacks
  const { rowCount: started } = await pool.query(
    `SELECT 1 FROM arma.card_photos p JOIN cards c ON c.id = p.card_id WHERE c.set_id = $1 AND p.source_id = 'limitless' LIMIT 1`,
    [setId],
  );
  const r: SetPhotos = { set: setId, cards: rows.length, fetched: 0, existing: 0, missing: 0, failed: 0, skipped: false };
  const todo = rows.flatMap(c => {
    if (notThere.has(c.id)) return [];
    const f = limitlessFile(setId, c.number);
    return f ? [{ id: c.id, url: limitlessUrl(f) }] : [];
  });
  for (let i = 0; i < todo.length; i += 2) {
    await Promise.all(
      todo.slice(i, i + 2).map(async ({ id, url }) => {
        // the same file name as the Full's photos from Limitless: both share one download
        const file = join('limitless', basename(new URL(url).pathname));
        try {
          const got = await downloadOnce(url, join(LOCAL_IMAGE_DIR, file));
          r[got]++;
          if (got === 'missing') notThere.add(id);
          if (got !== 'missing')
            await pool.query(
              `INSERT INTO arma.card_photos (card_id, source_id, src, ref) VALUES ($1, 'limitless', $2, $3)
               ON CONFLICT (card_id, source_id) DO UPDATE SET src = EXCLUDED.src, ref = EXCLUDED.ref, saved_at = now()`,
              [id, `/img-local/${file}`, url],
            );
        } catch {
          r.failed++;
        }
      }),
    );
    if (!started && i + 2 >= PROBE && r.missing === i + 2 && i + 2 < todo.length) {
      r.skipped = true;
      setNotThere.add(setId);
      break;
    }
    if (i + 2 < todo.length) await sleep(250);
  }
  return r;
}

// ---------- PokeCottage, per Pokémon: one request at a time, with pauses ----------
export interface Polite {
  /** after an album or a photo actually asked (not one from the cache or already on disk) */
  albumPause: number;
  photoPause: number;
  /** after a failure that isn't a "wait" (SourceBusy says its own) */
  errorPause: number;
  /** this many failures in a row stop the step */
  maxFails: number;
}
export const POLITE: Polite = { albumPause: 1500, photoPause: 750, errorPause: 5000, maxFails: 3 };
export interface PcGroup {
  dex: number;
  cards: PcCard[];
}
export interface PcIo {
  species: (dex: number) => Promise<string>;
  jaByName: Map<string, string>;
  /** the codes of our Simplified Chinese expansions (CBB4C, 30TH…) */
  zhCodes?: readonly string[];
  record: (cardId: string, file: string, url: string) => Promise<void>;
}
class Stopped extends Error {}
const FAILED = Symbol('failed');
type Ask = <T>(fn: () => Promise<T>) => Promise<T | typeof FAILED>;
type Photo = (cardId: string, url: string, folder: string, record: PcIo['record']) => Promise<boolean>;

/**
 * One source's step, polite: ask() makes one request, waits what a 429/503 asks and asks again, and gives up on any other
 * failure after a pause; photo() downloads once, records it and pauses when it was asked. Several failures in a row stop
 * the step (j.stopped); asking again later goes on with what's left.
 */
async function politeStep(
  source: string,
  j: CatalogJob,
  count: SourceCount,
  polite: Polite,
  body: (ask: Ask, photo: Photo) => Promise<void>,
): Promise<void> {
  let fails = 0;
  const ask: Ask = async fn => {
    for (;;) {
      try {
        const r = await fn();
        fails = 0;
        return r;
      } catch (e) {
        if (++fails >= polite.maxFails)
          throw new Stopped(`${source} respondió con errores ${fails} veces seguidas (${e instanceof Error ? e.message : String(e)})`);
        const ms = e instanceof SourceBusy ? e.retryAfterMs : polite.errorPause;
        j.waitingUntil = new Date(Date.now() + ms).toISOString();
        await sleep(ms);
        j.waitingUntil = undefined;
        if (!(e instanceof SourceBusy)) return FAILED;
      }
    }
  };
  const photo: Photo = async (cardId, url, folder, record) => {
    const file = join(folder, fileOf(url));
    const got = await ask(() => downloadOnce(url, join(LOCAL_IMAGE_DIR, file)));
    if (got === FAILED) {
      count.failed++;
      return false;
    }
    count[got]++;
    if (got === 'missing') return false;
    await record(cardId, file, url);
    if (got === 'fetched') await sleep(polite.photoPause);
    return true;
  };
  try {
    await body(ask, photo);
  } catch (e) {
    if (!(e instanceof Stopped)) throw e;
    j.stopped = e.message;
  }
}

/** each Pokémon's album and the photos of its cards; never two requests at once, the progress in j */
export async function pokecottageStep(groups: PcGroup[], io: PcIo, j: CatalogJob, polite: Polite = POLITE): Promise<void> {
  const s = j.bySource.pokecottage;
  const done = new Set<string>();
  await politeStep('PokeCottage', j, s, polite, async (ask, photo) => {
    for (const g of groups) {
      j.current = `#${g.dex}`;
      const cards = g.cards.filter(c => !done.has(c.id));
      if (cards.length) {
        const before = stats.fetched;
        const album = await ask(async () => pokecottageAlbum(g.dex, await io.species(g.dex)));
        if (stats.fetched > before) await sleep(polite.albumPause);
        if (album === FAILED) s.failed += cards.length;
        else {
          const found = album ? matchPokecottage(album, cards, io.jaByName, io.zhCodes) : new Map<string, string>();
          s.missing += cards.length - found.size;
          for (const [id, url] of found) if (await photo(id, url, 'pokecottage-fotos', io.record)) done.add(id);
        }
      }
      j.pokemonDone++;
    }
  });
}

// ---------- Bill's Archive, per expansion (fotos-billsarchive-japonesas) ----------
export interface BillsGroup {
  setId: string;
  /** its English name: the page's address (Leaders' Stadium → /leaders-stadium-jp.html) */
  name: string;
  /** cards of the expansion in the catalog: the page must have as many */
  total: number;
  cards: BillsCard[];
}
/** each expansion's page and the photos of its cards still without one; the same pace and stops as PokeCottage */
export async function billsStep(groups: BillsGroup[], record: PcIo['record'], j: CatalogJob, polite: Polite = POLITE): Promise<void> {
  const s = j.bySource.billsarchive;
  await politeStep("Bill's Archive", j, s, polite, async (ask, photo) => {
    for (const g of groups) {
      j.current = g.name;
      const before = stats.fetched;
      const page = await ask(() => billsPage(billsSlug(g.name)));
      if (stats.fetched > before) await sleep(polite.albumPause);
      if (page === FAILED) s.failed += g.cards.length;
      else if (!page) {
        s.missing += g.cards.length;
        j.billsSkipped.push(`${g.name} (no la tiene)`);
      } else {
        const { mismatch, found } = matchBills(page, g.setId, g.total, g.cards);
        if (mismatch) {
          s.missing += g.cards.length;
          j.billsSkipped.push(`${g.name} (su página no calza con el catálogo)`);
        } else {
          s.missing += g.cards.length - found.size;
          for (const [id, url] of found) await photo(id, url, 'billsarchive', record);
        }
      }
      j.billsDone++;
    }
  });
}

// ---------- the whole Japanese catalog, asked by the administrator from the gallery ----------
export interface SourceCount {
  fetched: number;
  existing: number;
  missing: number;
  failed: number;
}
export interface CatalogJob {
  running: boolean;
  /** Limitless per expansion first, then PokeCottage per Pokémon and Bill's Archive per expansion for what's left */
  phase: 'limitless' | 'pokecottage' | 'billsarchive';
  sets: number;
  done: number;
  pokemon: number;
  pokemonDone: number;
  billsSets: number;
  billsDone: number;
  /** expansions Bill's Archive doesn't have, or whose page doesn't match the catalog */
  billsSkipped: string[];
  /** the expansion or Pokémon (#133) being asked */
  current: string | null;
  bySource: { limitless: SourceCount; pokecottage: SourceCount; billsarchive: SourceCount };
  /** first, the Japanese expansions TCGdex has without cards get Limitless's list (lista-de-limitless-en-japonesas-vacias) */
  lists: { sets: number; done: number; tcgdex: number; cards: number; missing: string[] };
  /** expansions Limitless doesn't have */
  skipped: string[];
  /** PokeCottage asked to wait (or failed): the next request after this */
  waitingUntil?: string;
  /** PokeCottage failed too many times in a row: asking again goes on with what's left */
  stopped?: string;
  error?: string;
}
const count = (): SourceCount => ({ fetched: 0, existing: 0, missing: 0, failed: 0 });
/** a photo found for a catalog card, kept with its source */
const recordAs =
  (source: string): PcIo['record'] =>
  async (id, file, url) => {
    await pool.query(
      `INSERT INTO arma.card_photos (card_id, source_id, src, ref) VALUES ($1, $2, $3, $4)
       ON CONFLICT (card_id, source_id) DO UPDATE SET src = EXCLUDED.src, ref = EXCLUDED.ref, saved_at = now()`,
      [id, source, `/img-local/${file}`, url],
    );
  };
let job: CatalogJob | null = null;
export const catalogJob = () => job;
/** dex / sets: only the cards of those Pokémon or expansions, in every step; to try it without the whole catalog */
export function startCatalogPhotos({ dex, sets }: { dex?: number[]; sets?: string[] } = {}): CatalogJob {
  if (!localPhotosOn()) throw Object.assign(new Error('Las fotos solo locales están apagadas (ARMA_FOTOS_LOCALES=1)'), { statusCode: 403 });
  if (job?.running) return job;
  const only = dex?.length ? dex : null;
  const onlySets = sets?.length ? sets : null;
  const j: CatalogJob = (job = {
    running: true,
    phase: 'limitless',
    sets: 0,
    done: 0,
    pokemon: 0,
    pokemonDone: 0,
    billsSets: 0,
    billsDone: 0,
    billsSkipped: [],
    current: null,
    bySource: { limitless: count(), pokecottage: count(), billsarchive: count() },
    lists: { sets: 0, done: 0, tcgdex: 0, cards: 0, missing: [] },
    skipped: [],
  });
  (async () => {
    // the lists first, one expansion after the other, so their cards get photos below: TCGdex's for one never opened,
    // and Limitless's when TCGdex has it without cards or only Limitless has it (expansiones-japonesas-de-limitless)
    const { rows: empty } = await pool.query<{ id: string; asked: boolean }>(
      `SELECT s.id, s.cards_synced_at IS NOT NULL AS asked FROM sets s
       WHERE s.source IN ('tcgdex-ja', 'limitless') AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id)
         AND ($1::text[] IS NULL OR s.id = ANY ($1))
       ORDER BY 1`,
      [onlySets],
    );
    j.lists.sets = empty.length;
    const { ensureSetCards } = await import('./inventory.ts');
    for (const { id, asked } of empty) {
      j.current = id;
      if (!asked) {
        await ensureSetCards(id).catch(e => console.warn(`[arma] lista de TCGdex de ${id}:`, e instanceof Error ? e.message : e));
        const { rows } = await pool.query<{ n: number }>('SELECT count(*)::int AS n FROM cards WHERE set_id = $1', [id]);
        if (rows[0]!.n) {
          j.lists.tcgdex++;
          j.lists.done++;
          continue;
        }
      }
      const r = await fillJaSetFromLimitless(id).catch(e => {
        console.warn(`[arma] lista de Limitless de ${id}:`, e instanceof Error ? e.message : e);
        return 'missing' as const;
      });
      if (r === 'missing' || !r) j.lists.missing.push(id.slice(3));
      else if (r) j.lists.cards += r.filled;
      j.lists.done++;
    }
    const { rows } = await pool.query<{ set_id: string }>(
      `SELECT DISTINCT c.set_id FROM cards c
       WHERE c.set_id LIKE 'ja-%' AND c.image_small IS NULL AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
         AND ($1::int[] IS NULL OR c.dex && $1) AND ($2::text[] IS NULL OR c.set_id = ANY ($2))
       ORDER BY 1`,
      [only, onlySets],
    );
    j.sets = rows.length;
    const l = j.bySource.limitless;
    for (const { set_id } of rows) {
      j.current = set_id;
      const r = await ensureLocalCardPhotos(set_id, only);
      if (r) {
        l.fetched += r.fetched;
        l.existing += r.existing;
        l.missing += r.missing;
        l.failed += r.failed;
        if (r.skipped) j.skipped.push(set_id);
      }
      j.done++;
    }

    // PokeCottage: the Japanese and Simplified Chinese cards of a Pokémon still without any photo, grouped by Pokémon
    j.phase = 'pokecottage';
    j.current = null;
    const { rows: cards } = await pool.query<PcCard>(
      `SELECT c.id, c.set_id, c.number, c.dex FROM cards c JOIN sets s ON s.id = c.set_id
       WHERE s.lang IN ('JA', 'ZH-CN') AND c.image_small IS NULL AND cardinality(c.dex) > 0
         AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
         AND NOT EXISTS (SELECT 1 FROM ${PRINTED_PHOTOS} x WHERE x.card_id = c.id)
         AND ($1::int[] IS NULL OR c.dex && $1) AND ($2::text[] IS NULL OR c.set_id = ANY ($2))`,
      [only, onlySets],
    );
    const byDex = new Map<number, PcCard[]>();
    for (const c of cards) for (const d of c.dex) if (!only || only.includes(d)) byDex.set(d, [...(byDex.get(d) || []), c]);
    const groups = [...byDex].sort(([a], [b]) => a - b).map(([d, cs]) => ({ dex: d, cards: cs }));
    j.pokemon = groups.length;
    const { jaByName } = await loadCatalog();
    const { rows: zh } = await pool.query<{ code: string }>(
      `SELECT substr(id, length('zh-cn-') + 1) AS code FROM sets WHERE source = 'asia' AND lang = 'ZH-CN'`,
    );
    await pokecottageStep(
      groups,
      {
        species: async d => (await speciesNames(d)).en,
        jaByName,
        zhCodes: zh.map(r => r.code),
        record: recordAs('pokecottage-fotos'),
      },
      j,
    );
    if (j.stopped) return;

    // Bill's Archive: what's still without any photo (Trainers and Energies, mostly), per expansion
    j.phase = 'billsarchive';
    j.current = null;
    const { rows: left } = await pool.query<BillsCard & { name: string; total: number }>(
      `SELECT c.id, c.set_id, c.number, coalesce(s.name_en, s.name) AS name,
              (SELECT count(*)::int FROM cards k WHERE k.set_id = c.set_id) AS total
       FROM cards c JOIN sets s ON s.id = c.set_id
       WHERE s.lang = 'JA' AND c.image_small IS NULL
         AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
         AND NOT EXISTS (SELECT 1 FROM ${PRINTED_PHOTOS} x WHERE x.card_id = c.id)
         AND ($1::int[] IS NULL OR c.dex && $1) AND ($2::text[] IS NULL OR c.set_id = ANY ($2))
       ORDER BY s.release_date NULLS LAST, c.set_id`,
      [only, onlySets],
    );
    const bySet = new Map<string, BillsGroup>();
    for (const c of left) {
      const g = bySet.get(c.set_id) || { setId: c.set_id, name: c.name, total: c.total, cards: [] };
      g.cards.push(c);
      bySet.set(c.set_id, g);
    }
    j.billsSets = bySet.size;
    await billsStep([...bySet.values()], recordAs('billsarchive'), j);
  })()
    .catch(e => (j.error = e instanceof Error ? e.message : String(e)))
    .finally(() => {
      j.running = false;
      j.current = null;
      j.waitingUntil = undefined;
    });
  return j;
}
