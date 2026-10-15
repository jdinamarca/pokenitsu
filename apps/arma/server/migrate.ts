// Applies server/migrations/*.sql in name order, once each, tracked in arma.schema_migrations
import { readdirSync, readFileSync } from 'node:fs';
import { pool, tx } from './db.ts';

const DIR = new URL('./migrations/', import.meta.url);

export async function migrate(): Promise<string[]> {
  await pool.query('CREATE SCHEMA IF NOT EXISTS arma');
  await pool.query(
    'CREATE TABLE IF NOT EXISTS arma.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM arma.schema_migrations');
  const done = new Set(rows.map(r => r.name));
  const applied: string[] = [];
  for (const f of readdirSync(DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()) {
    if (done.has(f)) continue;
    const sql = readFileSync(new URL(f, DIR), 'utf8');
    await tx(async c => {
      await c.query(sql);
      await c.query('INSERT INTO arma.schema_migrations (name) VALUES ($1)', [f]);
    });
    applied.push(f);
  }
  return applied;
}
