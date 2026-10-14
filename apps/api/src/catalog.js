// Syncs sets and cards from pokemontcg.io into the database
import { readFileSync } from 'node:fs';
import { pool, tx } from './db.js';

const API = 'https://api.pokemontcg.io/v2';
const SETS_MAX_AGE_MS = 3 * 24 * 3600 * 1000;

export const norm = s => String(s).trim().toUpperCase().replace(/^([A-Z]*)0+(?=\d)/, '$1');

// the API returns intermittent 502s, so retry with backoff
export async function fetchJSON(url, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
      last = new Error(`HTTP ${r.status} en ${url}`);
    } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, 700 * (i + 1)));
  }
  throw last;
}

export async function syncSets() {
  let page = 1, out = [], total = Infinity;
  while (out.length < total) {
    const j = await fetchJSON(`${API}/sets?pageSize=250&page=${page}&select=id,name,series,ptcgoCode,releaseDate,total,printedTotal,images`);
    total = j.totalCount;
    if (!j.data.length) break;
    out.push(...j.data);
    page++;
  }
  await tx(async c => {
    for (const s of out) {
      await c.query(
        `INSERT INTO sets (id, name, series, code, release_date, total, printed_total, symbol_url, synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
         ON CONFLICT (id) DO UPDATE SET name=$2, series=$3, code=$4, release_date=$5, total=$6, printed_total=$7, symbol_url=$8, synced_at=now()`,
        [s.id, s.name, s.series, s.ptcgoCode || null, s.releaseDate ? s.releaseDate.replaceAll('/', '-') : null,
         s.total, s.printedTotal || s.total, s.images?.symbol || null]);
    }
  });
  return out.length;
}

// Syncs the set list if it's empty or stale; on API failure keeps what is stored
export async function ensureSets() {
  const { rows } = await pool.query('SELECT count(*)::int AS n, max(synced_at) AS t FROM sets WHERE source = \'ptcg\'');
  const { n, t } = rows[0];
  await ensureJaSets();
  if (n && Date.now() - new Date(t).getTime() < SETS_MAX_AGE_MS) return;
  try { await syncSets(); } catch (e) { if (!n) throw e; console.warn('no pude actualizar expansiones:', e.message); }
  try { await syncJaSets(); } catch (e) { console.warn('no pude actualizar expansiones japonesas:', e.message); }
}
// first run after adding Japanese support: the list of Japanese sets is still missing
let jaChecked = false;
async function ensureJaSets() {
  if (jaChecked) return;
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM sets WHERE source = 'tcgdex-ja' AND synced_at > now() - interval '3 days'");
  if (rows[0].n < 50) await syncJaSets().catch(e => console.warn('no pude actualizar expansiones japonesas:', e.message));
  jaChecked = true;
}

const syncing = new Map();
async function syncSetCards(setId) {
  let page = 1, got = 0, total = Infinity;
  const all = [];
  while (got < total) {
    const j = await fetchJSON(`${API}/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&select=id,name,number,nationalPokedexNumbers,artist,rarity,images,supertype`);
    total = j.totalCount;
    if (!j.data.length) break;
    all.push(...j.data);
    got += j.data.length;
    page++;
  }
  if (!got || got < total) throw new Error(`descarga incompleta de la expansión ${setId} (${got}/${total})`);
  // a few sets repeat a number (e.g. cel25c); keep the first card with each one
  const seen = new Set();
  const unique = all.filter(x => !seen.has(x.number) && seen.add(x.number));
  await tx(async c => {
    for (const x of unique) {
      await c.query(
        `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET number=$3, number_norm=$4, name=$5, supertype=$6, rarity=$7, artist=$8, dex=$9,
           -- a picture we already copied (/img/…, imagenes.js) stays
           image_small=CASE WHEN cards.image_small LIKE '/img/%' THEN cards.image_small ELSE $10 END, image_large=CASE WHEN cards.image_large LIKE '/img/%' THEN cards.image_large ELSE $11 END`,
        [x.id, setId, x.number, norm(x.number), x.name, x.supertype || null, x.rarity || null, x.artist || null,
         x.nationalPokedexNumbers || [], x.images?.small || null, x.images?.large || null]);
    }
    await c.query('UPDATE sets SET cards_synced_at = now() WHERE id = $1', [setId]);
  });
}

