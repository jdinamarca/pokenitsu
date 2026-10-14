// Our own copy of the catalog's card pictures: each card's big picture is downloaded once and saved under IMAGE_DIR as
// WebP in two sizes (small for lists, large for the preview). Then cards.image_* point to /img/…, and the original link
// stays in card_images. Why: pokemontcg.io is shutting down (keys work until March 1, 2027) and the app shouldn't depend
// on other sites to show a card. Later the folder is copied to the production storage (docs/despliegue.md).
//
// Sources: images.pokemontcg.io (international) and assets.tcgdex.net (Japanese, and international cards whose picture
// came from Scrydex, whose terms don't allow mirroring it). Never PokeCottage, which didn't authorize it.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { norm, fetchJSON } from './catalog.js';
import { tcgdexSetOf } from './prices.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const IMAGE_DIR = process.env.IMAGE_DIR || join(REPO, 'data', 'imagenes');
// says who is asking; TCGdex's CDN only answers user agents in the usual "Mozilla/5.0 (compatible; …)" form
const UA = 'Mozilla/5.0 (compatible; NitsuCollectibles/0.1; +https://github.com/jdinamarca/pokenitsu)';
const WIDTH = { small: 245, large: 600 };
const ALLOWED = /^https:\/\/(images\.pokemontcg\.io|assets\.tcgdex\.net)\//;
const TCGDEX_EN = 'https://api.tcgdex.net/v2/en';
const sleep = ms => new Promise(r => setTimeout(r, ms));
// a file name for an id: each sign a file can't take becomes _ and its hex code, so Unown ex10-? and ex10-! don't share one
const safe = s => String(s).replace(/[^\w.-]/g, c => '_' + c.codePointAt(0).toString(16));

// the biggest picture we can take for a card: the hi-res PNG of pokemontcg.io or the 600 px WebP of TCGdex
function bigOf(url) {
  if (/^https:\/\/images\.pokemontcg\.io\/.*\d[a-z]?\.png$/i.test(url)) return url.replace(/\.png$/i, '_hires.png');
  if (/\/low\.webp$/.test(url)) return url.replace(/\/low\.webp$/, '/high.webp');
  return url;
}
// TCGdex's pictures of one international set, by card number (for cards whose original link is Scrydex's)
const tdImages = new Map();
async function tcgdexImageOf(card) {
  const td = await tcgdexSetOf(card.set_id).catch(() => null);
  if (!td) return null;
  if (!tdImages.has(td)) {
    const d = await fetchJSON(`${TCGDEX_EN}/sets/${encodeURIComponent(td)}`, 3).catch(() => null);
    tdImages.set(td, Object.fromEntries((d?.cards || []).filter(c => c.image).map(c => [norm(c.localId), c.image])));
  }
  const base = tdImages.get(td)[card.number_norm];
  return base ? `${base}/high.webp` : null;
}
// where to download a card's picture from, or why there is none
async function sourceOf(card) {
  let url = card.image_large || card.image_small || '';
  if (url.startsWith('/img/')) url = (await pool.query("SELECT source_url FROM card_images WHERE card_id = $1 AND size = 'large'", [card.id])).rows[0]?.source_url || '';
  if (ALLOWED.test(url)) return { url: bigOf(url) };
  if (card.source === 'ptcg') {
    const td = await tcgdexImageOf(card);
    return td ? { url: td } : { skip: /scrydex/.test(url) ? 'la foto original es de Scrydex y TCGdex no la tiene' : 'sin foto descargable' };
  }
  if (/pokecottage/.test(url)) return { skip: 'foto de PokeCottage (no autorizada)' };
  return { missing: 'el catálogo no tiene foto de esta carta' };
}

