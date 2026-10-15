// Fills in what the first download left empty: illustrator, rarity, Pokédex number, category.
//   Japanese cards: the expansion list only brings name, number and picture; the rest is in each card's TCGdex page.
//   International cards: pokemontcg.io is incomplete for brand-new expansions; TCGdex's English catalog has them.
// Each card is looked up once (cards.details_at). My cards (inventory, collections, lots) go first.
import { pool, asSystem, tx } from './db.js';
import { fetchJSON } from './catalog.js';
import { tcgdexSetOf, tcgdexCardIds } from './prices.js';
import { guessVariants, standardVariants, suggestVariants } from '@pokenitsu/core';

const TCGDEX = 'https://api.tcgdex.net/v2';
const SUPERTYPE = { Pokemon: 'Pokémon', Trainer: 'Trainer', Energy: 'Energy' };
const MISSING = `(c.artist IS NULL OR c.artist = '') AND c.details_at IS NULL AND s.source IN ('ptcg', 'tcgdex-ja')`;
const MINE = `(EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id) OR EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id)
  OR EXISTS (SELECT 1 FROM lot_items l WHERE l.card_id = c.id))`;

// TCGdex variants {normal: true, reverse: true, holo: false, firstEdition: false, wPromo: false} → ['normal', 'reverse']
const variantsOf = x => (x && x.variants ? standardVariants(Object.keys(x.variants).filter(k => x.variants[k])) : null);
async function apply(cardId, x) {
  const vs = variantsOf(x);
  await pool.query(
    `UPDATE cards SET artist = coalesce(nullif(artist, ''), $2), rarity = coalesce(nullif(rarity, ''), $3),
       dex = CASE WHEN cardinality(dex) = 0 AND $4::int[] IS NOT NULL THEN $4::int[] ELSE dex END,
       supertype = coalesce(supertype, $5), details_at = now(),
       variants = CASE WHEN $6::text[] IS NOT NULL AND cardinality($6::text[]) > 0 THEN $6::text[] ELSE variants END,
       variants_guessed = CASE WHEN $6::text[] IS NOT NULL AND cardinality($6::text[]) > 0 THEN false ELSE variants_guessed END WHERE id = $1`,
    [cardId, x?.illustrator || null, x?.rarity && x.rarity !== 'None' ? x.rarity : null, x?.dexId?.length ? x.dexId : null, SUPERTYPE[x?.category] || null, vs]);
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
      // everyone's cards first (system: it runs with no user)
      const { rows } = await asSystem(c => c.query(
        `SELECT c.id, c.set_id, c.number_norm, s.source FROM cards c JOIN sets s ON s.id = c.set_id WHERE ${MISSING} AND ${scope}
         ORDER BY s.release_date DESC NULLS LAST, c.set_id`));
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

// ---------- standard variants of every card of an expansion (master-set progress) ----------
// One TCGdex request per card, a few at a time; cards TCGdex does not know get variants deduced from their rarity.
const variantJobs = new Map();
export const variantsJob = setId => variantJobs.get(setId) || null;
async function cardVariants(c, ids) {
  const url = c.source === 'tcgdex-ja' ? `${TCGDEX}/ja/cards/${encodeURIComponent(c.id.replace(/^ja-/, ''))}`
    : ids[c.number_norm] ? `${TCGDEX}/en/cards/${encodeURIComponent(ids[c.number_norm])}` : null;
  const x = url ? await fetchJSON(url, 2).catch(() => null) : null;
  const vs = variantsOf(x);
  if (x) await pool.query('UPDATE cards SET td_variants = $2 WHERE id = $1', [c.id, JSON.stringify(tdVariants(x))]);
  if (vs && vs.length) await pool.query('UPDATE cards SET variants = $2, variants_guessed = false WHERE id = $1', [c.id, vs]);
  else await pool.query('UPDATE cards SET variants = $2, variants_guessed = true WHERE id = $1 AND variants IS NULL', [c.id, guessVariants(c.rarity)]);
}
export function startVariantsJob(setId) {
  const cur = variantJobs.get(setId);
  if (cur?.running) return cur;
  const job = { running: true, done: 0, total: 0 };
  variantJobs.set(setId, job);
  (async () => {
    const { rows } = await pool.query(
      `SELECT c.id, c.number_norm, c.rarity, s.source FROM cards c JOIN sets s ON s.id = c.set_id
       WHERE c.set_id = $1 AND c.variants IS NULL AND s.source IN ('ptcg', 'tcgdex-ja')`, [setId]);
    job.total = rows.length;
    if (!rows.length) return;
    const td = rows[0].source === 'ptcg' ? await tcgdexSetOf(setId).catch(() => null) : null;
    const ids = td ? await tcgdexCardIds(td).catch(() => ({})) : {};
    let i = 0;
    const worker = async () => { while (i < rows.length) { const c = rows[i++]; await cardVariants(c, ids).catch(() => {}); job.done++; } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  })().then(() => { job.running = false; }, e => Object.assign(job, { running: false, error: e.message }));
  return job;
}
// at start: the expansions where I have cards, one after another
export async function startVariantsForMySets() {
  const { rows } = await asSystem(c => c.query(
    `SELECT DISTINCT c.set_id FROM inventory i JOIN cards c ON c.id = i.card_id JOIN sets s ON s.id = c.set_id
     WHERE s.source IN ('ptcg', 'tcgdex-ja') AND EXISTS (SELECT 1 FROM cards x WHERE x.set_id = c.set_id AND x.variants IS NULL)`));
  for (const r of rows) {
    const job = startVariantsJob(r.set_id);
    while (job.running) await new Promise(res => setTimeout(res, 1000));
  }
}

// ---------- the shared variant list of each card (variantes-compartidas) ----------
// TCGdex variants_detailed without prices and ids: [{type, foil, stamp, size}]
const tdVariants = x => (x?.variants_detailed || []).map(v => ({ type: v.type || null, foil: v.foil || null, stamp: v.stamp || null, size: v.size || null }));

// Rewrites the list of the cards the owner has not reviewed, from TCGdex + the TCGplayer variants of their prices
export async function refreshSuggestions(cardIds) {
  const { rows } = await pool.query(
    `SELECT c.id, c.td_variants, CASE WHEN jsonb_typeof(p.usd) = 'object' THEN (SELECT array_agg(k) FROM jsonb_object_keys(p.usd) k) END AS tp
     FROM cards c LEFT JOIN card_prices p ON p.card_id = c.id
     WHERE c.id = ANY ($1) AND NOT EXISTS (SELECT 1 FROM card_variants_reviewed r WHERE r.card_id = c.id)`, [cardIds]);
  for (const r of rows) {
    const list = suggestVariants(r.td_variants, r.tp);
    await tx(async c => {
      await c.query('DELETE FROM card_variants_list WHERE card_id = $1', [r.id]);
      for (const [pos, v] of list.entries()) {
        await c.query(
          `INSERT INTO card_variants_list (card_id, slug, finish, stamp, label, kind, sources, pos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [r.id, v.slug, v.finish, v.stamp, v.label, v.type, v.sources, pos]);
        await c.query('INSERT INTO variant_labels (slug, label) VALUES ($1, $2) ON CONFLICT DO NOTHING', [v.slug, v.label]);
      }
    });
  }
  return rows.length;
}

// For a list of cards (a collection): fetch the TCGdex details they lack, then their suggestions. One job per key.
const suggestionJobs = new Map();
export const suggestionsJob = key => suggestionJobs.get(key) || null;
export function startSuggestionsJob(key, cardIds) {
  const cur = suggestionJobs.get(key);
  if (cur?.running) return cur;
  const job = { running: true, done: 0, total: 0 };
  suggestionJobs.set(key, job);
  (async () => {
    const { rows } = await pool.query(
      `SELECT c.id, c.set_id, c.number_norm, c.rarity, s.source FROM cards c JOIN sets s ON s.id = c.set_id
       WHERE c.id = ANY ($1) AND c.td_variants IS NULL AND s.source IN ('ptcg', 'tcgdex-ja')`, [cardIds]);
    job.total = rows.length;
    // TCGdex ids of each international expansion's cards, looked up once per expansion
    const idsBySet = new Map();
    const idsOf = async setId => {
      if (!idsBySet.has(setId)) idsBySet.set(setId, tcgdexSetOf(setId).then(td => (td ? tcgdexCardIds(td) : {})).catch(() => ({})));
      return idsBySet.get(setId);
    };
    let i = 0;
    const worker = async () => {
      while (i < rows.length) {
        const c = rows[i++];
        const ids = c.source === 'ptcg' ? await idsOf(c.set_id) : {};
        await cardVariants(c, ids).catch(() => {});
        // never looked up again: an empty list when TCGdex does not have the card
        await pool.query("UPDATE cards SET td_variants = '[]'::jsonb WHERE id = $1 AND td_variants IS NULL", [c.id]).catch(() => {});
        job.done++;
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    job.cards = await refreshSuggestions(cardIds);
  })().then(() => { job.running = false; }, e => Object.assign(job, { running: false, error: e.message }));
  return job;
}
