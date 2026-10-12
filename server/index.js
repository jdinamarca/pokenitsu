import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { pool, tx, migrate } from './db.js';
import { norm, ensureSets, syncSets, ensureSetCards, syncAllCards, syncJaDex } from './catalog.js';
import { importChecklist } from './pokecottage.js';
import { fillDetails, startDetailsJob, detailsJob } from './details.js';
import { ensureCardPrice, refreshPrices, staleCount, getSetting, putSetting, getFx } from './prices.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['ES', 'EN', 'PT', 'FR', 'DE', 'IT', 'JA', 'KO', 'ZH'];
const ART_DIR = join(root, 'public', 'art');
const IMAGE_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// card fields the page needs, aliased to the names it uses
const CARD_COLS = `c.set_id AS sid, c.number AS num, c.name, c.dex, c.artist, c.rarity, c.image_small AS img, c.supertype`;

const bad = msg => Object.assign(new Error(msg), { statusCode: 400 });
// normal / holo / reverse, or a checklist variant slug (firstedition, pokeballholo…)
const VARIANT_RE = /^[a-z0-9]{1,60}$/;
const checkVariant = v => { if (!VARIANT_RE.test(String(v))) throw bad(`Variante inválida: ${v}`); return v; };
// group pictures: an http(s) URL or a file we stored under /art/
const checkImageUrl = u => {
  u = String(u ?? '').trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u) && !/^\/art\/[\w.-]+$/.test(u)) throw bad('La imagen debe ser una URL http(s)');
  return u;
};
async function removeLocalImage(u) {
  if (u && /^\/art\/[\w.-]+$/.test(u)) await unlink(join(ART_DIR, u.slice(5))).catch(() => {});
}
// card condition, NM unless said otherwise (bulk is almost always NM)
const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const checkCond = c => { c = String(c ?? 'NM').toUpperCase() || 'NM'; if (!CONDS.includes(c)) throw bad(`Estado inválido: ${c}`); return c; };
const checkLang = (l, allowEmpty = true) => {
  l = String(l ?? '').toUpperCase();
  if (l === '' && allowEmpty) return l;
  if (!LANGS.includes(l)) throw bad(`Idioma inválido: ${l}`);
  return l;
};

// Finds the card id for a set + number as typed (exact first, then normalized: 025 → 25, TG05 → TG5)
async function resolveCard(c, sid, num) {
  const q = () => c.query(
    'SELECT id, number FROM cards WHERE set_id = $1 AND (number = $2 OR number_norm = $3) ORDER BY (number = $2) DESC LIMIT 1',
    [sid, String(num), norm(num)]);
  let { rows } = await q();
  if (!rows.length) { await ensureSetCards(sid); ({ rows } = await q()); }
  return rows[0] || null;
}

async function groupsWithCards(c = pool) {
  const { rows: groups } = await c.query('SELECT id, name, cols, image_url FROM art_groups ORDER BY created_at DESC, id DESC');
  const { rows: gc } = await c.query(`SELECT g.group_id, g.pos, ${CARD_COLS} FROM art_group_cards g JOIN cards c ON c.id = g.card_id ORDER BY g.group_id, g.pos`);
  return groups.map(g => ({ ...g, cards: gc.filter(x => x.group_id === g.id).map(({ group_id, pos, ...card }) => card) }));
}

async function writeGroupCards(c, groupId, cards) {
  if (!Array.isArray(cards) || !cards.length) throw bad('El grupo necesita al menos una carta');
  const missing = [];
  for (let i = 0; i < cards.length; i++) {
    const card = await resolveCard(c, cards[i].sid, cards[i].num);
    if (!card) { missing.push(`${cards[i].sid} ${cards[i].num}`); continue; }
    await c.query('INSERT INTO art_group_cards (group_id, pos, card_id) VALUES ($1, $2, $3)', [groupId, i, card.id]);
  }
  if (missing.length) throw bad('No existen: ' + missing.join(', '));
}

