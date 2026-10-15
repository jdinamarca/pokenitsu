// API of "Arma tu colección" (ADR 0020): its own port, its own schema; the current app is never written to
import Fastify from 'fastify';
import { migrate } from './migrate.ts';
import { pool } from './db.ts';
import { importDex } from './importer.ts';
import { importLocalPhotos } from './localPhotos.ts';
import { LOCAL_IMAGE_DIR, localPhotosOn } from './local.ts';
import { ownedCopies, requireViewer, viewerOf } from './session.ts';
import { auditPrintings, FULL_RULES, type ArmaFinish, type ArmaRules, type AuditReason } from '@pokenitsu/core';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const app = Fastify({ logger: false });

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
app.post<{ Params: { dex: string } }>('/api/import/:dex', async req => importDex(dexOf(req.params.dex)));

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
    audit: Object.fromEntries(auditOf(printings.rows, sources.rows)),
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
  facts: Record<string, { source: string; value: string | null }[]>;
};
function auditOf(rows: FullRow[], sources: { id: string; name: string }[]): Map<string, AuditReason[]> {
  const names = new Map(sources.map(s => [s.id, s.name]));
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
app.get('/api/me', async req => ({ viewer: await viewerOf(req) }));

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
await app.listen({ port, host: '127.0.0.1' });
console.log(`Arma tu colección (API) en http://127.0.0.1:${port}`);
