import { describe, expect, it } from 'vitest';
import catalog from './fixtures/catalog.json' with { type: 'json' };
// @ts-expect-error frozen JS copy, no types
import { makeLegacy } from './legacy/legacy.js';
import { autoVariant, condCode, langCode, normNumber, parseEntry } from '../src/index.js';

const legacy = makeLegacy({ setById: {}, meta: () => null, priceOf: () => null, keyOf: () => '' });

describe('carga-de-cartas: sintaxis de entrada (escenarios)', () => {
  it('25 → una copia, variante automática', () =>
    expect(parseEntry('25')).toEqual({ sign: 1, qty: 1, base: '25', full: '25', v: null, cond: null, range: null }));
  it('25r lp*2 → 2 reverse LP', () => expect(parseEntry('25r lp*2')).toMatchObject({ qty: 2, base: '25', v: 'reverse', cond: 'LP' }));
  it('25 lp*2 → el estado antes de la cantidad', () =>
    expect(parseEntry('25 lp*2')).toMatchObject({ qty: 2, base: '25', v: null, cond: 'LP' }));
  it('25*4 y 25x4 → cuatro copias', () => {
    expect(parseEntry('25*4')?.qty).toBe(4);
    expect(parseEntry('25x4')?.qty).toBe(4);
  });
  it('-25 → quitar', () => expect(parseEntry('-25')).toMatchObject({ sign: -1, qty: 1, base: '25' }));
  it('sufijos de variante', () => {
    expect(parseEntry('25h')?.v).toBe('holo');
    expect(parseEntry('25e')?.v).toBe('firstedition');
    expect(parseEntry('25p')?.v).toBe('pokeballholo');
    expect(parseEntry('25m')?.v).toBe('masterballholo');
  });
  it('número con letra: guarda el texto completo para buscarlo tal cual (SV107, 25a)', () => {
    expect(parseEntry('SV107')).toMatchObject({ full: 'SV107', base: 'SV107', v: null });
    expect(parseEntry('25a')).toMatchObject({ full: '25a', base: '25a', v: null });
  });
  it('vacío → null', () => expect(parseEntry('   ')).toBeNull());
  it('variante automática', () => {
    expect(autoVariant('Common')).toBe('normal');
    expect(autoVariant('Promo')).toBe('normal');
    expect(autoVariant('Rare Holo')).toBe('holo');
    expect(autoVariant('')).toBe('normal');
    expect(autoVariant(undefined)).toBe('normal');
  });
  it('idioma y estado', () => {
    expect(langCode('jp')).toBe('JA');
    expect(langCode('sp')).toBe('ES');
    expect(langCode('xx')).toBeNull();
    expect(condCode('d')).toBe('DMG');
    expect(condCode('mint')).toBe('NM');
    expect(condCode('lp')).toBe('LP');
    expect(condCode('zz')).toBeNull();
  });
  it('número normalizado', () => {
    expect(normNumber('025')).toBe('25');
    expect(normNumber('tg05')).toBe('TG5');
  });
});

describe('equivalencia con el código anterior', () => {
  const nums = ['1', '25', '025', '199', 'SV107', 'TG05', '25a', 'SWSH050', 'GG35', '5', 'xy', 'h', 'r'];
  const sufs = ['', 'n', 'h', 'r', 'e', 'p', 'm', 'a', 'x'];
  const qtys = ['', '*2', 'x3', ' * 4', 'X10'];
  const conds = ['', ' lp', ' NM', ' dmg', ' hp'];
  const inputs: string[] = [];
  for (const n of nums)
    for (const s of sufs)
      for (const q of qtys)
        for (const c of conds) {
          inputs.push(n + s + q + c, '-' + n + s + q + c, n + s + c + q, ' ' + n + s + ' ' + q + c + ' ');
        }
  it(`parseEntry en ${inputs.length} entradas generadas`, () => {
    // the old parser had no ranges: everything else must be the same
    const diffs = inputs.filter(i => {
      const e = parseEntry(i);
      if (e && e.range) return true;
      const old = e && { sign: e.sign, qty: e.qty, base: e.base, full: e.full, v: e.v, cond: e.cond };
      return JSON.stringify(old) !== JSON.stringify(legacy.parseEntry(i));
    });
    expect(diffs).toEqual([]);
  });
  it('autoVariant con todas las rarezas del catálogo', () => {
    const rarities = [...new Set((catalog.cards as [string, string | null][]).map(c => c[1] || ''))];
    const diffs = rarities.filter(r => autoVariant(r) !== legacy.autoVariant(['', [], '', r]));
    expect(diffs).toEqual([]);
  });
  it('langCode, condCode y número normalizado', () => {
    const xs = [
      'es',
      'EN',
      'jp',
      'sp',
      'ja',
      'zh',
      'kr',
      '',
      ' pt ',
      'nm',
      'lp',
      'd',
      'dm',
      'damaged',
      'm',
      'mint',
      'MP',
      'hp',
      'DMG',
      'x',
    ];
    expect(xs.filter(x => langCode(x) !== legacy.langCode(x) || condCode(x) !== legacy.condCode(x))).toEqual([]);
    const ns = ['025', '0', '00', 'tg05', 'TG005', ' 7 ', 'SV107', 'swsh050', '25a', '0a'];
    expect(ns.filter(n => normNumber(n) !== legacy.norm(n))).toEqual([]);
  });
});

describe('carga-por-rangos: rangos de números (escenarios)', () => {
  it('1-30 → del 1 al 30', () =>
    expect(parseEntry('1-30')).toMatchObject({ sign: 1, qty: 1, v: null, cond: null, range: { from: 1, to: 30 } }));
  it('1-10r → reverse', () => expect(parseEntry('1-10r')).toMatchObject({ v: 'reverse', range: { from: 1, to: 10 } }));
  it('1-30*2 → dos copias de cada una', () => expect(parseEntry('1-30*2')).toMatchObject({ qty: 2, range: { from: 1, to: 30 } }));
  it('1-30 lp → todas en LP', () => expect(parseEntry('1-30 lp')).toMatchObject({ cond: 'LP', range: { from: 1, to: 30 } }));
  it('1-30r lp*2 → todo junto', () =>
    expect(parseEntry('1-30r lp*2')).toMatchObject({ qty: 2, v: 'reverse', cond: 'LP', range: { from: 1, to: 30 } }));
  it('-1-30 → quita una de cada una', () => expect(parseEntry('-1-30')).toMatchObject({ sign: -1, range: { from: 1, to: 30 } }));
  it('30-1 → igual que 1-30', () => expect(parseEntry('30-1')?.range).toEqual({ from: 1, to: 30 }));
  it('con espacios: 1 - 30', () => expect(parseEntry('1 - 30')?.range).toEqual({ from: 1, to: 30 }));
  it('guarda el texto completo por si el número con guion existe en la expansión', () => expect(parseEntry('1-30')?.full).toBe('1-30'));
  it('no son rangos: 25, -25, TG1-TG5, 1-30a', () => {
    expect(parseEntry('25')?.range).toBeNull();
    expect(parseEntry('-25')?.range).toBeNull();
    expect(parseEntry('TG1-TG5')?.range).toBeNull();
    expect(parseEntry('1-30a')?.range).toBeNull();
  });
});
