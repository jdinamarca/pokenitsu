import { describe, expect, it } from 'vitest';
import type { Printing, Source } from './api.ts';
import {
  cardOf,
  expansionOf,
  importLines,
  keepFor,
  LANG_NAME,
  ownership,
  regionOf,
  shelvesBySet,
  variantName,
  withPhotoShows,
} from './model.ts';
import { applyRules, FULL_RULES } from '@pokenitsu/core';
import type { Copy } from './api.ts';

let n = 0;
const pr = (o: Partial<Printing> & Pick<Printing, 'set_key' | 'number' | 'lang'>): Printing => ({
  code: `C${n++}`,
  set_name: null,
  set_name_local: null,
  set_release: null,
  finish: 'normal',
  stamp: null,
  name: 'Eevee',
  artist: null,
  release: null,
  design_id: null,
  design_date: null,
  card_id: null,
  equiv_id: null,
  facts: {},
  ...o,
});
const sources = new Map<string, Source>();
const titles = (ps: Printing[]) => shelvesBySet(ps, sources).map(s => `${s.title} | ${s.subtitle}`);

describe('shelvesBySet', () => {
  it('one timeline across regions: Rocket Gang (1997) before Jungle (1999) and Team Rocket (2000)', () => {
    const ps = [
      pr({ set_key: 'base5', number: '55', lang: 'EN', set_name: 'Team Rocket', release: '2000-04-24' }),
      pr({ set_key: 'ja-PMCG4', number: '79', lang: 'JA', set_name: 'Rocket Gang', set_name_local: 'ロケット団', release: '1997-11-21' }),
      pr({ set_key: 'base2', number: '51', lang: 'EN', set_name: 'Jungle', release: '1999-06-16' }),
    ];
    expect(titles(ps)).toEqual([
      'ロケット団 · Rocket Gang | Japón · 1997-11',
      'Jungle | Internacional · 1999-06',
      'Team Rocket | Internacional · 2000-04',
    ]);
  });

  it('a translated set is its own expansion and takes the Japanese date when it has none', () => {
    const ps = [
      pr({ set_key: 'ja-SV2a', number: '133', lang: 'ZH-TW', set_name: 'Pokémon Card 151', set_name_local: '寶可夢卡牌151' }),
      pr({
        set_key: 'ja-SV2a',
        number: '133',
        lang: 'JA',
        set_name: 'Pokémon Card 151',
        set_name_local: 'ポケモンカード151',
        release: '2023-06-18',
      }),
    ];
    expect(expansionOf(ps[0]!)).toBe('ja-SV2a|ZH-TW');
    expect(titles(ps)).toEqual(['ポケモンカード151 · Pokémon Card 151 | Japón · 2023-06', '寶可夢卡牌151 | China tradicional · 2023-06']);
  });

  it('falls back to the catalog date, and the undated ones go last in alphabetical order', () => {
    const ps = [
      pr({ set_key: 'td:tk', number: '4', lang: 'EN', set_name: 'Trainer Kit' }),
      pr({ set_key: 'td:2024sv', number: '1', lang: 'EN', set_name: 'Battle Academy' }),
      pr({ set_key: 'bw3', number: '91', lang: 'DE', set_name: 'Noble Victories', set_release: '2011-11-16' }),
    ];
    expect(titles(ps)).toEqual([
      'Noble Victories | Internacional · 2011-11',
      'Battle Academy | Internacional · Fecha por confirmar',
      'Trainer Kit | Internacional · Fecha por confirmar',
    ]);
  });

  it('inside an expansion: number, then language, finish and stamp', () => {
    const j = { set_key: 'base2', set_name: 'Jungle', release: '1999-06-16' };
    const ps = [
      pr({ ...j, number: '51', lang: 'DE' }),
      pr({ ...j, number: '51', lang: 'EN', stamp: '1st Edition' }),
      pr({ ...j, number: '9', lang: 'EN' }),
      pr({ ...j, number: '51', lang: 'FR' }),
      pr({ ...j, number: '51', lang: 'EN' }),
    ];
    const [shelf] = shelvesBySet(ps, sources);
    expect(shelf!.printings.map(p => `${p.number} ${p.lang}${p.stamp ? ' 1st' : ''}`)).toEqual([
      '9 EN',
      '51 EN',
      '51 EN 1st',
      '51 FR',
      '51 DE',
    ]);
  });
});

describe('la misma carta con números distintos', () => {
  it('074 y 74 son la misma carta: la foto compartida con su 1st Edition se reconoce', () => {
    const shared = { source: 'pokemontcg', value: '/img/x.webp', ref: null };
    const a = pr({ set_key: 'sv8pt5', number: '074', lang: 'EN', facts: { image: [shared] } });
    const b = pr({ set_key: 'sv8pt5', number: '74', lang: 'EN', stamp: '1st-edition', facts: { image: [shared] } });
    expect(cardOf(a)).toBe(cardOf(b));
    const [wa] = withPhotoShows([a, b], {});
    expect(wa!.facts.image![0]!.shows).toBe('1st-edition');
  });
});

