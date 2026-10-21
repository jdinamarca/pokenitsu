// API of "Arma tu colección" (ADR 0020): its own port, its own schema; the current app is never written to
import Fastify from 'fastify';
import { migrate } from './migrate.ts';
import { pool } from './db.ts';
import { importDex } from './importer.ts';
import { syncAsiaSets } from './asiaSets.ts';
import { linkFullToJaSets, syncJaSets } from './jaSets.ts';
import { importLocalPhotos } from './localPhotos.ts';
import { catalogJob, PRINTED_PHOTOS, startCatalogPhotos } from './catalogPhotos.ts';
import { detailsJob, pendingDetails, startJaDetails } from './details.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { isOwner, ownedCopies, requireOwner, requireViewer, viewerOf } from './session.ts';
import { authRoutes, initAuth } from './auth.ts';
import { ensureTdSets, inventoryRoutes } from './inventory.ts';
import { galleryRoutes } from './gallery.ts';
import { masterSetRoutes } from './masterSets.ts';
import { auditPrintings, FULL_RULES, type ArmaFinish, type ArmaRules, type AuditReason } from '@pokenitsu/core';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const app = Fastify({ logger: false });
// accounts: /api/auth/* and /api/auth-options, served here (cuentas-en-arma)
authRoutes(app);
// Cargar and Mi inventario: the inventory shared with Nitsu (cargar-e-inventario-en-arma)
inventoryRoutes(app);
galleryRoutes(app);
masterSetRoutes(app);

app.get('/api/health', async () => {
  await pool.query('SELECT 1');
  return { ok: true };
});

const dexOf = (v: unknown) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 1100) throw Object.assign(new Error('Número de Pokédex inválido'), { statusCode: 400 });
  return n;
};

// builds (or refreshes) the Full of one Pokémon from every source
app.post<{ Params: { dex: string } }>('/api/import/:dex', async req => {
  const r = await importDex(dexOf(req.params.dex));
  // its Chinese expansions in the catalog, with the printings linked (expansiones-chinas-en-cargar)
  await syncAsiaSets().catch(e => console.warn('no pude armar las expansiones chinas:', e instanceof Error ? e.message : e));
  // its printings of the Japanese expansions only Limitless has, linked (expansiones-japonesas-de-limitless)
  await linkFullToJaSets().catch(e => console.warn('no pude enlazar las expansiones japonesas:', e instanceof Error ? e.message : e));
  return r;
});

// the Full: every printing with its facts grouped by field (each with its source), the sources and their permission
app.get<{ Params: { dex: string } }>('/api/full/:dex', async req => {
  const dex = dexOf(req.params.dex);
  const [printings, sources, last, marks] = await Promise.all([
    pool.query(
      `SELECT p.code, p.set_key, coalesce(cs.name_en, cs.name, p.set_name) AS set_name,
              -- the printing's own name for its set (VMAX絕群壓軸 for the Chinese one of a Japanese set) and the catalog's date
              p.set_name AS set_name_local, cs.release_date::text AS set_release, p.number, p.lang, p.finish, p.stamp, p.name, p.artist, p.release, p.design_id, p.card_id, p.equiv_id,
              d.sort_date AS design_date,
              coalesce(jsonb_object_agg(f.field, f.facts) FILTER (WHERE f.field IS NOT NULL), '{}'::jsonb) AS facts
       FROM arma.printings p
       LEFT JOIN arma.designs d ON d.id = p.design_id
       -- the catalog's name for the set in every language (Jungle, not Dschungel; Pokémon Jungle, not ポケモンジャングル)
       LEFT JOIN public.sets cs ON cs.id = p.set_key
       LEFT JOIN LATERAL (
         SELECT field, jsonb_agg(jsonb_build_object('source', source_id, 'value', value, 'ref', ref) ORDER BY source_id) AS facts
         FROM arma.facts WHERE printing_code = p.code
           -- photos for local use only never leave this API while the switch is off
           AND NOT (NOT $2 AND field = 'image' AND source_id IN (SELECT id FROM arma.sources WHERE permission = 'local'))
         GROUP BY field) f ON true
       WHERE p.dex = $1
       GROUP BY p.code, d.sort_date, cs.name_en, cs.name, cs.release_date
       ORDER BY d.sort_date NULLS LAST, p.design_id, p.release NULLS LAST, p.lang, p.finish, p.stamp NULLS FIRST`,
      [dex, localPhotosOn()],
    ) as Promise<{ rows: FullRow[] }>,
    pool.query('SELECT id, name, url, permission, images, note FROM arma.sources ORDER BY id'),
    pool.query('SELECT summary, started_at FROM arma.imports WHERE dex = $1 ORDER BY id DESC LIMIT 1', [dex]),
    pool.query<{ src: string; shows: string }>('SELECT src, shows FROM arma.photo_marks'),
  ]);
  return {
    dex,
    printings: printings.rows,
    sources: sources.rows,
    lastImport: last.rows[0] || null,
    localPhotos: localPhotosOn(),
    // what variant a photo shows, marked by hand (fotos-por-variante): { src: stamp, or '' for the unlimited }
    photoMarks: Object.fromEntries(marks.rows.map(m => [m.src, m.shows])),
    // the classification check (corregir-clasificacion-de-cartas): { code: reasons } for each doubtful printing
    audit: Object.fromEntries(
      auditOf(
        printings.rows,
        sources.rows,
        Object.values((last.rows[0]?.summary as ImportedSummary | undefined)?.sources || {}).flatMap(s => s.notReleased || []),
      ),
    ),
  };
});

