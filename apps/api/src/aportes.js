// Photos the community shares for catalog cards with no picture (fotos-aportadas). Anyone with an account can send
// the photo of their own card, accepting the "Términos para aportar fotos" (apps/web/public/terminos-fotos.html); the
// owner reviews each one, and once approved it becomes the card's picture for everyone (two WebP sizes under
// IMAGE_DIR, like our copy of the catalog) with the credit of whoever took it. Anyone can report a shared photo; the
// owner can withdraw it and stop that account from sharing more.
import sharp from 'sharp';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool, asSystem } from './db.js';
import { IMAGE_DIR, save } from './imagenes.js';

// the version written at the top of terminos-fotos.html; change both together when the terms change
export const TERMS_VERSION = '2026-10-14';
const DIR = join(IMAGE_DIR, 'aportes');
const REASONS = { borrosa: 'Borrosa', equivocada: 'Carta equivocada', sleeve: 'Con sleeve o reflejo', ajena: 'No parece suya' };
const REPORT_REASONS = ['mine', 'wrong', 'other'];
const DAY = 24 * 3600 * 1000;

const err = (code, msg) => Object.assign(new Error(msg), { statusCode: code });
const fileOf = id => `aportes/${id}.jpg`;
// a card has a picture when our copy has it, or when it shows its catalog link (a set our copy hasn't reached, or a
// Scrydex picture we may not copy). Links our copy found broken (404) or that never existed don't count.
const HAS_PICTURE = `(EXISTS (SELECT 1 FROM card_images ci WHERE ci.card_id = c.id AND ci.status = 'ok')
  OR (coalesce(c.image_small, '') <> '' AND NOT EXISTS (SELECT 1 FROM card_images ci WHERE ci.card_id = c.id AND ci.status = 'missing')))`;
async function hasPicture(q, cardId) {
  const { rows: [r] } = await q.query(`SELECT ${HAS_PICTURE} AS has FROM cards c WHERE c.id = $1`, [cardId]);
  return !!r?.has;
}
const isBlocked = async (c, userId) => (await c.query('SELECT 1 FROM photo_contributor_blocks WHERE user_id = $1', [userId])).rowCount > 0;

