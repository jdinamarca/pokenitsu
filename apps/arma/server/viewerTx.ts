// The only way this API touches the account's rows in public (inventory, inventory_log, locations, price_overrides,
// user_settings): a transaction with app.user_id set, so Row Level Security keeps each account to its own (ADR 0023).
import type pg from 'pg';
import { pool } from './db.ts';
import type { Viewer } from './session.ts';

export async function asViewer<T>(viewer: Viewer, fn: (c: pg.PoolClient) => Promise<T>, readOnly = false): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
    await c.query("SELECT set_config('app.user_id', $1, true)", [viewer.id]);
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
