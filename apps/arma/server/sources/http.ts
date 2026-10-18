// One client for every external source: says who is asking, at most N requests at a time per host,
// retries, and keeps each answer for a day in arma.source_cache so a re-import does not ask again
import { createWriteStream } from 'node:fs';
import { mkdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pool } from '../db.ts';

const UA = 'NitsuCollectibles/0.1 (+https://github.com/jdinamarca/pokenitsu)';
const DAY = 24 * 3600 * 1000;
const slots = new Map<string, { busy: number; queue: (() => void)[] }>();
// PokeCottage: never two requests at once, from anywhere in the app (fotos-pokecottage-en-catalogo)
// and Bill's Archive, its pages and its images (fotos-billsarchive-japonesas)
const LIMIT: Record<string, number> = {
  'api.tcgdex.net': 4,
  'pokecottagecdn.com': 1,
  'billsarchive.com': 1,
  'bills-archive.nyc3.cdn.digitaloceanspaces.com': 1,
  // Bulbapedia's card lists, one page at a time (detalles-de-japonesas-en-arma)
  'bulbapedia.bulbagarden.net': 1,
};

/** a source answered 429 or 503: wait retryAfterMs before asking it again */
export class SourceBusy extends Error {
  constructor(
    readonly retryAfterMs: number,
    url: string,
  ) {
    super(`La fuente pidió esperar ${Math.round(retryAfterMs / 1000)} s (${url})`);
  }
}
/** Retry-After in seconds or as a date; 60 s when it's missing or unreadable, never more than 10 minutes */
export function retryAfterMs(header: string | null, now = Date.now()): number {
  const s = header?.trim() ? Number(header) : NaN;
  const ms = Number.isFinite(s) ? s * 1000 : header ? Date.parse(header) - now : NaN;
  return Number.isFinite(ms) ? Math.min(10 * 60_000, Math.max(0, ms)) : 60_000;
}
const busy = (r: Response, url: string) =>
  r.status === 429 || r.status === 503 ? new SourceBusy(retryAfterMs(r.headers.get('retry-after')), url) : null;

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
/** transform: applied before caching, so what must not be kept (a source's picture URLs) never is;
 *  cacheKey: to keep two views of one URL apart (PokeCottage's text and, for local photos, its picture URLs);
 *  valid: what a usable answer looks like; a cached one that isn't (another view stored under this URL) is asked again */
export async function fetchJson<T = unknown>(
  url: string,
  {
    ttl = DAY,
    tries = 3,
    transform,
    cacheKey = url,
    valid,
  }: { ttl?: number; tries?: number; transform?: (body: unknown) => unknown; cacheKey?: string; valid?: (body: T) => boolean } = {},
): Promise<T | null> {
  const { rows } = await pool.query<{ body: T; fresh: boolean }>(
    `SELECT body, fetched_at > now() - ($2 || ' milliseconds')::interval AS fresh FROM arma.source_cache WHERE url = $1`,
    [cacheKey, String(ttl)],
  );
  const usable = rows[0] && (!valid || valid(rows[0].body)) ? rows[0] : undefined;
  if (usable?.fresh) {
    stats.cached++;
    return usable.body;
  }
  const host = new URL(url).host;
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await withSlot(host, () =>
        fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(30000) }),
      );
      if (r.status === 404) return null;
      const wait = busy(r, url);
      if (wait) throw wait;
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      const raw: unknown = await r.json();
      const body = (transform ? transform(raw) : raw) as T;
      stats.fetched++;
      await pool.query(
        `INSERT INTO arma.source_cache (url, body) VALUES ($1, $2) ON CONFLICT (url) DO UPDATE SET body = EXCLUDED.body, fetched_at = now()`,
        [cacheKey, JSON.stringify(body)],
      );
      return body;
    } catch (e) {
      last = e;
      // asked to wait: no quick retry
      if (e instanceof SourceBusy) break;
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
  // the source is down: an old cached answer is better than nothing
  if (usable) return usable.body;
  throw last instanceof Error ? last : new Error(String(last));
}

/**
 * A page from a source, read into what is kept (parse), with fetchJson's cache: one try, SourceBusy on 429/503, 404 →
 * null. Only parse's result is cached, never the page.
 */
export async function fetchText<T>(url: string, parse: (html: string) => T, { ttl = DAY } = {}): Promise<T | null> {
  const { rows } = await pool.query<{ body: T; fresh: boolean }>(
    `SELECT body, fetched_at > now() - ($2 || ' milliseconds')::interval AS fresh FROM arma.source_cache WHERE url = $1`,
    [url, String(ttl)],
  );
  if (rows[0]?.fresh) {
    stats.cached++;
    return rows[0].body;
  }
  const r = await withSlot(new URL(url).host, () =>
    fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(30000) }),
  );
  if (r.status === 404) return null;
  const wait = busy(r, url);
  if (wait) throw wait;
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  const body = parse(await r.text());
  stats.fetched++;
  await pool.query(
    `INSERT INTO arma.source_cache (url, body) VALUES ($1, $2) ON CONFLICT (url) DO UPDATE SET body = EXCLUDED.body, fetched_at = now()`,
    [url, JSON.stringify(body)],
  );
  return body;
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

const MAX_BYTES = 8 * 1024 * 1024;
export const downloads = { fetched: 0, existing: 0 };
/**
 * A file from a source, saved once at dest: when dest exists nothing is asked. 404/403 → 'missing'.
 * Bigger than 8 MB, or not an image, is refused. A partial file never stays behind.
 */
export async function downloadOnce(url: string, dest: string): Promise<'fetched' | 'existing' | 'missing'> {
  if (
    await stat(dest).then(
      s => s.isFile() && s.size > 0,
      () => false,
    )
  ) {
    downloads.existing++;
    return 'existing';
  }
  const host = new URL(url).host;
  const r = await withSlot(host, () => fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) }));
  if (r.status === 404 || r.status === 403) return 'missing';
  const wait = busy(r, url);
  if (wait) throw wait;
  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status} en ${url}`);
  if (!(r.headers.get('content-type') || '').startsWith('image/')) throw new Error(`No es una imagen: ${url}`);
  if (Number(r.headers.get('content-length') || 0) > MAX_BYTES) throw new Error(`Más de 8 MB: ${url}`);
  await mkdir(dirname(dest), { recursive: true });
  const part = dest + '.part';
  let size = 0;
  const limited = Readable.fromWeb(r.body as never).on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_BYTES) limited.destroy(new Error(`Más de 8 MB: ${url}`));
  });
  try {
    await pipeline(limited, createWriteStream(part));
    await rename(part, dest);
  } catch (e) {
    await unlink(part).catch(() => {});
    throw e;
  }
  downloads.fetched++;
  return 'fetched';
}
