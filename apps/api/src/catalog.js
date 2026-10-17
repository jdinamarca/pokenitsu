// Syncs sets and cards from pokemontcg.io into the database
import { pool, tx } from './db.js';
import { fetchJSON, norm, jaName, jaNameEn, jaImg, JA_NAMES, JA_HIDDEN, JA_SUPERTYPE, TCGDEX_JA as TCGDEX } from '@pokenitsu/inventory';
import { inv } from './inventory.js';

export { fetchJSON, norm };
// an expansion's cards, downloaded the first time they're needed (shared with Arma tu colección)
export const ensureSetCards = (setId, force) => inv.ensureSetCards(setId, force);

const API = 'https://api.pokemontcg.io/v2';
const SETS_MAX_AGE_MS = 3 * 24 * 3600 * 1000;

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
