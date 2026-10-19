import { describe, expect, it } from 'vitest';
import type { CardSet, InvLocation, InvRow, SetCard } from './api.ts';
import {
  firstVariant,
  litCount,
  pictureOf,
  planRow,
  variantsOf,
  rowFor,
  rowMatches,
  shelvesOf,
  withRow,
  type Session,
  type SetContext,
} from './load.ts';

const set: CardSet = {
  id: 'sv3pt5',
  name: '151',
  name_ja: '',
  series: 'Scarlet & Violet',
  code: 'MEW',
  date: '2023/09/22',
  total: 207,
  printed: 165,
  sym: '',
  source: 'ptcg',
  lang: null,
  has_cards: true,
};
const card = (num: string, rarity: string | null, copies: SetCard['copies'] = [], usd?: number): SetCard => ({
  id: `sv3pt5-${num}`,
  sid: 'sv3pt5',
  num,
  name: `Carta ${num}`,
  dex: null,
  artist: null,
  rarity,
  img: null,
  supertype: 'Pokémon',
  variants: null,
  vguess: null,
  prices: usd ? { usd: { holofoil: usd, normal: usd } } : null,
  copies,
  photos: {},
  ref: null,
  own_card: null,
  local: null,
});
const loc = (id: number, pos: number, rule: InvLocation['rule'], name = `Ubicación ${id}`): InvLocation => ({
  id,
  name,
  kind: 'box',
  pos,
  note: null,
  rule,
});
const locations = [loc(1, 0, { series: ['Scarlet & Violet'] }, 'Caja SV'), loc(2, 1, { minPrice: 20000 }, 'Carpeta especiales')];
const ctx: SetContext = { set, locations, cfg: { source: 'tcgplayer', cond: { NM: 1, LP: 0.85 } }, fx: { usd: 950, eur: 1030 }, own: {} };
const session: Session = { lang: 'ES', cond: 'NM', personal: false, dest: 'auto' };

describe('carga-en-la-vitrina: qué fila carga una entrada', () => {
  it('variante automática y la ubicación de su serie', () =>
    expect(planRow(card('25', 'Common'), { v: null, cond: null, sign: 1 }, session, ctx)).toEqual({
      sid: 'sv3pt5',
      num: '25',
      variant: 'normal',
      lang: 'ES',
      cond: 'NM',
      loc: 1,
    }));
  it('el sufijo y el estado de la entrada ganan', () =>
    expect(planRow(card('25', 'Common'), { v: 'reverse', cond: 'LP', sign: 1 }, session, ctx)).toMatchObject({
      variant: 'reverse',
      cond: 'LP',
    }));
  it('una rara holo es holo y, con precio guardado alto, va a la carpeta de precio', () =>
    expect(planRow(card('6', 'Double Rare', [], 40), { v: null, cond: null, sign: 1 }, session, ctx)).toMatchObject({
      variant: 'holo',
      loc: 2,
    }));
  it('una ubicación fija gana a las reglas', () =>
    expect(planRow(card('6', 'Double Rare', [], 40), { v: null, cond: null, sign: 1 }, { ...session, dest: 1 }, ctx).loc).toBe(1));
  it('quitar sale de donde hay copias para vender', () => {
    const c = card('25', 'Common', [
      { variant: 'normal', lang: 'ES', cond: 'NM', loc: 1, qty: 2, personal: 2 },
      { variant: 'normal', lang: 'ES', cond: 'NM', loc: 2, qty: 1, personal: 0 },
    ]);
    expect(planRow(c, { v: null, cond: null, sign: -1 }, session, ctx).loc).toBe(2);
  });
  it('sin ubicaciones queda sin ubicación', () =>
    expect(planRow(card('25', 'Common'), { v: null, cond: null, sign: 1 }, session, { ...ctx, locations: [] }).loc).toBe(0));
});

describe('carga-en-la-vitrina: vitrina y contador', () => {
  it('la respuesta reemplaza la fila y a 0 la quita', () => {
    const c = withRow(card('25', 'Common'), {
      sid: 'sv3pt5',
      num: '25',
      variant: 'normal',
      lang: 'ES',
      cond: 'NM',
      loc: 1,
      qty: 2,
      personal: 0,
    });
    expect(c.copies).toHaveLength(1);
    expect(withRow(c, { ...c.copies[0]!, sid: 'sv3pt5', num: '25', qty: 0 }).copies).toEqual([]);
  });
  it('cuenta los números impresos encendidos', () => {
    const lit = [
      card('1', 'Common', [{ variant: 'normal', lang: 'ES', cond: 'NM', loc: 0, qty: 1, personal: 0 }]),
      card('200', 'Special Illustration Rare', [{ variant: 'holo', lang: 'ES', cond: 'NM', loc: 0, qty: 1, personal: 0 }]),
      card('2', 'Common'),
    ];
    expect(litCount(set, lit)).toEqual({ have: 1, total: 165 });
  });
});

