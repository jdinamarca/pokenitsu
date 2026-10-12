import { describe, expect, it } from 'vitest';
// @ts-expect-error frozen JS copy, no types
import { makeLegacy } from './legacy/legacy.js';
// @ts-expect-error frozen JS copy, no types
import { pick as legacyPick } from './legacy/legacy-pricing.js';
import { parseUsd, pickPrice, usdToClp, type CardPrices, type PriceConfig } from '../src/index.js';

const legacy = makeLegacy({ setById: {}, meta: () => null, priceOf: () => null, keyOf: () => '' });
const fx = { usd: 979.01, eur: 1096.77 };
const cfg: PriceConfig = { source: 'tcgplayer', cond: { NM: 1, LP: 0.85, MP: 0.7, HP: 0.5, DMG: 0.3 } };

describe('precios (escenarios)', () => {
  it('promo de una sola impresión: el precio es exacto para cualquier variante salvo reverse', () => {
    const p = { usd: { holofoil: 12 } };
    expect(pickPrice(p, 'normal', 'NM', cfg, fx)).toMatchObject({ approx: false, nm: Math.round(12 * fx.usd), src: 'TCGplayer' });
    expect(pickPrice(p, 'reverse', 'NM', cfg, fx)?.approx).toBe(true);
  });
  it('copia LP vale el 85% de NM', () => {
    const r = pickPrice({ usd: { normal: 10000 / fx.usd } }, 'normal', 'LP', cfg, fx);
    expect(r?.nm).toBe(10000);
    expect(r?.clp).toBe(8500);
  });
  it('un precio exacto de cualquier fuente gana a uno aproximado', () => {
    // TCGplayer only has the base card (approx for reverse), Cardmarket has the reverse: Cardmarket wins
    const r = pickPrice({ usd: { normal: 1 }, eur: { reverse: 3, trend: 1 } }, 'reverse', 'NM', cfg, fx);
    expect(r).toMatchObject({ src: 'Cardmarket', approx: false, nm: Math.round(3 * fx.eur) });
  });
  it('la fuente preferida va primero', () => {
    const p = { usd: { normal: 1 }, eur: { trend: 2 } };
    expect(pickPrice(p, 'normal', 'NM', cfg, fx)?.src).toBe('TCGplayer');
    expect(pickPrice(p, 'normal', 'NM', { ...cfg, source: 'cardmarket' }, fx)?.src).toBe('Cardmarket');
  });
  it('precio propio: gana al mercado y se descuenta por estado', () => {
    expect(pickPrice({ usd: { normal: 1 } }, 'normal', 'LP', cfg, fx, 342644)).toEqual({
      clp: Math.round(342644 * 0.85),
      nm: 342644,
      src: 'propio',
      approx: false,
    });
  });
  it('sin tipo de cambio ni precio propio no hay precio', () =>
    expect(pickPrice({ usd: { normal: 1 } }, 'normal', 'NM', cfg, null)).toBeNull());
  it('349,99 USD al dólar de 979,01 son $342.644', () => {
    expect(parseUsd('349,99')).toBe(349.99);
    expect(usdToClp(349.99, fx)).toBe(342644);
  });
  it('lectura de dólares', () => {
    expect(parseUsd('349.99')).toBe(349.99);
    expect(parseUsd('1.234,56')).toBe(1234.56);
    expect(parseUsd('1,234.56')).toBe(1234.56);
    expect(parseUsd('US$ 12,5')).toBe(12.5);
    expect(parseUsd('1.000')).toBe(1000);
    expect(parseUsd('')).toBeNull();
  });
});

describe('equivalencia con el código anterior', () => {
  const usdKeys = ['normal', 'holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'unlimited', 'unlimitedHolofoil', '1stEdition'];
  const eurKeys = ['trend', 'avg30', 'reverse', 'holo'];
  const subsets = <T>(xs: T[], max: number): T[][] => {
    const out: T[][] = [[]];
    for (const x of xs) for (const s of [...out]) if (s.length < max) out.push([...s, x]);
    return out;
  };
  const priceObjs: (CardPrices | null)[] = [null, {}];
  for (const us of subsets(usdKeys, 3))
    for (const es of subsets(eurKeys, 2)) {
      const p: CardPrices = {};
      if (us.length) p.usd = Object.fromEntries(us.map((k, i) => [k, 1.5 + i * 2.25]));
      if (es.length) p.eur = Object.fromEntries(es.map((k, i) => [k, 0.75 + i * 3.1]));
      priceObjs.push(p);
    }
  const variants = ['normal', 'holo', 'reverse', 'firstedition', 'pokeballholo', 'cosmosholo'];
  const cfgs: (PriceConfig | null)[] = [cfg, { ...cfg, source: 'cardmarket' }, null, { source: 'tcgplayer' }];
  it(`pickPrice en ${priceObjs.length * variants.length * 5 * cfgs.length * 3} combinaciones`, () => {
    const diffs: unknown[] = [];
    for (const p of priceObjs)
      for (const v of variants)
        for (const c of ['NM', 'LP', 'DMG', '', 'XX'])
          for (const cf of cfgs)
            for (const own of [null, undefined, 5000]) {
              for (const f of [fx]) {
                const a = pickPrice(p, v, c, cf, f, own),
                  b = legacyPick(p, v, c, cf, f, own);
                if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push([p, v, c, cf, own]);
              }
            }
    expect(diffs.slice(0, 5)).toEqual([]);
  });
  it('parseUsd en textos generados', () => {
    const xs: string[] = [];
    for (const a of ['', '1', '12', '349', '1234', '1.234', '1,234', '1.234.567'])
      for (const b of ['', ',9', ',99', '.5', '.99', ',999', '.']) xs.push(a + b, 'US$ ' + a + b, ' ' + a + b + ' usd');
    expect(xs.filter(x => !Object.is(parseUsd(x), legacy.parseUsd(x)))).toEqual([]);
  });
});
