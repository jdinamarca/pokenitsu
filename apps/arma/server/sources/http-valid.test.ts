import { afterEach, describe, expect, it, vi } from 'vitest';

// master-set-familia-eevee: a fresh cached answer that isn't usable (Completar detalles kept a trimmed TCGdex card under
// the importer's URL) is asked again instead of being used
const cached = { category: 'Pokemon', illustrator: 'tono' };
vi.mock('../db.ts', () => ({
  pool: { query: async (sql: string) => ({ rows: sql.startsWith('SELECT') ? [{ body: cached, fresh: true }] : [] }) },
}));
const { fetchJson } = await import('./http.ts');
afterEach(() => vi.unstubAllGlobals());

describe('fetchJson valid', () => {
  it('uses a fresh cached answer that passes', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchJson('https://api.tcgdex.net/v2/ja/cards/SV8a-223')).toEqual(cached);
    expect(f).not.toHaveBeenCalled();
  });
  it("asks again when the cached one isn't usable", async () => {
    const whole = { id: 'SV8a-223', set: { id: 'SV8a' } };
    const f = vi.fn(async () => new Response(JSON.stringify(whole), { status: 200 }));
    vi.stubGlobal('fetch', f);
    const got = await fetchJson<{ set?: { id: string } }>('https://api.tcgdex.net/v2/ja/cards/SV8a-223', { valid: d => !!d?.set?.id });
    expect(got).toEqual(whole);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
