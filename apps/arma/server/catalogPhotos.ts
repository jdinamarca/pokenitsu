// Photos for local use only of the Japanese catalog (fotos-solo-local-en-catalogo): Limitless TCG's scan of each card
// with no photo of the catalog nor ours, downloaded once to LOCAL_IMAGE_DIR (never IMAGE_DIR) and recorded in
// arma.card_photos with its source (permission 'local'). Per expansion, a few at a time, never the same one twice at once.
import { basename, join } from 'node:path';
import { pool } from './db.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { limitlessFile, limitlessUrl } from './limitless.ts';
import { downloadOnce } from './sources/http.ts';

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
/** downloads what an expansion lacks; null when the photos are off or the expansion isn't Japanese */
export function ensureLocalCardPhotos(setId: string): Promise<SetPhotos | null> {
  if (!localPhotosOn() || !setId.startsWith('ja-') || setNotThere.has(setId)) return Promise.resolve(null);
  if (!running.has(setId))
    running.set(
      setId,
      run(setId).finally(() => running.delete(setId)),
    );
  return running.get(setId)!;
}

async function run(setId: string): Promise<SetPhotos> {
  const { rows } = await pool.query<{ id: string; number: string }>(
    `SELECT c.id, c.number FROM cards c
     WHERE c.set_id = $1 AND c.image_small IS NULL AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
     ORDER BY c.number_norm ~ '^[0-9]+$' DESC, nullif(regexp_replace(c.number_norm, '[^0-9]', '', 'g'), '')::int NULLS LAST, c.number`,
    [setId],
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

// ---------- the whole Japanese catalog, asked by the administrator from the gallery ----------
export interface CatalogJob {
  running: boolean;
  sets: number;
  done: number;
  current: string | null;
  fetched: number;
  existing: number;
  missing: number;
  failed: number;
  /** expansions Limitless doesn't have */
  skipped: string[];
  error?: string;
}
let job: CatalogJob | null = null;
export const catalogJob = () => job;
export function startCatalogPhotos(): CatalogJob {
  if (!localPhotosOn()) throw Object.assign(new Error('Las fotos solo locales están apagadas (ARMA_FOTOS_LOCALES=1)'), { statusCode: 403 });
  if (job?.running) return job;
  const j: CatalogJob = (job = {
    running: true,
    sets: 0,
    done: 0,
    current: null,
    fetched: 0,
    existing: 0,
    missing: 0,
    failed: 0,
    skipped: [],
  });
  (async () => {
    const { rows } = await pool.query<{ set_id: string }>(
      `SELECT DISTINCT c.set_id FROM cards c
       WHERE c.set_id LIKE 'ja-%' AND c.image_small IS NULL AND NOT EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id)
       ORDER BY 1`,
    );
    j.sets = rows.length;
    for (const { set_id } of rows) {
      j.current = set_id;
      const r = await ensureLocalCardPhotos(set_id);
      if (r) {
        j.fetched += r.fetched;
        j.existing += r.existing;
        j.missing += r.missing;
        j.failed += r.failed;
        if (r.skipped) j.skipped.push(set_id);
      }
      j.done++;
    }
  })()
    .catch(e => (j.error = e instanceof Error ? e.message : String(e)))
    .finally(() => {
      j.running = false;
      j.current = null;
    });
  return j;
}