// the doubtful printings of a Pokémon, with their reasons: run it after importing any Pokémon, and check each one
type FullRow = {
  code: string;
  set_key: string;
  number: string;
  lang: string;
  finish: ArmaFinish;
  stamp: string | null;
  set_name_local: string | null;
  facts: Record<string, { source: string; value: string | null }[]>;
};
type NotReleased = { setKey: string; lang: string; name: string; source: string };
type ImportedSummary = { sources?: Record<string, { notReleased?: NotReleased[] }> };
const LANGUAGE: Record<string, string> = { IT: 'italiano', PT: 'portugués', ES: 'español', NL: 'neerlandés', FR: 'francés', DE: 'alemán' };
function auditOf(rows: FullRow[], sources: { id: string; name: string }[], notReleased: NotReleased[]): Map<string, AuditReason[]> {
  const names = new Map(sources.map(s => [s.id, s.name]));
  const never = new Map(notReleased.map(n => [`${n.setKey}|${n.lang}`, n]));
  return auditPrintings(
    rows.map(r => ({
      code: r.code,
      set_key: r.set_key,
      number: r.number,
      lang: r.lang,
      finish: r.finish,
      stamp: r.stamp,
      sources: (r.facts.exists || []).map(f => f.source),
      labels: (r.facts.variant || []).map(f => f.value || ''),
      // only deduced from a set list (cartas-en-otros-idiomas), or Spanish in a set WikiDex says never came out in Spain
      ...((r.facts.exists || []).every(f => f.source === 'tcgdex-expansiones') && r.facts.exists?.length
        ? { inferred: { setName: r.set_name_local || r.set_key, language: LANGUAGE[r.lang] || r.lang } }
        : {}),
      ...(never.has(`${r.set_key}|${r.lang}`)
        ? (n => ({ notReleased: { name: n.name, language: LANGUAGE[n.lang] || n.lang, source: n.source } }))(
            never.get(`${r.set_key}|${r.lang}`)!,
          )
        : {}),
    })),
    id => names.get(id) || id,
  );
}
app.get<{ Params: { dex: string } }>('/api/audit/:dex', async req => {
  const dex = dexOf(req.params.dex);
  const full = (await app.inject({ method: 'GET', url: `/api/full/${dex}` })).json() as { audit: Record<string, AuditReason[]> };
  return {
    dex,
    doubtful: Object.keys(full.audit).length,
    printings: Object.entries(full.audit).map(([code, reasons]) => ({ code, reasons })),
  };
});

