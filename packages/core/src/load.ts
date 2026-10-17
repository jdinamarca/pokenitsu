// Copy arithmetic of an inventory row and what an entry in Cargar resolves to. Shared by Nitsu and Arma tu colección
// (cargar-e-inventario-en-arma), so both apps count copies the same way.
import { condCode, langCode, normNumber, parseEntry, type Cond, type Entry, type Lang } from './entry.js';

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
