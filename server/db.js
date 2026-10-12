import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (revisa el archivo .env)');

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Applies db/migrations/*.sql in name order, once each
export async function migrate(dir) {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map(r => r.name));
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = await readFile(join(dir, f), 'utf8');
    await tx(async c => {
      await c.query(sql);
      await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
    });
    console.log('migración aplicada:', f);
  }
}
