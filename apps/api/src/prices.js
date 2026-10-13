// Market prices (NM, raw) and exchange rates to CLP.
//   International cards → pokemontcg.io: TCGplayer (USD) and Cardmarket (EUR), downloaded a whole set at a time
//                         if it has none (brand-new expansions), TCGdex's English catalog: TCGplayer + Cardmarket
//   Japanese cards      → TCGdex: Cardmarket (EUR), one card at a time
// Checklist and hand-typed cards have no market price: set your own with price_overrides.
import { pool } from './db.js';
import { fetchJSON, norm } from './catalog.js';

const PTCG = 'https://api.pokemontcg.io/v2';
const TCGDEX_JA = 'https://api.tcgdex.net/v2/ja';
const TCGDEX_EN = 'https://api.tcgdex.net/v2/en';
const MAX_AGE = '20 hours';
const FX_MAX_AGE_MS = 12 * 3600 * 1000;

const num = x => (typeof x === 'number' && x > 0 ? Math.round(x * 100) / 100 : undefined);
const clean = o => { const r = Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)); return Object.keys(r).length ? r : null; };

// TCGplayer: market price (or mid) of each printing
function usdOf(tp) {
  if (!tp?.prices) return null;
  return clean(Object.fromEntries(Object.entries(tp.prices).map(([k, p]) => [k, num(p.market) ?? num(p.mid)])));
}
function eurOfPtcg(cm) {
  const p = cm?.prices; if (!p) return null;
  return clean({ trend: num(p.trendPrice), avg30: num(p.avg30), reverse: num(p.reverseHoloTrend) });
}
function eurOfTcgdex(cm) {
  if (!cm) return null;
  return clean({ trend: num(cm.trend), avg30: num(cm.avg30), holo: num(cm['trend-holo']) ?? num(cm['avg30-holo']) });
}

// TCGdex's TCGplayer block: {"reverse-holofoil": {marketPrice, midPrice…}, unit, updated} → {reverseHolofoil: USD}
function usdOfTcgdex(tp) {
  if (!tp) return null;
  const camel = k => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  return clean(Object.fromEntries(Object.entries(tp).filter(([, p]) => p && typeof p === 'object').map(([k, p]) => [camel(k), num(p.marketPrice) ?? num(p.midPrice)])));
}

const TD_MAX_AGE = '3 days';
// keepTdEur: pokemontcg.io's Cardmarket block lags months behind, so a recent one from TCGdex stays
async function save(cardId, usd, eur, url, keepTdEur = false) {
  await pool.query(
    `INSERT INTO card_prices (card_id, usd, eur, url, fetched_at) VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (card_id) DO UPDATE SET usd = $2, url = $4, fetched_at = now(),
       eur = CASE WHEN $5 AND card_prices.td_at > now() - '${TD_MAX_AGE}'::interval AND card_prices.eur IS NOT NULL THEN card_prices.eur ELSE $3 END`,
    [cardId, usd && JSON.stringify(usd), eur && JSON.stringify(eur), url || null, keepTdEur]);
}

async function fetchPtcgSet(setId) {
  let page = 1, got = 0, total = Infinity;
  while (got < total) {
    const j = await fetchJSON(`${PTCG}/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250&page=${page}&select=id,tcgplayer,cardmarket`);
    total = j.totalCount;
    if (!j.data.length) break;
    // only cards we have in the catalog (the foreign key)
    const { rows } = await pool.query('SELECT id FROM cards WHERE id = ANY($1)', [j.data.map(x => x.id)]);
    const known = new Set(rows.map(r => r.id));
    for (const x of j.data) if (known.has(x.id)) await save(x.id, usdOf(x.tcgplayer), eurOfPtcg(x.cardmarket), x.tcgplayer?.url || x.cardmarket?.url, true);
    got += j.data.length; page++;
  }
}
async function fetchPtcgCard(cardId) {
  const { data: x } = await fetchJSON(`${PTCG}/cards/${encodeURIComponent(cardId)}?select=id,tcgplayer,cardmarket`, 2);
  await save(cardId, usdOf(x.tcgplayer), eurOfPtcg(x.cardmarket), x.tcgplayer?.url || x.cardmarket?.url, true);
}
async function fetchJaCard(cardId) {
  const x = await fetchJSON(`${TCGDEX_JA}/cards/${encodeURIComponent(cardId.replace(/^ja-/, ''))}`, 2);
  const id = x.pricing?.cardmarket?.idProduct;
  await save(cardId, usdOf(x.pricing?.tcgplayer && { prices: x.pricing.tcgplayer }), eurOfTcgdex(x.pricing?.cardmarket),
    id ? `https://www.cardmarket.com/en/Pokemon/Products?idProduct=${id}` : null);
}

