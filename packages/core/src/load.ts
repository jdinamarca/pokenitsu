// Copy arithmetic of an inventory row and what an entry in Cargar resolves to. Shared by Nitsu and Arma tu colección
// (cargar-e-inventario-en-arma), so both apps count copies the same way.
import { condCode, langCode, normNumber, parseEntry, type Cond, type Entry, type Lang } from './entry.js';
import { eraOf, type SetLike } from './era.js';

/** a row's copies: qty in total, personal of them in my collection (0..qty) */
export interface Copies {
  qty: number;
  personal: number;
}

/**
 * Adding or removing copies of a row: never below 0; added copies are personal when asked, removing takes copies
 * for sale first. `real` is how many really changed (0 when there was nothing to remove).
 */
export function addToCopies(cur: Copies, delta: number, personal: boolean): Copies & { real: number } {
  const qty = Math.max(0, cur.qty + delta),
    real = qty - cur.qty;
  const p = real > 0 && personal ? cur.personal + real : Math.min(cur.personal, qty);
  return { qty, personal: qty ? p : 0, real };
}

/** Undoing a load that changed qty by `delta` and personal by `personalDelta` */
export function undoCopies(cur: Copies, delta: number, personalDelta: number): Copies {
  const qty = Math.max(0, cur.qty - delta);
  return { qty, personal: Math.min(Math.max(0, cur.personal - personalDelta), qty) };
}

/** Moving n copies (all by default) out of a row: copies for sale go first. moved = how many, personal = of them personal */
export function moveSplit(cur: Copies, n = Infinity): { moved: number; personal: number } {
  const moved = Math.max(0, Math.min(n, cur.qty));
  return { moved, personal: Math.max(0, moved - (cur.qty - cur.personal)) };
}

/** numbers of an expansion by their normalized form ("025" and "25" → "25"): normNumber(number) → number */
export type NumberIndex = Record<string, string>;
export function indexNumbers(numbers: Iterable<string>): NumberIndex {
  const out: NumberIndex = {};
  for (const n of numbers) out[normNumber(n)] = n;
  return out;
}

export const RANGE_CONFIRM = 50;
/** "1-30": the numbers of the range that exist in the expansion, the skipped ones, and whether to ask first (more than 50) */
export function expandRange(
  index: NumberIndex,
  range: { from: number; to: number },
): { nums: string[]; skipped: number[]; confirm: boolean } {
  const nums: string[] = [],
    skipped: number[] = [];
  for (let n = range.from; n <= range.to; n++) {
    const num = index[normNumber(String(n))];
    if (num === undefined) skipped.push(n);
    else nums.push(num);
  }
  return { nums, skipped, confirm: nums.length > RANGE_CONFIRM };
}

export type Resolved =
  | { kind: 'empty' }
  | { kind: 'lang'; lang: Lang }
  | { kind: 'cond'; cond: Cond }
  | { kind: 'bad' }
  | { kind: 'card'; entry: Entry; num: string }
  | { kind: 'range'; entry: Entry }
  | { kind: 'missing'; entry: Entry };
/**
 * What a line typed in Cargar means in one expansion, as Nitsu reads it: a language or condition alone changes the
 * session; a number that exists as typed with its letter ("25a", "SV107") wins over the suffix; "1-30" is a range
 * unless a number with that dash exists.
 */
export function resolveEntry(raw: string, index: NumberIndex): Resolved {
  const t = raw.trim();
  if (!t) return { kind: 'empty' };
  const lang = langCode(t);
  if (lang) return { kind: 'lang', lang };
  const cond = /^(nm|lp|mp|hp|dmg)$/i.test(t) && condCode(t);
  if (cond) return { kind: 'cond', cond };
  const p = parseEntry(raw);
  if (!p || !p.qty || !/\d/.test(t)) return { kind: 'bad' };
  const byBase = index[normNumber(p.base)],
    byFull = index[normNumber(p.full)];
  if (p.range && byBase === undefined && byFull === undefined) return { kind: 'range', entry: p };
  if (byBase !== undefined) return { kind: 'card', entry: p, num: byBase };
  if (byFull !== undefined) return { kind: 'card', entry: { ...p, v: null }, num: byFull };
  return { kind: 'missing', entry: p };
}

/**
 * Where "-25" takes a copy from: the fixed location if it has copies, else the location with the most copies for sale
 * (then the most copies). byLoc: location → {qty, personal} of the same card, variant, language and condition.
 */
export function removalLocation(byLoc: Record<number, Copies>, fixed: number | null): number {
  if (fixed != null && byLoc[fixed]?.qty) return fixed;
  const sale = (l: number) => byLoc[l]!.qty - byLoc[l]!.personal;
  const best = Object.keys(byLoc)
    .map(Number)
    .filter(l => byLoc[l]!.qty > 0)
    .sort((a, b) => sale(b) - sale(a) || byLoc[b]!.qty - byLoc[a]!.qty)[0];
  return best ?? 0;
}

export interface SearchableSet extends SetLike {
  name: string;
  name_ja?: string | null;
}
/**
 * The expansion picker's search, as Nitsu's: exact code first, then exact name, names that start with it, names that
 * contain it, and the series (or a code that starts with it). At most 14.
 */
export function searchSets<S extends SearchableSet>(sets: readonly S[], q: string, limit = 14): S[] {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const score = (s: S) => {
    const code = (s.code || '').toLowerCase(),
      id = s.id.toLowerCase(),
      name = s.name.toLowerCase(),
      ja = (s.name_ja || '').toLowerCase();
    if (code === q || id === q) return 0;
    if (name === q || ja === q) return 1;
    if (name.startsWith(q) || (ja && ja.startsWith(q))) return 2;
    if (name.includes(q) || (ja && ja.includes(q))) return 3;
    if ((s.series || '').toLowerCase().includes(q) || eraOf(s).toLowerCase().includes(q) || code.startsWith(q) || id.startsWith(q))
      return 4;
    return 99;
  };
  return sets
    .map(s => [score(s), s] as const)
    .filter(x => x[0] < 99)
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(x => x[1]);
}
/** "MEW ES": search "MEW" and say the language, when the search finds something without it */
export function searchSetsLang<S extends SearchableSet>(sets: readonly S[], q: string): { sets: S[]; lang: Lang | null } {
  const m = q.trim().match(/^(.*\S)\s+([a-z]{2})$/i);
  const lang = m ? langCode(m[2]) : null;
  if (m && lang) {
    const r = searchSets(sets, m[1]!);
    if (r.length) return { sets: r, lang };
  }
  return { sets: searchSets(sets, q), lang: null };
}
