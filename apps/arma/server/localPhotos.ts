// Photos for local use only (fotos-solo-local): PokeCottage, Limitless TCG and Bulbagarden Archives, for the printings
// with no photo from a source allowed to show it. Each file is downloaded once to LOCAL_IMAGE_DIR and recorded as an
// image fact of its source (permission 'local'), served at /img-local/… only while ARMA_FOTOS_LOCALES=1.
import { basename, join } from 'node:path';
import { normNumber } from '@pokenitsu/core';
import { pool, tx } from './db.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { intlSetByName, loadCatalog, nameKey } from './sources/catalog.ts';
import { downloadOnce, fetchJson, mapLimit } from './sources/http.ts';
import { speciesNames } from './sources/tcgdex.ts';

interface Target {
  code: string;
  set_key: string;
  number: string;
  lang: string;
  pc_ref: string | null;
}
interface Found {
  code: string;
  source: string;
  url: string;
  file: string;
}
export interface PhotoSummary {
  [source: string]: {
    ok: boolean;
    found: number;
    fetched: number;
    existing: number;
    missing: number;
    failed: number;
    error?: string;
    errors?: string[];
  };
}

// a safe file name from a URL (no folders, no odd characters)
const fileOf = (url: string) =>
  basename(new URL(url).pathname)
    .replace(/[^\w.-]+/g, '_')
    .slice(-120);

/** PokeCottage: the photo of each master-set entry, matched to its printing by the entry id kept as ref */
async function pokecottage(dex: number, species: string, targets: Target[]): Promise<Found[]> {
  const url = `https://pokecottagecdn.com/mastersets/data/${dex}-${nameKey(species)}.json`;
  // its own cache key: the text importer's cache (without any picture URL) stays as it is
  const data = await fetchJson<{ cards: { id: string; url: string | null }[] }>(url, {
    cacheKey: url + '#fotos',
    transform: raw => ({
      cards: ((raw as { cards?: { id: string; imageUrl?: string; originalImageUrl?: string }[] }).cards || []).map(c => ({
        id: c.id,
        url: c.imageUrl || c.originalImageUrl || null,
      })),
    }),
  });
  if (!data) throw new Error('PokeCottage no trajo el master set');
  const byId = new Map(data.cards.filter(c => c.url).map(c => [c.id, c.url!]));
  return targets
    .filter(t => t.pc_ref && byId.has(t.pc_ref))
    .map(t => ({ code: t.code, source: 'pokecottage-fotos', url: byId.get(t.pc_ref!)!, file: '' }));
}

/** Limitless: Japanese set code + number with 3 digits (SV2a 133 → SV2a_133_R_JP_LG.png); only the Japanese printing,
 *  since the Chinese, Thai or Indonesian ones of the same set carry other text */