describe('neerlandés', () => {
  it('es un idioma internacional, y va justo después del inglés en la repisa', () => {
    expect(LANG_NAME.NL).toBe('Neerlandés');
    expect(regionOf('NL')).toBe('Internacional');
    const j = { set_key: 'base2', set_name: 'Jungle', release: '1999-06-16' };
    const [shelf] = shelvesBySet(
      [pr({ ...j, number: '51', lang: 'FR' }), pr({ ...j, number: '51', lang: 'NL' }), pr({ ...j, number: '51', lang: 'EN' })],
      sources,
    );
    expect(shelf!.printings.map(p => p.lang)).toEqual(['EN', 'NL', 'FR']);
  });
});

describe('eevee-lo-que-tienes: lo que tengo y lo que me falta', () => {
  const en = pr({ set_key: 'sv3pt5', number: '133', lang: 'EN', equiv_id: 'e133' });
  const es = pr({ set_key: 'sv3pt5', number: '133', lang: 'ES', equiv_id: 'e133' });
  const rev = pr({ set_key: 'sv3pt5', number: '133', lang: 'EN', finish: 'reverse', equiv_id: 'e133r' });
  const jumbo = pr({ set_key: 'sv3pt5', number: '133', lang: 'EN', stamp: 'jumbo', equiv_id: 'e133j' });
  const all = [en, es, rev, jumbo];
  const rules = (o: Partial<typeof FULL_RULES>) =>
    applyRules(
      all.map(p => ({ key: p.code, lang: p.lang, stamp: p.stamp, equivId: p.equiv_id })),
      { ...FULL_RULES, ...o },
    );
  const copy = (code: string, qty: number): Copy => ({ code, qty, personal: 0, lang: 'EN', cond: 'NM', loc: null });
  const owned = (...cs: Copy[]) => new Map(cs.map(c => [c.code, [c]]));

  it('cuenta las visibles y cuántas tengo', () =>
    expect(ownership(all, rules({}), owned(copy(en.code, 2)))).toEqual({ visible: { total: 4, have: 1 }, hidden: {} }));
  it('una que me falta no cuenta', () => expect(ownership(all, rules({}), owned()).visible.have).toBe(0));
  it('la ES que tengo no marca la EN visible; la regla la cuenta entre las ocultas', () =>
    expect(ownership(all, rules({ onlyEnglish: true }), owned(copy(es.code, 1)))).toEqual({
      visible: { total: 3, have: 0 },
      hidden: { onlyEnglish: { total: 1, have: 1 } },
    }));
  it('un jumbo propio que la regla oculta', () =>
    expect(ownership(all, rules({ jumbo: false }), owned(copy(jumbo.code, 1))).hidden).toEqual({ jumbo: { total: 1, have: 1 } }));
  it('una fila con 0 copias no cuenta como tenida', () => expect(ownership([en], rules({}), owned(copy(en.code, 0))).visible.have).toBe(0));
  it('el filtro', () =>
    expect([keepFor('all', false), keepFor('have', true), keepFor('have', false), keepFor('miss', false)]).toEqual([
      true,
      true,
      false,
      true,
    ]));
});

describe('volver-a-traer-el-full: el resumen', () => {
  const srcs = new Map([['bulbapedia-mazos', { id: 'bulbapedia-mazos', name: 'Bulbapedia (mazos)' } as Source]]);
  it('nuevas, quitadas y fotos traspasadas', () =>
    expect(importLines('Eevee', { printings: 1114, added: 5, removed: 4, carried: 4, sources: { tcgdex: { ok: true } } }, srcs)).toEqual([
      'Full de Eevee actualizado: 1.114 impresiones · +5 nuevas · −4 quitadas',
      '4 fotos locales traspasadas',
    ]));
  it('una fuente que no respondió, en singular y sin cambios', () =>
    expect(
      importLines(
        'Espeon',
        { printings: 1, added: 1, removed: 0, sources: { 'bulbapedia-mazos': { ok: false, error: 'x' }, wikidex: { ok: false } } },
        srcs,
      ),
    ).toEqual([
      'Full de Espeon actualizado: 1 impresión · +1 nueva · −0 quitadas',
      'Bulbapedia (mazos) no respondió: quedó lo de la última vez',
      'wikidex no respondió: quedó lo de la última vez',
    ]));
});

describe('reverse-con-sello-ex: el nombre de la Reverse de la era EX', () => {
  const fact = (source: string, value: string) => ({ source, value, ref: null });
  it('"Reverse · Sello de la expansión" si una fuente dice que lleva el sello', () =>
    expect(
      variantName(
        pr({
          set_key: 'ex11',
          number: '68',
          lang: 'EN',
          finish: 'reverse',
          facts: { variant: [fact('tcgplayer', 'Reverse'), fact('pokecottage', 'Expansion Stamp')] },
        }),
      ),
    ).toBe('Reverse · Sello de la expansión'));
  it('una Reverse sin esa fuente sigue siendo "Reverse"', () =>
    expect(
      variantName(
        pr({ set_key: 'ex2', number: '63', lang: 'EN', finish: 'reverse', facts: { variant: [fact('pokecottage', 'Reverse Holo')] } }),
      ),
    ).toBe('Reverse'));
});
