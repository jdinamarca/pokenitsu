import { describe, expect, it } from 'vitest';
import catalog from './fixtures/catalog.json' with { type: 'json' };
import { cardTier, RARITY, TIERS } from '../src/index.js';

const t = (name: string, rarity: string | null, variant = 'normal') => cardTier({ name, rarity }, variant).id;

describe('kits-pokedex: nivel de una copia (escenarios)', () => {
  it('común sin ex/V/GX en normal → challa', () => expect(t('Bulbasaur', 'Common')).toBe('challa'));
  it('Doble rara (ex común) → ex/V/GX', () => expect(t('Charizard ex', 'Double Rare', 'holo')).toBe('exvgx'));
  it('común en Poké Ball → edición especial', () => expect(t('Bulbasaur', 'Common', 'pokeballholo')).toBe('especial'));
  it('promo ex → ex/V/GX', () => expect(t('Pikachu ex', 'Promo', 'holo')).toBe('exvgx'));
  it('común en reverse → challa holo', () => expect(t('Bulbasaur', 'Common', 'reverse')).toBe('holo'));
});

describe('todos los niveles', () => {
  it.each([
    ['Pikachu', 'Rare Holo', 'holo', 'holo'],
    ['Pikachu', 'Rare', 'normal', 'challa'],
    ['Zacian V', 'Rare Holo V', 'holo', 'exvgx'],
    ['Eternatus VMAX', 'Triple Rare', 'holo', 'exvgx'],
    ['Mewtwo-EX', 'Rare Holo EX', 'holo', 'exvgx'],
    ['Pikachu', 'Common', 'firstedition', 'especial'],
    ['Pikachu', 'Common', 'masterballholo', 'especial'],
    ['Charizard', 'Shiny Rare', 'holo', 'variocolor'],
    ['Radiant Greninja', 'Radiant Rare', 'holo', 'variocolor'],
    ['Charizard ex', 'Ultra Rare', 'holo', 'fullart'],
    ['Professor Turo', 'ACE SPEC Rare', 'holo', 'fullart'],
    ['Charmander', 'Illustration Rare', 'holo', 'ir'],
    ['Pikachu', 'Trainer Gallery Rare Holo', 'holo', 'ir'],
    ['Charizard ex', 'Special Illustration Rare', 'holo', 'sir'],
    ['Pikachu', 'Character Super Rare', 'holo', 'sir'],
    ['Mew ex', 'Hyper Rare', 'holo', 'dorada'],
    ['Pikachu', 'Rare Rainbow', 'holo', 'dorada'],
    ['Mewtwo', 'Secret Rare', 'holo', 'dorada'],
    ['Pikachu', 'Rare Holo Star', 'holo', 'dorada'],
    ['Pikachu', null, 'normal', 'challa'],
    ['Pikachu', 'Promo', 'normal', 'challa'],
    ['Pikachu', 'Promo', 'holo', 'holo'],
  ])('%s · %s · %s → %s', (name, rarity, variant, tier) => expect(t(name, rarity, variant)).toBe(tier));
  it('los niveles van de menor a mayor', () => expect(TIERS.map(x => x.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]));
});

describe('catálogo completo', () => {
  it('toda rareza del catálogo es conocida (ninguna cae en una rareza improvisada)', () => {
    const known = new Set(Object.keys(RARITY).map(r => r.toLowerCase()));
    const unknown = [...new Set((catalog.cards as [string, string | null][]).map(c => c[1]).filter((r): r is string => !!r))].filter(
      r => !known.has(r.toLowerCase()),
    );
    expect(unknown).toEqual([]);
  });
  it('toda carta del catálogo tiene un nivel en cada variante', () => {
    for (const [name, rarity] of catalog.cards as [string, string | null][])
      for (const v of ['normal', 'holo', 'reverse', 'pokeballholo']) expect(TIERS).toContain(cardTier({ name, rarity }, v));
  });
});