// ---------- TCGdex English: fallback for international cards without prices ----------
let tdSets = null, tdSetsAt = 0;
const nameKey = x => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// TCGdex's id of one of our expansions, found by name (and code / date when several share it); remembered in sets.tcgdex_en
export async function tcgdexSetOf(setId) {
  const { rows: [s] } = await pool.query('SELECT id, name, code, release_date, tcgdex_en FROM sets WHERE id = $1', [setId]);
  if (!s) return null;
  if (s.tcgdex_en !== null) return s.tcgdex_en || null;
  if (!tdSets || Date.now() - tdSetsAt > 6 * 3600 * 1000) { tdSets = await fetchJSON(`${TCGDEX_EN}/sets`, 3); tdSetsAt = Date.now(); }
  let found = '';
  const same = tdSets.filter(x => nameKey(x.name) === nameKey(s.name));
  if (same.length === 1) found = same[0].id;
  else for (const c of same) {
    const d = await fetchJSON(`${TCGDEX_EN}/sets/${encodeURIComponent(c.id)}`, 2).catch(() => null);
    const date = s.release_date && s.release_date.toISOString().slice(0, 10);
    if (d && ((s.code && d.abbreviation?.official === s.code) || (date && d.releaseDate === date))) { found = c.id; break; }
  }
  await pool.query('UPDATE sets SET tcgdex_en = $2 WHERE id = $1', [setId, found]);
  return found || null;
}
const tdCards = new Map();   // TCGdex set id → {number_norm: card id}
export async function tcgdexCardIds(tdSet) {
  if (!tdCards.has(tdSet)) {
    const d = await fetchJSON(`${TCGDEX_EN}/sets/${encodeURIComponent(tdSet)}`, 3);
    tdCards.set(tdSet, Object.fromEntries((d.cards || []).map(c => [norm(c.localId), c.id])));
  }
  return tdCards.get(tdSet);
}
// TCGdex prices for these cards of one expansion: its Cardmarket replaces pokemontcg.io's (stale);
// its TCGplayer only fills in when pokemontcg.io has none (brand-new expansions)
async function fetchTcgdexEn(setId, cardIds) {
  const tdSet = await tcgdexSetOf(setId);
  if (!tdSet) return;
  const ids = await tcgdexCardIds(tdSet);
  const { rows } = await pool.query('SELECT id, number_norm FROM cards WHERE id = ANY($1)', [cardIds]);
  for (const c of rows) {
    const tid = ids[c.number_norm]; if (!tid) continue;
    const x = await fetchJSON(`${TCGDEX_EN}/cards/${encodeURIComponent(tid)}`, 2).catch(() => null);
    const p = x?.pricing; if (!p) continue;
    const cm = p.cardmarket;
    const eur = cm ? clean({ trend: num(cm.trend), avg30: num(cm.avg30), reverse: num(cm['trend-holo']) ?? num(cm['avg30-holo']) }) : null;
    const pid = p.tcgplayer && Object.values(p.tcgplayer).find(v => v && v.productId)?.productId;
    const usd = usdOfTcgdex(p.tcgplayer);
    const url = pid ? `https://www.tcgplayer.com/product/${pid}` : cm?.idProduct ? `https://www.cardmarket.com/en/Pokemon/Products?idProduct=${cm.idProduct}` : null;
    await pool.query(
      `INSERT INTO card_prices (card_id, usd, eur, url, fetched_at, td_at) VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (card_id) DO UPDATE SET usd = coalesce(card_prices.usd, $2), eur = coalesce($3, card_prices.eur), url = coalesce(card_prices.url, $4), td_at = now()`,
      [c.id, usd && JSON.stringify(usd), eur && JSON.stringify(eur), url]);
  }
}
// international cards (of the wanted ones, or the given ones) to complete from TCGdex: without any price, or not checked there lately
async function unpricedIntl(cardIds = null) {
  const { rows } = await pool.query(
    `SELECT c.id, c.set_id FROM cards c JOIN sets s ON s.id = c.set_id LEFT JOIN card_prices p ON p.card_id = c.id
     WHERE s.source = 'ptcg' AND (p.card_id IS NULL OR (p.usd IS NULL AND p.eur IS NULL) OR p.td_at IS NULL OR p.td_at < now() - '${TD_MAX_AGE}'::interval)
       AND ($1::text[] IS NULL OR c.id = ANY($1)) AND ($1::text[] IS NOT NULL OR c.id IN (SELECT id FROM (${WANTED}) w))`, [cardIds]);
  const bySet = new Map();
  for (const r of rows) { if (!bySet.has(r.set_id)) bySet.set(r.set_id, []); bySet.get(r.set_id).push(r.id); }
  return bySet;
}

