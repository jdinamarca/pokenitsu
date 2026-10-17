import { describe, expect, it } from 'vitest';
import {
  addToCopies,
  expandRange,
  indexNumbers,
  moveSplit,
  removalLocation,
  resolveEntry,
  searchSets,
  searchSetsLang,
  undoCopies,
} from '../src/index.js';

describe('cuenta de copias', () => {
  it('sumar copias para vender', () => expect(addToCopies({ qty: 2, personal: 1 }, 3, false)).toEqual({ qty: 5, personal: 1, real: 3 }));
  it('sumar copias personales', () => expect(addToCopies({ qty: 2, personal: 1 }, 2, true)).toEqual({ qty: 4, personal: 3, real: 2 }));
  it('quitar saca primero las de venta', () =>
    expect(addToCopies({ qty: 3, personal: 2 }, -1, false)).toEqual({ qty: 2, personal: 2, real: -1 }));
  it('quitar más de las que hay deja 0', () =>
    expect(addToCopies({ qty: 1, personal: 1 }, -5, false)).toEqual({ qty: 0, personal: 0, real: -1 }));
  it('quitar sin copias no cambia nada', () => expect(addToCopies({ qty: 0, personal: 0 }, -1, false).real).toBe(0));
  it('deshacer una carga personal', () => expect(undoCopies({ qty: 4, personal: 3 }, 2, 2)).toEqual({ qty: 2, personal: 1 }));
  it('deshacer una quita devuelve la copia', () => expect(undoCopies({ qty: 1, personal: 0 }, -1, 0)).toEqual({ qty: 2, personal: 0 }));
  it('mover 2 de 3: las de venta primero', () => expect(moveSplit({ qty: 3, personal: 2 }, 2)).toEqual({ moved: 2, personal: 1 }));
  it('mover todas', () => expect(moveSplit({ qty: 3, personal: 2 })).toEqual({ moved: 3, personal: 2 }));
});

describe('carga-en-la-vitrina: entrada en una expansión', () => {
  const idx = indexNumbers(['1', '2', '3', '25', '25a', 'SV107', '133']);
  it('número con variante automática', () => expect(resolveEntry('25', idx)).toMatchObject({ kind: 'card', num: '25' }));
  it('con ceros a la izquierda', () =>
    expect(resolveEntry('025r', idx)).toMatchObject({ kind: 'card', num: '25', entry: { v: 'reverse' } }));
  it('el número con letra que existe gana al sufijo', () => {
    expect(resolveEntry('SV107', idx)).toMatchObject({ kind: 'card', num: 'SV107' });
    expect(resolveEntry('25a', idx)).toMatchObject({ kind: 'card', num: '25a', entry: { v: null } });
  });
  it('idioma y estado solos', () => {
    expect(resolveEntry('es', idx)).toEqual({ kind: 'lang', lang: 'ES' });
    expect(resolveEntry('lp', idx)).toEqual({ kind: 'cond', cond: 'LP' });
  });
  it('carta que no existe', () => expect(resolveEntry('999', idx).kind).toBe('missing'));
  it('rango', () =>
    expect(resolveEntry('1-30r', idx)).toMatchObject({ kind: 'range', entry: { v: 'reverse', range: { from: 1, to: 30 } } }));
  it('texto sin números', () => expect(resolveEntry('eevee', idx).kind).toBe('bad'));
  it('vacío', () => expect(resolveEntry('  ', idx).kind).toBe('empty'));
});

describe('rangos', () => {
  it('se salta los que no existen', () =>
    expect(expandRange(indexNumbers(['1', '2', '4']), { from: 1, to: 4 })).toEqual({
      nums: ['1', '2', '4'],
      skipped: [3],
      confirm: false,
    }));
  it('más de 50 pide confirmar', () => {
    const idx = indexNumbers(Array.from({ length: 60 }, (_, i) => String(i + 1)));
    expect(expandRange(idx, { from: 1, to: 51 }).confirm).toBe(true);
    expect(expandRange(idx, { from: 1, to: 50 }).confirm).toBe(false);
  });
});

describe('de dónde sale "-25"', () => {
  it('la ubicación fija si tiene copias', () =>
    expect(removalLocation({ 1: { qty: 1, personal: 0 }, 2: { qty: 3, personal: 0 } }, 1)).toBe(1));
  it('si no, la que tiene más copias para vender', () =>
    expect(removalLocation({ 1: { qty: 3, personal: 3 }, 2: { qty: 1, personal: 0 } }, null)).toBe(2));
  it('sin copias: ninguna', () => expect(removalLocation({}, null)).toBe(0));
});

describe('carga-en-la-vitrina: elegir la expansión', () => {
  const sets = [
    { id: 'sv3pt5', code: 'MEW', name: '151', series: 'Scarlet & Violet', source: 'pokemontcg' },
    { id: 'sv1', code: 'SVI', name: 'Scarlet & Violet', series: 'Scarlet & Violet', source: 'pokemontcg' },
    { id: 'base2', code: '', name: 'Jungle', series: 'Base', source: 'pokemontcg' },
    { id: 'ja-SV2a', code: 'SV2a', name: 'Pokémon Card 151', name_ja: 'ポケモンカード151', series: null, source: 'tcgdex-ja' },
  ];
  it('código exacto primero', () => expect(searchSets(sets, 'mew')[0]!.id).toBe('sv3pt5'));
  it('nombre que empieza antes que el que lo contiene', () =>
    expect(searchSets(sets, '151').map(s => s.id)).toEqual(['sv3pt5', 'ja-SV2a']));
  it('por serie, también la deducida del código', () =>
    expect(searchSets(sets, 'scarlet').map(s => s.id)).toEqual(['sv1', 'sv3pt5', 'ja-SV2a']));
  it('nombre japonés', () => expect(searchSets(sets, 'ポケモン')[0]!.id).toBe('ja-SV2a'));
  it('vacío no busca', () => expect(searchSets(sets, '  ')).toEqual([]));
  it('sufijo de idioma', () => expect(searchSetsLang(sets, 'MEW ES')).toMatchObject({ lang: 'ES', sets: [{ id: 'sv3pt5' }] }));
  it('sin sufijo', () => expect(searchSetsLang(sets, 'jungle')).toMatchObject({ lang: null, sets: [{ id: 'base2' }] }));
});