export function aportesRoutes(app, { isOwner, ownerOnly: only, resolveCard }) {
  const ownerOnly = req => only(req, 'Solo el administrador revisa las fotos aportadas.');
  const cardOf = async q => {
    const card = await resolveCard(pool, q.sid, q.num);
    if (!card) throw err(400, `La carta ${q.num} no existe en la expansión ${q.sid}`);
    return card;
  };

  // what the photo dialog may offer for this card: sharing only when it has no picture; not when the account is blocked
  app.get('/api/photo-status', async req => {
    const card = await cardOf(req.query);
    const [has, blocked, mine] = await Promise.all([hasPicture(pool, card.id), isBlocked(pool, req.user.id),
      pool.query("SELECT 1 FROM photo_submissions WHERE card_id = $1 AND status = 'pending'", [card.id])]);
    return { canShare: !has, blocked, pending: mine.rowCount > 0, terms: TERMS_VERSION };
  });

  // share a photo: body = the photo already framed like a card (JPEG/PNG/WebP), ?sid=&num=&terms=<version accepted>
  app.post('/api/photo-submissions', async req => {
    if (req.query.terms !== TERMS_VERSION) throw err(400, 'Acepta los Términos para aportar fotos para compartirla.');
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw err(400, 'Sube una foto JPG, PNG o WEBP');
    const card = await cardOf(req.query);
    if (await isBlocked(pool, req.user.id)) throw err(403, 'Tu cuenta no puede aportar fotos a la comunidad.');
    if (await hasPicture(pool, card.id)) throw err(409, 'Esta carta ya tiene foto en Nitsu.');
    // re-encoded: drops the metadata (GPS, camera) and anything that isn't an image
    const jpg = await sharp(req.body).rotate().resize({ height: 1200, withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer()
      .catch(() => { throw err(400, 'La foto no se pudo leer. Prueba con otra.'); });
    let row;
    try {
      ({ rows: [row] } = await pool.query(
        `INSERT INTO photo_submissions (card_id, file, terms_version) VALUES ($1, '', $2) RETURNING id`, [card.id, TERMS_VERSION]));
    } catch (e) {
      if (e.code === '23505') throw err(409, 'Ya enviaste una foto de esta carta: está en revisión.');
      throw e;
    }
    await mkdir(DIR, { recursive: true });
    await writeFile(join(IMAGE_DIR, fileOf(row.id)), jpg);
    await pool.query('UPDATE photo_submissions SET file = $2 WHERE id = $1', [row.id, fileOf(row.id)]);
    return { id: row.id, status: 'pending' };
  });

  // my shared photos and how they went
  app.get('/api/photo-submissions/mine', async () => {
    const { rows } = await pool.query(
      `SELECT p.id, p.status, p.reason, p.created_at, p.reviewed_at, c.set_id AS sid, c.number AS num, c.name, s.name AS set_name, s.code
       FROM photo_submissions p JOIN cards c ON c.id = p.card_id JOIN sets s ON s.id = c.set_id
       ORDER BY p.created_at DESC LIMIT 200`);
    const n = st => rows.filter(r => r.status === st).length;
    return { approved: n('approved'), pending: n('pending'), rejected: n('rejected'), list: rows };
  });

  // the photo as sent: for its author and the owner
  app.get('/api/photo-submissions/:id/file', async (req, reply) => {
    const id = Number(req.params.id);
    const owner = await isOwner(req);
    const row = owner
      ? await asSystem(async c => (await c.query('SELECT file, status FROM photo_submissions WHERE id = $1', [id])).rows[0])
      : (await pool.query('SELECT file, status FROM photo_submissions WHERE id = $1', [id])).rows[0];
    if (!row?.file) throw err(404, 'No existe');
    reply.header('cache-control', 'private, max-age=300');
    return reply.type('image/jpeg').send(await readFile(join(IMAGE_DIR, row.file)).catch(() => { throw err(404, 'No existe'); }));
  });

  // who took a card's picture, for the credit next to it
  app.get('/api/card-credit', async req => {
    const card = await cardOf(req.query);
    const { rows: [r] } = await pool.query(
      `SELECT u.name FROM card_images ci LEFT JOIN "user" u ON u.id = ci.credit_user_id
       WHERE ci.card_id = $1 AND ci.size = 'large' AND ci.status = 'ok' AND ci.source = 'aporte'`, [card.id]);
    return r ? { shared: true, credit: r.name || null } : { shared: false };
  });

  // "Se buscan": cards with no picture that most accounts have, and how much of the catalog has one. Only counts
  // leave the database, never who has them.
  app.get('/api/wanted-photos', async () => asSystem(async c => {
    const [{ rows: list }, { rows: [tot] }] = await Promise.all([
      c.query(`SELECT c.set_id AS sid, c.number AS num, c.name, s.name AS set_name, s.code, count(DISTINCT i.user_id)::int AS owners
               FROM inventory i JOIN cards c ON c.id = i.card_id JOIN sets s ON s.id = c.set_id
               WHERE NOT ${HAS_PICTURE}
               GROUP BY 1, 2, 3, 4, 5, s.release_date ORDER BY owners DESC, s.release_date DESC NULLS LAST, c.number LIMIT 24`),
      c.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'ok')::int AS ok FROM card_images WHERE size = 'small'`),
    ]);
    return { list, total: tot.total, withPhoto: tot.ok, missing: tot.total - tot.ok };
  }));

  // ---------- the owner's review ----------
  app.get('/api/review/photos', async req => {
    await ownerOnly(req);
    return asSystem(async c => {
      const [{ rows: pending }, { rows: reports }, { rows: blocked }, { rows: [today] }] = await Promise.all([
        c.query(`SELECT p.id, p.created_at, p.user_id, u.name AS user_name, c.id AS card_id, c.set_id AS sid, c.number AS num, c.name, c.rarity,
                   s.name AS set_name, s.code, (SELECT count(*) FROM photo_submissions a WHERE a.user_id = p.user_id AND a.status = 'approved')::int AS approved,
                   (SELECT count(DISTINCT i.user_id) FROM inventory i WHERE i.card_id = p.card_id)::int AS owners
                 FROM photo_submissions p JOIN cards c ON c.id = p.card_id JOIN sets s ON s.id = c.set_id LEFT JOIN "user" u ON u.id = p.user_id
                 WHERE p.status = 'pending' ORDER BY p.created_at`),
        c.query(`SELECT r.id, r.reason, r.contact, r.message, r.created_at, c.id AS card_id, c.set_id AS sid, c.number AS num, c.name, s.code, s.name AS set_name,
                   c.image_small AS img, (ci.card_id IS NOT NULL) AS shared, ci.credit_user_id AS user_id, u.name AS user_name
                 FROM photo_reports r JOIN cards c ON c.id = r.card_id JOIN sets s ON s.id = c.set_id
                 LEFT JOIN card_images ci ON ci.card_id = c.id AND ci.size = 'large' AND ci.source = 'aporte' LEFT JOIN "user" u ON u.id = ci.credit_user_id
                 WHERE r.status = 'open' ORDER BY r.created_at`),
        c.query(`SELECT b.user_id, u.name, b.reason, b.created_at FROM photo_contributor_blocks b LEFT JOIN "user" u ON u.id = b.user_id ORDER BY b.created_at DESC`),
        c.query(`SELECT count(*) FILTER (WHERE status = 'approved')::int AS approved, count(*) FILTER (WHERE status = 'rejected')::int AS rejected
                 FROM photo_submissions WHERE reviewed_at > now() - interval '1 day'`),
      ]);
      return { pending, reports, blocked, today, reasons: REASONS };
    });
  });

  app.post('/api/review/photos/:id/approve', async req => {
    await ownerOnly(req);
    const id = Number(req.params.id), rotation = Number(req.body?.rotation || 0);
    if (![0, 90, 180, 270].includes(rotation)) throw err(400, 'Giro inválido');
    if (!req.body?.checked) throw err(400, 'Marca las tres comprobaciones antes de aprobar.');
    return asSystem(async c => {
      const { rows: [p] } = await c.query(
        `SELECT p.*, c.set_id, c.image_small, c.image_large FROM photo_submissions p JOIN cards c ON c.id = p.card_id WHERE p.id = $1`, [id]);
      if (!p || p.status !== 'pending') throw err(409, 'Esa foto ya no está por revisar.');
      if (await hasPicture(c, p.card_id)) throw err(409, 'Esta carta ya tiene foto.');
      const img = await sharp(await readFile(join(IMAGE_DIR, p.file))).rotate(rotation).toBuffer();
      const card = { id: p.card_id, set_id: p.set_id }, saved = {};
      for (const size of ['small', 'large']) {
        saved[size] = await save(card, size, img);
        await c.query(
          `INSERT INTO card_images (card_id, size, status, path, source_url, bytes, width, height, sha256, note, fetched_at, uploaded_at, source, credit_user_id, submission_id)
           VALUES ($1, $2, 'ok', $3, NULL, $4, $5, $6, $7, NULL, now(), NULL, 'aporte', $8, $9)
           ON CONFLICT (card_id, size) DO UPDATE SET status = 'ok', path = $3, source_url = NULL, bytes = $4, width = $5, height = $6, sha256 = $7,
             note = NULL, fetched_at = now(), uploaded_at = NULL, source = 'aporte', credit_user_id = $8, submission_id = $9`,
          [p.card_id, size, saved[size].path, saved[size].bytes, saved[size].width, saved[size].height, saved[size].sha256, p.user_id, id]);
      }
      await c.query('UPDATE cards SET image_small = $2, image_large = $3 WHERE id = $1', [p.card_id, '/img/' + saved.small.path, '/img/' + saved.large.path]);
      await c.query(`UPDATE photo_submissions SET status = 'approved', rotation = $2, reviewed_at = now(), prev_small = $3, prev_large = $4 WHERE id = $1`,
        [id, rotation, p.image_small, p.image_large]);
      // the others waiting for the same card are no longer needed
      await c.query(`UPDATE photo_submissions SET status = 'rejected', reason = 'Ya tiene foto', reviewed_at = now() WHERE card_id = $1 AND status = 'pending'`, [p.card_id]);
      return { ok: true, img: '/img/' + saved.small.path };
    });
  });

  app.post('/api/review/photos/:id/reject', async req => {
    await ownerOnly(req);
    const reason = REASONS[req.body?.reason];
    if (!reason) throw err(400, 'Elige el motivo del rechazo');
    return asSystem(async c => {
      const { rowCount } = await c.query(`UPDATE photo_submissions SET status = 'rejected', reason = $2, reviewed_at = now() WHERE id = $1 AND status = 'pending'`,
        [Number(req.params.id), reason]);
      if (!rowCount) throw err(409, 'Esa foto ya no está por revisar.');
      return { ok: true };
    });
  });

  // take a shared photo down: the card goes back to having no picture; optionally the account can no longer share
  app.post('/api/review/withdraw', async req => {
    await ownerOnly(req);
    const cardId = String(req.body?.cardId || ''), block = !!req.body?.block;
    return asSystem(async c => {
      const { rows } = await c.query(`SELECT size, path, submission_id, credit_user_id FROM card_images WHERE card_id = $1 AND source = 'aporte'`, [cardId]);
      if (!rows.length) throw err(404, 'Esa carta no tiene una foto aportada.');
      const sub = rows[0].submission_id, who = rows[0].credit_user_id;
      const { rows: [p] } = sub ? await c.query('SELECT prev_small, prev_large FROM photo_submissions WHERE id = $1', [sub]) : { rows: [] };
      for (const r of rows) if (r.path) await unlink(join(IMAGE_DIR, r.path)).catch(() => {});
      await c.query(`UPDATE card_images SET status = 'missing', path = NULL, bytes = NULL, width = NULL, height = NULL, sha256 = NULL,
                       note = 'foto aportada retirada', source = NULL, credit_user_id = NULL, submission_id = NULL, fetched_at = now() WHERE card_id = $1`, [cardId]);
      await c.query('UPDATE cards SET image_small = $2, image_large = $3 WHERE id = $1', [cardId, p?.prev_small || null, p?.prev_large || null]);
      if (sub) await c.query(`UPDATE photo_submissions SET status = 'withdrawn', reason = $2, reviewed_at = now() WHERE id = $1`,
        [sub, block ? 'Retirada por un reporte' : 'Retirada']);
      await c.query(`UPDATE photo_reports SET status = 'resolved' WHERE card_id = $1 AND status = 'open'`, [cardId]);
      if (block && who) await c.query(`INSERT INTO photo_contributor_blocks (user_id, reason) VALUES ($1, 'Foto reportada') ON CONFLICT DO NOTHING`, [who]);
      return { ok: true };
    });
  });

  app.post('/api/review/reports/:id/dismiss', async req => {
    await ownerOnly(req);
    await asSystem(c => c.query(`UPDATE photo_reports SET status = 'resolved' WHERE id = $1`, [Number(req.params.id)]));
    return { ok: true };
  });

  app.post('/api/review/blocks', async req => {
    await ownerOnly(req);
    const userId = String(req.body?.userId || '');
    if (!userId) throw err(400, 'Falta la cuenta');
    await asSystem(c => req.body?.block === false
      ? c.query('DELETE FROM photo_contributor_blocks WHERE user_id = $1', [userId])
      : c.query(`INSERT INTO photo_contributor_blocks (user_id, reason) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, String(req.body?.reason || '').slice(0, 200) || null]));
    return { ok: true };
  });

  // the card of a report: the set as an id (ja-S8b), its code (S8b, EVS) or a Japanese code without "ja-"; only known sets
  async function reportedCard(sid, num) {
    const { rows } = await pool.query(
      `SELECT id FROM sets WHERE id = $1 OR id = 'ja-' || $1 OR lower(code) = lower($1) ORDER BY (id = $1) DESC, (id = 'ja-' || $1) DESC LIMIT 3`, [sid]);
    for (const s of rows) { const c = await resolveCard(pool, s.id, num); if (c) return c; }
    return null;
  }
  // "Reportar esta foto": without an account too (whoever's photo it is may not have one); a few per hour and address
  const recent = new Map();
  app.post('/api/photo-reports', async req => {
    const now = Date.now(), ip = req.ip, list = (recent.get(ip) || []).filter(t => now - t < 3600 * 1000);
    if (list.length >= 5) throw err(429, 'Enviaste varios reportes seguidos. Prueba en una hora.');
    const b = req.body || {}, reason = REPORT_REASONS.includes(b.reason) ? b.reason : null;
    const contact = String(b.contact || '').trim().slice(0, 200), message = String(b.message || '').trim().slice(0, 2000) || null;
    if (!reason) throw err(400, 'Elige el motivo');
    if (!contact) throw err(400, 'Deja un correo o contacto para responderte');
    const card = b.sid && b.num ? await reportedCard(String(b.sid).trim(), String(b.num).trim()) : null;
    if (!card) throw err(400, 'No encontramos esa carta: revisa la expansión y el número.');
    await pool.query('INSERT INTO photo_reports (card_id, reason, contact, message) VALUES ($1, $2, $3, $4)', [card.id, reason, contact, message]);
    recent.set(ip, [...list, now]);
    return { ok: true };
  });

  // rejected and withdrawn photos leave the disk after 30 days
  const clean = () => asSystem(async c => {
    const { rows } = await c.query(`SELECT id, file FROM photo_submissions WHERE status IN ('rejected', 'withdrawn') AND file <> ''
                                    AND coalesce(reviewed_at, created_at) < now() - interval '30 days'`);
    for (const r of rows) { await unlink(join(IMAGE_DIR, r.file)).catch(() => {}); await c.query(`UPDATE photo_submissions SET file = '' WHERE id = $1`, [r.id]); }
  }).catch(e => console.error('limpieza de aportes:', e.message));
  setTimeout(clean, 60 * 1000).unref();
  setInterval(clean, DAY).unref();
}
