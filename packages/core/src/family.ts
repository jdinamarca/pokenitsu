// "Arma tu Master Set" (master-set-familia-eevee): the families whose Full can be chosen in the fan, in the fan's order,
// and the address of each member (/master-set/vaporeon). Adding a family is one entry here.

export interface Family {
  id: string;
  name: string;
  /** the member shown at / and at the centre of the fan */
  base: number;
  /** in the fan's order, left to right */
  members: readonly number[];
}
export const FAMILIES: readonly Family[] = [
  { id: 'eevee', name: 'Familia Eevee', base: 133, members: [134, 135, 136, 196, 133, 197, 470, 471, 700] },
];
/** each member's English name (PokéAPI's), whose lower case is its address */
export const MEMBER_NAMES: Readonly<Record<number, string>> = {
  133: 'Eevee',
  134: 'Vaporeon',
  135: 'Jolteon',
  136: 'Flareon',
  196: 'Espeon',
  197: 'Umbreon',
  470: 'Leafeon',
  471: 'Glaceon',
  700: 'Sylveon',
};
export const familyOf = (dex: number): Family | undefined => FAMILIES.find(f => f.members.includes(dex));
export const pathOf = (dex: number): string => `/master-set/${(MEMBER_NAMES[dex] || String(dex)).toLowerCase()}`;
/** / and /master-set open the first family's base; /master-set/espeon → 196; anything else → null */
export function memberFromPath(path: string): number | null {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/' || p === '/master-set') return FAMILIES[0]!.base;
  const m = /^\/master-set\/([^/]+)$/.exec(p);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]!).toLowerCase();
  const hit = Object.entries(MEMBER_NAMES).find(([, n]) => n.toLowerCase() === slug);
  return hit && familyOf(Number(hit[0])) ? Number(hit[0]) : null;
}
