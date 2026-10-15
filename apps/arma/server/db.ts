// The app's own connection: it writes only in the arma schema and reads public (catalog, prices, inventory, sessions)
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (en el .env de la raíz del repo)');
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 6 });

// a transaction; the client is released whatever happens
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
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
