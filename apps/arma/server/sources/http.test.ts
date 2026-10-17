import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

// no database: the cache is always empty
vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) } }));
const { downloadOnce, fetchJson, retryAfterMs, SourceBusy } = await import('./http.ts');

afterEach(() => vi.unstubAllGlobals());
// the wait a call asked for, failing when it didn't throw SourceBusy
const waitOf = async (p: Promise<unknown>) => {
  const e = await p.then(
    () => null,
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(SourceBusy);
  return (e as InstanceType<typeof SourceBusy>).retryAfterMs;
};
const answer = (status: number, headers: Record<string, string> = {}) => new Response(status < 300 ? '{}' : null, { status, headers });

describe('fotos-pokecottage-en-catalogo: no saturar la fuente', () => {
  it('Retry-After en segundos, como fecha, sin cabecera y con tope', () => {
    expect(retryAfterMs('60')).toBe(60_000);
    expect(retryAfterMs(new Date(1_000_000 + 30_000).toUTCString(), 1_000_000)).toBe(30_000);
    expect(retryAfterMs(null)).toBe(60_000);
    expect(retryAfterMs('basura')).toBe(60_000);
    expect(retryAfterMs('86400')).toBe(600_000);
  });

  it('un 429 con Retry-After: 60 da SourceBusy tras una sola petición', async () => {
    const fetch = vi.fn(async () => answer(429, { 'retry-after': '60' }));
    vi.stubGlobal('fetch', fetch);
    expect(await waitOf(fetchJson('https://pokecottagecdn.com/mastersets/data/1-bulbasaur.json'))).toBe(60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('un 503 sin cabecera, al bajar una foto, pide 60 s', async () => {
    vi.stubGlobal('fetch', async () => answer(503));
    const dir = await mkdtemp(join(tmpdir(), 'arma-http-'));
    try {
      expect(await waitOf(downloadOnce('https://pokecottagecdn.com/x.webp', join(dir, 'x.webp')))).toBe(60_000);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('nunca dos peticiones a la vez a PokeCottage', async () => {
    let now = 0;
    let most = 0;
    vi.stubGlobal('fetch', async () => {
      most = Math.max(most, ++now);
      await new Promise(r => setTimeout(r, 20));
      now--;
      return answer(404);
    });
    await Promise.all(Array.from({ length: 4 }, (_, i) => fetchJson(`https://pokecottagecdn.com/mastersets/data/${i}-x.json`)));
    expect(most).toBe(1);
  });
});
