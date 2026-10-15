import { describe, expect, it } from 'vitest';
import { suggestVariants, variantLabel, variantSlug, variantType } from '../src/index.js';

const brief = (xs: ReturnType<typeof suggestVariants>) => xs.map(x => `${x.label} [${x.sources.join('+')}]`);

describe('identificador y etiqueta de una variante', () => {
  it('las impresiones estándar conservan su identificador', () => {
    expect(variantSlug({ finish: 'normal' })).toBe('normal');
    expect(variantSlug({ finish: 'reverse' })).toBe('reverse');
    expect(variantSlug({ finish: 'pokeball' })).toBe('pokeballholo');
    expect(variantSlug({ finish: 'masterball' })).toBe('masterballholo');
    expect(variantSlug({ finish: 'cosmos' })).toBe('cosmosholo');
    expect(variantSlug({ finish: 'normal', stamp: '1st-edition' })).toBe('firstedition');
    expect(variantLabel({ finish: 'normal', stamp: '1st-edition' })).toBe('1st Edition');
  });
  it('sello: acabado~sello', () => {
    expect(variantSlug({ finish: 'normal', stamp: 'prerelease' })).toBe('normal~prerelease');
    expect(variantLabel({ finish: 'holo', stamp: 'pokemon-center' })).toBe('Holo · Pokémon Center');
  });
  it('Battle Academy con mazo y número', () => {
    const s = { finish: 'normal' as const, stamp: 'battle-academy', deck: 'Charizard', deckNo: '12' };
    expect(variantSlug(s)).toBe('normal~ba-charizard-12');
    expect(variantLabel(s)).toBe('Normal · Battle Academy · Charizard #12');
    expect(variantType(s)).toBe('variant');
  });
  it('un sello escrito a mano', () => {
    expect(variantSlug({ finish: 'normal', stamp: 'Número azul' })).toBe('normal~numero-azul');
    expect(variantLabel({ finish: 'normal', stamp: 'Número azul' })).toBe('Normal · Número azul');
  });
  it('tipo: estándar o variante', () => {
    expect(variantType({ finish: 'cosmos' })).toBe('default');
    expect(variantType({ finish: 'pokeball' })).toBe('variant');
  });
});

describe('sugerencias de TCGdex y TCGplayer (casos de la investigación de Eevee)', () => {
  it('Dark Explorers #83: la reverse solo la da TCGplayer', () => {
    expect(brief(suggestVariants([{ type: 'normal' }], ['normal', 'reverseHolofoil']))).toEqual([
      'Normal [tcgdex+tcgplayer]',
      'Reverse [tcgplayer]',
    ]);
  });
  it('SWSH042: el holo de TCGplayer es el holo cosmos de TCGdex', () => {
    expect(brief(suggestVariants([{ type: 'holo', foil: 'cosmos' }], ['holofoil']))).toEqual(['Holo cosmos [tcgdex+tcgplayer]']);
  });
  it('promo GX: normal en TCGdex y holo en TCGplayer son la misma impresión', () => {
    expect(brief(suggestVariants([{ type: 'normal' }], ['holofoil']))).toEqual(['Holo [tcgdex+tcgplayer]']);
  });
  it('Futsal: holo en TCGdex y normal en TCGplayer son la misma', () => {
    expect(brief(suggestVariants([{ type: 'holo' }], ['normal']))).toEqual(['Holo [tcgdex+tcgplayer]']);
  });
  it('Jungle: unlimited es la normal y 1stEdition la 1st Edition', () => {
    const s = suggestVariants([{ type: 'normal' }, { type: 'normal', stamp: ['1st-edition'] }], ['1stEdition', 'unlimited']);
    expect(brief(s)).toEqual(['Normal [tcgdex+tcgplayer]', '1st Edition [tcgdex+tcgplayer]']);
    expect(s.map(x => x.slug)).toEqual(['normal', 'firstedition']);
  });
  it('Prismatic #74: Poké Ball, Master Ball y reverse cosmos', () => {
    const s = suggestVariants(
      [
        { type: 'normal' },
        { type: 'reverse' },
        { type: 'reverse', foil: 'pokeball' },
        { type: 'reverse', foil: 'masterball' },
        { type: 'reverse', foil: 'cosmos' },
      ],
      ['normal', 'reverseHolofoil'],
    );
    expect(brief(s)).toEqual([
      'Normal [tcgdex+tcgplayer]',
      'Reverse [tcgdex+tcgplayer]',
      'Reverse cosmos [tcgdex]',
      'Poké Ball [tcgdex]',
      'Master Ball [tcgdex]',
    ]);
  });
  it('151 #133: los sellos van después', () => {
    const s = suggestVariants(
      [{ type: 'normal' }, { type: 'reverse' }, { type: 'normal', stamp: ['pokemon-together'] }, { type: 'normal', stamp: ['snowflake'] }],
      ['normal', 'reverseHolofoil'],
    );
    expect(brief(s)).toEqual([
      'Normal [tcgdex+tcgplayer]',
      'Reverse [tcgdex+tcgplayer]',
      'Normal · Pokémon Together [tcgdex]',
      'Normal · Snowflake [tcgdex]',
    ]);
  });
  it('jumbo cuenta como producto', () => {
    expect(suggestVariants([{ type: 'holo', size: 'jumbo' }], [])[0]!.slug).toBe('holo~jumbo');
  });
  it('sin datos: lista vacía', () => {
    expect(suggestVariants(null, null)).toEqual([]);
  });
});
