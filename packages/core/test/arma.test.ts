import { describe, expect, it } from 'vitest';
import {
  applyRules,
  buildEquivalences,
  catalogCode,
  FULL_RULES,
  mergeClaims,
  photoShows,
  printingKey,
  variantFromInventory,
  variantFromPokecottage,
  variantFromTcgdex,
  variantFromTcgplayer,
  variantLabel,
  type ArmaFinish,
  type Claim,
  type RulePrinting,
} from '../src/index.js';

const claim = (setKey: string, number: string, lang: string, finish: ArmaFinish, source: string, stamp: string | null = null): Claim => ({
  setKey,
  number,
  lang,
  finish,
  stamp,
  source,
});

describe('2.1 código de catálogo y variantes', () => {
  it('código estable de una impresión', () => {
    expect(catalogCode('EEV', { setKey: 'sv3pt5', number: '133', lang: 'EN', finish: 'normal', stamp: null })).toBe('EEV·SV3PT5·133·EN·N');
    expect(catalogCode('EEV', { setKey: 'base2', number: '051', lang: 'EN', finish: 'normal', stamp: '1st-edition' })).toBe(
      'EEV·BASE2·51·EN·N~1ST-EDITION',
    );
  });
  it('Jungle #51: 1st Edition igual en TCGdex, TCGplayer, PokeCottage e inventario', () => {
    const all = [
      variantFromTcgdex({ type: 'normal', stamp: ['1st-edition'] }),
      variantFromTcgplayer('1stEdition'),
      variantFromPokecottage('firstEdition'),
      variantFromInventory('firstedition'),
    ];
    for (const v of all) expect(v).toMatchObject({ finish: 'normal', stamp: '1st-edition' });
    expect(variantLabel(all[0]!)).toBe('1st Edition');
  });
  it('151 #133: sellos de TCGdex', () => {
    expect(variantFromTcgdex({ type: 'normal', stamp: ['snowflake'] })).toEqual({ finish: 'normal', stamp: 'snowflake' });
    expect(variantFromTcgdex({ type: 'normal', stamp: ['pokemon-together'] })).toEqual({ finish: 'normal', stamp: 'pokemon-together' });
  });
  it('Prismatic #74: Poké Ball, Master Ball y reverse cosmos', () => {
    expect(variantFromTcgdex({ type: 'reverse', foil: 'pokeball' })!.finish).toBe('pokeball');
    expect(variantFromTcgdex({ type: 'reverse', foil: 'masterball' })!.finish).toBe('masterball');
    expect(variantFromTcgdex({ type: 'reverse', foil: 'cosmos' })!.finish).toBe('reversecosmos');
    expect(variantFromPokecottage('pokeBallHolo').finish).toBe('pokeball');
    expect(variantFromInventory('masterballholo').finish).toBe('masterball');
  });
  it('mazos y productos de PokeCottage quedan como sello con su nombre', () => {
    const v = variantFromPokecottage('charizarddeck', 'Charizard Deck');
    expect(v).toEqual({ finish: 'normal', stamp: 'charizarddeck', label: 'Charizard Deck' });
    expect(variantLabel(v)).toBe('Charizard Deck');
    expect(variantFromPokecottage('setStamp').stamp).toBe('set-logo');
    expect(variantFromTcgdex({ type: 'holo', size: 'jumbo' })).toEqual({ finish: 'holo', stamp: 'jumbo' });
  });
  it('SWSH042: el holo de TCGplayer es el holo cosmos de TCGdex', () => {
    const m = mergeClaims([claim('swshp', 'SWSH042', 'EN', 'cosmos', 'tcgdex'), claim('swshp', 'SWSH042', 'EN', 'holo', 'tcgplayer')]);
    expect(m).toHaveLength(1);
    expect(m[0]!.finish).toBe('cosmos');
    expect(m[0]!.facts.filter(f => f.field === 'exists').map(f => f.source)).toEqual(['tcgdex', 'tcgplayer']);
  });
  it('promo GX: el "normal" de TCGdex es el holo de TCGplayer', () => {
    const m = mergeClaims([claim('smp', 'SM233', 'EN', 'normal', 'tcgdex'), claim('smp', 'SM233', 'EN', 'holo', 'tcgplayer')]);
    expect(m.map(p => p.finish)).toEqual(['holo']);
  });
});