const row = (loc: number, extra: Partial<InvRow> = {}): InvRow => ({
  card_id: 'sv3pt5-133',
  variant: 'normal',
  lang: 'ES',
  cond: 'NM',
  loc,
  qty: 1,
  personal: 0,
  added: '0',
  sid: 'sv3pt5',
  num: '133',
  name: 'Eevee',
  dex: [133],
  artist: 'Atsuko Nishida',
  rarity: 'Common',
  img: null,
  supertype: 'Pokémon',
  set_name: '151',
  set_code: 'MEW',
  set_series: 'Scarlet & Violet',
  set_source: 'ptcg',
  set_lang: null,
  price_usd: null,
  price_eur: null,
  own_img: null,
  ref: null,
  own_card: null,
  local: null,
  ...extra,
});
describe('inventario-por-ubicacion', () => {
  it('una repisa por ubicación en su orden, y "Sin ubicación" al final solo si tiene copias', () => {
    expect(shelvesOf([row(2), row(1)], [loc(2, 1, null), loc(1, 0, null)]).map(s => s.id)).toEqual([1, 2]);
    expect(shelvesOf([row(0), row(99)], [loc(1, 0, null)]).map(s => [s.id, s.rows.length])).toEqual([
      [1, 0],
      [0, 2],
    ]);
  });
  it('buscar sin tildes por nombre, expansión, número o ilustrador', () => {
    expect(rowMatches(row(1, { name: 'Pokémon Center' }), 'pokemon')).toBe(true);
    expect(rowMatches(row(1), 'nishida')).toBe(true);
    expect(rowMatches(row(1), 'mew')).toBe(true);
    expect(rowMatches(row(1), 'pikachu')).toBe(false);
  });
  it('"Para": vender o personales', () => {
    const r = row(1, { qty: 2, personal: 2 });
    expect([rowFor(r, 'all'), rowFor(r, 'sale'), rowFor(r, 'personal')]).toEqual([true, false, true]);
  });
});

describe('fotos-del-catalogo-en-arma: qué foto muestra una carta', () => {
  const L = { src: '/img-local/limitless/S8b_1_R_JP_LG.png', source: 'Limitless TCG' };
  it('tu foto de la variante primero', () =>
    expect(pictureOf('/v.jpg', '/own.jpg', '/cat.webp', L, '/ref.webp')).toMatchObject({ src: '/v.jpg', kind: 'photo' }));
  it('después la foto propia de la carta', () =>
    expect(pictureOf(null, '/own.jpg', '/cat.webp', L, null)).toMatchObject({ src: '/own.jpg' }));
  it('después la del catálogo', () => expect(pictureOf(null, null, '/cat.webp', L, null)).toMatchObject({ src: '/cat.webp' }));
  it('después la solo local, con su fuente', () =>
    expect(pictureOf(null, null, null, L, '/ref.webp')).toEqual({ src: L.src, kind: 'local', source: 'Limitless TCG' }));
  it('después la de referencia', () => expect(pictureOf(null, null, null, null, '/ref.webp')).toEqual({ src: '/ref.webp', kind: 'ref' }));
  it('sin nada', () => expect(pictureOf(null, null, null, null, null)).toEqual({ src: null, kind: 'none' }));
});

describe('variantes-al-cargar: las variantes de una carta', () => {
  const sandstorm = {
    ...card('63', 'Common'),
    full: [
      { lang: 'EN', variant: 'normal' },
      { lang: 'EN', variant: 'reverse' },
      { lang: 'EN', variant: 'noereaderlogo' },
      { lang: 'EN', variant: 'fxewtfg7z' },
      { lang: 'FR', variant: 'normal' },
      { lang: 'FR', variant: 'reverse' },
    ],
  };
  it('las del Full en el idioma de la sesión, los básicos primero', () =>
    expect(variantsOf(sandstorm, 'EN')).toEqual(['normal', 'reverse', 'fxewtfg7z', 'noereaderlogo']));
  it('sin el idioma en el Full, las de todos sus idiomas', () =>
    expect(variantsOf(sandstorm, 'ES')).toEqual(['normal', 'reverse', 'fxewtfg7z', 'noereaderlogo']));
  it('suma las del catálogo y las que ya tienes, sin repetir', () => {
    const c = {
      ...card('63', 'Common', [{ variant: 'holo', lang: 'FR', cond: 'NM', loc: 0, qty: 1, personal: 0 }]),
      variants: ['normal', 'firstedition'],
    };
    expect(variantsOf(c, 'FR')).toEqual(['normal', 'holo', 'firstedition']);
  });
  it('sin nada conocido, Normal, Holo y Reverse', () =>
    expect(variantsOf(card('63', 'Common'), 'ES')).toEqual(['normal', 'holo', 'reverse']));
  it('marcada: la automática si está, si no la primera', () => {
    expect(firstVariant({ rarity: 'Rare Holo' }, ['normal', 'reverse'])).toBe('normal');
    expect(firstVariant({ rarity: 'Common' }, ['normal', 'reverse'])).toBe('normal');
    expect(firstVariant({ rarity: 'Rare Holo' }, ['normal', 'holo'])).toBe('holo');
  });
  it('planRow: el sufijo manda, después la marcada, después la automática', () => {
    expect(planRow(sandstorm, { v: null, cond: null, sign: 1 }, session, ctx, 'fxewtfg7z').variant).toBe('fxewtfg7z');
    expect(planRow(sandstorm, { v: 'reverse', cond: null, sign: 1 }, session, ctx, 'fxewtfg7z').variant).toBe('reverse');
    expect(planRow(sandstorm, { v: null, cond: null, sign: 1 }, session, ctx, null).variant).toBe('normal');
  });
});