// Prices of every card of an international expansion (one or two requests), when some are missing or old:
// e.g. what completing the expansion would cost. Japanese expansions keep only the prices they already have.
// Returns whether TCGdex is still completing some of them in the background (brand-new expansions pokemontcg.io has no prices for).
const setTdJobs = new Set();
export async function ensureSetPrices(setId) {
  const { rows: [r] } = await pool.query(
    `SELECT s.source, count(*) FILTER (WHERE p.card_id IS NULL OR p.fetched_at < now() - $2::interval)::int AS stale
     FROM sets s JOIN cards c ON c.set_id = s.id LEFT JOIN card_prices p ON p.card_id = c.id WHERE s.id = $1 GROUP BY s.source`, [setId, MAX_AGE]);
  if (!r || r.source !== 'ptcg') return false;
  if (r.stale) await fetchPtcgSet(setId).catch(e => console.warn('precios de', setId, e.message));
  if (!setTdJobs.has(setId)) {
    const { rows } = await pool.query('SELECT id FROM cards WHERE set_id = $1', [setId]);
    const todo = (await unpricedIntl(rows.map(x => x.id))).get(setId);
    if (todo && todo.length) {
      setTdJobs.add(setId);
      fetchTcgdexEn(setId, todo).catch(e => console.warn('precios TCGdex de', setId, e.message)).finally(() => setTdJobs.delete(setId));
    }
  }
  return setTdJobs.has(setId);
}
// Prices of one card right now (e.g. just loaded); ignores errors, the next refresh retries
export async function ensureCardPrice(cardId) {
  const { rows: [r] } = await pool.query(
    `SELECT s.source, p.fetched_at > now() - $2::interval AS fresh FROM cards c JOIN sets s ON s.id = c.set_id
     LEFT JOIN card_prices p ON p.card_id = c.id WHERE c.id = $1`, [cardId, MAX_AGE]);
  if (!r || r.fresh) return;
  try {
    if (r.source === 'ptcg') {
      await fetchPtcgCard(cardId).catch(e => console.warn('precio de', cardId, e.message));
      for (const [sid, ids] of await unpricedIntl([cardId])) await fetchTcgdexEn(sid, ids);
    }
    else if (r.source === 'tcgdex-ja') await fetchJaCard(cardId);
  } catch (e) { console.warn('precio de', cardId, e.message); }
}

