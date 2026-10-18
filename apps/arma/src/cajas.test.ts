import { describe, expect, it } from 'vitest';
import type { CardSet, InvLocation, InvRow } from './api.ts';
import { locationStats, locColor, planFor, seriesList, setsFromCodes } from './cajas.ts';

const row = (o: Partial<InvRow>): InvRow =>
  ({
    card_id: 'sv3pt5-133',
    variant: 'normal',
    lang: 'ES',
    cond: 'NM',
    loc: 0,
    qty: 1,
    personal: 0,
    sid: 'sv3pt5',
    num: '133',
    name: 'Eevee',
    rarity: 'Common',
    img: null,
    set_code: 'MEW',
    set_series: 'Scarlet & Violet',
    set_source: 'ptcg',
    set_lang: null,
    own_img: null,
    own_card: null,
    local: null,
    ...o,
  }) as InvRow;
const loc = (id: number, pos: number, rule: InvLocation['rule'] = {}): InvLocation => ({
  id,
  name: `L${id}`,
  kind: 'box',
  pos,
  note: '',
  rule,
});
const set = (o: Partial<CardSet>): CardSet => ({
  id: 'x',
  name: '',
  name_ja: '',
  series: null,
  code: '',
  date: '',
  total: null,
  printed: null,
  sym: '',
  source: 'ptcg',
  lang: null,
  has_cards: true,
  ...o,
});

describe('cajas-y-carpetas-en-arma: lo que guarda cada ubicación', () => {
  it('copias, expansiones, valor y las cartas más valiosas primero, cada foto una vez', () => {
    const rows = [
      row({ loc: 3, qty: 2, img: 'a.png', card_id: 'a' }),
      row({ loc: 3, qty: 1, img: 'b.png', card_id: 'b', sid: 'sv1' }),
      row({ loc: 3, qty: 1, img: 'a.png', card_id: 'a', variant: 'holo' }),
    ];
    const price = (r: InvRow) => (r.card_id === 'b' ? 1000 : 100);
    expect(locationStats(rows, [loc(3, 1)], price).get(3)).toEqual({ qty: 4, value: 1300, sets: 2, cards: ['b.png', 'a.png'] });
  });
  it('una ubicación que ya no existe cuenta como sin ubicación', () => {
    expect(locationStats([row({ loc: 99, qty: 2 })], [loc(3, 1)], () => 0).get(0)?.qty).toBe(2);
  });
});

describe('cajas-y-carpetas-en-arma: asignar', () => {
  it('serie y región salen de la expansión de la fila', () => {
    const locs = [loc(5, 2, { origin: ['JA'] }), loc(3, 1, { series: ['Scarlet & Violet'], origin: ['INT'] })];
    const rows = [
      row({}),
      row({ sid: 'ja-SV2a', set_source: 'tcgdex', set_series: null, set_code: 'SV2a', set_lang: 'JA' }),
      row({ loc: 3 }),
    ];
    expect(planFor(rows, locs, () => null).map(p => [rows.indexOf(p.row), p.to])).toEqual([
      [0, 3],
      [1, 5],
    ]);
  });
});

describe('cajas-y-carpetas-en-arma: formulario y colores', () => {
  const sets = [
    set({ id: 'sv3pt5', code: 'MEW', series: 'Scarlet & Violet', date: '2023/09/22' }),
    set({ id: 'swsh1', code: 'SSH', series: 'Sword & Shield', date: '2020/02/07' }),
    set({ id: 'ja-SV2a', code: 'SV2a', series: 'x', source: 'tcgdex', date: '2023/06/16' }),
  ];
  it('códigos o ids, y los que no existen', () =>
    expect(setsFromCodes('mew, swsh1, XYZ,', sets)).toEqual({ ids: ['sv3pt5', 'swsh1'], unknown: ['XYZ'] }));
  it('las series internacionales, la más nueva primero', () => expect(seriesList(sets)).toEqual(['Scarlet & Violet', 'Sword & Shield']));
  it('morado la personal, dorado la de especiales', () => {
    expect(locColor({ rule: { personal: true } }, 0)).toBe('#a77bff');
    expect(locColor({ rule: { minPrice: 5000 } }, 0)).toBe('#ffc83d');
    expect(locColor({ rule: null }, 1)).toBe('#5aa8ff');
  });
});
