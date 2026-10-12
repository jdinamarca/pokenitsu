import { describe, expect, it } from 'vitest';
import catalog from './fixtures/catalog.json' with { type: 'json' };
// @ts-expect-error frozen JS copy, no types
import { makeLegacy } from './legacy/legacy.js';
import { eraOf, mechOf, rarityGroup, rarityMatches, rarityOf, RGROUPS } from '../src/index.js';

const legacy = makeLegacy({ setById: {}, meta: () => null, priceOf: () => null, keyOf: () => '' });
const cards = catalog.cards as [string, string | null][];

describe('rareza (escenarios)', () => {
  it('IR, SIR y Doble rara tienen su grupo', () => {
    expect(rarityGroup('Illustration Rare')).toBe('ir');
    expect(rarityGroup('Special Illustration Rare')).toBe('sir');
    expect(rarityGroup('Double Rare')).toBe('ultra');
  });
  it('ignora mayúsculas y minúsculas', () => expect(rarityOf('rare holo')?.[3]).toBe('rare'));
  it('una rareza desconocida se improvisa como rara', () =>
    expect(rarityOf('Super Mega Rare')).toEqual(['SMR', 'Super Mega Rare', 'r-r', 'rare']));
  it('sin rareza es base', () => expect(rarityGroup(null)).toBe('base'));
  it('el filtro de mecánica mira el nombre', () => {
    expect(rarityMatches('mech', 'Double Rare', 'Charizard ex')).toBe(true);
    expect(rarityMatches('mech', 'Common', 'Pikachu')).toBe(false);
    expect(rarityMatches('', 'Common', 'Pikachu')).toBe(true);
  });
});

describe('tipo de carta por nombre (escenarios)', () => {
  it.each([
    ['Charizard ex', 'ex'],
    ['Mewtwo-EX', 'EX'],
    ['Pikachu & Zekrom-GX', 'TAG TEAM'],
    ['Eternatus VMAX', 'VMAX'],
    ['Arceus VSTAR', 'VSTAR'],
    ['Zacian V', 'V'],
    ['Radiant Greninja', 'Radiante'],
    ['M Charizard-EX', 'EX'],
    ['Pikachu', ''],
  ])('%s → %s', (name, mech) => expect(mechOf(name)).toBe(mech));
});

describe('serie (escenarios)', () => {
  it('internacional usa su serie', () =>
    expect(eraOf({ id: 'sv3pt5', source: 'ptcg', series: 'Scarlet & Violet' })).toBe('Scarlet & Violet'));
  it('japonesa sin serie en inglés se deduce del código', () =>
    expect(eraOf({ id: 'ja-SV2a', source: 'tcgdex-ja', code: 'SV2a', series: 'ポケモンカードゲーム スカーレット&バイオレット' })).toBe(
      'Scarlet & Violet',
    ));
  it('sin expansión', () => expect(eraOf(null)).toBe(''));
});

describe('equivalencia con el código anterior (todo el catálogo)', () => {
  it(`rarityOf, grupo y filtros para las ${cards.length} combinaciones nombre + rareza`, () => {
    const diffs: unknown[] = [];
    for (const [name, rarity] of cards) {
      if (JSON.stringify(rarityOf(rarity)) !== JSON.stringify(legacy.rarityOf(rarity))) diffs.push(['rarityOf', rarity]);
      if (mechOf(name) !== legacy.mechOf(name)) diffs.push(['mechOf', name]);
      if (rarityGroup(rarity) !== legacy.rgroupOf(rarity)) diffs.push(['group', rarity]);
      for (const [g] of RGROUPS)
        if (rarityMatches(g, rarity, name) !== legacy.rarityMatch(g, rarity, name)) diffs.push(['match', g, name, rarity]);
    }
    expect(diffs).toEqual([]);
  });
  it(`eraOf para las ${catalog.sets.length} expansiones`, () => {
    const diffs = catalog.sets.filter(s => eraOf(s) !== legacy.eraOf(s)).map(s => s.id);
    expect(diffs).toEqual([]);
  });
});