// Cards worth pricing: everything in the inventory, in my collections' checklists, in my lots and in my connected-art groups
const WANTED = `
  SELECT DISTINCT c.id, c.set_id, s.source FROM cards c JOIN sets s ON s.id = c.set_id
  WHERE (EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id) OR EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id)
         OR EXISTS (SELECT 1 FROM lot_items l WHERE l.card_id = c.id) OR EXISTS (SELECT 1 FROM art_group_cards g WHERE g.card_id = c.id))
    AND s.source IN ('ptcg', 'tcgdex-ja')`;

export async function staleCount() {
  const { rows: [r] } = await pool.query(
    `SELECT count(*)::int AS n FROM (${WANTED}) w LEFT JOIN card_prices p ON p.card_id = w.id
     WHERE p.card_id IS NULL OR p.fetched_at < now() - $1::interval`, [MAX_AGE]);
  return r.n;
}

// Downloads missing or old prices (all of them with force); international ones a set at a time
export async function refreshPrices(force, onProgress = () => {}) {
  const { rows } = await pool.query(
    `SELECT w.* FROM (${WANTED}) w LEFT JOIN card_prices p ON p.card_id = w.id
     WHERE $1 OR p.card_id IS NULL OR p.fetched_at < now() - $2::interval`, [!!force, MAX_AGE]);
  const intlSets = [...new Set(rows.filter(r => r.source === 'ptcg').map(r => r.set_id))];
  const ja = rows.filter(r => r.source === 'tcgdex-ja').map(r => r.id);
  let total = intlSets.length + ja.length;
  const failed = [];
  let done = 0;
  const step = what => onProgress({ done: ++done, total, what });
  // a few requests at a time: the APIs are slow but don't like floods
  const run = async (list, fetchOne, n) => {
    let i = 0;
    const worker = async () => {
      while (i < list.length) {
        const x = list[i++];
        try { await fetchOne(x); } catch (e) { failed.push(`${x}: ${e.message}`); }
        step(x);
      }
    };
    await Promise.all(Array.from({ length: n }, worker));
  };
  await run(intlSets, fetchPtcgSet, 3);
  await run(ja, fetchJaCard, 3);
  // TCGdex: fresh Cardmarket prices, and TCGplayer for brand-new expansions pokemontcg.io has no prices for yet
  const fallback = await unpricedIntl();
  total += fallback.size;
  onProgress({ done, total, what: 'TCGdex' });
  await run([...fallback.keys()], sid => fetchTcgdexEn(sid, fallback.get(sid)), 2);
  return { failed };
}

// ---------- settings and exchange rates ----------
export async function getSetting(key, def) {
  const { rows } = await pool.query('SELECT value, updated_at FROM settings WHERE key = $1', [key]);
  return rows.length ? { ...def, ...rows[0].value, at: rows[0].updated_at } : def;
}
export async function putSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
    [key, JSON.stringify(value)]);
}

// CLP per USD and per EUR; tries exchangerate-api, then mindicador.cl (Banco Central's rates); keeps the last ones on failure
async function downloadFx() {
  try {
    const j = await fetchJSON('https://open.er-api.com/v6/latest/USD', 2);
    if (j.rates?.CLP && j.rates?.EUR) return { usd: Math.round(j.rates.CLP * 100) / 100, eur: Math.round(j.rates.CLP / j.rates.EUR * 100) / 100, src: 'exchangerate-api.com' };
  } catch (e) { console.warn('tipo de cambio (exchangerate-api):', e.message); }
  const j = await fetchJSON('https://mindicador.cl/api', 2);
  return { usd: j.dolar.valor, eur: j.euro.valor, src: 'mindicador.cl' };
}
export async function getFx(force = false) {
  const cur = await getSetting('fx', null);
  if (cur && !force && Date.now() - new Date(cur.at).getTime() < FX_MAX_AGE_MS) return cur;
  try { await putSetting('fx', await downloadFx()); return await getSetting('fx', null); }
  catch (e) { console.warn('tipo de cambio:', e.message); return cur; }
}