const app = Fastify({ logger: { level: 'warn' } });
app.setErrorHandler((err, req, reply) => {
  const code = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
  if (code === 500) req.log.error(err);
  reply.code(code).send({ error: err.message });
});
app.register(fastifyStatic, { root: join(root, 'public') });
app.addContentTypeParser(/^image\//, { parseAs: 'buffer', bodyLimit: 15 * 1024 * 1024 }, (req, body, done) => done(null, body));

// ---------- landing (/alfa) and its alpha sign-ups ----------
app.get('/alfa', (req, reply) => reply.sendFile('landing.html'));
app.post('/api/alpha', async req => {
  const b = req.body || {}, txt = (x, n) => String(x ?? '').trim().slice(0, n);
  if (b.website) return { ok: true }; // honeypot filled in: a bot
  const email = txt(b.email, 120).toLowerCase(), name = txt(b.name, 80);
  if (!name) throw bad('Falta tu nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Ese email no parece válido');
  // signing up again with the same email updates the answers
  await pool.query(`INSERT INTO alpha_signups (email, name, handle, role, size, note) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO UPDATE SET name = $2, handle = $3, role = $4, size = $5, note = $6, updated_at = now()`,
    [email, name, txt(b.handle, 80), txt(b.role, 20), txt(b.size, 20), txt(b.note, 1000)]);
  return { ok: true };
});

// ---------- catalog ----------
app.get('/api/sets', async () => {
  await ensureSets();
  const { rows } = await pool.query(
    `SELECT id, name, series, coalesce(code, '') AS code, coalesce(to_char(release_date, 'YYYY/MM/DD'), '') AS date,
            total, printed_total AS printed, coalesce(symbol_url, '') AS sym, source, lang
     FROM sets ORDER BY release_date DESC NULLS LAST, id`);
  return rows;
});
app.post('/api/sets/refresh', async () => ({ sets: await syncSets() }));
app.get('/api/sets/:id/cards', async req => {
  await ensureSetCards(req.params.id, req.query.refresh === '1');
  const { rows } = await pool.query(`SELECT ${CARD_COLS} FROM cards c WHERE c.set_id = $1`, [req.params.id]);
  return rows;
});

// full-catalog download, started from the page and polled via GET /api/catalog
let syncJob = null;
app.get('/api/catalog', async () => {
  const { rows: [r] } = await pool.query(
    `SELECT (SELECT count(*) FROM sets)::int AS sets, (SELECT count(*) FROM sets WHERE cards_synced_at IS NOT NULL)::int AS synced,
            (SELECT count(*) FROM cards)::int AS cards`);
  return { ...r, job: syncJob, details: detailsJob() };
});
app.post('/api/catalog/sync', async () => {
  if (!syncJob?.running) {
    syncJob = { running: true, done: 0, total: 0, set: '' };
    syncAllCards(p => Object.assign(syncJob, p))
      .then(r => Object.assign(syncJob, { running: false, failed: r.failed }))
      .catch(e => Object.assign(syncJob, { running: false, error: e.message }));
  }
  return { job: syncJob };
});

// ---------- prices ----------
await import('../public/pricing.js');
const PRICE_CFG = { source: 'tcgplayer', cond: { NM: 1, LP: 0.85, MP: 0.7, HP: 0.5, DMG: 0.3 }, alert: 5000, ownDays: 7 };
const PRICE_COLS = `c.set_id || '|' || c.number AS k, p.usd, p.eur, p.url, to_char(p.fetched_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS at`;
let priceJob = null;
function startPriceJob(force) {
  if (priceJob?.running) return;
  priceJob = { running: true, done: 0, total: 0 };
  refreshPrices(force, x => Object.assign(priceJob, x))
    .then(r => Object.assign(priceJob, { running: false, failed: r.failed.length }))
    .catch(e => Object.assign(priceJob, { running: false, error: e.message }));
}
// prices of the cards in the inventory and in my collections; downloads the missing / old ones in the background
app.get('/api/prices', async () => {
  const [cfg, fx, stale] = await Promise.all([getSetting('prices', PRICE_CFG), getFx(), staleCount()]);
  if (stale) startPriceJob(false);
  const [prices, own] = await Promise.all([
    pool.query(`SELECT ${PRICE_COLS} FROM card_prices p JOIN cards c ON c.id = p.card_id
                WHERE EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id) OR EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id)
                   OR EXISTS (SELECT 1 FROM lot_items l WHERE l.card_id = c.id)`),
    pool.query(`SELECT c.set_id || '|' || c.number || '|' || o.variant AS k, o.clp, o.usd::float AS usd, (extract(epoch FROM o.updated_at) * 1000)::bigint AS at
                FROM price_overrides o JOIN cards c ON c.id = o.card_id`),
  ]);
  return { cfg, fx, job: priceJob, stale, prices: Object.fromEntries(prices.rows.map(({ k, ...r }) => [k, r])), own: Object.fromEntries(own.rows.map(r => [r.k, ownClp(r, fx)])), ownUsd: Object.fromEntries(own.rows.filter(r => r.usd != null).map(r => [r.k, r.usd])), ownAt: Object.fromEntries(own.rows.map(r => [r.k, +r.at])) };
});
// one card right now (e.g. just loaded)
app.get('/api/prices/card', async req => {
  const card = await resolveCard(pool, req.query.sid, req.query.num);
  if (!card) return {};
  // a card just loaded: also complete its illustrator / rarity if the catalog didn't have them
  await Promise.all([ensureCardPrice(card.id), fillDetails([card.id]).catch(() => {})]);
  const [{ rows }, { rows: [c] }] = await Promise.all([
    pool.query(`SELECT ${PRICE_COLS} FROM card_prices p JOIN cards c ON c.id = p.card_id WHERE c.id = $1`, [card.id]),
    pool.query(`SELECT ${CARD_COLS} FROM cards c WHERE c.id = $1`, [card.id]),
  ]);
  return { ...(rows[0] || {}), card: c };
});
app.post('/api/prices/refresh', async req => { startPriceJob(!!req.body?.force); await getFx(true); return { job: priceJob }; });
app.put('/api/prices/settings', async req => {
  const b = req.body || {};
  const cond = {};
  for (const k of Object.keys(PRICE_CFG.cond)) {
    const m = Number(b.cond?.[k] ?? PRICE_CFG.cond[k]);
    if (!(m >= 0 && m <= 1)) throw bad(`Porcentaje inválido para ${k}`);
    cond[k] = Math.round(m * 100) / 100;
  }
  const alert = Math.max(0, parseInt(b.alert, 10) || 0), ownDays = Math.min(365, Math.max(1, parseInt(b.ownDays, 10) || 7));
  await putSetting('prices', { source: b.source === 'cardmarket' ? 'cardmarket' : 'tcgplayer', cond, alert, ownDays });
  return getSetting('prices', PRICE_CFG);
});
// my own price in CLP; typed in USD it follows today's exchange rate
const ownClp = (r, fx) => r.usd != null && fx ? Math.round(r.usd * fx.usd) : r.clp;
// my own price (NM) for a card + variant, in usd or clp; both null = back to the market price
app.put('/api/prices/own', async req => {
  const { sid, num } = req.body || {};
  const variant = checkVariant(req.body.variant);
  const card = await resolveCard(pool, sid, num);
  if (!card) throw bad(`La carta ${num} no existe en la expansión ${sid}`);
  const id = card.id;
  const usd = req.body.usd == null || req.body.usd === '' ? null : Math.round(Number(req.body.usd) * 100) / 100;
  if (usd == null && (req.body.clp == null || req.body.clp === '')) await pool.query('DELETE FROM price_overrides WHERE card_id = $1 AND variant = $2', [id, variant]);
  else {
    if (usd != null && !(usd >= 0)) throw bad('Precio inválido');
    const clp = usd != null ? ownClp({ usd }, await getFx()) : parseInt(req.body.clp, 10);
    if (!(clp >= 0)) throw bad(usd != null ? 'No tengo el tipo de cambio para convertir a CLP' : 'Precio inválido');
    // saving the same value again counts as "checked today"
    await pool.query(`INSERT INTO price_overrides (card_id, variant, clp, usd) VALUES ($1, $2, $3, $4)
      ON CONFLICT (card_id, variant) DO UPDATE SET clp = $3, usd = $4, updated_at = now()`, [id, variant, clp, usd]);
  }
  return { ok: true };
});

// one representative card per Pokédex number (prefers recent commons), used to show species you don't own yet
app.get('/api/dex', async () => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (d) d AS dex, c.name, c.image_small AS img
     FROM cards c JOIN sets s ON s.id = c.set_id, unnest(c.dex) d
     WHERE s.source = 'ptcg' AND c.supertype = 'Pokémon' AND cardinality(c.dex) = 1 AND c.image_small IS NOT NULL
     ORDER BY d, (position(' ' in c.name) = 0 OR c.name LIKE 'Nidoran%' OR c.name LIKE 'Mr. %') DESC, (c.rarity = 'Common') DESC, length(c.name), s.release_date DESC NULLS LAST`);
  return rows;
});

// ---------- artists ----------
// owned = distinct cards of that artist with at least one copy (optionally only in one language)
app.get('/api/artists', async req => {
  const lang = req.query.lang ? checkLang(req.query.lang, false) : null;
  const { rows } = await pool.query(
    `SELECT c.artist AS name, count(*)::int AS total,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id AND ($1::text IS NULL OR i.lang = $1)))::int AS owned
     FROM cards c JOIN sets s ON s.id = c.set_id WHERE coalesce(c.artist, '') <> '' AND s.source = 'ptcg'
     GROUP BY c.artist ORDER BY count(*) DESC, c.artist`, [lang]);
  return rows;
});
app.get('/api/artists/cards', async req => {
  const name = String(req.query.name || '');
  if (!name) throw bad('Falta el nombre del artista');
  const lang = req.query.lang ? checkLang(req.query.lang, false) : null;
  const { rows } = await pool.query(
    `SELECT ${CARD_COLS}, s.name AS set_name, coalesce(s.code, '') AS set_code, coalesce(to_char(s.release_date, 'YYYY'), '') AS year,
            coalesce((SELECT sum(qty) FROM inventory i WHERE i.card_id = c.id AND ($2::text IS NULL OR i.lang = $2)), 0)::int AS qty
     FROM cards c JOIN sets s ON s.id = c.set_id
     WHERE c.artist = $1 AND s.source = 'ptcg'
     ORDER BY s.release_date NULLS LAST, s.id, length(c.number_norm), c.number_norm`, [name, lang]);
  return rows;
});

// ---------- everything the page needs on load ----------
app.get('/api/state', async () => {
  const [inv, log, groups, labels, locs, vimg] = await Promise.all([
    pool.query(`SELECT i.variant, i.lang, i.cond, i.loc, i.qty, i.personal, (extract(epoch FROM i.added_at) * 1000)::bigint AS added, ${CARD_COLS} FROM inventory i JOIN cards c ON c.id = i.card_id`),
    pool.query(`SELECT l.id, l.variant, l.lang, l.cond, l.loc, l.delta, l.personal, ${CARD_COLS} FROM inventory_log l JOIN cards c ON c.id = l.card_id ORDER BY l.id DESC LIMIT 50`),
    groupsWithCards(),
    pool.query('SELECT slug, label FROM variant_labels'),
    pool.query('SELECT id, name, kind, pos, note, rule FROM locations ORDER BY pos, id'),
    variantImages(),
  ]);
  return { inventory: inv.rows, log: log.rows.reverse(), groups, variants: Object.fromEntries(labels.rows.map(r => [r.slug, r.label])), locations: locs.rows, vimg };
});

// ---------- pictures per variant ----------
// own: my pictures; checklist: the checklist's picture of special variants (1st Edition, Poké Ball, misprints…).
// Keys "sid|num|variant". Plain normal / holo / reverse keep the catalog picture unless I set my own.
async function variantImages() {
  const [own, ck] = await Promise.all([
    pool.query(`SELECT c.set_id || '|' || c.number || '|' || v.variant AS k, v.img FROM variant_images v JOIN cards c ON c.id = v.card_id`),
    pool.query(`SELECT DISTINCT ON (k) k, img FROM (
                  SELECT c.set_id || '|' || c.number || '|' || (x->>'slug') AS k, x->>'img' AS img
                  FROM collection_cards cc JOIN cards c ON c.id = cc.card_id, jsonb_array_elements(cc.vlist) x
                  WHERE x->>'img' IS NOT NULL AND x->>'slug' NOT IN ('normal', 'holo', 'reverse')) t ORDER BY k`),
  ]);
  const { rows: vars } = await pool.query(
    `SELECT c.set_id || '|' || c.number AS k, array_agg(DISTINCT x->>'slug') AS slugs
     FROM collection_cards cc JOIN cards c ON c.id = cc.card_id, jsonb_array_elements(cc.vlist) x GROUP BY 1`);
  return { own: Object.fromEntries(own.rows.map(r => [r.k, r.img])), checklist: Object.fromEntries(ck.rows.map(r => [r.k, r.img])),
           variants: Object.fromEntries(vars.map(r => [r.k, r.slugs])) };
}
async function imageCard(q) {
  const variant = checkVariant(q.variant);
  const card = await resolveCard(pool, q.sid, q.num);
  if (!card) throw bad(`La carta ${q.num} no existe en la expansión ${q.sid}`);
  const { rows } = await pool.query('SELECT img FROM variant_images WHERE card_id = $1 AND variant = $2', [card.id, variant]);
  return { card, variant, old: rows[0]?.img };
}
async function setVariantImage(q, img) {
  const { card, variant, old } = await imageCard(q);
  await pool.query(`INSERT INTO variant_images (card_id, variant, img) VALUES ($1, $2, $3)
    ON CONFLICT (card_id, variant) DO UPDATE SET img = $3, updated_at = now()`, [card.id, variant, img]);
  if (old !== img) await removeLocalImage(old);
  return variantImages();
}
// a link: {sid, num, variant, url}
app.put('/api/card-image', async req => {
  const url = checkImageUrl(req.body?.url);
  if (!url) throw bad('Pega el link de una imagen');
  return setVariantImage(req.body, url);
});
// a photo of my card: body = the image, ?sid=&num=&variant=
app.put('/api/card-image/upload', async req => {
  const ext = IMAGE_EXT[req.headers['content-type']];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) throw bad('Sube una imagen JPG, PNG, WEBP o GIF');
  const { card, variant } = await imageCard(req.query);
  const file = `carta-${card.id.replace(/[^\w.-]/g, '_')}-${variant}-${Date.now()}.${ext}`;
  await writeFile(join(ART_DIR, file), req.body);
  return setVariantImage(req.query, '/art/' + file);
});
// back to the catalog picture
app.delete('/api/card-image', async req => {
  const { card, variant, old } = await imageCard(req.body || {});
  await pool.query('DELETE FROM variant_images WHERE card_id = $1 AND variant = $2', [card.id, variant]);
  await removeLocalImage(old);
  return variantImages();
});

// ---------- inventory ----------
// A row is one card + variant + language + condition + location: r = { cardId, variant, lang, cond, loc }
const ROW_WHERE = 'card_id = $1 AND variant = $2 AND lang = $3 AND cond = $4 AND loc = $5';
const rowArgs = r => [r.cardId, r.variant, r.lang, r.cond, r.loc];
// Writes a row's quantities (deletes it at 0)
async function writeRow(c, r, qty, personal) {
  if (qty <= 0) await c.query(`DELETE FROM inventory WHERE ${ROW_WHERE}`, rowArgs(r));
  else await c.query(
    `INSERT INTO inventory (card_id, variant, lang, cond, loc, qty, personal) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (card_id, variant, lang, cond, loc) DO UPDATE SET qty = $6, personal = $7, updated_at = now()`,
    [...rowArgs(r), qty, Math.min(Math.max(personal, 0), qty)]);
}
const lockRow = (c, r) => c.query(`SELECT qty, personal, added_at FROM inventory WHERE ${ROW_WHERE} FOR UPDATE`, rowArgs(r))
  .then(x => x.rows[0] || { qty: 0, personal: 0, added_at: null });
const checkLoc = l => { l = parseInt(l ?? 0, 10) || 0; if (l < 0) throw bad('Ubicación inválida'); return l; };
// the row a request talks about (resolves set + number to the card)
async function rowOf(c, b) {
  const variant = checkVariant(b.variant), lang = checkLang(b.lang), cond = checkCond(b.cond), loc = checkLoc(b.loc);
  if (loc) { const { rows } = await c.query('SELECT 1 FROM locations WHERE id = $1', [loc]); if (!rows.length) throw bad('Esa ubicación ya no existe'); }
  const card = await resolveCard(c, b.sid, b.num);
  if (!card) throw Object.assign(new Error(`La carta ${b.num} no existe en la expansión ${b.sid}`), { statusCode: 404 });
  return { cardId: card.id, num: card.number, variant, lang, cond, loc };
}

// personal: true = the added copies go to my personal collection
app.post('/api/inventory/add', async req => {
  const b = req.body || {};
  const d = parseInt(b.delta, 10);
  if (!d || Math.abs(d) > 10000) throw bad('Cantidad inválida');
  return tx(async c => {
    const r = await rowOf(c, b);
    const cur = await lockRow(c, r);
    const next = Math.max(0, cur.qty + d), real = next - cur.qty;
    // removing takes copies for sale first, then personal ones
    const pers = real > 0 && b.personal ? cur.personal + real : Math.min(cur.personal, next);
    await writeRow(c, r, next, pers);
    let logId = null;
    if (real) ({ rows: [{ id: logId }] } = await c.query(
      'INSERT INTO inventory_log (card_id, variant, lang, cond, loc, delta, personal) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [...rowArgs(r), real, pers - cur.personal]));
    return { sid: b.sid, num: r.num, variant: r.variant, lang: r.lang, cond: r.cond, loc: r.loc, qty: next, personal: next ? pers : 0, real, logId };
  });
});

// How many copies of a row are personal (0..qty)
app.post('/api/inventory/personal', async req => {
  const n = parseInt(req.body?.personal, 10);
  if (!(n >= 0)) throw bad('Cantidad inválida');
  return tx(async c => {
    const r = await rowOf(c, req.body);
    const cur = await lockRow(c, r);
    if (!cur.qty) throw bad('No tienes copias de esa carta');
    await writeRow(c, r, cur.qty, n);
    return { personal: Math.min(n, cur.qty) };
  });
});

app.post('/api/inventory/undo', async () => tx(async c => {
  const { rows } = await c.query(`SELECT l.*, ${CARD_COLS} FROM inventory_log l JOIN cards c ON c.id = l.card_id ORDER BY l.id DESC LIMIT 1 FOR UPDATE OF l`);
  if (!rows.length) return { undone: null };
  const e = rows[0], r = { cardId: e.card_id, variant: e.variant, lang: e.lang, cond: e.cond, loc: e.loc };
  const cur = await lockRow(c, r);
  const next = Math.max(0, cur.qty - e.delta), pers = Math.min(Math.max(0, cur.personal - e.personal), next);
  await writeRow(c, r, next, pers);
  await c.query('DELETE FROM inventory_log WHERE id = $1', [e.id]);
  return { undone: e.id, sid: e.sid, num: e.num, variant: e.variant, lang: e.lang, cond: e.cond, loc: e.loc, qty: next, personal: next ? pers : 0 };
}));

// Moves n copies (default all; copies for sale go first) of a row to another variant / language / condition / location,
// merging if that row already exists. Log entries follow when the whole row moves, so undo stays coherent.
async function moveRow(c, from, to, n = Infinity) {
  const cur = await lockRow(c, from);
  if (!cur.qty || ['variant', 'lang', 'cond', 'loc'].every(k => from[k] === to[k])) return 0;
  const k = Math.min(n, cur.qty), kp = Math.max(0, k - (cur.qty - cur.personal));
  await writeRow(c, from, cur.qty - k, cur.personal - kp);
  await c.query(
    `INSERT INTO inventory (card_id, variant, lang, cond, loc, qty, personal, added_at) VALUES ($1, $2, $3, $4, $5, $6, $7, coalesce($8, now()))
     ON CONFLICT (card_id, variant, lang, cond, loc) DO UPDATE SET qty = inventory.qty + excluded.qty, personal = inventory.personal + excluded.personal,
       added_at = least(inventory.added_at, excluded.added_at), updated_at = now()`,
    [...rowArgs(to), k, kp, cur.added_at]);
  if (k === cur.qty) await c.query(`UPDATE inventory_log SET variant = $6, lang = $7, cond = $8, loc = $9 WHERE ${ROW_WHERE}`, [...rowArgs(from), to.variant, to.lang, to.cond, to.loc]);
  return k;
}
// n copies (default all) of a row to another language, condition and/or location: body = row + {to: {lang?, cond?, loc?}, n?}
app.post('/api/inventory/move', async req => {
  const b = req.body || {}, t = b.to || {};
  const n = b.n == null ? Infinity : parseInt(b.n, 10);
  if (!(n > 0)) throw bad('Cantidad inválida');
  return tx(async c => {
    const from = await rowOf(c, b);
    const to = { ...from, variant: t.variant !== undefined ? checkVariant(t.variant) : from.variant, lang: t.lang !== undefined ? checkLang(t.lang, false) : from.lang, cond: t.cond !== undefined ? checkCond(t.cond) : from.cond, loc: t.loc !== undefined ? checkLoc(t.loc) : from.loc };
    if (to.loc) { const { rows } = await c.query('SELECT 1 FROM locations WHERE id = $1', [to.loc]); if (!rows.length) throw bad('Esa ubicación ya no existe'); }
    const moved = await moveRow(c, from, to, n);
    // the copies just loaded were re-filed (e.g. its price sent it to the binder): undo must find them in the new place
    if (moved && b.logId) await c.query('UPDATE inventory_log SET variant = $2, lang = $3, cond = $4, loc = $5 WHERE id = $1', [b.logId, to.variant, to.lang, to.cond, to.loc]);
    return { moved };
  });
});
// several whole rows to new locations at once (auto-assign): moves [{sid, num, variant, lang, cond, loc, to}]
app.post('/api/inventory/move-locs', { bodyLimit: 20 * 1024 * 1024 }, async req => {
  const moves = Array.isArray(req.body?.moves) ? req.body.moves : [];
  return tx(async c => {
    const { rows: locs } = await c.query('SELECT id FROM locations');
    const ok = new Set([0, ...locs.map(l => l.id)]);
    let moved = 0;
    for (const m of moves) {
      const from = await rowOf(c, m), to = { ...from, loc: checkLoc(m.to) };
      if (!ok.has(to.loc)) continue;
      moved += await moveRow(c, from, to);
    }
    return { moved };
  });
});
app.post('/api/inventory/assign-lang', async req => {
  const to = checkLang(req.body?.lang, false);
  await tx(async c => {
    const { rows } = await c.query("SELECT card_id, variant, cond, loc FROM inventory WHERE lang = ''");
    for (const r of rows) {
      const from = { cardId: r.card_id, variant: r.variant, lang: '', cond: r.cond, loc: r.loc };
      await moveRow(c, from, { ...from, lang: to });
    }
  });
  return { ok: true };
});
app.post('/api/inventory/reset', async req => {
  if (req.body?.confirm !== 'BORRAR') throw bad('Falta confirmación');
  await tx(async c => { await c.query('DELETE FROM inventory_log'); await c.query('DELETE FROM inventory'); });
  return { ok: true };
});

// ---------- storage locations (boxes, binders) ----------
const KINDS = ['box', 'binder', 'other'];
function checkLocation(b) {
  const name = String(b?.name ?? '').trim().replace(/\|/g, '/').slice(0, 80);
  if (!name) throw bad('Ponle un nombre a la ubicación');
  const r = b.rule || {};
  const list = x => (Array.isArray(x) ? x : []).map(String).filter(Boolean).slice(0, 500);
  const rule = {};
  if (list(r.series).length) rule.series = list(r.series);
  if (list(r.sets).length) rule.sets = list(r.sets);
  if (list(r.special).length) rule.special = list(r.special);
  if (list(r.origin).length) rule.origin = list(r.origin);   // INT (international), JA, ZH…: the set's region
  if (parseInt(r.minPrice, 10) > 0) rule.minPrice = parseInt(r.minPrice, 10);
  if (r.personal === true || r.personal === false) rule.personal = r.personal;
  if (r.auto === false) rule.auto = false;   // never assigned automatically, only by hand
  if (r.bulk === true) rule.bulk = true;      // only bulk: common/uncommon/rare/rare holo without ex/GX/V…, normal/holo/reverse
  return { name, kind: KINDS.includes(b.kind) ? b.kind : 'box', note: String(b.note ?? '').slice(0, 2000), rule };
}
const uniqueName = e => { if (e.code === '23505') throw bad('Ya existe una ubicación con ese nombre'); throw e; };
app.post('/api/locations', async req => {
  const l = checkLocation(req.body);
  const { rows: [r] } = await pool.query(
    `INSERT INTO locations (name, kind, note, rule, pos) VALUES ($1, $2, $3, $4, (SELECT coalesce(max(pos), 0) + 1 FROM locations)) RETURNING id`,
    [l.name, l.kind, l.note, JSON.stringify(l.rule)]).catch(uniqueName);
  return { id: r.id };
});
app.put('/api/locations/:id', async req => {
  const l = checkLocation(req.body);
  await pool.query('UPDATE locations SET name = $2, kind = $3, note = $4, rule = $5 WHERE id = $1', [req.params.id, l.name, l.kind, l.note, JSON.stringify(l.rule)]).catch(uniqueName);
  return { ok: true };
});
// order = which rule is checked first: ids in the new order
app.put('/api/locations-order', async req => {
  const ids = (req.body?.ids || []).map(Number);
  await tx(async c => { for (let i = 0; i < ids.length; i++) await c.query('UPDATE locations SET pos = $2 WHERE id = $1', [ids[i], i + 1]); });
  return { ok: true };
});
// deleting a location leaves its cards without location
app.delete('/api/locations/:id', async req => tx(async c => {
  const id = parseInt(req.params.id, 10);
  const { rows } = await c.query('SELECT card_id, variant, lang, cond FROM inventory WHERE loc = $1', [id]);
  for (const r of rows) { const from = { cardId: r.card_id, variant: r.variant, lang: r.lang, cond: r.cond, loc: id }; await moveRow(c, from, { ...from, loc: 0 }); }
  await c.query('UPDATE inventory_log SET loc = 0 WHERE loc = $1', [id]);
  await c.query('DELETE FROM locations WHERE id = $1', [id]);
  return { ok: true, moved: rows.length };
}));

// ---------- connected-art groups ----------
app.post('/api/groups', async req => {
  const { name, cols, cards } = req.body || {};
  if (!String(name || '').trim()) throw bad('El grupo necesita nombre');
  const image = checkImageUrl(req.body.image_url);
  const id = await tx(async c => {
    const { rows: [g] } = await c.query('INSERT INTO art_groups (name, cols, image_url) VALUES ($1, $2, $3) RETURNING id', [name.trim(), cols || 3, image]);
    await writeGroupCards(c, g.id, cards);
    return g.id;
  });
  return { id, groups: await groupsWithCards() };
});
app.put('/api/groups/:id', async req => {
  const { name, cols, cards } = req.body || {};
  if (!String(name || '').trim()) throw bad('El grupo necesita nombre');
  const image = checkImageUrl(req.body.image_url);
  const old = await tx(async c => {
    const { rows } = await c.query('SELECT image_url FROM art_groups WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows.length) throw Object.assign(new Error('Grupo no encontrado'), { statusCode: 404 });
    await c.query('UPDATE art_groups SET name = $2, cols = $3, image_url = $4 WHERE id = $1', [req.params.id, name.trim(), cols || 3, image]);
    await c.query('DELETE FROM art_group_cards WHERE group_id = $1', [req.params.id]);
    await writeGroupCards(c, req.params.id, cards);
    return rows[0].image_url;
  });
  if (old !== image) await removeLocalImage(old);
  return { id: Number(req.params.id), groups: await groupsWithCards() };
});
// Uploads the picture of the assembled art (raw image body) and stores it under public/art/
app.put('/api/groups/:id/image', async req => {
  const ext = IMAGE_EXT[req.headers['content-type']];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) throw bad('Sube una imagen JPG, PNG, WEBP o GIF');
  const { rows } = await pool.query('SELECT image_url FROM art_groups WHERE id = $1', [req.params.id]);
  if (!rows.length) throw Object.assign(new Error('Grupo no encontrado'), { statusCode: 404 });
  const file = `grupo-${Number(req.params.id)}-${Date.now()}.${ext}`;
  await writeFile(join(ART_DIR, file), req.body);
  await pool.query('UPDATE art_groups SET image_url = $2 WHERE id = $1', [req.params.id, '/art/' + file]);
  await removeLocalImage(rows[0].image_url);
  return { id: Number(req.params.id), groups: await groupsWithCards() };
});
app.delete('/api/groups/:id', async req => {
  const { rows } = await pool.query('DELETE FROM art_groups WHERE id = $1 RETURNING image_url', [req.params.id]);
  if (rows.length) await removeLocalImage(rows[0].image_url);
  return groupsWithCards();
});

// ---------- personal collections (e.g. every distinct Eevee) ----------
// A card is one print: same set + number = same card whatever the language (international catalog).
// Japanese, Chinese and hand-typed cards have their own sets and numbers, so they count as different cards.
// Owned: international cards (set without language) need a copy in the collection's language; the rest, any copy.
// Members: the cards of a checklist when the collection follows one, otherwise every card with the Pokédex number;
// plus cards added by hand. role: main (the Pokémon is the protagonist) or cameo (it appears in the art).
const COLL_CARDS = `
  WITH co AS (SELECT * FROM collections WHERE id = $1),
  members AS (
    SELECT cc.card_id, cc.role, cc.variants, cc.name, cc.set_name, cc.vlist FROM collection_cards cc WHERE cc.collection_id = $1
    UNION ALL
    SELECT c.id, 'main', '{}'::text[], NULL, NULL, '[]'::jsonb FROM cards c, co
    WHERE co.checklist_url IS NULL AND co.dex = ANY (c.dex)
      AND NOT EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.collection_id = $1 AND cc.card_id = c.id))
  SELECT ${CARD_COLS}, c.id AS card_id, m.role, m.variants, m.vlist, coalesce(m.name, c.name) AS label, c.name AS printed_name, coalesce(m.set_name, s.name) AS set_name, coalesce(s.code, '') AS set_code, s.source, s.lang AS set_lang,
         coalesce(to_char(s.release_date, 'YYYY'), '') AS year, coalesce(to_char(s.release_date, 'YYYY-MM-DD'), '') AS date,
         coalesce(sum(i.qty) FILTER (WHERE s.lang <> '' OR co.lang = '' OR i.lang = co.lang), 0)::int AS qty,
         coalesce(sum(i.personal) FILTER (WHERE s.lang <> '' OR co.lang = '' OR i.lang = co.lang), 0)::int AS personal,
         EXISTS (SELECT 1 FROM collection_hidden h WHERE h.collection_id = co.id AND h.card_id = c.id) AS hidden
  FROM members m
  CROSS JOIN co
  JOIN cards c ON c.id = m.card_id
  JOIN sets s ON s.id = c.set_id
  LEFT JOIN inventory i ON i.card_id = c.id
  GROUP BY c.id, s.id, m.role, m.variants, m.vlist, m.name, m.set_name, co.id, co.lang`;

async function collectionList() {
  const { rows: list } = await pool.query('SELECT id, name, dex, lang, checklist_url, checklist_at FROM collections ORDER BY created_at');
  for (const co of list) {
    // one slot per checklist variant (or per card when the collection has no variants)
    const { rows: [x] } = await pool.query(
      `SELECT count(*) FILTER (WHERE role = 'main')::int AS total, count(*) FILTER (WHERE role = 'main' AND owned)::int AS owned,
              count(*) FILTER (WHERE role = 'cameo')::int AS cameos, count(*) FILTER (WHERE role = 'cameo' AND owned)::int AS cameos_owned,
              count(DISTINCT card_id) FILTER (WHERE role = 'main')::int AS cards
       FROM (SELECT t.card_id, t.role, EXISTS (SELECT 1 FROM inventory i, collections k WHERE k.id = $1 AND i.card_id = t.card_id
                    AND (v.slug IS NULL OR i.variant = v.slug
                      -- the card's only standard print has a special name (Cosmos Holo…): normal / holo copies are that print
                      OR (v.type = 'default' AND v.slug NOT IN ('normal', 'holo', 'reverse') AND i.variant IN ('normal', 'holo')
                          AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(t.vlist) y WHERE y->>'slug' IN ('normal', 'holo')))) AND (t.set_lang <> '' OR k.lang = '' OR i.lang = k.lang)) AS owned
             FROM (${COLL_CARDS}) t
             CROSS JOIN LATERAL jsonb_to_recordset(CASE WHEN jsonb_array_length(t.vlist) > 0 THEN t.vlist ELSE '[{}]'::jsonb END) AS v(slug text, type text)
             WHERE NOT t.hidden) slots`, [co.id]);
    Object.assign(co, x);
  }
  return list;
}
const checkCollection = b => {
  const name = String(b?.name || '').trim(), dex = parseInt(b?.dex, 10), lang = checkLang(b?.lang);
  if (!name) throw bad('La colección necesita nombre');
  if (!(dex >= 1 && dex <= 1100)) throw bad('Número de Pokédex inválido');
  return { name, dex, lang };
};
app.get('/api/collections', collectionList);
app.post('/api/collections', async req => {
  const { name, dex, lang } = checkCollection(req.body);
  const { rows: [r] } = await pool.query('INSERT INTO collections (name, dex, lang) VALUES ($1, $2, $3) RETURNING id', [name, dex, lang]);
  return { id: r.id, collections: await collectionList() };
});
app.put('/api/collections/:id', async req => {
  const { name, dex, lang } = checkCollection(req.body);
  await pool.query('UPDATE collections SET name = $2, dex = $3, lang = $4 WHERE id = $1', [req.params.id, name, dex, lang]);
  return { id: Number(req.params.id), collections: await collectionList() };
});
app.delete('/api/collections/:id', async req => {
  await pool.query('DELETE FROM collections WHERE id = $1', [req.params.id]);
  return collectionList();
});
app.get('/api/collections/:id/cards', async req => {
  const { rows } = await pool.query(`SELECT * FROM (${COLL_CARDS}) t ORDER BY date = '', date, sid, length(num), num`, [req.params.id]);
  return rows;
});
app.post('/api/collections/:id/hide', async req => {
  const card = String(req.body?.card_id || '');
  if (req.body?.hidden) await pool.query('INSERT INTO collection_hidden VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, card]);
  else await pool.query('DELETE FROM collection_hidden WHERE collection_id = $1 AND card_id = $2', [req.params.id, card]);
  return { ok: true };
});
// Follow a PokeCottage master-set checklist (and refresh it)
app.post('/api/collections/:id/checklist', async req => {
  const url = String(req.body?.url || '').trim();
  if (!url) throw bad('Falta el link de la checklist');
  const stats = await importChecklist(req.params.id, url);
  return { ...stats, collections: await collectionList() };
});
// Stop following the checklist: back to every card with the Pokédex number (hand-added cards stay)
app.delete('/api/collections/:id/checklist', async req => {
  await tx(async c => {
    await c.query('DELETE FROM collection_cards WHERE collection_id = $1 AND from_checklist', [req.params.id]);
    await c.query('UPDATE collections SET checklist_url = NULL, checklist_at = NULL WHERE id = $1', [req.params.id]);
  });
  return collectionList();
});
// Protagonist or cameo for one card
app.post('/api/collections/:id/role', async req => {
  const role = req.body?.role === 'cameo' ? 'cameo' : 'main', card = String(req.body?.card_id || '');
  await pool.query(
    `INSERT INTO collection_cards (collection_id, card_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (collection_id, card_id) DO UPDATE SET role = $3`, [req.params.id, card, role]);
  return { ok: true };
});
// Add cards by set + number (e.g. cameos: trainers or other Pokémon where it appears)
app.post('/api/collections/:id/cards', async req => {
  const role = req.body?.role === 'main' ? 'main' : 'cameo', list = req.body?.cards;
  if (!Array.isArray(list) || !list.length) throw bad('No hay cartas para agregar');
  const missing = [];
  let added = 0;
  await tx(async c => {
    for (const x of list) {
      const card = await resolveCard(c, x.sid, x.num).catch(() => null);
      if (!card) { missing.push(`${x.sid} ${x.num}`); continue; }
      await c.query(
        `INSERT INTO collection_cards (collection_id, card_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (collection_id, card_id) DO UPDATE SET role = $3`, [req.params.id, card.id, role]);
      added++;
    }
  });
  return { added, missing };
});
// Remove a hand-added card from the collection
app.delete('/api/collections/:id/cards/:card', async req => {
  await pool.query('DELETE FROM collection_cards WHERE collection_id = $1 AND card_id = $2 AND NOT from_checklist', [req.params.id, req.params.card]);
  return { ok: true };
});
// Downloads the Japanese cards of the collection's Pokémon from TCGdex
app.post('/api/collections/:id/sync-ja', async req => {
  const { rows } = await pool.query('SELECT dex FROM collections WHERE id = $1', [req.params.id]);
  if (!rows.length) throw Object.assign(new Error('Colección no encontrada'), { statusCode: 404 });
  return syncJaDex(rows[0].dex);
});

// A card that is not in any catalog (e.g. Chinese), typed in by hand. Its set is created per language + name.
app.post('/api/cards/manual', async req => {
  const b = req.body || {};
  const lang = checkLang(b.lang, false), setName = String(b.set_name || '').trim(), number = String(b.number || '').trim(), name = String(b.name || '').trim();
  if (!setName || !number || !name) throw bad('Faltan datos: expansión, número y nombre');
  const dex = String(b.dex ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
  if (dex.some(d => !(d >= 1 && d <= 1100))) throw bad('Número de Pokédex inválido');
  const image = checkImageUrl(b.image_url);
  // readable slug for latin names; a hash for others (Chinese, Korean…)
  const slug = /^[\x20-\x7E]+$/.test(setName) ? setName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
    : createHash('sha1').update(setName).digest('hex').slice(0, 12);
  const setId = `x-${lang.toLowerCase()}-${slug}`;
  return tx(async c => {
    await c.query(
      `INSERT INTO sets (id, name, code, source, lang, cards_synced_at) VALUES ($1, $2, $3, 'manual', $4, now()) ON CONFLICT (id) DO NOTHING`,
      [setId, setName, String(b.set_code || '').trim() || null, lang]);
    const { rows } = await c.query(
      `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
       VALUES ($1, $2, $3, $4, $5, 'Pokémon', $6, $7, $8, $9, $9)
       ON CONFLICT (set_id, number) DO NOTHING RETURNING id`,
      [`${setId}-${number}`, setId, number, norm(number), name, String(b.rarity || '').trim() || null, String(b.artist || '').trim() || null, dex, image]);
    if (!rows.length) throw bad(`Ya existe la carta ${number} en ${setName}`);
    return { sid: setId, num: number, id: rows[0].id };
  });
});

// ---------- lots (deals: cards I sell or buy together at a % of the market price) ----------
const LOT_DEF = { sell: 90, buy: 70 };
const checkLot = b => {
  const r = {};
  if (b.name !== undefined) { r.name = String(b.name).trim().slice(0, 120); if (!r.name) throw bad('Ponle un nombre al lote'); }
  if (b.kind !== undefined) r.kind = b.kind === 'buy' ? 'buy' : 'sell';
  if (b.pct !== undefined) { r.pct = parseInt(b.pct, 10); if (!(r.pct >= 1 && r.pct <= 300)) throw bad('Porcentaje inválido'); }
  if (b.round_to !== undefined) { r.round_to = parseInt(b.round_to, 10); if (![1, 10, 50, 100, 500, 1000].includes(r.round_to)) throw bad('Redondeo inválido'); }
  if (b.note !== undefined) r.note = String(b.note).slice(0, 2000);
  return r;
};
async function lotById(c, id, lock = false) {
  const { rows: [lot] } = await c.query(`SELECT * FROM lots WHERE id = $1${lock ? ' FOR UPDATE' : ''}`, [id]);
  if (!lot) throw Object.assign(new Error('Lote no encontrado'), { statusCode: 404 });
  return lot;
}
app.get('/api/lots', async () => {
  const [lots, items, def] = await Promise.all([
    pool.query(`SELECT id, name, kind, pct, round_to, note, status, created_at, closed_at FROM lots ORDER BY status = 'done', coalesce(closed_at, created_at) DESC, id DESC`),
    pool.query(`SELECT l.lot_id, l.variant, l.lang, l.cond, l.qty, l.price, l.unit, l.taken, ${CARD_COLS} FROM lot_items l JOIN cards c ON c.id = l.card_id ORDER BY l.added_at, c.set_id, c.number`),
    getSetting('lots', LOT_DEF),
  ]);
  return { def, lots: lots.rows.map(l => ({ ...l, items: items.rows.filter(i => i.lot_id === l.id).map(({ lot_id, ...i }) => i) })) };
});
app.post('/api/lots', async req => {
  const b = checkLot({ name: 'Lote', ...req.body });
  const def = await getSetting('lots', LOT_DEF);
  const kind = b.kind || 'sell';
  const { rows: [r] } = await pool.query('INSERT INTO lots (name, kind, pct, round_to) VALUES ($1, $2, $3, $4) RETURNING id',
    [b.name, kind, b.pct ?? def[kind], b.round_to ?? 10]);
  return { id: r.id };
});
app.put('/api/lots/:id', async req => {
  const b = checkLot(req.body || {});
  const keys = Object.keys(b);
  if (keys.length) await pool.query(`UPDATE lots SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1`, [req.params.id, ...keys.map(k => b[k])]);
  return { ok: true };
});
app.put('/api/lots-defaults', async req => {
  const sell = parseInt(req.body?.sell, 10), buy = parseInt(req.body?.buy, 10);
  if (!(sell >= 1 && sell <= 300 && buy >= 1 && buy <= 300)) throw bad('Porcentaje inválido');
  await putSetting('lots', { sell, buy });
  return { sell, buy };
});
app.delete('/api/lots/:id', async req => { await pool.query('DELETE FROM lots WHERE id = $1', [req.params.id]); return { ok: true }; });

// adds / removes copies of a line (delta), or sets its hand price (price: CLP or null)
app.post('/api/lots/:id/items', async req => {
  const b = req.body || {};
  const variant = checkVariant(b.variant), lang = checkLang(b.lang), cond = checkCond(b.cond);
  return tx(async c => {
    const lot = await lotById(c, req.params.id, true);
    if (lot.status === 'done') throw bad('El lote ya está cerrado; reábrelo para cambiarlo');
    const card = await resolveCard(c, b.sid, b.num);
    if (!card) throw Object.assign(new Error(`La carta ${b.num} no existe en la expansión ${b.sid}`), { statusCode: 404 });
    const key = [lot.id, card.id, variant, lang, cond];
    const { rows: [cur] } = await c.query('SELECT qty FROM lot_items WHERE lot_id = $1 AND card_id = $2 AND variant = $3 AND lang = $4 AND cond = $5 FOR UPDATE', key);
    if ('price' in b) {
      const price = b.price == null || b.price === '' ? null : parseInt(b.price, 10);
      if (price !== null && !(price >= 0)) throw bad('Precio inválido');
      await c.query('UPDATE lot_items SET price = $6 WHERE lot_id = $1 AND card_id = $2 AND variant = $3 AND lang = $4 AND cond = $5', [...key, price]);
      return { qty: cur?.qty || 0, price };
    }
    const d = parseInt(b.delta, 10);
    if (!d || Math.abs(d) > 10000) throw bad('Cantidad inválida');
    const next = Math.max(0, (cur?.qty || 0) + d);
    if (!next) await c.query('DELETE FROM lot_items WHERE lot_id = $1 AND card_id = $2 AND variant = $3 AND lang = $4 AND cond = $5', key);
    else await c.query(`INSERT INTO lot_items (lot_id, card_id, variant, lang, cond, qty) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (lot_id, card_id, variant, lang, cond) DO UPDATE SET qty = $6`, [...key, next]);
    if (!cur) ensureCardPrice(card.id).catch(() => {});
    return { qty: next, num: card.number };
  });
});

// several lines at once (e.g. every filtered card of Mi colección): items [{sid, num, variant, lang, cond, qty}] are added
app.post('/api/lots/:id/items/batch', async req => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length || items.length > 5000) throw bad('Lista inválida');
  return tx(async c => {
    const lot = await lotById(c, req.params.id, true);
    if (lot.status === 'done') throw bad('El lote ya está cerrado; reábrelo para cambiarlo');
    let added = 0;
    for (const it of items) {
      const variant = checkVariant(it.variant), lang = checkLang(it.lang), cond = checkCond(it.cond), qty = parseInt(it.qty, 10);
      if (!(qty > 0)) continue;
      const card = await resolveCard(c, it.sid, it.num);
      if (!card) continue;
      await c.query(`INSERT INTO lot_items (lot_id, card_id, variant, lang, cond, qty) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (lot_id, card_id, variant, lang, cond) DO UPDATE SET qty = lot_items.qty + $6`, [lot.id, card.id, variant, lang, cond, qty]);
      added += qty;
    }
    return { added };
  });
});

// Closing a lot updates the inventory: a sale takes the copies out (only copies for sale), a purchase adds them.
// Each line remembers where its copies came from / went (taken: [{loc, n}]) so reopening puts things back.
const lotKey = it => `${it.sid}|${it.num}|${it.variant}|${it.lang}|${it.cond}`;
async function lotRows(c, lot) {
  const { rows } = await c.query(`SELECT l.*, c.set_id AS sid, c.number AS num, c.name FROM lot_items l JOIN cards c ON c.id = l.card_id WHERE l.lot_id = $1`, [lot.id]);
  if (!rows.length) throw bad('El lote está vacío');
  return rows;
}
// takes it.qty copies for sale of each line, from the locations in prefer first; → taken per line
async function takeCopies(c, rows, prefer = () => []) {
  const short = [], taken = new Map();
  for (const it of rows) {
    const { rows: have } = await c.query(
      'SELECT loc, qty, personal FROM inventory WHERE card_id = $1 AND variant = $2 AND lang = $3 AND cond = $4 ORDER BY loc FOR UPDATE',
      [it.card_id, it.variant, it.lang, it.cond]);
    const pref = prefer(it).map(t => t.loc);
    have.sort((a, b) => (pref.includes(a.loc) ? 0 : 1) - (pref.includes(b.loc) ? 0 : 1));
    const sale = have.reduce((a, h) => a + h.qty - h.personal, 0);
    if (sale < it.qty) { short.push(`${it.name} ${it.sid} #${it.num} ${it.variant} ${it.lang || '¿?'} ${it.cond}: tienes ${sale} para vender, el lote lleva ${it.qty}`); continue; }
    let left = it.qty; const t = [];
    for (const h of have) {
      const n = Math.min(left, h.qty - h.personal); if (!n) continue;
      await writeRow(c, { cardId: it.card_id, variant: it.variant, lang: it.lang, cond: it.cond, loc: h.loc }, h.qty - n, h.personal);
      t.push({ loc: h.loc, n }); left -= n; if (!left) break;
    }
    taken.set(it, t);
  }
  if (short.length) throw bad('No alcanzan las copias:\n' + short.join('\n'));
  return taken;
}
// puts the copies of each line in the given locations
async function putCopies(c, rows, where) {
  const { rows: locs } = await c.query('SELECT id FROM locations');
  const ok = new Set([0, ...locs.map(l => l.id)]);
  const put = new Map();
  for (const it of rows) {
    const t = where(it).map(x => ({ loc: ok.has(x.loc) ? x.loc : 0, n: x.n }));
    for (const x of t) {
      const r = { cardId: it.card_id, variant: it.variant, lang: it.lang, cond: it.cond, loc: x.loc };
      const cur = await lockRow(c, r);
      await writeRow(c, r, cur.qty + x.n, cur.personal);
    }
    put.set(it, t);
  }
  return put;
}
const saveTaken = (c, lot, it, taken, unit) => c.query(
  'UPDATE lot_items SET taken = $6, unit = $7 WHERE lot_id = $1 AND card_id = $2 AND variant = $3 AND lang = $4 AND cond = $5',
  [lot.id, it.card_id, it.variant, it.lang, it.cond, taken ? JSON.stringify(taken) : null, unit]);