// who is asking (null without a Nitsu session)
app.get('/api/me', async req => {
  const viewer = await viewerOf(req);
  // owner: the administrator sees "Por reemplazar" (fotos-solo-local-en-catalogo)
  return { viewer, owner: await isOwner(viewer) };
});

// the viewer's copies of a Pokémon's printings (read-only, with their own Row Level Security)
app.get<{ Params: { dex: string } }>('/api/owned/:dex', async req => {
  const v = await requireViewer(req);
  return { copies: await ownedCopies(v.id, dexOf(req.params.dex)) };
});

// saved views: a name and its rules, per account; "Full" is built in
const RULE_KEYS = Object.keys(FULL_RULES) as (keyof ArmaRules)[];
const checkRules = (r: unknown): ArmaRules => {
  const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
  if (RULE_KEYS.some(k => typeof o[k] !== 'boolean')) throw Object.assign(new Error('Reglas inválidas'), { statusCode: 400 });
  return Object.fromEntries(RULE_KEYS.map(k => [k, o[k]])) as unknown as ArmaRules;
};
app.get('/api/views', async req => {
  const v = await requireViewer(req);
  const { rows } = await pool.query('SELECT id, name, rules FROM arma.views WHERE user_id = $1 ORDER BY created_at', [v.id]);
  return { views: [{ id: 'full', name: 'Full', rules: FULL_RULES, builtIn: true }, ...rows] };
});
app.post<{ Body: { name?: string; rules?: unknown } }>('/api/views', async req => {
  const v = await requireViewer(req);
  const name = String(req.body?.name || '')
    .trim()
    .slice(0, 60);
  if (!name || name.toLowerCase() === 'full')
    throw Object.assign(new Error('La vista necesita un nombre distinto de "Full"'), { statusCode: 400 });
  const { rows } = await pool.query(
    `INSERT INTO arma.views (user_id, name, rules) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, name) DO UPDATE SET rules = EXCLUDED.rules RETURNING id, name, rules`,
    [v.id, name, JSON.stringify(checkRules(req.body?.rules))],
  );
  return rows[0];
});
app.delete<{ Params: { id: string } }>('/api/views/:id', async req => {
  const v = await requireViewer(req);
  const { rowCount } = await pool.query('DELETE FROM arma.views WHERE id = $1 AND user_id = $2', [Number(req.params.id) || 0, v.id]);
  return { removed: rowCount };
});

// our own copies of the card pictures and your uploads (the same IMAGE_DIR as the current app)
const IMAGE_DIR = resolve(process.env.IMAGE_DIR || new URL('../../../data/imagenes', import.meta.url).pathname);

// what variant a photo shows, marked by hand: one of the variants of the card(s) that have this photo; DELETE → automatic
app.post<{ Body: { src?: string; shows?: string } }>('/api/photo-marks', async req => {
  const v = await requireViewer(req);
  const src = String(req.body?.src || '');
  const shows = String(req.body?.shows ?? '');
  const { rows } = await pool.query<{ stamp: string }>(
    `SELECT DISTINCT coalesce(s.stamp, '') AS stamp
     FROM arma.facts f JOIN arma.printings p ON p.code = f.printing_code
     JOIN arma.printings s ON s.set_key = p.set_key AND s.number = p.number AND s.lang = p.lang
     WHERE f.field = 'image' AND f.value = $1`,
    [src],
  );
  if (!rows.length) throw Object.assign(new Error('No hay ninguna impresión con esa foto'), { statusCode: 404 });
  if (!rows.some(r => r.stamp === shows)) throw Object.assign(new Error('Esa variante no existe para esta carta'), { statusCode: 400 });
  await pool.query(
    `INSERT INTO arma.photo_marks (src, shows, marked_by) VALUES ($1, $2, $3)
     ON CONFLICT (src) DO UPDATE SET shows = EXCLUDED.shows, marked_by = EXCLUDED.marked_by, marked_at = now()`,
    [src, shows, v.name],
  );
  return { src, shows };
});
app.delete<{ Body: { src?: string } }>('/api/photo-marks', async req => {
  await requireViewer(req);
  const { rowCount } = await pool.query('DELETE FROM arma.photo_marks WHERE src = $1', [String(req.body?.src || '')]);
  return { removed: rowCount };
});

