// CLP per USD and EUR, shared by every account (table settings, key 'fx'); refreshed when older than 12 hours.
// Moved from apps/api/src/prices.js (cargar-e-inventario-en-arma).
import { fetchJSON } from './catalog.js';
import type { Queryable } from './db.js';

export interface StoredFx {
  usd: number;
  eur: number;
  src: string;
  at: Date;
}
const FX_MAX_AGE_MS = 12 * 3600 * 1000;

export async function storedFx(db: Queryable): Promise<StoredFx | null> {
  const { rows } = await db.query<{ value: Omit<StoredFx, 'at'>; updated_at: Date }>(
    "SELECT value, updated_at FROM settings WHERE key = 'fx'",
  );
  return rows.length ? { ...rows[0]!.value, at: rows[0]!.updated_at } : null;
}

// tries exchangerate-api, then mindicador.cl (Banco Central's rates)
async function downloadFx(): Promise<Omit<StoredFx, 'at'>> {
  try {
    const j = await fetchJSON('https://open.er-api.com/v6/latest/USD', 2);
    if (j.rates?.CLP && j.rates?.EUR)
      return {
        usd: Math.round(j.rates.CLP * 100) / 100,
        eur: Math.round((j.rates.CLP / j.rates.EUR) * 100) / 100,
        src: 'exchangerate-api.com',
      };
  } catch (e) {
    console.warn('tipo de cambio (exchangerate-api):', (e as Error).message);
  }
  const j = await fetchJSON('https://mindicador.cl/api', 2);
  return { usd: j.dolar.valor, eur: j.euro.valor, src: 'mindicador.cl' };
}

/** today's rate: the stored one while fresh; on failure keeps the last one */
export async function getFx(db: Queryable, force = false): Promise<StoredFx | null> {
  const cur = await storedFx(db);
  if (cur && !force && Date.now() - new Date(cur.at).getTime() < FX_MAX_AGE_MS) return cur;
  try {
    await db.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('fx', $1, now()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = now()`,
      [JSON.stringify(await downloadFx())],
    );
    return await storedFx(db);
  } catch (e) {
    console.warn('tipo de cambio:', (e as Error).message);
    return cur;
  }
}

/** my own price in CLP: entered in USD it follows today's rate */
export const ownClp = (r: { usd?: number | null; clp?: number | null }, fx: { usd: number } | null): number | null =>
  r.usd != null && fx ? Math.round(r.usd * fx.usd) : (r.clp ?? null);
