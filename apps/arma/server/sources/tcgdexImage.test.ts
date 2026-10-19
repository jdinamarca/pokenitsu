import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
// TCGdex answers only in English, with Majestic Dawn #62 and its Burger King stamp (burger-king-2009)
vi.mock('./http.ts', async orig => ({
  ...(await orig<typeof import('./http.ts')>()),
  fetchJson: async (url: string) => {
    if (url.includes('pokeapi')) return { names: [{ language: { name: 'en' }, name: 'Eevee' }] };
    if (!url.includes('/en/')) return [];
    if (url.endsWith('/cards/dp5-62'))
      return {
        id: 'dp5-62',
        localId: '62',
        name: 'Eevee',
        image: 'https://assets.tcgdex.net/en/dp/dp5/62',
        set: { id: 'dp5', name: 'Majestic Dawn' },
        variants_detailed: [{ type: 'normal' }, { type: 'reverse' }, { type: 'reverse', stamp: ['platinum'] }],
      };
    if (url.includes('dexId')) return [{ id: 'dp5-62' }];
    return [];
  },
}));
const { tcgdexClaims } = await import('./tcgdex.ts');

describe('burger-king-2009: la foto de TCGdex es la de la carta sin sello', () => {
  it('va en las variantes sin sello y no en la de Burger King', async () => {
    const cat = {
      sets: new Map([['dp5', { name: 'Majestic Dawn' }]]),
      fromTcgdex: new Map([['dp5', 'dp5']]),
      cardIds: new Map(),
      tdByName: new Map(),
    } as never;
    const { claims } = await tcgdexClaims(cat, 133);
    expect(claims.map(c => `${c.finish}|${c.stamp}|${c.image ? 'foto' : '-'}`)).toEqual([
      'normal|null|foto',
      'reverse|null|foto',
      'reverse|burger-king-2009|-',
    ]);
  });
});
