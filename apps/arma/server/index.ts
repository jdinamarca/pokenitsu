// API of "Arma tu colección" (ADR 0020): its own port, its own schema; the current app is never written to
import Fastify from 'fastify';
import { migrate } from './migrate.ts';
import { pool } from './db.ts';
import { importDex } from './importer.ts';
import { ownedCopies, requireViewer, viewerOf } from './session.ts';
import { FULL_RULES, type ArmaRules } from '@pokenitsu/core';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
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
  const [printings, sources, last] = await Promise.all([
    pool.query(
      `SELECT p.code, p.set_key, coalesce(cs.name_en, cs.name, p.set_name) AS set_name, p.number, p.lang, p.finish, p.stamp, p.name, p.artist, p.release, p.design_id, p.card_id, p.equiv_id,
              d.sort_date AS design_date,
              coalesce(jsonb_object_agg(f.field, f.facts) FILTER (WHERE f.field IS NOT NULL), '{}'::jsonb) AS facts
       FROM arma.printings p
       LEFT JOIN arma.designs d ON d.id = p.design_id
       -- the catalog's name for the set in every language (Jungle, not Dschungel; Pokémon Jungle, not ポケモンジャングル)
       LEFT JOIN public.sets cs ON cs.id = p.set_key
       LEFT JOIN LATERAL (
         SELECT field, jsonb_agg(jsonb_build_object('source', source_id, 'value', value, 'ref', ref) ORDER BY source_id) AS facts
         FROM arma.facts WHERE printing_code = p.code GROUP BY field) f ON true
       WHERE p.dex = $1
       GROUP BY p.code, d.sort_date, cs.name_en, cs.name
       ORDER BY d.sort_date NULLS LAST, p.design_id, p.release NULLS LAST, p.lang, p.finish, p.stamp NULLS FIRST`,
      [dex],
    ),
    pool.query('SELECT id, name, url, permission, images, note FROM arma.sources ORDER BY id'),
    pool.query('SELECT summary, started_at FROM arma.imports WHERE dex = $1 ORDER BY id DESC LIMIT 1', [dex]),
  ]);
  return { dex, printings: printings.rows, sources: sources.rows, lastImport: last.rows[0] || null };
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

// our own copies of the card pictures (the same IMAGE_DIR as the current app); nothing outside it is ever served
const IMAGE_DIR = resolve(process.env.IMAGE_DIR || new URL('../../../data/imagenes', import.meta.url).pathname);
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
