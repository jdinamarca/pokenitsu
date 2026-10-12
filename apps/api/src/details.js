// Fills in what the first download left empty: illustrator, rarity, Pokédex number, category.
//   Japanese cards: the expansion list only brings name, number and picture; the rest is in each card's TCGdex page.
//   International cards: pokemontcg.io is incomplete for brand-new expansions; TCGdex's English catalog has them.
// Each card is looked up once (cards.details_at). My cards (inventory, collections, lots) go first.
import { pool } from './db.js';
import { fetchJSON } from './catalog.js';
import { tcgdexSetOf, tcgdexCardIds } from './prices.js';

const TCGDEX = 'https://api.tcgdex.net/v2';
const SUPERTYPE = { Pokemon: 'Pokémon', Trainer: 'Trainer', Energy: 'Energy' };
const MISSING = `(c.artist IS NULL OR c.artist = '') AND c.details_at IS NULL AND s.source IN ('ptcg', 'tcgdex-ja')`;
const MINE = `(EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id) OR EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id)
  OR EXISTS (SELECT 1 FROM lot_items l WHERE l.card_id = c.id))`;

async function apply(cardId, x) {
  await pool.query(
    `UPDATE cards SET artist = coalesce(nullif(artist, ''), $2), rarity = coalesce(nullif(rarity, ''), $3),
       dex = CASE WHEN cardinality(dex) = 0 AND $4::int[] IS NOT NULL THEN $4::int[] ELSE dex END,
       supertype = coalesce(supertype, $5), details_at = now() WHERE id = $1`,
    [cardId, x?.illustrator || null, x?.rarity && x.rarity !== 'None' ? x.rarity : null, x?.dexId?.length ? x.dexId : null, SUPERTYPE[x?.category] || null]);
}
const tried = id => pool.query('UPDATE cards SET details_at = now() WHERE id = $1', [id]);

async function fillJa(card) {
  const x = await fetchJSON(`${TCGDEX}/ja/cards/${encodeURIComponent(card.id.replace(/^ja-/, ''))}`, 2).catch(() => null);
  if (x) await apply(card.id, x); else await tried(card.id);
}
async function fillIntlSet(setId, cards) {
  const td = await tcgdexSetOf(setId).catch(() => null);
  const ids = td ? await tcgdexCardIds(td).catch(() => ({})) : {};
  for (const c of cards) {
    const tid = ids[c.number_norm];
    const x = tid ? await fetchJSON(`${TCGDEX}/en/cards/${encodeURIComponent(tid)}`, 2).catch(() => null) : null;
    if (x) await apply(c.id, x); else await tried(c.id);
  }
}
// the given cards right now (e.g. one just loaded)
export async function fillDetails(cardIds) {
  const { rows } = await pool.query(
    `SELECT c.id, c.set_id, c.number_norm, s.source FROM cards c JOIN sets s ON s.id = c.set_id WHERE c.id = ANY($1) AND ${MISSING}`, [cardIds]);
  for (const c of rows) {
    if (c.source === 'tcgdex-ja') await fillJa(c);
    else await fillIntlSet(c.set_id, [c]);
  }
}

let job = null;
export const detailsJob = () => job;
// background: my cards first, then the rest of the catalog; a few requests at a time
export function startDetailsJob() {
  if (job?.running) return job;
  job = { running: true, done: 0, total: 0 };
  (async () => {
    for (const scope of [MINE, 'true']) {
      const { rows } = await pool.query(
        `SELECT c.id, c.set_id, c.number_norm, s.source FROM cards c JOIN sets s ON s.id = c.set_id WHERE ${MISSING} AND ${scope}
         ORDER BY s.release_date DESC NULLS LAST, c.set_id`);
      job.total += rows.length;
      const ja = rows.filter(c => c.source === 'tcgdex-ja');
      const intl = new Map();
      for (const c of rows.filter(c => c.source === 'ptcg')) { if (!intl.has(c.set_id)) intl.set(c.set_id, []); intl.get(c.set_id).push(c); }
      let i = 0;
      const worker = async () => { while (i < ja.length) { const c = ja[i++]; await fillJa(c).catch(() => {}); job.done++; } };
      await Promise.all([worker(), worker(), worker()]);
      for (const [sid, cards] of intl) { await fillIntlSet(sid, cards).catch(() => {}); job.done += cards.length; }
    }
  })().then(() => { job.running = false; }, e => Object.assign(job, { running: false, error: e.message }));
  return job;
}
