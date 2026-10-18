// Ilustradores and Pokédex in Arma (ilustradores-y-pokedex-en-arma): the regions of the Pokédex, a gallery's shelves
// (one per expansion, newest first) and the illustrators' order. Pure: the API gives the cards, this arranges them.

export interface Region {
  /** the slug in the address: /pokedex/johto */
  id: string;
  name: string;
  from: number;
  to: number;
}
/** the 1025 species by the region where they debuted (Hisui's few, 899–905, with Galar) */
export const REGIONS: readonly Region[] = [
  { id: 'kanto', name: 'Kanto', from: 1, to: 151 },
  { id: 'johto', name: 'Johto', from: 152, to: 251 },
  { id: 'hoenn', name: 'Hoenn', from: 252, to: 386 },
  { id: 'sinnoh', name: 'Sinnoh', from: 387, to: 493 },
  { id: 'teselia', name: 'Teselia', from: 494, to: 649 },
  { id: 'kalos', name: 'Kalos', from: 650, to: 721 },
  { id: 'alola', name: 'Alola', from: 722, to: 809 },
  { id: 'galar', name: 'Galar', from: 810, to: 905 },
  { id: 'paldea', name: 'Paldea', from: 906, to: 1025 },
];
export const regionOf = (dex: number): Region | undefined => REGIONS.find(r => dex >= r.from && dex <= r.to);

export interface GalleryCard {
  set_id: string;
  set_name: string;
  set_code: string;
  /** YYYY-MM-DD, or '' when unknown */
  release: string;
  number_norm: string;
  qty: number;
}
export interface Shelf<C extends GalleryCard> {
  set_id: string;
  set_name: string;
  set_code: string;
  release: string;
  mine: number;
  total: number;
  cards: C[];
}
export type Owned = 'all' | 'mine' | 'missing';

/** Todas · Tengo · Me faltan */
export const filterOwned = <C extends GalleryCard>(cards: readonly C[], owned: Owned): C[] =>
  owned === 'all' ? [...cards] : cards.filter(c => (owned === 'mine' ? c.qty > 0 : c.qty <= 0));

const byNumber = (a: GalleryCard, b: GalleryCard) => {
  const na = parseInt(a.number_norm, 10),
    nb = parseInt(b.number_norm, 10);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  if (Number.isFinite(na) !== Number.isFinite(nb)) return Number.isFinite(na) ? -1 : 1;
  return a.number_norm.localeCompare(b.number_norm, 'en', { numeric: true });
};
/**
 * One shelf per expansion, newest first (undated last), cards by number. mine/total count the shelf's cards before any
 * filter, so "3 / 5" stays the expansion's progress; a shelf left without cards by the filter is dropped.
 */
export function shelvesBySet<C extends GalleryCard>(cards: readonly C[], owned: Owned = 'all'): Shelf<C>[] {
  const by = new Map<string, Shelf<C>>();
  for (const c of cards) {
    let s = by.get(c.set_id);
    if (!s) {
      s = { set_id: c.set_id, set_name: c.set_name, set_code: c.set_code, release: c.release, mine: 0, total: 0, cards: [] };
      by.set(c.set_id, s);
    }
    s.total++;
    if (c.qty > 0) s.mine++;
    s.cards.push(c);
  }
  const shelves = [...by.values()].map(s => ({ ...s, cards: filterOwned(s.cards, owned).sort(byNumber) })).filter(s => s.cards.length);
  return shelves.sort(
    (a, b) => (a.release ? 0 : 1) - (b.release ? 0 : 1) || b.release.localeCompare(a.release) || a.set_name.localeCompare(b.set_name),
  );
}

export interface ArtistSummary {
  name: string;
  total: number;
  mine: number;
}
export type ArtistOrder = 'progress' | 'mine' | 'total' | 'name';
const share = (a: ArtistSummary) => (a.total ? a.mine / a.total : 0);
const byName = (a: ArtistSummary, b: ArtistSummary) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
/** más avance (share, then more owned), más cartas mías, más cartas en el catálogo, nombre; ties by name */
export function sortArtists<A extends ArtistSummary>(list: readonly A[], order: ArtistOrder): A[] {
  const cmp: Record<ArtistOrder, (a: A, b: A) => number> = {
    progress: (a, b) => share(b) - share(a) || b.mine - a.mine || b.total - a.total || byName(a, b),
    mine: (a, b) => b.mine - a.mine || share(b) - share(a) || byName(a, b),
    total: (a, b) => b.total - a.total || byName(a, b),
    name: byName,
  };
  return [...list].sort(cmp[order]);
}
/** the search: every word in the name, without accents or case */
export function matchesName(name: string, q: string): boolean {
  const norm = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const n = norm(name);
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every(w => n.includes(w));
}
