// One client for every external source: says who is asking, at most N requests at a time per host,
// retries, and keeps each answer for a day in arma.source_cache so a re-import does not ask again
import { pool } from '../db.ts';

const UA = 'NitsuCollectibles/0.1 (+https://github.com/jdinamarca/pokenitsu)';
const DAY = 24 * 3600 * 1000;
const slots = new Map<string, { busy: number; queue: (() => void)[] }>();
const LIMIT: Record<string, number> = { 'api.tcgdex.net': 4 };

async function withSlot<T>(host: string, fn: () => Promise<T>): Promise<T> {
  const s = slots.get(host) || { busy: 0, queue: [] };
  slots.set(host, s);
  if (s.busy >= (LIMIT[host] ?? 2)) await new Promise<void>(r => s.queue.push(r));
  s.busy++;
  try {
    return await fn();
  } finally {
    s.busy--;
    s.queue.shift()?.();
  }
}

export interface FetchStats {
  cached: number;
  fetched: number;
}
export const stats: FetchStats = { cached: 0, fetched: 0 };

/** JSON from a source, from the cache when it is less than a day old; 404 → null */
/** transform: applied before caching, so what must not be kept (a source's picture URLs) never is */
export async function fetchJson<T = unknown>(
  url: string,
  { ttl = DAY, tries = 3, transform }: { ttl?: number; tries?: number; transform?: (body: unknown) => unknown } = {},
): Promise<T | null> {
  const { rows } = await pool.query<{ body: T; fresh: boolean }>(
    `SELECT body, fetched_at > now() - ($2 || ' milliseconds')::interval AS fresh FROM arma.source_cache WHERE url = $1`,
    [url, String(ttl)],
  );
  if (rows[0]?.fresh) {
    stats.cached++;
    return rows[0].body;
  }
  const host = new URL(url).host;
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await withSlot(host, () =>
        fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(30000) }),
      );
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      const raw: unknown = await r.json();
      const body = (transform ? transform(raw) : raw) as T;
      stats.fetched++;
      await pool.query(
        `INSERT INTO arma.source_cache (url, body) VALUES ($1, $2) ON CONFLICT (url) DO UPDATE SET body = EXCLUDED.body, fetched_at = now()`,
        [url, JSON.stringify(body)],
      );
      return body;
    } catch (e) {
      last = e;
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
  // the source is down: an old cached answer is better than nothing
  if (rows[0]) return rows[0].body;
  throw last instanceof Error ? last : new Error(String(last));
}

/** a few at a time over a list */
export async function mapLimit<T, R>(items: readonly T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]!);
      }
    }),
  );
  return out;
}