// your own photo of a printing: JPEG, PNG or WebP up to 8 MB, kept in IMAGE_DIR/arma (ours, so it may go to production)
const UPLOAD_EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
app.addContentTypeParser(Object.keys(UPLOAD_EXT), { parseAs: 'buffer', bodyLimit: 8 * 1024 * 1024 }, (_req, body, done) =>
  done(null, body),
);
const uploadName = (code: string) => code.replace(/[^\w.-]+/g, '_');
async function removeUpload(code: string) {
  const dir = join(IMAGE_DIR, 'arma');
  const base = uploadName(code);
  for (const f of await readdir(dir).catch(() => [] as string[])) if (f.startsWith(base + '.')) await unlink(join(dir, f));
}
app.post<{ Params: { code: string } }>('/api/photos/:code', async req => {
  const v = await requireViewer(req);
  const ext = UPLOAD_EXT[(req.headers['content-type'] || '').split(';')[0]!.trim()];
  const body = req.body as Buffer | undefined;
  if (!ext || !Buffer.isBuffer(body) || !body.length)
    throw Object.assign(new Error('La foto debe ser JPEG, PNG o WebP'), { statusCode: 415 });
  const { rowCount } = await pool.query('SELECT 1 FROM arma.printings WHERE code = $1', [req.params.code]);
  if (!rowCount) throw Object.assign(new Error('No existe esa impresión'), { statusCode: 404 });
  await removeUpload(req.params.code);
  await mkdir(join(IMAGE_DIR, 'arma'), { recursive: true });
  const file = uploadName(req.params.code) + ext;
  await writeFile(join(IMAGE_DIR, 'arma', file), body);
  // ?v=: a new upload is a new address, so no browser keeps the old one
  const value = `/img/arma/${file}?v=${Date.now()}`;
  await pool.query(
    `INSERT INTO arma.facts (printing_code, field, source_id, value, ref) VALUES ($1, 'image', 'own', $2, $3)
     ON CONFLICT (printing_code, field, source_id) DO UPDATE SET value = EXCLUDED.value, ref = EXCLUDED.ref, fetched_at = now()`,
    [req.params.code, value, `Subida por ${v.name}`],
  );
  return { code: req.params.code, src: value };
});
app.delete<{ Params: { code: string } }>('/api/photos/:code', async req => {
  await requireViewer(req);
  await removeUpload(req.params.code);
  const { rowCount } = await pool.query(`DELETE FROM arma.facts WHERE printing_code = $1 AND field = 'image' AND source_id = 'own'`, [
    req.params.code,
  ]);
  return { removed: rowCount };
});

// your own photo of a catalog card (fotos-solo-local-en-catalogo): the administrator's, kept in IMAGE_DIR/arma/cartas
// (ours, production-ready), shown before the catalog's and the ones for local use only, for every account
const cardFileName = (cardId: string) => cardId.replace(/[^\w.-]+/g, '_');
async function removeCardUpload(cardId: string) {
  const dir = join(IMAGE_DIR, 'arma', 'cartas');
  const base = cardFileName(cardId);
  for (const f of await readdir(dir).catch(() => [] as string[])) if (f.startsWith(base + '.')) await unlink(join(dir, f));
}
app.post<{ Params: { cardId: string } }>('/api/card-photos/:cardId', async req => {
  const v = await requireOwner(req);
  const ext = UPLOAD_EXT[(req.headers['content-type'] || '').split(';')[0]!.trim()];
  const body = req.body as Buffer | undefined;
  if (!ext || !Buffer.isBuffer(body) || !body.length)
    throw Object.assign(new Error('La foto debe ser JPEG, PNG o WebP'), { statusCode: 415 });
  const { rowCount } = await pool.query('SELECT 1 FROM cards WHERE id = $1', [req.params.cardId]);
  if (!rowCount) throw Object.assign(new Error('No existe esa carta'), { statusCode: 404 });
  await removeCardUpload(req.params.cardId);
  await mkdir(join(IMAGE_DIR, 'arma', 'cartas'), { recursive: true });
  const file = cardFileName(req.params.cardId) + ext;
  await writeFile(join(IMAGE_DIR, 'arma', 'cartas', file), body);
  // ?v=: a new upload is a new address, so no browser keeps the old one
  const src = `/img/arma/cartas/${file}?v=${Date.now()}`;
  await pool.query(
    `INSERT INTO arma.card_photos (card_id, source_id, src, ref, by_name) VALUES ($1, 'own', $2, $3, $4)
     ON CONFLICT (card_id, source_id) DO UPDATE SET src = EXCLUDED.src, ref = EXCLUDED.ref, by_name = EXCLUDED.by_name, saved_at = now()`,
    [req.params.cardId, src, `Subida por ${v.name}`, v.name],
  );
  return { cardId: req.params.cardId, src };
});
app.delete<{ Params: { cardId: string } }>('/api/card-photos/:cardId', async req => {
  await requireOwner(req);
  await removeCardUpload(req.params.cardId);
  const { rowCount } = await pool.query(`DELETE FROM arma.card_photos WHERE card_id = $1 AND source_id = 'own'`, [req.params.cardId]);
  return { removed: rowCount };
});

