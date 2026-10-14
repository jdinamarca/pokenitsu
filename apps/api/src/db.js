import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (revisa el archivo .env)');

// the plain pool: accounts (Better Auth) and work with no user. Per-user tables have forced Row Level Security
// (migration 027), so without app.user_id they look empty.
// in production (Supabase) the connection is encrypted and the server checked against its CA certificate (DATABASE_CA_CERT,
// the PEM text; leave sslmode out of DATABASE_URL, it would override this)
const ca = process.env.DATABASE_CA_CERT;
export const rawPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ...(ca ? { ssl: { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true } } : {}) });

// Row Level Security is what keeps each account's data apart, and a superuser or a role with BYPASSRLS skips it
// silently: in production the API refuses to start with such a role (see apps/api/db/produccion/rol.sql)
export async function assertSafeRole() {
  if (process.env.NODE_ENV !== 'production') return;
  const { rows: [r] } = await rawPool.query('SELECT current_user AS name, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user');
  if (r && (r.rolsuper || r.rolbypassrls))
    throw new Error(`El rol de la base "${r.name}" es superusuario o tiene BYPASSRLS: cada cuenta vería los datos de todas. Conéctate con el rol nitsu_app (apps/api/db/produccion/rol.sql).`);
}

// A request runs with one connection that has app.user_id set to its user (opened on its first query, reset and
// returned when the response is sent); its queries go one after another on it. Work still running after that
// falls back to the plain pool.
const ctx = new AsyncLocalStorage();
export const runAsUser = (userId, fn) => { const store = { userId, client: null, chain: Promise.resolve(), done: false }; ctx.run(store, fn); return store; };
const asUser = async (c, userId) => { await c.query("SELECT set_config('app.user_id', $1, false)", [userId]); return c; };
async function userClient(store) {
  store.client ||= rawPool.connect().then(c => asUser(c, store.userId));
  return store.client;
}
export async function endUser(store) {
  if (!store || store.done) return;
  store.done = true;
  if (!store.client) return;
  const c = await store.client;
  try { await c.query("SELECT set_config('app.user_id', '', false)"); c.release(); } catch (e) { c.release(e); }
}
const live = () => { const s = ctx.getStore(); return s && !s.done ? s : null; };
export const pool = {
  async query(...args) {
    const s = live(); if (!s) return rawPool.query(...args);
    const c = await userClient(s), run = s.chain.then(() => c.query(...args));
    s.chain = run.catch(() => {});
    return run;
  },
};
// system work that must see every user's rows (refreshing shared prices, cleaning unused catalog cards)
export async function asSystem(fn) {
  const c = await rawPool.connect();
  try { await c.query("SELECT set_config('app.all_users', 'on', false)"); return await fn(c); }
  finally { await c.query("SELECT set_config('app.all_users', '', false)").catch(() => {}); c.release(); }
}

// a transaction gets its own connection (for a request, with the same user), as before per-user data
export async function tx(fn) {
  const s = live(), client = s ? await asUser(await rawPool.connect(), s.userId) : await rawPool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    if (s) await client.query("SELECT set_config('app.user_id', '', false)").catch(() => {});
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
      // migrations may move any user's rows
      await c.query("SELECT set_config('app.all_users', 'on', true)");
      await c.query(sql);
      await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
    });
    console.log('migración aplicada:', f);
  }
}
