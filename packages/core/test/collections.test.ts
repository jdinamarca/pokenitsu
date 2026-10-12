import { describe, expect, it } from 'vitest';
// @ts-expect-error frozen JS copy, no types
import { makeLegacy } from './legacy/legacy.js';
import { slotVariants, type ChecklistVariant } from '../src/index.js';

const legacy = makeLegacy({ setById: {}, meta: () => null, priceOf: () => null, keyOf: () => '' });

describe('colecciones (escenarios)', () => {
  it('Cosmos Holo como única versión estándar: una copia normal u holo cuenta', () => {
    const v = { slug: 'cosmosholo', type: 'default' };
    expect(slotVariants({ v, vlist: [v] })).toEqual(['cosmosholo', 'normal', 'holo']);
  });
  it('si la carta también tiene normal u holo, Cosmos Holo solo cuenta como tal', () => {
    const v = { slug: 'cosmosholo', type: 'default' };
    expect(slotVariants({ v, vlist: [v, { slug: 'holo', type: 'default' }] })).toEqual(['cosmosholo']);
  });
  it('variantes no estándar (sellos, Poké Ball) solo cuentan como tal', () => {
    expect(slotVariants({ v: { slug: 'pokeballholo', type: 'variant' }, vlist: [] })).toEqual(['pokeballholo']);
  });
  it('normal, holo y reverse cuentan como tal', () => {
    expect(slotVariants({ v: { slug: 'reverse', type: 'default' }, vlist: [] })).toEqual(['reverse']);
  });
});

describe('equivalencia con el código anterior', () => {
  it('todas las combinaciones de variante, tipo y lista', () => {
    const slugs = ['normal', 'holo', 'reverse', 'cosmosholo', 'pokeballholo', 'firstedition', 'stamp'];
    const types = ['default', 'variant', null, undefined];
    const lists: (ChecklistVariant[] | null | undefined)[] = [
      null,
      undefined,
      [],
      [{ slug: 'normal' }],
      [{ slug: 'holo' }],
      [{ slug: 'reverse' }],
      [{ slug: 'cosmosholo' }, { slug: 'reverse' }],
    ];
    const diffs: unknown[] = [];
    for (const slug of slugs)
      for (const type of types)
        for (const vlist of lists) {
          const sl = { v: { slug, type }, vlist };
          if (JSON.stringify(slotVariants(sl)) !== JSON.stringify(legacy.slotVariants(sl))) diffs.push(sl);
        }
    expect(diffs).toEqual([]);
  });
});