async function download(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(45000) });
      if (r.status === 404) return { notFound: true };
      if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()) };
      last = new Error(`HTTP ${r.status}`);
    } catch (e) { last = e; }
    await sleep(1500 * (i + 1));
  }
  throw last;
}
async function save(card, size, img) {
  const { data, info } = await sharp(img).resize({ width: WIDTH[size], withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
  const path = `cards/${safe(card.set_id)}/${safe(card.id)}-${size}.webp`, file = join(IMAGE_DIR, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file + '.tmp', data); await rename(file + '.tmp', file);
  return { path, bytes: data.length, width: info.width, height: info.height, sha256: createHash('sha256').update(data).digest('hex') };
}
const mark = (cardId, size, status, x = {}) => pool.query(
  `INSERT INTO card_images (card_id, size, status, path, source_url, bytes, width, height, sha256, note, fetched_at, uploaded_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), NULL)
   ON CONFLICT (card_id, size) DO UPDATE SET status = $3, path = $4, source_url = $5, bytes = $6, width = $7, height = $8, sha256 = $9,
     note = $10, fetched_at = now(), uploaded_at = CASE WHEN card_images.sha256 IS NOT DISTINCT FROM $9 THEN card_images.uploaded_at END`,
  [cardId, size, status, x.path || null, x.source_url || null, x.bytes || null, x.width || null, x.height || null, x.sha256 || null, x.note || null]);

// one card: both sizes from its big picture; the card then points to our copy
export async function copyCard(card) {
  const src = await sourceOf(card);
  if (!src.url) {
    const status = src.skip ? 'skipped' : 'missing', note = src.skip || src.missing;
    for (const size of ['small', 'large']) await mark(card.id, size, status, { note, source_url: card.image_small });
    return status;
  }
  const got = await download(src.url);
  if (got.notFound) { for (const size of ['small', 'large']) await mark(card.id, size, 'missing', { note: 'la fuente respondió 404', source_url: src.url }); return 'missing'; }
  const saved = {};
  for (const size of ['small', 'large']) { saved[size] = await save(card, size, got.buf); await mark(card.id, size, 'ok', { ...saved[size], source_url: src.url }); }
  await pool.query('UPDATE cards SET image_small = $2, image_large = $3 WHERE id = $1', [card.id, '/img/' + saved.small.path, '/img/' + saved.large.path]);
  return 'ok';
}

const fileOf = card => `cards/${safe(card.set_id)}/${safe(card.id)}-small.webp`;

// cards still to copy: catalog cards (international and Japanese) without both sizes done; `retry` also tries the ones
// marked missing, skipped or failed before, and the ones saved under the old file name, which gave the same file to
// Unown ex10-? and ex10-! (so one of them may show the other's picture)
export async function pendingCards({ set, retry = false, limit } = {}) {
  const renamed = !retry ? [] : (await pool.query(
    `SELECT c.id, c.set_id, c.number_norm, c.image_small, c.image_large, s.source, ci.path FROM cards c JOIN sets s ON s.id = c.set_id
     JOIN card_images ci ON ci.card_id = c.id AND ci.size = 'small' AND ci.status = 'ok'
     WHERE s.source IN ('ptcg', 'tcgdex-ja') AND ($1::text IS NULL OR c.set_id = $1) AND (c.id ~ '[^\\w.-]' OR c.set_id ~ '[^\\w.-]')`,
    [set || null])).rows.filter(c => c.path !== fileOf(c));
  const { rows } = await pool.query(
    `SELECT c.id, c.set_id, c.number_norm, c.image_small, c.image_large, s.source FROM cards c JOIN sets s ON s.id = c.set_id
     WHERE s.source IN ('ptcg', 'tcgdex-ja') AND ($1::text IS NULL OR c.set_id = $1)
       AND (SELECT count(*) FROM card_images ci WHERE ci.card_id = c.id AND (ci.status = 'ok' OR (NOT $2 AND ci.status IN ('missing', 'skipped')))) < 2
     ORDER BY s.release_date DESC NULLS LAST, c.set_id, c.number_norm
     LIMIT $3`, [set || null, retry, limit || null]);
  return [...renamed, ...rows].slice(0, limit || undefined);
}

// the whole run: a few cards at a time, a short pause between each, progress on the console; safe to stop and run again
export async function copyAll({ set, retry, limit, workers = 4, pause = 250, log = console.log } = {}) {
  const list = await pendingCards({ set, retry, limit });
  const n = { ok: 0, missing: 0, skipped: 0, error: 0 }, t0 = Date.now();
  log(`🖼️  ${list.length} cartas por copiar en ${IMAGE_DIR}`);
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const card = list[i++];
      try { n[await copyCard(card)]++; }
      catch (e) { n.error++; for (const size of ['small', 'large']) await mark(card.id, size, 'error', { note: String(e.message).slice(0, 200), source_url: card.image_small }).catch(() => {}); }
      const done = n.ok + n.missing + n.skipped + n.error;
      if (done % 100 === 0 || done === list.length) {
        const eta = done ? Math.round((Date.now() - t0) / done * (list.length - done) / 60000) : 0;
        log(`   ${done}/${list.length} · ✓ ${n.ok} · sin foto ${n.missing} · omitidas ${n.skipped} · errores ${n.error}${done < list.length ? ` · faltan ~${eta} min` : ''}`);
      }
      await sleep(pause);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workers, list.length) }, worker));
  return n;
}