// Downloads a set's cards the first time they're needed (or when forced)
export async function ensureSetCards(setId, force = false) {
  const { rows } = await pool.query('SELECT cards_synced_at, source FROM sets WHERE id = $1', [setId]);
  if (!rows.length) throw Object.assign(new Error(`La expansión ${setId} no existe`), { statusCode: 404 });
  // typed by hand, or left from the old PokeCottage checklists (in use, so kept): nothing to download
  if (['manual', 'pokecottage'].includes(rows[0].source) || (!force && rows[0].cards_synced_at)) return;
  const sync = rows[0].source === 'tcgdex-ja' ? syncJaSet : syncSetCards;
  if (!syncing.has(setId)) syncing.set(setId, sync(setId).finally(() => syncing.delete(setId)));
  return syncing.get(setId);
}

// Downloads the cards of every set not yet synced (one set at a time, to be gentle with the API)
export async function syncAllCards(onProgress = () => {}) {
  await ensureSets();
  const { rows } = await pool.query("SELECT id, name FROM sets WHERE cards_synced_at IS NULL AND source = 'ptcg' ORDER BY release_date DESC NULLS LAST");
  const failed = [];
  for (let i = 0; i < rows.length; i++) {
    try { await ensureSetCards(rows[i].id); } catch (e) { failed.push(`${rows[i].id}: ${e.message}`); }
    onProgress({ done: i + 1, total: rows.length, set: rows[i].name });
  }
  return { synced: rows.length - failed.length, failed };
}

// ---------- Japanese cards (TCGdex) ----------
// Japanese prints have their own sets and numbers, so they are different cards from the international ones.
// Ids are prefixed: set ja-SV2a, card ja-SV2a-133.
const TCGDEX = 'https://api.tcgdex.net/v2/ja';
const JA_SUPERTYPE = { Pokemon: 'Pokémon', Trainer: 'Trainer', Energy: 'Energy' };
const jaImg = (base, size) => base ? `${base}/${size}.webp` : null;
// English collector names of Japanese sets (TCGdex only has the Japanese one), Japanese names TCGdex has wrong, and junk entries
// to leave out (by set code): the CS* sets are empty placeholders all named トリプレットビート, and SM1+ / sm2+ / SM3+ / SM4+ / SM5+
// are empty duplicates of SM1p… SM5p, which have the cards
const JA_NAMES = JSON.parse(readFileSync(new URL('./ja-sets.json', import.meta.url), 'utf8'));
const jaName = (code, name) => JA_NAMES.fixJa[code] || name;
const jaNameEn = code => JA_NAMES.en[code] || null;
const JA_HIDDEN = new Set(JA_NAMES.hidden || []);

// fills the names for sets already in the database, without waiting for the next sync
export async function applyJaNames() {
  const en = Object.entries(JA_NAMES.en), fix = Object.entries(JA_NAMES.fixJa);
  await pool.query(
    `UPDATE sets s SET name_en = v.en FROM unnest($1::text[], $2::text[]) AS v(code, en)
     WHERE s.source = 'tcgdex-ja' AND s.code = v.code AND s.name_en IS DISTINCT FROM v.en`,
    [en.map(x => x[0]), en.map(x => x[1])]);
  await pool.query(
    `UPDATE sets s SET name = v.name FROM unnest($1::text[], $2::text[]) AS v(code, name)
     WHERE s.source = 'tcgdex-ja' AND s.code = v.code AND s.name <> v.name`,
    [fix.map(x => x[0]), fix.map(x => x[1])]);
  // junk entries from an earlier sync: gone, as long as nothing hangs from them
  await pool.query(`DELETE FROM sets s WHERE s.source = 'tcgdex-ja' AND s.code = ANY($1::text[]) AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id)`, [[...JA_HIDDEN]]);
}

