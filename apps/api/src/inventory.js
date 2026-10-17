// The inventory and catalog operations shared with Arma tu colección (@pokenitsu/inventory), over this API's
// per-request pool and transactions (db.js): Row Level Security keeps each request to its user's rows.
import { createInventory } from '@pokenitsu/inventory';
import { pool, tx } from './db.js';

export const inv = createInventory({ query: (...args) => pool.query(...args), tx });