// units: {"sid|num|variant|lang|cond": CLP per copy} as the page computed them (history); locs: where bought copies go
app.post('/api/lots/:id/close', async req => tx(async c => {
  const lot = await lotById(c, req.params.id, true);
  if (lot.status === 'done') throw bad('El lote ya está cerrado');
  const rows = await lotRows(c, lot);
  const units = req.body?.units || {}, locs = req.body?.locs || {};
  const moved = lot.kind === 'sell' ? await takeCopies(c, rows)
    : await putCopies(c, rows, it => [{ loc: parseInt(locs[lotKey(it)], 10) || 0, n: it.qty }]);
  for (const it of rows) { const u = parseInt(units[lotKey(it)], 10); await saveTaken(c, lot, it, moved.get(it), u >= 0 ? u : null); }
  await c.query("UPDATE lots SET status = 'done', closed_at = now() WHERE id = $1", [lot.id]);
  return { ok: true };
}));
// reopening undoes the inventory change (the sold copies come back where they were, the bought ones leave)
app.post('/api/lots/:id/reopen', async req => tx(async c => {
  const lot = await lotById(c, req.params.id, true);
  if (lot.status !== 'done') throw bad('El lote no está cerrado');
  const rows = await lotRows(c, lot);
  if (lot.kind === 'buy') await takeCopies(c, rows, it => it.taken || []);
  else await putCopies(c, rows, it => it.taken || [{ loc: 0, n: it.qty }]);
  await c.query("UPDATE lots SET status = 'open', closed_at = NULL WHERE id = $1", [lot.id]);
  await c.query('UPDATE lot_items SET unit = NULL, taken = NULL WHERE lot_id = $1', [lot.id]);
  return { ok: true };
}));

