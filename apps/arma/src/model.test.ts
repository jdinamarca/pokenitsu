import { describe, expect, it } from 'vitest';
import type { Printing, Source } from './api.ts';
import { cardOf, expansionOf, shelvesBySet, withPhotoShows } from './model.ts';

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