export async function syncJaSets() {
  const list = await fetchJSON(`${TCGDEX}/sets`);
  await tx(async c => {
    for (const s of list) {
      if (JA_HIDDEN.has(s.id)) continue;
      await c.query(
        `INSERT INTO sets (id, name, code, total, printed_total, source, lang, synced_at, name_en)
         VALUES ($1, $2, $3, $4, $5, 'tcgdex-ja', 'JA', now(), $6)
         ON CONFLICT (id) DO UPDATE SET name = $2, total = $4, printed_total = $5, synced_at = now(), name_en = $6`,
        ['ja-' + s.id, jaName(s.id, s.name), s.id, s.cardCount?.total || null, s.cardCount?.official || s.cardCount?.total || null, jaNameEn(s.id)]);
    }
  });
  return list.length;
}

// Set details (date, series) and the basic data of all its cards; detailed card data comes from upsertJaCard
async function syncJaSet(setId) {
  const s = await fetchJSON(`${TCGDEX}/sets/${encodeURIComponent(setId.replace(/^ja-/, ''))}`);
  await tx(async c => {
    await c.query(
      `INSERT INTO sets (id, name, series, code, release_date, total, printed_total, source, lang, cards_synced_at, name_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'tcgdex-ja', 'JA', now(), $8)
       ON CONFLICT (id) DO UPDATE SET name = $2, series = $3, release_date = $5, total = $6, printed_total = $7, cards_synced_at = now(), name_en = $8`,
      ['ja-' + s.id, jaName(s.id, s.name), s.serie?.name || null, s.id, s.releaseDate || null, s.cardCount?.total || null, s.cardCount?.official || null, jaNameEn(s.id)]);
    for (const x of s.cards || []) {
      await c.query(
        `INSERT INTO cards (id, set_id, number, number_norm, name, image_small, image_large)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        ['ja-' + x.id, 'ja-' + s.id, x.localId, norm(x.localId), x.name, jaImg(x.image, 'low'), jaImg(x.image, 'high')]);
    }
  });
}

async function upsertJaCard(x) {
  const setId = 'ja-' + x.set.id;
  await ensureSetCards(setId).catch(async () => {
    // set missing from the list: create it from the card, then try its details
    await pool.query(`INSERT INTO sets (id, name, code, source, lang, name_en) VALUES ($1, $2, $3, 'tcgdex-ja', 'JA', $4) ON CONFLICT DO NOTHING`, [setId, jaName(x.set.id, x.set.name), x.set.id, jaNameEn(x.set.id)]);
    await ensureSetCards(setId).catch(() => {});
  });
  await pool.query(
    `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET name=$5, supertype=$6, rarity=$7, artist=$8, dex=$9,
       image_small=CASE WHEN cards.image_small LIKE '/img/%' THEN cards.image_small ELSE $10 END, image_large=CASE WHEN cards.image_large LIKE '/img/%' THEN cards.image_large ELSE $11 END`,
    ['ja-' + x.id, setId, x.localId, norm(x.localId), x.name, JA_SUPERTYPE[x.category] || x.category || null, x.rarity || null,
     x.illustrator || null, x.dexId || [], jaImg(x.image, 'low'), jaImg(x.image, 'high')]);
}

// Downloads every Japanese card of one Pokédex number (a few at a time)
export async function syncJaDex(dex) {
  const list = await fetchJSON(`${TCGDEX}/cards?dexId=eq:${Number(dex)}`);
  const failed = [];
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const id = list[i++].id;
      try { await upsertJaCard(await fetchJSON(`${TCGDEX}/cards/${encodeURIComponent(id)}`)); } catch (e) { failed.push(`${id}: ${e.message}`); }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return { cards: list.length - failed.length, failed };
}
