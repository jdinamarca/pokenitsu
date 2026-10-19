import { describe, expect, it } from 'vitest';
import { crossTcgdex, tdCardRow, tdSetRow } from '../src/index.js';

// catalogo-desde-tcgdex: the international sets only TCGdex has
describe('crossTcgdex', () => {
  const ours = [
    { id: 'hgss3', name: 'HS—Undaunted', tcgdex_en: null },
    { id: 'svp', name: 'Scarlet & Violet Black Star Promos', tcgdex_en: null },
    { id: 'sv3', name: 'Obsidian Flames', tcgdex_en: null },
    { id: 'sv3pt5', name: '151', tcgdex_en: 'sv03.5' },
  ];
  const theirs = [
    { id: 'hgss3', name: 'Undaunted' },
    { id: 'svp', name: 'SVP Black Star Promos' },
    { id: 'sv03', name: 'Obsidian Flames' },
    { id: 'sv03.5', name: '151' },
    { id: 'tk-xy-sy', name: 'XY trainer Kit (Sylveon)' },
  ];
  it('por tcgdex_en, por nombre y por identificador; el kit queda sin cruzar', () =>
    expect(Object.fromEntries(crossTcgdex(ours, theirs))).toEqual({ 'sv03.5': 'sv3pt5', sv03: 'sv3', hgss3: 'hgss3', svp: 'svp' }));
});

describe('tdSetRow y tdCardRow', () => {
  const kit = {
    id: 'tk-xy-sy',
    name: 'XY trainer Kit (Sylveon)',
    releaseDate: '2014-03-12',
    serie: { id: 'tk', name: 'Trainer kits' },
    cardCount: { total: 30, official: 30 },
    abbreviation: { official: 'TK6S' },
    cards: [{ id: 'tk-xy-sy-13', localId: '13', name: 'Eevee' }],
  };
  it('el XY Trainer Kit de Sylveon, en la era XY', () =>
    expect(tdSetRow(kit)).toEqual({
      id: 'td-tk-xy-sy',
      name: 'XY trainer Kit (Sylveon)',
      series: 'XY',
      code: 'TK6S',
      release_date: '2014-03-12',
      total: 30,
      printed_total: 30,
      symbol_url: null,
    }));
  it('fuera: Pokémon TCG Pocket y las expansiones sin cartas', () => {
    expect(tdSetRow({ ...kit, id: 'A1', serie: { id: 'tcgp' } })).toBeNull();
    expect(tdSetRow({ ...kit, id: 'jumbo', cards: [] })).toBeNull();
  });
  it("McDonald's 2024 en Scarlet & Violet; las promos MEP con su serie de TCGdex", () => {
    expect(tdSetRow({ ...kit, id: '2024sv', serie: { id: 'mc', name: "McDonald's Collection" } })!.series).toBe('Scarlet & Violet');
    expect(tdSetRow({ ...kit, id: 'mep', serie: { id: 'me', name: 'Mega Evolution' } })!.series).toBe('Mega Evolution');
  });
  it('Eevee #13 del kit, sin foto en TCGdex', () =>
    expect(
      tdCardRow('td-tk-xy-sy', { id: 'tk-xy-sy-13', localId: '13', name: 'Eevee', rarity: 'Common', dexId: [133], category: 'Pokemon' }),
    ).toEqual({
      id: 'td-tk-xy-sy-13',
      set_id: 'td-tk-xy-sy',
      number: '13',
      number_norm: '13',
      name: 'Eevee',
      supertype: 'Pokémon',
      rarity: 'Common',
      artist: null,
      dex: [133],
      image_small: null,
      image_large: null,
    }));
});
