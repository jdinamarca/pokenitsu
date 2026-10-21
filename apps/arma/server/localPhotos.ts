// Photos for local use only (fotos-solo-local): PokeCottage, Limitless TCG and Bulbagarden Archives, for the printings
// with no photo from a source allowed to show it. Each file is downloaded once to LOCAL_IMAGE_DIR and recorded as an
// image fact of its source (permission 'local'), served at /img-local/… only while ARMA_FOTOS_LOCALES=1.
import { basename, join } from 'node:path';
import { normNumber, photoShows, plainPhotoFits, type ArmaFinish } from '@pokenitsu/core';
import { pool, tx } from './db.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { limitlessFile, limitlessUrl } from './limitless.ts';
import { intlSetByName, loadCatalog } from './sources/catalog.ts';
import { downloadOnce, fetchJson, mapLimit } from './sources/http.ts';
import { pokecottageAlbum } from './sources/pokecottage.ts';
import { speciesNames } from './sources/tcgdex.ts';

interface Target {
  code: string;
  set_key: string;
  number: string;
  lang: string;
  finish: ArmaFinish;
  stamp: string | null;
  pc_ref: string | null;
}
interface Holder extends Target {
  card: string;
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
export const fileOf = (url: string) =>
  basename(new URL(url).pathname)
    .replace(/[^\w.-]+/g, '_')
    .slice(-120);

/** PokeCottage: the photo of each master-set entry, matched to its printing by the entry id kept as ref */
async function pokecottage(dex: number, species: string, targets: Holder[], all: Holder[]): Promise<Found[]> {
  // the same album (30 days in the cache) as the Japanese catalog's photos
  const cards = await pokecottageAlbum(dex, species);
  if (!cards) throw new Error('PokeCottage no trajo el master set');
  const byId = new Map(cards.filter(c => c.url).map(c => [c.id, c.url!]));
  // the same picture for two entries of one card (unlimited and 1st Edition) shows only one of them: photoShows says which
  const holders = new Map<string, Holder[]>();
  for (const h of all) {
    const u = h.pc_ref && byId.get(h.pc_ref);
    if (u) holders.set(`${h.card}|${u}`, [...(holders.get(`${h.card}|${u}`) || []), h]);
  }
  return (
    targets
      .filter(t => t.pc_ref && byId.has(t.pc_ref))
      .map(t => ({ t, url: byId.get(t.pc_ref!)! }))
      .filter(({ t, url }) => photoShows(t, holders.get(`${t.card}|${url}`) || [t]) === (t.stamp || ''))
      // one picture for two finishes of a card (its Master Ball entry reusing the Normal's) shows the plain one only
      // (fotos-de-japonesas-con-poke-ball)
      .filter(({ t, url }) => plainPhotoFits(t) || new Set((holders.get(`${t.card}|${url}`) || [t]).map(h => h.finish)).size === 1)
      .map(({ t, url }) => ({ code: t.code, source: 'pokecottage-fotos', url, file: '' }))
  );
}

/** Limitless: Japanese set code + number with 3 digits (SV2a 133 → SV2a_133_R_JP_LG.png); only the Japanese printing,
 *  since the Chinese, Thai or Indonesian ones of the same set carry other text, and only the plain one: its photo is never
 *  a reverse, Poké Ball or Master Ball (fotos-de-japonesas-con-poke-ball) */
function limitless(targets: Target[]): Found[] {
  return targets.flatMap(t => {
    const f = t.lang === 'JA' && plainPhotoFits(t) ? limitlessFile(t.set_key, t.number) : null;
    return f ? [{ code: t.code, source: 'limitless', url: limitlessUrl(f), file: '' }] : [];
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
  // the card's own scan: the page's file whose name ends with its set and number ("…NeoDiscovery38.jpg"); the page's
  // lead image is sometimes another card (Neo Discovery 38 → a Premium File promo)
  const alnum = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  const files = new Map<string, Target>();
  const list = [...titles.keys()];
  for (let i = 0; i < list.length; i += 10) {
    const batch = list.slice(i, i + 10);
    const r = await fetchJson<{
      query?: { normalized?: { from: string; to: string }[]; pages?: Record<string, { title: string; images?: { title: string }[] }> };
    }>(`${API}?action=query&prop=images&imlimit=500&format=json&titles=${encodeURIComponent(batch.join('|'))}`);
    const back = new Map((r?.query?.normalized || []).map(n => [n.to, n.from]));
    for (const p of Object.values(r?.query?.pages || {})) {
      const title = back.get(p.title) || p.title;
      const t = titles.get(title);
      const end = alnum(title.replace(/^.*\(|\)$/g, ''));
      const file = (p.images || []).find(im => /\.(jpe?g|png)$/i.test(im.title) && alnum(im.title.replace(/\.\w+$/, '')).endsWith(end));
      if (t && file) files.set(file.title, t);
    }
  }
  const found: Found[] = [];
  const names = [...files.keys()];
  for (let i = 0; i < names.length; i += 50) {
    const r = await fetchJson<{
      query?: { normalized?: { from: string; to: string }[]; pages?: Record<string, { title: string; imageinfo?: { url: string }[] }> };
    }>(`${API}?action=query&prop=imageinfo&iiprop=url&format=json&titles=${encodeURIComponent(names.slice(i, i + 50).join('|'))}`);
    const back = new Map((r?.query?.normalized || []).map(n => [n.to, n.from]));
    for (const p of Object.values(r?.query?.pages || {})) {
      const t = files.get(back.get(p.title) || p.title);
      const u = p.imageinfo?.[0]?.url;
      if (t && u) found.push({ code: t.code, source: 'bulbagarden', url: u, file: '' });
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
  // the printings with no photo, from a source allowed to show it, that shows their own variant (fotos-por-variante):
  // an unlimited whose only photo is the one shared with its 1st Edition still needs one
  const { rows } = await pool.query<Target & { card: string; allowed: string[] }>(
    `SELECT p.code, p.set_key, p.number, p.lang, p.finish, p.stamp, -- the same card whatever zeros its number has (074 = 74), as in core's normNumber
            p.set_key || '|' || regexp_replace(upper(p.number), '^([A-Z]*)0+(?=[0-9])', '\\1') || '|' || p.lang AS card,
            (SELECT ref FROM arma.facts WHERE printing_code = p.code AND source_id = 'pokecottage' AND field = 'exists') AS pc_ref,
            coalesce((SELECT array_agg(f.value) FROM arma.facts f JOIN arma.sources s ON s.id = f.source_id
                      WHERE f.printing_code = p.code AND f.field = 'image' AND s.images AND s.permission <> 'local'), '{}') AS allowed
     FROM arma.printings p WHERE p.dex = $1`,
    [dex],
  );
  const marks = new Map(
    (await pool.query<{ src: string; shows: string }>('SELECT src, shows FROM arma.photo_marks')).rows.map(m => [m.src, m.shows]),
  );
  // who else of the same card has each photo
  const holders = new Map<string, { stamp: string | null }[]>();
  for (const r of rows) for (const src of r.allowed) holders.set(`${r.card}|${src}`, [...(holders.get(`${r.card}|${src}`) || []), r]);
  const targets = rows.filter(
    r => !r.allowed.some(src => photoShows(r, holders.get(`${r.card}|${src}`) || [r], marks.get(src)) === (r.stamp || '')),
  );
  const summary: PhotoSummary = {};
  const plan: [string, () => Promise<Found[]> | Found[]][] = [
    ['pokecottage-fotos', () => pokecottage(dex, en, targets, rows)],
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
    // a source that answered replaces its photos of this Pokémon: one that no longer fits its printing goes away
    for (const [source, r] of Object.entries(summary))
      if (r.ok)
        await c.query(
          `DELETE FROM arma.facts f USING arma.printings p
           WHERE p.code = f.printing_code AND p.dex = $1 AND f.field = 'image' AND f.source_id = $2 AND NOT (f.printing_code = ANY($3))`,
          [dex, source, saved.filter(x => x.source === source).map(x => x.code)],
        );
    for (const f of saved)
      await c.query(
        `INSERT INTO arma.facts (printing_code, field, source_id, value, ref) VALUES ($1, 'image', $2, $3, $4)
         ON CONFLICT (printing_code, field, source_id) DO UPDATE SET value = EXCLUDED.value, ref = EXCLUDED.ref, fetched_at = now()`,
        [f.code, f.source, `/img-local/${f.file}`, f.url],
      );
  });
  return summary;
}
