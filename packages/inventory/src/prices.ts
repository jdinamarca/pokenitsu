// The account's price settings (user_settings 'prices'), with Nitsu's defaults for what isn't set
import type { Queryable } from './db.js';

export const PRICE_CFG = { source: 'tcgplayer', cond: { NM: 1, LP: 0.85, MP: 0.7, HP: 0.5, DMG: 0.3 }, alert: 5000, ownDays: 7 };
export type PriceSettings = typeof PRICE_CFG;

/** c: a client with app.user_id set (the settings are per account) */
export async function priceSettings(c: Queryable): Promise<PriceSettings> {
  const { rows } = await c.query<{ value: Partial<PriceSettings> }>("SELECT value FROM user_settings WHERE key = 'prices'");
  return rows.length ? { ...PRICE_CFG, ...rows[0]!.value } : PRICE_CFG;
}