// ---------- "Por reemplazar" (fotos-solo-local-en-catalogo): the administrator's gallery ----------
// the catalog cards shown with a photo for local use only (no own photo, no catalog photo; those with a printing of the Full
// are in the gallery as that printing), and the progress: of the
// cards that have one, how many already have a photo that can go to production
app.get('/api/replace/cards', async req => {
  await requireOwner(req);
  const [cards, totals] = await Promise.all([
    localPhotosOn()
      ? pool.query(
          `SELECT p.card_id, c.set_id AS sid, c.number AS num, c.name, coalesce(st.name_en, st.name) AS set_name, coalesce(st.code, '') AS set_code,
                  s.id AS source_id, s.name AS source, p.src
           FROM arma.card_photos p JOIN arma.sources s ON s.id = p.source_id AND s.permission = 'local'
           JOIN cards c ON c.id = p.card_id JOIN sets st ON st.id = c.set_id
           WHERE c.image_small IS NULL AND NOT EXISTS (SELECT 1 FROM arma.card_photos o WHERE o.card_id = p.card_id AND o.source_id = 'own')
             AND NOT EXISTS (SELECT 1 FROM ${PRINTED_PHOTOS} x WHERE x.card_id = p.card_id)
           ORDER BY st.release_date NULLS LAST, c.set_id, c.number_norm ~ '^[0-9]+$' DESC,
                    nullif(regexp_replace(c.number_norm, '[^0-9]', '', 'g'), '')::int NULLS LAST, c.number`,
        )
      : Promise.resolve({ rows: [] }),
    pool.query<{ total: number; ready: number }>(
      `SELECT count(DISTINCT p.card_id)::int AS total,
              count(DISTINCT p.card_id) FILTER (WHERE c.image_small IS NOT NULL
                OR EXISTS (SELECT 1 FROM arma.card_photos o WHERE o.card_id = p.card_id AND o.source_id = 'own'))::int AS ready
       FROM arma.card_photos p JOIN arma.sources s ON s.id = p.source_id AND s.permission = 'local' JOIN cards c ON c.id = p.card_id
       WHERE NOT EXISTS (SELECT 1 FROM ${PRINTED_PHOTOS} x WHERE x.card_id = p.card_id)`,
    ),
  ]);
  return { localPhotos: localPhotosOn(), cards: cards.rows, ...totals.rows[0]! };
});
// the whole Japanese catalog's photos for local use only: one expansion after the other, never two runs at once
app.post<{ Body: { dex?: unknown; sets?: unknown } }>('/api/local-photos/catalog', async req => {
  await requireOwner(req);
  // dex: only those Pokémon (to try it without the whole catalog)
  const dex = Array.isArray(req.body?.dex) ? req.body.dex.map(Number).filter(n => Number.isInteger(n) && n > 0) : undefined;
  // sets: only those expansions (to try it, too)
  const sets = Array.isArray(req.body?.sets) ? req.body.sets.map(String).filter(s => /^[\w.-]+$/.test(s)) : undefined;
  return startCatalogPhotos({ dex, sets });
});
app.get('/api/local-photos/catalog', async req => {
  await requireOwner(req);
  return { localPhotos: localPhotosOn(), job: catalogJob() };
});