describe('2.2 fusión y equivalencias', () => {
  it('una impresión en tres fuentes queda una sola vez', () => {
    const m = mergeClaims([
      { ...claim('base2', '51', 'EN', 'normal', 'tcgdex', '1st-edition'), name: 'Eevee' },
      claim('base2', '051', 'EN', 'normal', 'pokecottage', '1st-edition'),
      claim('base2', '51', 'EN', 'normal', 'tcgplayer', '1st-edition'),
    ]);
    expect(m).toHaveLength(1);
    expect(m[0]!.name).toBe('Eevee');
    expect(new Set(m[0]!.facts.map(f => f.source))).toEqual(new Set(['tcgdex', 'pokecottage', 'tcgplayer']));
  });
  it('reimportar no duplica: la misma clave para el mismo número con ceros', () => {
    expect(printingKey(claim('base2', '051', 'EN', 'normal', 'x'))).toBe(printingKey(claim('base2', '51', 'EN', 'normal', 'y')));
  });
  it('Prismatic #74 en 5 idiomas = 1 equivalencia', () => {
    const m = mergeClaims(['EN', 'ES', 'FR', 'DE', 'IT'].map(l => claim('sv8pt5', '74', l, 'normal', 'tcgdex')));
    const eq = buildEquivalences(m);
    expect(eq).toHaveLength(1);
    expect(eq[0]!.keys).toHaveLength(5);
  });
  it('151 #133 normal y reverse = 2 equivalencias', () => {
    const m = mergeClaims([claim('sv3pt5', '133', 'EN', 'normal', 'tcgdex'), claim('sv3pt5', '133', 'EN', 'reverse', 'tcgdex')]);
    expect(buildEquivalences(m)).toHaveLength(2);
  });
  it('un enset+jpset de Bulbapedia une la inglesa con la japonesa', () => {
    const m = mergeClaims([claim('sv3pt5', '133', 'EN', 'normal', 'tcgdex'), claim('ja-SV2a', '133', 'JA', 'normal', 'tcgdex')]);
    expect(buildEquivalences(m)).toHaveLength(2);
    const eq = buildEquivalences(m, [
      { a: { setKey: 'sv3pt5', number: '133' }, b: { setKey: 'ja-SV2a', number: '133' }, source: 'bulbapedia' },
    ]);
    expect(eq).toHaveLength(1);
    expect(eq[0]!.sources).toContain('bulbapedia');
  });
  it('distinto número o variante nunca se une sin un vínculo explícito', () => {
    const m = mergeClaims([claim('sv3s', '141', 'ID', 'normal', 'tcgdex'), claim('sv3', '91', 'JA', 'normal', 'tcgdex')]);
    expect(buildEquivalences(m)).toHaveLength(2);
  });
});

describe('2.3 reglas', () => {
  const rp = (key: string, lang: string, equivId: string | null, stamp: string | null = null): RulePrinting => ({
    key,
    lang,
    stamp,
    equivId,
  });
  const full = [
    rp('en', 'EN', 'pre74'),
    rp('es', 'ES', 'pre74'),
    rp('fr', 'FR', 'pre74'),
    rp('de', 'DE', 'pre74'),
    rp('it', 'IT', 'pre74'),
    rp('ja', 'JA', 'pre74'),
    rp('zh', 'ZH-TW', 'pre74'),
    rp('copo', 'EN', 'copo', 'snowflake'),
    rp('wcd', 'EN', 'wcd', 'world-championships-deck-2007-jun-hasebe'),
    rp('jumbo', 'EN', 'jumbo', 'jumbo'),
    rp('first', 'EN', 'first', '1st-edition'),
  ];
  const inside = (r: Map<string, { in: boolean }>) =>
    [...r]
      .filter(([, v]) => v.in)
      .map(([k]) => k)
      .sort();
  it('el Full deja todo bajo luz', () => {
    expect(inside(applyRules(full, FULL_RULES))).toHaveLength(full.length);
  });
  it('solo inglés: queda la inglesa, las otras 4 fuera, sin tocar las asiáticas', () => {
    const r = applyRules(full, { ...FULL_RULES, onlyEnglish: true });
    for (const k of ['es', 'fr', 'de', 'it']) expect(r.get(k)).toEqual({ in: false, by: 'onlyEnglish' });
    expect(r.get('en')!.in).toBe(true);
    expect(r.get('ja')!.in).toBe(true);
    expect(r.get('zh')!.in).toBe(true);
  });
  it('sin inglés: queda el idioma occidental que va primero en orden alfabético', () => {
    const r = applyRules([rp('fr', 'FR', 'x'), rp('de', 'DE', 'x')], { ...FULL_RULES, onlyEnglish: true });
    expect(r.get('de')!.in).toBe(true);
    expect(r.get('fr')!.in).toBe(false);
  });
  it('asiáticas = japonesa', () => {
    const r = applyRules(full, { ...FULL_RULES, asiaAsJapanese: true });
    expect(r.get('ja')!.in).toBe(true);
    expect(r.get('zh')).toEqual({ in: false, by: 'asiaAsJapanese' });
  });
  it('sin sellos y mazos: fuera el copo, la 1st Edition siempre dentro', () => {
    const r = applyRules(full, { ...FULL_RULES, stampsAndDecks: false });
    expect(r.get('copo')).toEqual({ in: false, by: 'stampsAndDecks' });
    expect(r.get('first')!.in).toBe(true);
  });
  it('WCD y jumbo tienen su propia regla', () => {
    const r = applyRules(full, { ...FULL_RULES, wcd: false, jumbo: false });
    expect(r.get('wcd')!.by).toBe('wcd');
    expect(r.get('jumbo')!.by).toBe('jumbo');
  });
  it('nunca quita impresiones del Full: siempre devuelve una respuesta por cada una', () => {
    const r = applyRules(full, { onlyEnglish: true, asiaAsJapanese: true, stampsAndDecks: false, wcd: false, jumbo: false });
    expect(r.size).toBe(full.length);
  });
});

describe('photoShows', () => {
  const unlimited = { stamp: null };
  const first = { stamp: '1st-edition' };
  it('a photo shared by the unlimited and the 1st Edition shows the 1st Edition', () => {
    expect(photoShows(unlimited, [unlimited, first])).toBe('1st-edition');
    expect(photoShows(first, [unlimited, first])).toBe('1st-edition');
  });
  it('a photo only the unlimited has shows the unlimited', () => {
    expect(photoShows(unlimited, [unlimited])).toBe('');
    expect(photoShows({ stamp: 'pokemon-center' }, [{ stamp: 'pokemon-center' }])).toBe('pokemon-center');
  });
  it('a mark made by hand wins, also a mark back to the unlimited', () => {
    expect(photoShows(unlimited, [unlimited], '1st-edition')).toBe('1st-edition');
    expect(photoShows(first, [unlimited, first], '')).toBe('');
  });
});