function limitless(targets: Target[]): Found[] {
  return targets
    .filter(t => t.lang === 'JA' && t.set_key.startsWith('ja-') && /^\d+$/.test(normNumber(t.number)))
    .map(t => {
      const set = t.set_key.slice(3);
      const n = normNumber(t.number).padStart(3, '0');
      return {
        code: t.code,
        source: 'limitless',
        url: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/${set}/${set}_${n}_R_JP_LG.png`,
        file: '',
      };
    });
}

/** Bulbagarden Archives: the scan of each card of Bulbapedia's list ("Eevee (Jungle 51)"), for its English printing */
async function bulbagarden(species: string, targets: Target[]): Promise<Found[]> {
  const API = process.env.ARMA_BULBAPEDIA_API || 'https://bulbapedia.bulbagarden.net/w/api.php';
  const d = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(
    `${API}?action=parse&page=${encodeURIComponent(`${species} (TCG)`)}&prop=wikitext&format=json`,
  );
  const text = d?.parse?.wikitext?.['*'];
  if (!text) throw new Error('Bulbapedia no trajo la lista de cartas');
  const cat = await loadCatalog();
  // only the plain printing (no stamp nor variant): the scan shows the base card, not a 1st Edition or a misprint
  const byCard = new Map(
    targets.filter(t => t.lang === 'EN' && !t.code.includes('~')).map(t => [`${t.set_key}|${normNumber(t.number)}`, t]),
  );
  // page title → the English printing it shows
  const titles = new Map<string, Target>();
  for (const m of text.matchAll(/\{\{TCG ID\|([^|}]+)\|([^|}]+)\|([^|}]+)\}\}/g)) {
    const [, set, name, num] = m;
    const key = intlSetByName(cat, set);
    const t = key ? byCard.get(`${key}|${normNumber(num)}`) : undefined;
    if (t) titles.set(`${name!.trim()} (${set!.trim()} ${num!.trim()})`, t);
  }
  const found: Found[] = [];
  const list = [...titles.keys()];
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const r = await fetchJson<{
      query?: { normalized?: { from: string; to: string }[]; pages?: Record<string, { title: string; original?: { source: string } }> };
    }>(`${API}?action=query&prop=pageimages&piprop=original&format=json&titles=${encodeURIComponent(batch.join('|'))}`);
    const back = new Map((r?.query?.normalized || []).map(n => [n.to, n.from]));
    for (const p of Object.values(r?.query?.pages || {})) {
      const t = titles.get(back.get(p.title) || p.title);
      if (t && p.original?.source) found.push({ code: t.code, source: 'bulbagarden', url: p.original.source, file: '' });
    }
  }
  return found;
}

const running = new Map<number, Promise<PhotoSummary>>();
export function importLocalPhotos(dex: number): Promise<PhotoSummary> {
  if (!localPhotosOn()) throw Object.assign(new Error('Las fotos solo locales están apagadas (ARMA_FOTOS_LOCALES=1)'), { statusCode: 403 });
  if (!running.has(dex))
    running.set(
      dex,
      run(dex).finally(() => running.delete(dex)),
    );
  return running.get(dex)!;
}

async function run(dex: number): Promise<PhotoSummary> {
  const { en } = await speciesNames(dex);
  // the printings with no photo from a source allowed to show it
  const { rows: targets } = await pool.query<Target>(
    `SELECT p.code, p.set_key, p.number, p.lang,
            (SELECT ref FROM arma.facts WHERE printing_code = p.code AND source_id = 'pokecottage' AND field = 'exists') AS pc_ref
     FROM arma.printings p
     WHERE p.dex = $1 AND NOT EXISTS (
       SELECT 1 FROM arma.facts f JOIN arma.sources s ON s.id = f.source_id
       WHERE f.printing_code = p.code AND f.field = 'image' AND s.images AND s.permission <> 'local')`,
    [dex],
  );
  const summary: PhotoSummary = {};
  const plan: [string, () => Promise<Found[]> | Found[]][] = [
    ['pokecottage-fotos', () => pokecottage(dex, en, targets)],
    ['limitless', () => limitless(targets)],
    ['bulbagarden', () => bulbagarden(en, targets)],
  ];
  const saved: Found[] = [];
  for (const [source, find] of plan) {
    const s: PhotoSummary[string] = (summary[source] = { ok: true, found: 0, fetched: 0, existing: 0, missing: 0, failed: 0 });
    try {
      const found = await find();
      s.found = found.length;
      // one download per file: several printings (variants of one artwork) often share a photo
      const byFile = new Map<string, Found[]>();
      for (const f of found) {
        const file = join(source, fileOf(f.url));
        byFile.set(file, [...(byFile.get(file) || []), { ...f, file }]);
      }
      await mapLimit([...byFile.entries()], 2, async ([file, fs]) => {
        try {
          const r = await downloadOnce(fs[0]!.url, join(LOCAL_IMAGE_DIR, file));
          s[r] += fs.length;
          if (r !== 'missing') saved.push(...fs);
        } catch (e) {
          s.failed += fs.length;
          // a sample of what failed, so the summary says why
          if ((s.errors ||= []).length < 3) s.errors.push(e instanceof Error ? e.message : String(e));
        }
      });
    } catch (e) {
      Object.assign(s, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  await tx(async c => {
    for (const f of saved)
      await c.query(
        `INSERT INTO arma.facts (printing_code, field, source_id, value, ref) VALUES ($1, 'image', $2, $3, $4)
         ON CONFLICT (printing_code, field, source_id) DO UPDATE SET value = EXCLUDED.value, ref = EXCLUDED.ref, fetched_at = now()`,
        [f.code, f.source, `/img-local/${f.file}`, f.url],
      );
  });
  return summary;
}
