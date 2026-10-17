// What the package needs from each app's database layer: Nitsu passes its per-request pool and tx (db.js),
// Arma tu colección a transaction with app.user_id set (viewerTx.ts). Plain pg clients and pools fit.
export interface QueryResult<R> {
  rows: R[];
  rowCount?: number | null;
}
export interface Queryable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<R = any>(text: string, params?: unknown[]): Promise<QueryResult<R>>;
}
export interface Db extends Queryable {
  /** runs fn in a transaction (BEGIN … COMMIT / ROLLBACK) on one connection */
  tx<T>(fn: (c: Queryable) => Promise<T>): Promise<T>;
}

/** an error the HTTP layer answers with its statusCode (400 by default) */
export const bad = (msg: string, statusCode = 400): Error & { statusCode: number } => Object.assign(new Error(msg), { statusCode });
