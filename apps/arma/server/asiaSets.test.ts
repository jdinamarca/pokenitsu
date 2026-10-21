import { describe, expect, it, vi } from 'vitest';

// no database
vi.mock('./db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const { cardsFromFull, codeOfKey, crossCode, groupAsiaSets } = await import('./asiaSets.ts');
const { copyLangs } = await import('./session.ts');

const p = (set_key: string, number: string, lang: 'ZH-CN' | 'ZH-TW' = 'ZH-CN', extra = {}) => ({
  set_key,
  set_name: 'Gem Pack Vol. 4',
  lang,
  number,
  name: 'Eevee',
  dex: 133,
  artist: null,
  release: '2026-02-02',
  ...extra,
});
const TD = { 'ZH-CN': ['CBB2C', 'CBB4C', 'CSMPiC', 'SV9', 'csm1a', 'CSM1aC'], 'ZH-TW': ['SCC', 'SC1b'] };

describe('expansiones-chinas-en-cargar: las expansiones chinas del Full', () => {
  it('el código en la clave del Full', () => {
    expect(codeOfKey('pc:scn_cbb4')).toBe('cbb4');
    expect(codeOfKey('td-zh-tw:SCC')).toBe('SCC');
    expect(codeOfKey('ja-S10D')).toBeNull();
  });
  it('PokeCottage cbb4 es CBB4C de TCGdex', () => expect(crossCode('cbb4', TD['ZH-CN'])).toBe('CBB4C'));
  it('con los dos, el del código impreso', () => expect(crossCode('csm1a', TD['ZH-CN'])).toBe('CSM1aC'));
  it('el mismo código', () => expect(crossCode('SCC', TD['ZH-TW'])).toBe('SCC'));
  it('una que TCGdex no tiene', () => expect(crossCode('csv95', TD['ZH-CN'])).toBeNull());
  it('Gem Pack Vol. 4 es zh-cn-CBB4C', () => {
    const [s] = groupAsiaSets([p('pc:scn_cbb4', '401'), p('pc:scn_cbb4', '402')], TD);
    expect(s).toMatchObject({ id: 'zh-cn-CBB4C', lang: 'ZH-CN', code: 'CBB4C', td: 'CBB4C', keys: ['pc:scn_cbb4'] });
  });
  it('la misma expansión en PokeCottage y TCGdex es una sola', () => {
    const sets = groupAsiaSets([p('pc:scn_csmPi', '1'), p('td-zh-cn:CSMPiC', '2')], TD);
    expect(sets.map(s => [s.id, s.keys])).toEqual([['zh-cn-CSMPiC', ['pc:scn_csmPi', 'td-zh-cn:CSMPiC']]]);
  });
  it('sin TCGdex: el código de PokeCottage en mayúsculas', () =>
    expect(groupAsiaSets([p('pc:scn_csv95', '10')], TD)[0]!.id).toBe('zh-cn-CSV95'));
  it('chino tradicional', () => expect(groupAsiaSets([p('td-zh-tw:SCC', '12', 'ZH-TW')], TD)[0]!.id).toBe('zh-tw-SCC'));
  it('una carta por número, con el ilustrador de alguna impresión', () => {
    const [s] = groupAsiaSets(
      [p('pc:scn_cbb4', '401'), p('pc:scn_cbb4', '0401', 'ZH-CN', { artist: 'Naoyo Kimura' }), p('pc:scn_cbb4', '402')],
      TD,
    );
    expect(cardsFromFull(s!)).toEqual([
      { id: 'zh-cn-CBB4C-401', number: '401', number_norm: '401', name: 'Eevee', dex: [133], artist: 'Naoyo Kimura' },
      { id: 'zh-cn-CBB4C-402', number: '402', number_norm: '402', name: 'Eevee', dex: [133], artist: null },
    ]);
  });
});

describe('expansiones-chinas-en-cargar: el idioma de una copia', () => {
  it('ZH de una expansión china: su idioma primero', () => expect(copyLangs('zh-cn-CBB4C-401', 'ZH')).toEqual(['ZH-CN', 'ZH-TW']));
  it('ZH de una japonesa: tradicional y después simplificado', () => expect(copyLangs('ja-S10D-052', 'ZH')).toEqual(['ZH-TW', 'ZH-CN']));
  it('sin idioma en una china: la suya', () => expect(copyLangs('zh-tw-SCC-12', '')[0]).toBe('ZH-TW'));
  it('lo de siempre', () => {
    expect(copyLangs('ja-S10D-052', '')).toEqual(['JA']);
    expect(copyLangs('sv8pt5-74', '')).toEqual(['EN']);
    expect(copyLangs('sv8pt5-74', 'ES')).toEqual(['ES']);
  });
});
