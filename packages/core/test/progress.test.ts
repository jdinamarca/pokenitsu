import { describe, expect, it } from 'vitest';
import fixture from './fixtures/numbers.json' with { type: 'json' };
import { guessVariants, isPrintedNumber, masterProgress, setProgress, standardVariants } from '../src/index.js';

const s151 = { printed: 165, total: 207 };
const nums = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

describe('progreso-de-expansiones (escenarios)', () => {
  it('151 en modo Base: 1 a 88 más la 199 → 88/165', () =>
    expect(setProgress(s151, [...nums(1, 88), '199']).base).toEqual({ have: 88, total: 165 }));
  it('151 con secretas → 89/207', () => expect(setProgress(s151, [...nums(1, 88), '199']).secrets).toEqual({ have: 89, total: 207 }));
  it('completar en modo Base aunque falten secretas', () => {
    const p = setProgress(s151, nums(1, 165));
    expect(p.base.have).toBe(p.base.total);
    expect(p.secrets.have).toBeLessThan(p.secrets.total);
  });
  it('carta con normal y reverse, solo tengo la normal → 1 de 2', () =>
    expect(masterProgress([{ number: '25', variants: ['normal', 'reverse'] }], ['25|normal'])).toEqual({ have: 1, total: 2, unknown: 0 }));
  it('variantes aún sin descargar no inventan un total', () =>
    expect(
      masterProgress(
        [
          { number: '1', variants: ['normal'] },
          { number: '2', variants: null },
        ],
        ['1|normal'],
      ),
    ).toEqual({ have: 1, total: 1, unknown: 1 }));
  it('promos: Base y Con secretas son iguales', () => {
    const p = setProgress({ printed: null, total: 200, promo: true }, ['SVP001', 'SVP002']);
    expect(p.base).toEqual(p.secrets);
  });
  it('números con ceros a la izquierda cuentan como impresos', () => expect(isPrintedNumber('025', 165)).toBe(true));
  it('no son impresos: sobre el total, con prefijo o con letra', () => {
    for (const n of ['199', 'TG05', '25a', 'SV107', '0', 'B']) expect(isPrintedNumber(n, 165)).toBe(false);
  });
  it('variantes del catálogo → variantes del inventario', () => {
    expect(standardVariants(['reverse', 'normal', 'wPromo'])).toEqual(['normal', 'reverse']);
    expect(standardVariants(['firstEdition', 'holo'])).toEqual(['holo', 'firstedition']);
  });
  it('variantes deducidas por rareza', () => {
    expect(guessVariants('Common')).toEqual(['normal', 'reverse']);
    expect(guessVariants('Rare Holo')).toEqual(['holo', 'reverse']);
    expect(guessVariants('Special Illustration Rare')).toEqual(['holo']);
  });
});

// printed numbers the catalog (pokemontcg.io) does not have: Base cannot reach 100% there
const CATALOG_GAPS: Record<string, string> = { zsv10pt5: 'Black Bolt: falta la #80' };

describe('subcolecciones y reimpresiones', () => {
  it('Trainer Gallery (TG01…TG30, 30 impresas): todas cuentan en Base', () =>
    expect(setProgress({ printed: 30, total: 30 }, ['TG01', 'TG05']).base).toEqual({ have: 2, total: 30 }));
  it('Classic Collection (números de la expansión original): todas cuentan en Base', () =>
    expect(setProgress({ printed: 25, total: 22 }, ['107', '4']).base).toEqual({ have: 2, total: 22 }));
});

describe('todos los números del catálogo', () => {
  const sets = Object.entries(
    fixture.sets as Record<
      string,
      { name: string; source: string; printed: number | null; total: number | null; numbers: string[] | null }
    >,
  );
  it(`${sets.length} expansiones: cada número se clasifica y, con todo, el avance llega a 100%`, () => {
    const problems: unknown[] = [];
    for (const [id, s] of sets) {
      const numbers = s.numbers || [];
      const promo = /promo/i.test(s.name);
      const printedCount = numbers.filter(n => isPrintedNumber(n, s.printed)).length;
      if (s.printed && !promo && printedCount > s.printed)
        problems.push([id, 'más impresas que el total impreso', printedCount, s.printed]);
      const p = setProgress({ printed: s.printed, total: numbers.length, promo }, numbers);
      if (p.secrets.have !== p.secrets.total) problems.push([id, 'secretas incompletas']);
      // every printed number of an international expansion exists in the catalog (Base reaches 100%)
      if (s.source === 'ptcg' && !promo && s.printed && p.base.have !== p.base.total && !CATALOG_GAPS[id])
        problems.push([id, 'base', p.base]);
    }
    expect(problems).toEqual([]);
  });
});
