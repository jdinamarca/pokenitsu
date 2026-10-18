import { describe, expect, it } from 'vitest';
import { filterOwned, matchesName, REGIONS, regionOf, shelvesBySet, sortArtists, type GalleryCard } from '../src/index.js';

describe('regions', () => {
  it('cover the 1025 species without gaps or overlaps', () => {
    expect(REGIONS[0]!.from).toBe(1);
    expect(REGIONS.at(-1)!.to).toBe(1025);
    for (let i = 1; i < REGIONS.length; i++) expect(REGIONS[i]!.from).toBe(REGIONS[i - 1]!.to + 1);
  });
  it('put each number in its region, at the edges too', () => {
    expect(regionOf(151)?.id).toBe('kanto');
    expect(regionOf(152)?.id).toBe('johto');
    expect(regionOf(196)?.name).toBe('Johto');
    expect(regionOf(905)?.id).toBe('galar');
    expect(regionOf(906)?.id).toBe('paldea');
    expect(regionOf(1025)?.id).toBe('paldea');
    expect(regionOf(0)).toBeUndefined();
    expect(regionOf(1026)).toBeUndefined();
  });
});

const card = (set_id: string, release: string, number_norm: string, qty = 0): GalleryCard => ({
  set_id,
  set_name: set_id.toUpperCase(),
  set_code: set_id,
  release,
  number_norm,
  qty,
});
const cards = [
  card('sm9', '2019-02-01', '33', 1),
  card('base1', '1999-01-09', '58'),
  card('sv3pt5', '2023-09-22', '173'),
  card('sv3pt5', '2023-09-22', '25', 2),
  card('sv3pt5', '2023-09-22', 'SV1'),
  card('promo', '', '7'),
];

describe('shelvesBySet', () => {
  it('one shelf per expansion, newest first and undated last, cards by number', () => {
    const s = shelvesBySet(cards);
    expect(s.map(x => x.set_id)).toEqual(['sv3pt5', 'sm9', 'base1', 'promo']);
    expect(s[0]!.cards.map(c => c.number_norm)).toEqual(['25', '173', 'SV1']);
    expect(s[0]).toMatchObject({ mine: 1, total: 3 });
  });
  it('Tengo and Me faltan keep the shelf progress and drop empty shelves', () => {
    const mine = shelvesBySet(cards, 'mine');
    expect(mine.map(x => x.set_id)).toEqual(['sv3pt5', 'sm9']);
    expect(mine[0]).toMatchObject({ mine: 1, total: 3 });
    expect(mine[0]!.cards).toHaveLength(1);
    expect(shelvesBySet(cards, 'missing').map(x => x.set_id)).toEqual(['sv3pt5', 'base1', 'promo']);
  });
  it('filterOwned', () => {
    expect(filterOwned(cards, 'all')).toHaveLength(6);
    expect(filterOwned(cards, 'mine')).toHaveLength(2);
    expect(filterOwned(cards, 'missing')).toHaveLength(4);
  });
});

describe('sortArtists', () => {
  const list = [
    { name: 'Mitsuhiro Arita', total: 300, mine: 12 },
    { name: '5ban Graphics', total: 58, mine: 9 },
    { name: 'Naoki Saito', total: 41, mine: 0 },
    { name: 'Ayaka Yoshida', total: 10, mine: 1 },
    { name: 'Atsuko Nishida', total: 20, mine: 2 },
  ];
  const names = (o: Parameters<typeof sortArtists>[1]) => sortArtists(list, o).map(a => a.name);
  it('más avance: share, then more owned', () => {
    expect(names('progress')).toEqual(['5ban Graphics', 'Atsuko Nishida', 'Ayaka Yoshida', 'Mitsuhiro Arita', 'Naoki Saito']);
  });
  it('más cartas mías, más cartas, nombre', () => {
    expect(names('mine')[0]).toBe('Mitsuhiro Arita');
    expect(names('total')).toEqual(['Mitsuhiro Arita', '5ban Graphics', 'Naoki Saito', 'Atsuko Nishida', 'Ayaka Yoshida']);
    expect(names('name')).toEqual(['5ban Graphics', 'Atsuko Nishida', 'Ayaka Yoshida', 'Mitsuhiro Arita', 'Naoki Saito']);
  });
  it('the search ignores case, accents and word order', () => {
    expect(matchesName('Mitsuhiro Arita', 'arita')).toBe(true);
    expect(matchesName('Mitsuhiro Arita', 'ARITA mitsu')).toBe(true);
    expect(matchesName('Hélène', 'helene')).toBe(true);
    expect(matchesName('Ken Sugimori', 'arita')).toBe(false);
  });
});
