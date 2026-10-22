import { describe, expect, it } from 'vitest';
import languagesPage from './fixtures/bulbapedia-languages.json' with { type: 'json' };
import {
  applyRules,
  battleAcademyClaims,
  type BattleAcademyCard,
  auditPrintings,
  baseFinish,
  buildEquivalences,
  catalogCode,
  FULL_RULES,
  mergeClaims,
  ownCardClaims,
  mirrorPhotos,
  plainPhotoFits,
  parseLanguageSentence,
  parseLanguageTables,
  misfiled,
  photoShows,
  printingKey,
  stampKey,
  variantFromInventory,
  inventoryVariant,
  parseAdditionalCards,
  additionalCardClaims,
  compactStamp,
  variantFromPokecottage,
  variantFromTcgdex,
  variantFromTcgplayer,
  variantLabel,
  type ArmaFinish,
  type Fact,
  type AuditPrinting,
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
  it('variante del Full → nombre del inventario, de ida y vuelta (variantes-al-cargar)', () => {
    expect(inventoryVariant('normal', null)).toBe('normal');
    expect(inventoryVariant('pokeball', null)).toBe('pokeballholo');
    expect(inventoryVariant('cosmos', null)).toBe('cosmosholo');
    expect(inventoryVariant('normal', '1st-edition')).toBe('firstedition');
    expect(inventoryVariant('normal', 'fxewtfg7z')).toBe('fxewtfg7z');
    expect(inventoryVariant('normal', 'set-logo')).toBe('setstamp');
    expect(inventoryVariant('normal', 'ba-charizard-26')).toBe('bacharizard26');
    expect(inventoryVariant('reverse', 'hd5chxcnz')).toBe('reverseholohd5chxcnz');
    expect(inventoryVariant('holo', 'jumbo')).toBe('holojumbo');
    const back = (f: string, st: string | null) => {
      const v = variantFromInventory(inventoryVariant(f, st));
      return { finish: v.finish, stamp: v.stamp && compactStamp(v.stamp) };
    };
    for (const [f, st] of [
      ['normal', null],
      ['holo', null],
      ['reverse', null],
      ['masterball', null],
      ['normal', '1st-edition'],
      ['normal', 'fxewtfg7z'],
      ['normal', 'set-logo'],
      ['normal', 'ba-charizard-26'],
      ['reverse', 'hd5chxcnz'],
      ['holo', 'jumbo'],
      ['normal', 'jr-stamp-rally'],
    ] as const)
      expect(back(f, st)).toEqual({ finish: f, stamp: st && compactStamp(st) });
  });
  it('PokeCottage: normal, nonHolo y holofoil son acabados, no sellos', () => {
    expect(variantFromPokecottage('normal')).toEqual({ finish: 'normal', stamp: null });
    expect(variantFromPokecottage('nonHolo')).toEqual({ finish: 'normal', stamp: null });
    expect(variantFromPokecottage('holofoil')).toEqual({ finish: 'holo', stamp: null });
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
  it('la Eevee de Burger King 2009 en español, confirmada con la carta del usuario (burger-king-2009-en-espanol)', () => {
    const own = ownCardClaims(133);
    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({
      setKey: 'dp5',
      number: '62',
      lang: 'ES',
      finish: 'reverse',
      stamp: 'burger-king-2009',
      source: 'confirmada',
    });
    expect(own[0]!.label).toBe(variantLabel({ finish: 'reverse', stamp: 'burger-king-2009' }));
    expect(ownCardClaims(134)).toEqual([]);
    const m = mergeClaims([claim('dp5', '62', 'EN', 'reverse', 'tcgdex', 'burger-king-2009'), ...own]);
    expect(m.map(p => `${p.lang} ${p.finish} ${p.stamp}`)).toEqual(['EN reverse burger-king-2009', 'ES reverse burger-king-2009']);
    expect(m[1]!.facts.find(f => f.field === 'exists')).toMatchObject({
      source: 'confirmada',
      ref: 'Foto de la carta del usuario, 2026-10-21',
    });
  });
  it('30th Celebration es toda holo: el normal de las fuentes es la holo (me55-solo-holo)', () => {
    const m = mergeClaims([
      claim('me55', '118', 'EN', 'normal', 'pokemontcg'),
      claim('me55', '118', 'EN', 'normal', 'tcgdex'),
      claim('me55', '118', 'EN', 'holo', 'pokecottage'),
      claim('me55', '118', 'DE', 'normal', 'tcgdex'),
    ]);
    expect(m.map(p => `${p.lang} ${p.finish}`)).toEqual(['EN holo', 'DE holo']);
    expect(m[0]!.facts.filter(f => f.field === 'exists').map(f => f.source)).toEqual(['pokemontcg', 'tcgdex', 'pokecottage']);
  });
  it('30th Celebration: holo y cosmos siguen separadas, y una sola cosmos se queda cosmos', () => {
    const both = mergeClaims([
      claim('me55', '116', 'EN', 'normal', 'tcgdex'),
      claim('me55', '116', 'EN', 'holo', 'pokecottage'),
      claim('me55', '116', 'EN', 'cosmos', 'pokecottage'),
    ]);
    expect(both.map(p => p.finish).sort()).toEqual(['cosmos', 'holo']);
    const cosmos = mergeClaims([claim('me55', '50', 'EN', 'normal', 'tcgdex'), claim('me55', '50', 'EN', 'cosmos', 'pokecottage')]);
    expect(cosmos.map(p => p.finish)).toEqual(['cosmos']);
  });
  it('fuera de las expansiones toda holo, el normal sigue normal', () =>
    expect(mergeClaims([claim('sv8', '133', 'EN', 'normal', 'tcgdex')]).map(p => p.finish)).toEqual(['normal']));
  it('era EX: el sello de la expansión de TCGdex y PokeCottage es la Reverse (reverse-con-sello-ex)', () => {
    const m = mergeClaims([
      claim('ex11', '68', 'EN', 'normal', 'tcgplayer'),
      claim('ex11', '68', 'EN', 'reverse', 'tcgplayer'),
      claim('ex11', '68', 'EN', 'reverse', 'pokemontcg'),
      claim('ex11', '68', 'EN', 'normal', 'tcgdex'),
      claim('ex11', '68', 'EN', 'normal', 'tcgdex', 'set-logo'),
      { ...claim('ex11', '68', 'EN', 'normal', 'pokecottage', 'set-logo'), label: 'Expansion Stamp' },
      claim('ex11', '68', 'EN', 'normal', 'pokecottage', 'hd5chx3d3'),
    ]);
    const rev = m.filter(p => p.finish === 'reverse');
    expect(rev).toHaveLength(1);
    expect(rev[0]!.stamp).toBeNull();
    expect(rev[0]!.facts.filter(f => f.field === 'exists').map(f => f.source)).toEqual([
      'tcgplayer',
      'pokemontcg',
      'tcgdex',
      'pokecottage',
    ]);
    expect(rev[0]!.facts.filter(f => f.field === 'variant').map(f => f.value)).toEqual([
      'Reverse',
      'Reverse',
      'Sello de la expansión',
      'Expansion Stamp',
    ]);
    expect(m.some(p => p.stamp === 'set-logo')).toBe(false);
  });
  it('era EX: también cuando TCGdex anota el sello como reverse o como holo', () => {
    for (const f of ['reverse', 'holo'] as const) {
      const m = mergeClaims([
        claim('ex11', '18', 'EN', 'holo', 'tcgplayer'),
        claim('ex11', '18', 'EN', 'reverse', 'tcgplayer'),
        claim('ex11', '18', 'EN', 'holo', 'tcgdex'),
        claim('ex11', '18', 'EN', f, 'tcgdex', 'set-logo'),
        claim('ex11', '18', 'EN', 'holo', 'pokecottage'),
        claim('ex11', '18', 'EN', 'normal', 'pokecottage', 'set-logo'),
      ]);
      expect(m.map(p => `${p.finish}|${p.stamp}`).sort()).toEqual(['holo|null', 'reverse|null']);
    }
  });
  it('el sello de la expansión sigue aparte fuera de la era EX o si PokeCottage tiene una reverse sin sello', () => {
    const sv = mergeClaims([
      claim('sv3', '86', 'EN', 'reverse', 'tcgplayer'),
      claim('sv3', '86', 'EN', 'normal', 'pokecottage', 'set-logo'),
    ]);
    expect(sv.map(p => `${p.finish}|${p.stamp}`).sort()).toEqual(['normal|set-logo', 'reverse|null']);
    const ex = mergeClaims([
      claim('ex2', '63', 'EN', 'reverse', 'tcgplayer'),
      claim('ex2', '63', 'EN', 'reverse', 'pokecottage'),
      claim('ex2', '63', 'EN', 'normal', 'pokecottage', 'set-logo'),
    ]);
    expect(ex.map(p => `${p.finish}|${p.stamp}`).sort()).toEqual(['normal|set-logo', 'reverse|null']);
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

describe('correcciones de clasificación', () => {
  const finishes = (cs: Claim[]) =>
    mergeClaims(cs).map(m => `${m.finish}${m.stamp ? '~' + m.stamp : ''} [${[...new Set(m.facts.map(f => f.source))].sort().join(',')}]`);
  it('Wizards Promo #11: la "Holo" de pokemontcg.io es la holo cosmos de las demás', () => {
    expect(
      finishes([
        claim('basep', '11', 'EN', 'holo', 'pokemontcg'),
        claim('basep', '11', 'EN', 'cosmos', 'tcgdex'),
        claim('basep', '11', 'EN', 'cosmos', 'pokecottage'),
        claim('basep', '11', 'EN', 'holo', 'tcgplayer'),
      ]),
    ).toEqual(['cosmos [pokecottage,pokemontcg,tcgdex,tcgplayer]']);
  });
  it('una holo de TCGdex sin brillo también es genérica', () => {
    expect(
      finishes([
        { ...claim('bwp', 'BW94', 'EN', 'holo', 'tcgdex'), genericFinish: true },
        claim('bwp', 'BW94', 'EN', 'cosmos', 'pokecottage'),
      ]),
    ).toEqual(['cosmos [pokecottage,tcgdex]']);
  });
  it('SM184: la "normal" de TCGdex que TCGplayer vende como holo, con PokeCottage diciendo holo cosmos, es la holo cosmos', () => {
    expect(
      finishes([
        claim('smp', 'SM184', 'EN', 'normal', 'tcgdex'),
        claim('smp', 'SM184', 'EN', 'holo', 'tcgplayer'),
        claim('smp', 'SM184', 'EN', 'holo', 'pokemontcg'),
        claim('smp', 'SM184', 'EN', 'cosmos', 'pokecottage'),
      ]),
    ).toEqual(['cosmos [pokecottage,pokemontcg,tcgdex,tcgplayer]']);
  });
  it('30th Celebration #116: holo y holo cosmos dichas por una fuente específica se mantienen', () => {
    expect(
      finishes([
        claim('me55', '116', 'EN', 'holo', 'pokecottage'),
        claim('me55', '116', 'EN', 'cosmos', 'pokecottage'),
        claim('me55', '116', 'EN', 'holo', 'pokemontcg'),
      ]),
    ).toEqual(['holo [pokecottage,pokemontcg]', 'cosmos [pokecottage]']);
  });
  it('JR Stamp Rally solo existe en japonés: en una carta occidental está mal catalogado', () => {
    expect(misfiled(claim('basep', '11', 'EN', 'normal', 'tcgdex', 'jr-stamp-rally'))).toBe(true);
    expect(misfiled(claim('pc:jpn_unp', '157', 'JA', 'normal', 'pokecottage', 'jr-stamp-rally'))).toBe(false);
    expect(variantFromPokecottage('JREastRally2000').stamp).toBe('jr-stamp-rally');
  });
  it('el mismo sello con dos nombres queda con el más completo', () => {
    expect(
      finishes([
        claim('ex11', '68', 'EN', 'normal', 'tcgdex', 'jun-hasebe'),
        claim('ex11', '68', 'EN', 'normal', 'pokecottage', 'world-championships-deck2007-jun-hasebe'),
      ]),
    ).toEqual(['normal~world-championships-deck2007-jun-hasebe [pokecottage,tcgdex]']);
  });
});

describe('revisión de clasificación', () => {
  const pr = (o: Partial<AuditPrinting> & Pick<AuditPrinting, 'code'>): AuditPrinting => ({
    set_key: 'sv8',
    number: '143',
    lang: 'EN',
    finish: 'normal',
    stamp: null,
    sources: ['pokemontcg', 'tcgdex'],
    labels: ['Normal'],
    ...o,
  });
  const kinds = (ps: AuditPrinting[]) => Object.fromEntries([...auditPrintings(ps)].map(([k, rs]) => [k, rs.map(r => r.kind)]));
  it('una impresión limpia no se marca', () => {
    expect(kinds([pr({ code: 'a' })])).toEqual({});
  });
  it('región: sello japonés o expansión japonesa en un idioma occidental, y japonés en una internacional', () => {
    expect(
      kinds([
        pr({ code: 'gym', stamp: 'pokemon-card-gym' }),
        pr({ code: 'jaset', set_key: 'pc:jpn_unp', number: '157' }),
        pr({ code: 'jaint', set_key: 'base2', number: '51', lang: 'JA' }),
      ]),
    ).toEqual({ gym: ['region'], jaset: ['region'], jaint: ['region'] });
  });
  it('acabado: holo y holo cosmos que ninguna fuente comparte', () => {
    expect(
      kinds([
        pr({ code: 'h', set_key: 'smp', number: 'SM184', finish: 'holo', sources: ['pokemontcg', 'tcgdex'] }),
        pr({ code: 'c', set_key: 'smp', number: 'SM184', finish: 'cosmos', sources: ['pokecottage'] }),
      ]),
    ).toEqual({ h: ['finish'], c: ['finish', 'oneSource'] });
  });
  it('una sola fuente cuando otras conocen la carta, con el texto que las nombra', () => {
    const r = auditPrintings(
      [pr({ code: 'n' }), pr({ code: 'p', stamp: 'platinum', sources: ['tcgdex'] })],
      id => ({ tcgdex: 'TCGdex', pokemontcg: 'pokemontcg.io' })[id] || id,
    );
    expect(r.get('p')!.map(x => x.text)).toEqual(['Solo TCGdex dice que existe; pokemontcg.io conoce la carta']);
    expect(r.has('n')).toBe(false);
  });
  it('sin nombre: la variante es solo un código', () => {
    expect(kinds([pr({ code: 'x', stamp: 'x6m1ty0f6', labels: ['X6M-1TY-0F6'], sources: ['pokecottage', 'tcgdex'] })])).toEqual({
      x: ['unnamed'],
    });
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

describe('tamaño de TCGdex traducido', () => {
  it('"Standard", "estándar" y "Padrão" son el tamaño normal, no un sello; jumbo sí es una variante', () => {
    for (const size of ['standard', 'Standard', 'estándar', 'Padrão'])
      expect(variantFromTcgdex({ type: 'normal', size })).toEqual({ finish: 'normal', stamp: null });
    expect(variantFromTcgdex({ type: 'holo', size: 'jumbo' })!.stamp).toBe('jumbo');
  });
});

describe('cartas en otros idiomas', () => {
  it('acabado base: normal si existe; si no, su holo; nunca un sello ni un reverse', () => {
    expect(
      baseFinish([
        { finish: 'reverse', stamp: null },
        { finish: 'normal', stamp: null },
        { finish: 'normal', stamp: '1st-edition' },
      ]),
    ).toBe('normal');
    expect(
      baseFinish([
        { finish: 'cosmos', stamp: null },
        { finish: 'normal', stamp: 'pokemon-center' },
      ]),
    ).toBe('cosmos');
    expect(baseFinish([])).toBe('normal');
  });
  it('motivos "deducida" y "no salió en este idioma"', () => {
    const base = { set_key: 'dp5', number: '62', finish: 'normal' as const, stamp: null, labels: [] };
    const r = auditPrintings([
      { ...base, code: 'it', lang: 'IT', sources: ['tcgdex-expansiones'], inferred: { setName: 'Alba Suprema', language: 'italiano' } },
      {
        ...base,
        code: 'es',
        set_key: 'base5',
        number: '55',
        lang: 'ES',
        sources: ['tcgdex'],
        notReleased: { name: 'Team Rocket', language: 'español', source: 'WikiDex' },
      },
    ]);
    expect(r.get('it')!.map(x => x.text)).toEqual([
      'Deducida: TCGdex lista Alba Suprema en italiano, pero ninguna fuente lista esta carta',
    ]);
    expect(r.get('es')!.map(x => x.text)).toEqual(['WikiDex dice que Team Rocket no salió en español']);
  });
});

describe('idiomas desde Bulbapedia', () => {
  const tables = parseLanguageTables(languagesPage.wikitext);
  it('tablas: nombre por idioma, colspan repetido y "—" como no salió', () => {
    expect(tables.get('Jungle')).toEqual({ NL: 'Jungle', FR: 'Jungle', DE: 'Dschungel', IT: 'Jungle', PT: 'Selva', ES: 'Jungla' });
    expect(tables.get('Team Rocket')).toEqual({ NL: null, FR: 'Team Rocket', DE: 'Team Rocket', IT: 'Team Rocket', PT: null, ES: null });
    expect(tables.get('Gym Challenge')!.ES).toBeNull();
  });
  it('tablas: una serie sin columna de neerlandés ni portugués no dice nada de ellos', () => {
    expect(tables.get('Neo Discovery')).toEqual({ FR: 'Neo Discovery', DE: 'Neo Entdeckung', IT: 'Neo Discovery', ES: null });
  });
  it('frase: 1st Edition y reverse por idioma', () => {
    expect(
      parseLanguageSentence(
        'The Pokémon Jungle set is released in Japanese. The Jungle set is released in English, Dutch, German, French, Italian, Spanish, and Portuguese in both 1st and unlimited edition. All the English…',
        'Jungle',
      ),
    ).toEqual({
      languages: ['EN', 'NL', 'DE', 'FR', 'IT', 'ES', 'PT'],
      firstEdition: ['EN', 'NL', 'DE', 'FR', 'IT', 'ES', 'PT'],
      reverse: [],
    });
    expect(
      parseLanguageSentence(
        'The Team Rocket set is released in English, German, French, and Italian, in both 1st and unlimited edition.',
        'Team Rocket',
      ).firstEdition,
    ).toEqual(['EN', 'DE', 'FR', 'IT']);
    expect(
      parseLanguageSentence(
        'The Golden Sky, Silvery Ocean set is only released in Japanese, in both 1st and unlimited edition. The EX Unseen Forces set is released in English, German, French, Italian, Spanish, and Portuguese with cards also available as Reverse Holofoils.',
        'EX Unseen Forces',
      ),
    ).toEqual({ languages: ['EN', 'DE', 'FR', 'IT', 'ES', 'PT'], firstEdition: [], reverse: ['EN', 'DE', 'FR', 'IT', 'ES', 'PT'] });
    expect(
      parseLanguageSentence(
        'The Majestic Dawn set is released in English, German, French, and Italian, which all also had Reverse Holos available.',
        'Majestic Dawn',
      ).reverse,
    ).toEqual(['EN', 'DE', 'FR', 'IT']);
    expect(parseLanguageSentence('Nothing about languages here.', 'Gym Challenge').languages).toEqual([]);
    // a whole page: a <br> and templates before the sentence, the 1st Edition as a template
    expect(
      parseLanguageSentence(
        '{{SetInfobox|cards=64<br>48}}\n==Trivia==\n* The Jungle set is released in English, Dutch and Spanish in both {{TCG|1st Edition}} and unlimited edition.',
        'Jungle',
      ).languages,
    ).toEqual(['EN', 'NL', 'ES']);
  });
});

describe('mazos con sello y de campeonato (mazos-y-campeonatos-de-la-familia)', () => {
  const list: BattleAcademyCard[] = [
    { year: 2020, deck: 'Charizard', deckNo: '26', name: 'Eevee', setKey: 'sm115', setName: 'Hidden Fates', number: '49' },
    { year: 2020, deck: 'Charizard', deckNo: '27', name: 'Flareon', setKey: 'smp', setName: 'SM Black Star Promos', number: 'SM186' },
    { year: 2020, deck: 'Charizard', deckNo: '36', name: 'Eevee', setKey: 'sm115', setName: 'Hidden Fates', number: '49' },
    { year: 2020, deck: 'Charizard', deckNo: '44', name: 'Flareon', setKey: 'smp', setName: 'SM Black Star Promos', number: 'SM186' },
    { year: 2020, deck: 'Mewtwo', deckNo: null, name: 'Espeon', setKey: 'sm8', setName: 'Lost Thunder', number: '89' },
    { year: 2020, deck: 'Mewtwo', deckNo: null, name: 'Eevee', setKey: 'sm115', setName: 'Hidden Fates', number: '49' },
    { year: 2022, deck: 'Eevee', deckNo: null, name: 'Eevee V', setKey: 'swshp', setName: 'SWSH Black Star Promos', number: 'SWSH065' },
  ];
  const pc = (setKey: string, number: string, ref: string, stamp: string, finish: Claim['finish'] = 'normal'): Claim => ({
    setKey,
    number,
    lang: 'EN',
    finish,
    stamp,
    source: 'pokecottage',
    ref,
    setName: 'Battle Academy 2020: Charizard Deck',
  });
  const keys = (cs: Claim[]) =>
    mergeClaims(cs)
      .map(
        p =>
          `${p.setKey}|${p.number}|${p.finish}|${p.stamp}|${p.facts
            .filter(f => f.field === 'exists')
            .map(f => f.source)
            .join('+')}`,
      )
      .sort();

  it('dos números del mismo mazo son dos impresiones de la carta original', () => {
    const r = battleAcademyClaims(
      [
        pc('pc:ba20c', '49', '133-ba20c-26-normal', 'charizarddeck'),
        pc('pc:ba20c', '49', '133-ba20c-36-normal', 'charizarddeck'),
        pc('pc:ba20m', '49', '133-ba20m-3-normal', 'mewtwodeck'),
        pc('pc:ba22e', '1', '133-ba22e-1-holo', 'eeveedeck'),
      ],
      list,
      'Eevee',
    );
    expect(keys([...r.claims, ...r.added])).toEqual([
      'sm115|49|normal|ba-charizard-26|pokecottage+bulbapedia-mazos',
      'sm115|49|normal|ba-charizard-36|pokecottage+bulbapedia-mazos',
      'sm115|49|normal|ba-mewtwo|pokecottage+bulbapedia-mazos',
      'swshp|SWSH065|holo|ba-eevee|pokecottage+bulbapedia-mazos',
    ]);
    expect(r.claims[0]!.label).toBe('Battle Academy 2020 · Mazo Charizard #26');
    expect(r.claims[0]!.setName).toBe('Hidden Fates');
  });

  it('la misma carta dicha como expansión del mazo y como promo con sello es una sola', () => {
    const r = battleAcademyClaims(
      [
        pc('pc:ba20c', '27', '136-ba20c-27-normal', 'charizarddeck'),
        pc('pc:ba20c', '44', '136-ba20c-44-normal', 'charizarddeck'),
        pc('smp', 'SM186', '136-smp-SM186-battleAcademyCharizard27', stampKey('battleAcademyCharizard27')!),
        pc('smp', 'SM186', '136-smp-SM186-battleAcademyCharizard44', stampKey('battleAcademyCharizard44')!),
      ],
      list,
      'Flareon',
    );
    expect(keys([...r.claims, ...r.added])).toEqual([
      'smp|SM186|normal|ba-charizard-27|pokecottage+bulbapedia-mazos',
      'smp|SM186|normal|ba-charizard-44|pokecottage+bulbapedia-mazos',
    ]);
  });

  it('una carta que solo trae Bulbapedia se agrega con su fuente; sin lista nada cambia', () => {
    const r = battleAcademyClaims([], list, 'Espeon');
    expect(keys(r.added)).toEqual(['sm8|89|normal|ba-mewtwo|bulbapedia-mazos']);
    const same = [pc('pc:ba20c', '27', '136-ba20c-27-normal', 'charizarddeck')];
    expect(battleAcademyClaims(same, [], 'Flareon').claims).toEqual(same);
    expect(variantLabel({ finish: 'normal', stamp: 'ba-charizard-12' })).toBe('Battle Academy · Mazo Charizard #12');
  });

  it('trainer-kit-sun-moon: la Eevee del kit de Alolan Ninetales es Ultra Prism #104 con el sello del mazo, en sus idiomas', () => {
    const langs = ['EN', 'DE', 'FR', 'IT', 'ES', 'PT'];
    const kit: BattleAcademyCard[] = [
      {
        year: 2018,
        kit: 'sm',
        deck: 'Alolan Ninetales',
        deckNo: '26',
        name: 'Eevee',
        setKey: 'sm5',
        setName: 'Ultra Prism',
        number: '104',
        finish: 'normal',
        langs,
      },
      {
        year: 2018,
        kit: 'sm',
        deck: 'Alolan Ninetales',
        deckNo: '17',
        name: 'Alolan Ninetales',
        setKey: 'smp',
        number: 'SM128',
        finish: 'normal',
        langs,
      },
      {
        year: 2018,
        kit: 'sm',
        deck: 'Alolan Ninetales',
        deckNo: '30',
        name: 'Alolan Ninetales',
        setKey: 'smp',
        number: 'SM128',
        finish: 'holo',
        langs,
      },
    ];
    const r = battleAcademyClaims(
      [
        { setKey: 'sm5', number: '104', lang: 'ES', finish: 'normal', stamp: null, source: 'tcgdex', setName: 'Ultraprisma' },
        {
          ...pc('pc:tk11a', '26', '133-tk11a-26-normal', 'alolanninetalesdeck'),
          setName: 'Sun & Moon Trainer Kit: Alolan Ninetales Half Deck',
        },
      ],
      [...list, ...kit],
      'Eevee',
    );
    const order = (l: string) => langs.indexOf(l);
    const all = mergeClaims([...r.claims, ...r.added])
      .filter(p => p.setKey === 'sm5' && p.stamp)
      .sort((x, y) => order(x.lang) - order(y.lang));
    expect(
      all.map(
        p =>
          `${p.lang}|${p.stamp}|${p.facts
            .filter(f => f.field === 'exists')
            .map(f => f.source)
            .join('+')}`,
      ),
    ).toEqual([
      'EN|tk-sm-alolan-ninetales-26|pokecottage+bulbapedia-mazos',
      ...langs.slice(1).map(l => `${l}|tk-sm-alolan-ninetales-26|bulbapedia-mazos`),
    ]);
    expect(r.claims.find(c => c.source === 'pokecottage')).toMatchObject({
      setKey: 'sm5',
      number: '104',
      label: 'Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26',
      setName: 'Ultra Prism',
    });
    expect(r.claims.some(c => c.setKey.startsWith('pc:'))).toBe(false);
    // in another language, the set's name as the other sources write it
    expect(r.added.find(c => c.lang === 'ES' && c.setKey === 'sm5')!.setName).toBe('Ultraprisma');
    const ninetales = battleAcademyClaims([], kit, 'Alolan Ninetales').added.filter(c => c.lang === 'EN');
    expect(ninetales.map(c => `${c.number}|${c.finish}|${c.stamp}`)).toEqual([
      'SM128|normal|tk-sm-alolan-ninetales-17',
      'SM128|holo|tk-sm-alolan-ninetales-30',
    ]);
    expect(variantLabel({ finish: 'normal', stamp: 'tk-sm-alolan-ninetales-26' })).toBe(
      'Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26',
    );
  });

  it('el mazo de Ballard escrito sin guiones es el mismo y cuenta como campeonato', () => {
    const ballard = stampKey('worldchampionshipsdeck2006eeveelutionsbyjimmyballard');
    expect(ballard).toBe(stampKey('worldChampionshipsDeck2006JimmyBallard'));
    const r = applyRules(
      [
        { key: 'a', lang: 'EN', stamp: ballard, equivId: null },
        { key: 'b', lang: 'EN', stamp: 'worldchampionshipsdeck2099someone', equivId: null },
      ],
      { ...FULL_RULES, wcd: false },
    );
    expect(r.get('a')).toEqual({ in: false, by: 'wcd' });
    expect(r.get('b')).toEqual({ in: false, by: 'wcd' });
  });
});

describe('burger-king-2009: la promo de Burger King de 2009', () => {
  it('Eevee #62 de Majestic Dawn: una sola impresión Reverse con las tres fuentes y su nombre', () => {
    const td = variantFromTcgdex({ type: 'reverse', stamp: ['platinum'] })!;
    const pc = variantFromPokecottage('burgerKing09', 'Burger King (Reverse Holo)');
    const m = mergeClaims([
      claim('dp5', '62', 'EN', 'normal', 'tcgdex'),
      claim('dp5', '62', 'EN', 'reverse', 'tcgdex'),
      claim('dp5', '62', 'EN', td.finish, 'tcgdex', td.stamp),
      claim('dp5', '62', 'EN', 'reverse', 'bulbapedia-adicionales', stampKey('Platinum')),
      { ...claim('dp5', '62', 'EN', pc.finish, 'pokecottage', pc.stamp), finishUnknown: true },
    ]);
    const bk = m.filter(p => p.stamp);
    expect(
      bk.map(
        p =>
          `${p.finish}|${p.stamp}|${p.facts
            .filter(f => f.field === 'exists')
            .map(f => f.source)
            .join('+')}`,
      ),
    ).toEqual(['reverse|burger-king-2009|tcgdex+bulbapedia-adicionales+pokecottage']);
    expect(variantLabel({ finish: bk[0]!.finish, stamp: bk[0]!.stamp })).toBe('Reverse · Burger King 2009 (sello Platinum)');
    expect(stampKey('burgerKing')).toBe('burger-king-2009');
    // the inventory's name goes and comes back
    expect(variantFromInventory(inventoryVariant('reverse', 'burger-king-2009'))).toEqual({ finish: 'reverse', stamp: 'burger-king-2009' });
  });
});

describe('sellos-y-cruce-de-expansiones', () => {
  const pcStamp = (setKey: string, number: string, stamp: string): Claim => ({
    ...claim(setKey, number, 'EN', 'normal', 'pokecottage', stamp),
    finishUnknown: true,
  });
  const shape = (m: ReturnType<typeof mergeClaims>) => m.map(p => `${p.finish}|${p.stamp}`).sort();
  it('Prismatic Evolutions #75: el sello de PokeCottage toma el acabado holo de TCGdex', () => {
    const m = mergeClaims([
      claim('sv8pt5', '75', 'EN', 'holo', 'tcgplayer'),
      claim('sv8pt5', '75', 'EN', 'holo', 'tcgdex'),
      claim('sv8pt5', '75', 'EN', 'holo', 'tcgdex', 'set-logo'),
      claim('sv8pt5', '75', 'EN', 'holo', 'pokecottage'),
      pcStamp('sv8pt5', '75', 'set-logo'),
    ]);
    expect(shape(m)).toEqual(['holo|null', 'holo|set-logo']);
    expect(
      m
        .find(p => p.stamp)!
        .facts.filter(f => f.field === 'exists')
        .map(f => f.source),
    ).toEqual(['tcgdex', 'pokecottage']);
  });
  it('TCGdex con dos acabados para el sello: PokeCottage no toma ninguno', () => {
    const m = mergeClaims([
      claim('sv3', '86', 'EN', 'holo', 'tcgdex', 'set-logo'),
      claim('sv3', '86', 'EN', 'reverse', 'tcgdex', 'set-logo'),
      pcStamp('sv3', '86', 'set-logo'),
    ]);
    expect(shape(m)).toEqual(['holo|set-logo', 'normal|set-logo', 'reverse|set-logo']);
  });
  it('un sello sin TCGdex sigue normal', () =>
    expect(shape(mergeClaims([pcStamp('sv3', '130', 'gamestop')]))).toEqual(['normal|gamestop']));
  it('un sello con su año: trick-or-trade de TCGdex es trick-or-trade24 de PokeCottage', () => {
    const m = mergeClaims([claim('sv3', '130', 'EN', 'normal', 'tcgdex', 'trick-or-trade'), pcStamp('sv3', '130', 'trick-or-trade24')]);
    expect(shape(m)).toEqual(['normal|trick-or-trade24']);
  });
  it('Espeon #86 y Umbreon #130 de Obsidian Flames quedan como dice Bulbapedia', () => {
    const notes = new Map([
      [
        'sv3',
        [
          { number: '86', stamp: 'set-logo', finish: 'reverse' as const },
          { number: '130', stamp: 'game-stop', finish: 'reverse' as const },
        ],
      ],
    ]);
    const r = additionalCardClaims(
      [
        claim('sv3', '86', 'EN', 'reverse', 'tcgdex'),
        claim('sv3', '86', 'EN', 'holo', 'tcgdex', 'set-logo'),
        claim('sv3', '86', 'EN', 'reverse', 'tcgdex', 'set-logo'),
        pcStamp('sv3', '86', 'set-logo'),
        claim('sv3', '130', 'EN', 'normal', 'tcgdex', 'gamestop'),
        pcStamp('sv3', '130', 'gamestop'),
        claim('sv3', '130', 'FR', 'normal', 'tcgdex', 'gamestop'),
      ],
      notes,
    );
    const m = mergeClaims([...r.claims, ...r.added]);
    expect(shape(m.filter(p => p.lang === 'EN'))).toEqual(['reverse|gamestop', 'reverse|null', 'reverse|set-logo']);
    expect(
      m
        .find(p => p.number === '86' && p.stamp)!
        .facts.filter(f => f.field === 'exists')
        .map(f => f.source),
    ).toEqual(['tcgdex', 'pokecottage', 'bulbapedia-adicionales']);
    expect(m.find(p => p.lang === 'FR')!.finish).toBe('normal');
  });
  it('parseAdditionalCards: las cartas adicionales de Obsidian Flames y Prismatic Evolutions', () => {
    const of = [
      '{{Setlist/nmentry|086/197|{{TCG ID|Obsidian Flames|Espeon|86}}|Psychic|||Reverse Holo "Obsidian Flames" stamp Best Buy gift with purchase exclusive (USA)}}',
      '{{Setlist/nmentry|130/197|{{TCG ID|Obsidian Flames|Umbreon|130}}|Darkness|||Reverse Holo "GameStop" stamp gift with purchase exclusive (USA & Canada)}}',
      "{{Setlist/nmentry|130/197|{{TCG ID|Obsidian Flames|Umbreon|130}}|Darkness|||Pikachu jack-o'-lantern stamp {{TCGMerch|Scarlet & Violet|Series|Trick or Trade BOOster Bundle 2024}} exclusive}}",
    ].join('\n');
    expect(parseAdditionalCards(of, 'Obsidian Flames')).toEqual([
      { number: '86', stamp: 'set-logo', finish: 'reverse' },
      { number: '130', stamp: 'game-stop', finish: 'reverse' },
    ]);
    const pre =
      '{{Setlist/nmentry|075/131|{{TCG ID|Prismatic Evolutions|Eevee ex|75|Eevee}}{{Tera ex}}|Colorless|||{{TCGMerch|Scarlet & Violet|Series|Prismatic Evolutions Surprise Box}} exclusive with "Prismatic Evolutions" stamp}}\n' +
      '{{Setlist/nmentry|026/131|{{TCG ID|Prismatic Evolutions|Glaceon ex|26|Glaceon}}{{Tera ex}}|Water|6=Snowflake Stamp {{TCGMerch|Scarlet & Violet|Series|Holiday Calendar 2025}} exclusive}}';
    expect(parseAdditionalCards(pre, 'Prismatic Evolutions')).toEqual([{ number: '75', stamp: 'set-logo', finish: null }]);
  });
});

describe('fotos-de-japonesas-con-poke-ball', () => {
  const td = { field: 'image' as const, source: 'tcgdex', value: 'https://assets.tcgdex.net/ja/SV/SV8a/125/high.webp', ref: null };
  const pc = { field: 'image' as const, source: 'pokecottage-fotos', value: '/img-local/pc.webp', ref: null };
  const ex = { field: 'exists' as const, source: 'tcgdex', value: 'true', ref: null };
  const p = (finish: ArmaFinish, facts: Fact[], lang = 'JA', number = '125') => ({
    setKey: 'ja-SV8a',
    number,
    lang,
    finish,
    stamp: null,
    facts,
  });
  it('la foto de TCGdex pasa a la Poké Ball', () => {
    const out = mirrorPhotos([p('normal', [ex, td]), p('reverse', [td]), p('masterball', [td]), p('pokeball', [pc])]);
    expect(out.map(x => [x.finish, x.facts.filter(f => f.field === 'image').map(f => f.source)])).toEqual([
      ['normal', []],
      ['reverse', []],
      ['masterball', []],
      ['pokeball', ['pokecottage-fotos', 'tcgdex']],
    ]);
    expect(out[0]!.facts).toEqual([ex]);
  });
  it('una carta sin Poké Ball queda igual', () => {
    const xs = [p('normal', [td], 'JA', '126'), p('pokeball', [pc])];
    expect(mirrorPhotos(xs)[0]).toBe(xs[0]);
  });
  it('solo en japonés', () => {
    const xs = [p('normal', [td], 'ZH-TW'), p('pokeball', [pc])];
    expect(mirrorPhotos(xs)[0]).toBe(xs[0]);
  });
  it('la foto de Limitless es la de la impresión simple', () => {
    expect(plainPhotoFits({ finish: 'normal', stamp: null })).toBe(true);
    expect(plainPhotoFits({ finish: 'holo', stamp: null })).toBe(true);
    expect(plainPhotoFits({ finish: 'pokeball', stamp: null })).toBe(false);
    expect(plainPhotoFits({ finish: 'masterball', stamp: null })).toBe(false);
    expect(plainPhotoFits({ finish: 'reverse', stamp: null })).toBe(false);
    expect(plainPhotoFits({ finish: 'normal', stamp: 'set-logo' })).toBe(false);
  });
});