// the Japanese cards' details (detalles-de-japonesas-en-arma): what's missing and the job, for the administrator
app.get('/api/catalog-details', async req => {
  await requireOwner(req);
  return { pending: await pendingDetails(), job: detailsJob() };
});
app.post<{ Body: { sets?: unknown } }>('/api/catalog-details', async req => {
  await requireOwner(req);
  // sets: only those expansions (to try it without the whole catalog)
  const sets = Array.isArray(req.body?.sets) ? req.body.sets.map(String).filter(s => /^[\w.-]+$/.test(s)) : undefined;
  return startJaDetails({ sets });
});

// photos for local use only: downloaded once to LOCAL_IMAGE_DIR, only with ARMA_FOTOS_LOCALES=1 (403 otherwise)
app.post<{ Params: { dex: string } }>('/api/local-photos/:dex', async req => importLocalPhotos(dexOf(req.params.dex)));
// …and served from there, never from IMAGE_DIR; 404 for everything while the switch is off
app.get<{ Params: { '*': string } }>('/img-local/*', async (req, reply) => {
  if (!localPhotosOn()) return reply.code(404).send();
  const file = normalize(join(LOCAL_IMAGE_DIR, req.params['*']));
  const type = TYPES[extname(file).toLowerCase()];
  if (
    !file.startsWith(LOCAL_IMAGE_DIR + '/') ||
    !type ||
    !(await stat(file).then(
      s => s.isFile(),
      () => false,
    ))
  )
    return reply.code(404).send();
  return reply.header('cache-control', 'private, max-age=604800').type(type).send(createReadStream(file));
});

// our own copies of the card pictures (the same IMAGE_DIR as the current app); nothing outside it is ever served
const TYPES: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
app.get<{ Params: { '*': string } }>('/img/*', async (req, reply) => {
  const file = normalize(join(IMAGE_DIR, req.params['*']));
  const type = TYPES[extname(file).toLowerCase()];
  if (
    !file.startsWith(IMAGE_DIR + '/') ||
    !type ||
    !(await stat(file).then(
      s => s.isFile(),
      () => false,
    ))
  )
    return reply.code(404).send();
  return reply.header('cache-control', 'public, max-age=604800').type(type).send(createReadStream(file));
});

const port = Number(process.env.ARMA_PORT || 3002);
for (const m of await migrate()) console.log('migración aplicada:', m);
initAuth();
await app.listen({ port, host: '127.0.0.1' });
// the sets only TCGdex has, in the background (catalogo-desde-tcgdex)
ensureTdSets().then(
  n => n && console.log(`expansiones de TCGdex agregadas o actualizadas: ${n}`),
  e => console.warn('no pude actualizar las expansiones de TCGdex:', e instanceof Error ? e.message : e),
);
// the Chinese expansions of the Full, in the background (expansiones-chinas-en-cargar)
syncAsiaSets().then(
  r => r.sets && console.log(`expansiones chinas: ${r.sets}, cartas nuevas: ${r.cards}, impresiones enlazadas: ${r.linked}`),
  e => console.warn('no pude armar las expansiones chinas:', e instanceof Error ? e.message : e),
);
// the Japanese expansions only Limitless has, in the background and only in local mode (expansiones-japonesas-de-limitless)
syncJaSets().then(
  r =>
    r &&
    console.log(
      `expansiones japonesas de Limitless: ${r.added} nuevas, ${r.filled} llenadas con ${r.cards} cartas, impresiones enlazadas: ${r.linked}` +
        (r.missing.length ? `, sin lista: ${r.missing.join(' ')}` : ''),
    ),
  e => console.warn('no pude agregar las expansiones japonesas de Limitless:', e instanceof Error ? e.message : e),
);
console.log(`Arma tu colección (API) en http://127.0.0.1:${port}`);
