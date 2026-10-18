import { describe, expect, it } from 'vitest';
import { FAMILIES, familyOf, MEMBER_NAMES, memberFromPath, pathOf } from '../src/index.js';

describe('the Eevee family', () => {
  it('has the 9 in the fan order, Eevee at the centre', () => {
    const f = FAMILIES[0]!;
    expect(f.members.map(d => MEMBER_NAMES[d])).toEqual([
      'Vaporeon',
      'Jolteon',
      'Flareon',
      'Espeon',
      'Eevee',
      'Umbreon',
      'Leafeon',
      'Glaceon',
      'Sylveon',
    ]);
    expect(f.members[4]).toBe(f.base);
    expect(familyOf(700)?.id).toBe('eevee');
    expect(familyOf(25)).toBeUndefined();
  });
  it('reads the member of an address', () => {
    expect(memberFromPath('/')).toBe(133);
    expect(memberFromPath('/master-set')).toBe(133);
    expect(memberFromPath('/master-set/')).toBe(133);
    expect(memberFromPath('/master-set/espeon')).toBe(196);
    expect(memberFromPath('/master-set/Umbreon')).toBe(197);
    expect(memberFromPath('/master-set/pikachu')).toBeNull();
    expect(memberFromPath('/cargar')).toBeNull();
  });
  it('pathOf and memberFromPath go back and forth', () => {
    for (const d of FAMILIES[0]!.members) expect(memberFromPath(pathOf(d))).toBe(d);
    expect(pathOf(470)).toBe('/master-set/leafeon');
  });
});