// ---------- import / export ----------
// Accepts the JSON backup format (also the old browser-only one): { inv: {"sid|num|variant|lang": qty}, groups: [...] }
app.post('/api/import', { bodyLimit: 20 * 1024 * 1024 }, async req => {
  const { inv = {}, personal = {}, groups = [], locations = [], mode = 'add' } = req.body || {};
  const items = [];
  const skipped = [];
  for (const [k, q] of Object.entries(inv)) {
    // the location goes by name (ids differ between databases)
    const [sid, num, variant, lang = '', cond = 'NM', location = ''] = k.split('|');
    const qty = parseInt(q, 10);
    if (!sid || !num || !VARIANT_RE.test(String(variant)) || !(lang === '' || LANGS.includes(lang)) || !CONDS.includes(cond) || !(qty > 0)) { skipped.push(k); continue; }
    items.push({ sid, num, variant, lang, cond, location: location.trim(), qty, personal: Math.min(Math.max(parseInt(personal[k], 10) || 0, 0), qty) });
  }
  await ensureSets();
  const sids = new Set([...items.map(i => i.sid), ...groups.flatMap(g => (g.cards || []).map(c => c.sid))]);
  for (const sid of sids) {
    try { await ensureSetCards(sid); } catch (e) { skipped.push(`expansión ${sid}: ${e.message}`); }
  }
  return tx(async c => {
    if (mode === 'replace') { await c.query('DELETE FROM inventory_log'); await c.query('DELETE FROM inventory'); }
    let imported = 0, importedGroups = 0;
    const locId = new Map((await c.query('SELECT id, name FROM locations')).rows.map(l => [l.name.toLowerCase(), l.id]));
    for (const l of Array.isArray(locations) ? locations : []) {
      let def; try { def = checkLocation(l); } catch (e) { continue; }
      if (locId.has(def.name.toLowerCase())) continue;
      const { rows: [r] } = await c.query(`INSERT INTO locations (name, kind, note, rule, pos) VALUES ($1, $2, $3, $4, (SELECT coalesce(max(pos), 0) + 1 FROM locations)) RETURNING id`,
        [def.name, def.kind, def.note, JSON.stringify(def.rule)]);
      locId.set(def.name.toLowerCase(), r.id);
    }
    for (const it of items) {
      const card = await resolveCard(c, it.sid, it.num).catch(() => null);
      if (!card) { skipped.push(`${it.sid} ${it.num}`); continue; }
      let loc = 0;
      if (it.location) {
        loc = locId.get(it.location.toLowerCase());
        if (!loc) {
          const { rows: [r] } = await c.query(`INSERT INTO locations (name, pos, rule) VALUES ($1, (SELECT coalesce(max(pos), 0) + 1 FROM locations), '{"auto": false}') RETURNING id`, [it.location.replace(/\|/g, '/')]);
          loc = r.id; locId.set(it.location.toLowerCase(), loc);
        }
      }
      await c.query(
        `INSERT INTO inventory (card_id, variant, lang, cond, loc, qty, personal) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (card_id, variant, lang, cond, loc) DO UPDATE SET qty = inventory.qty + excluded.qty, personal = inventory.personal + excluded.personal, updated_at = now()`,
        [card.id, it.variant, it.lang, it.cond, loc, it.qty, it.personal]);
      imported += it.qty;
    }
    for (const g of groups) {
      if (!g.name || !g.cards?.length) continue;
      await c.query('DELETE FROM art_groups WHERE name = $1', [g.name]); // same name = replace
      let image = null; try { image = checkImageUrl(g.image_url); } catch (e) {}
      const { rows: [row] } = await c.query('INSERT INTO art_groups (name, cols, image_url) VALUES ($1, $2, $3) RETURNING id', [g.name, g.cols || 3, image]);
      await c.query('SAVEPOINT grp');
      try { await writeGroupCards(c, row.id, g.cards); importedGroups++; await c.query('RELEASE SAVEPOINT grp'); }
      catch (e) { await c.query('ROLLBACK TO SAVEPOINT grp'); await c.query('DELETE FROM art_groups WHERE id = $1', [row.id]); skipped.push(`grupo ${g.name}: ${e.message}`); }
    }
    return { imported, importedGroups, skipped };
  });
});

