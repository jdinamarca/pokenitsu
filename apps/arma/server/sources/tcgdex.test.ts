import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const { bare, isSpecies } = await import('./tcgdex.ts');

describe('isSpecies', () => {
  it('compares without accents or case (Évoli / Evoli)', () => {
    expect(bare('Évoli')).toBe('evoli');
    expect(isSpecies('Evoli', ['Évoli'])).toBe(true);
    expect(isSpecies('Évoli-V', ['Évoli'])).toBe(true);
    expect(isSpecies('Aquali', ['Aquali'])).toBe(true);
  });
  it('keeps Radiant and the "X Eevee" names, and leaves evolutions out of Eevee', () => {
    expect(isSpecies('Radiant Eevee', ['Eevee'])).toBe(true);
    expect(isSpecies("Team Rocket's Eevee", ['Eevee'])).toBe(true);
    expect(isSpecies('Leafeon', ['Eevee'])).toBe(false);
    expect(isSpecies('Phyllali', ['Évoli', 'Evoli'])).toBe(false);
  });
});