const today = () => new Date().toISOString().slice(0, 10);
app.get('/api/export.json', async (req, reply) => {
  const { rows } = await pool.query("SELECT set_id, number, variant, lang, cond, coalesce(location, '') AS location, qty, personal FROM inventory_full ORDER BY set_id, number, variant, lang, cond, location");
  const { rows: locations } = await pool.query('SELECT name, kind, note, rule FROM locations ORDER BY pos, id');
  const groups = (await groupsWithCards()).map(g => ({ name: g.name, cols: g.cols, image_url: g.image_url, cards: g.cards.map(c => ({ sid: c.sid, num: c.num })) }));
  const key = r => `${r.set_id}|${r.number}|${r.variant}|${r.lang}|${r.cond}|${r.location}`;
  const inv = Object.fromEntries(rows.map(r => [key(r), r.qty]));
  const personal = Object.fromEntries(rows.filter(r => r.personal).map(r => [key(r), r.personal]));
  reply.header('Content-Disposition', `attachment; filename="respaldo-inventario-pokemon-${today()}.json"`);
  return { app: 'inventario-pokemon', version: 5, exported: new Date().toISOString(), inv, personal, groups, locations };
});
app.get('/api/export.csv', async (req, reply) => {
  const { rows } = await pool.query(
    `SELECT f.set_id, f.set_name, f.set_code, f.number, f.variant, f.lang, f.cond, f.location, f.qty, f.personal, f.name, array_to_string(f.dex, ',') AS dex, f.artist, f.rarity, f.supertype,
            p.usd, p.eur, o.clp AS own_clp, o.usd::float AS own_usd
     FROM inventory_full f LEFT JOIN card_prices p ON p.card_id = f.card_id LEFT JOIN price_overrides o ON o.card_id = f.card_id AND o.variant = f.variant
     ORDER BY f.set_id, f.number, f.variant, f.lang, f.cond, f.location`);
  const [cfg, fx] = await Promise.all([getSetting('prices', PRICE_CFG), getFx()]);
  const cell = x => { x = String(x ?? ''); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  const head = 'set_id;set_nombre;set_codigo;numero;variante;idioma;estado;ubicacion;cantidad;personal;nombre;pokedex;ilustrador;rareza;tipo;precio_unitario_clp;precio_total_clp;fuente_precio';
  const lines = rows.map(r => {
    const own = r.own_clp == null ? null : ownClp({ clp: r.own_clp, usd: r.own_usd }, fx);
    const pr = globalThis.Pricing.pick(r, r.variant, r.cond, cfg, fx, own);
    return [r.set_id, r.set_name, r.set_code, r.number, r.variant, r.lang, r.cond, r.location, r.qty, r.personal, r.name, r.dex, r.artist, r.rarity, r.supertype,
      pr ? pr.clp : '', pr ? pr.clp * r.qty : '', pr ? pr.src + (pr.approx ? ' (aprox.)' : '') : ''].map(cell).join(';');
  });
  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="inventario-pokemon-${today()}.csv"`);
  return '﻿' + [head, ...lines].join('\n');
});

await migrate(join(root, 'db', 'migrations'));
const port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
await app.listen({ port, host });
startDetailsJob();
console.log(`Inventario Pokémon listo en http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
