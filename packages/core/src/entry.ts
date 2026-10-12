// What the user types in Cargar: "25", "25r", "25*4", "-25", "25r lp", "25 lp*2"…

export const LANGS = ['ES', 'EN', 'PT', 'FR', 'DE', 'IT', 'JA', 'KO', 'ZH'] as const;
export type Lang = (typeof LANGS)[number];
// card condition; bulk is almost always NM
export const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;
export type Cond = (typeof CONDS)[number];
// entry suffixes: 25r reverse, 25e 1st Edition, 25p Poké Ball…
export const SUFFIX: Record<string, string> = {
  n: 'normal',
  h: 'holo',
  r: 'reverse',
  e: 'firstedition',
  p: 'pokeballholo',
  m: 'masterballholo',
};

/** "es", "jp", "sp"… → language code, or null */
export function langCode(s: unknown): Lang | null {
  let x = String(s || '')
    .trim()
    .toUpperCase();
  if (x === 'JP') x = 'JA';
  if (x === 'SP') x = 'ES';
  return (LANGS as readonly string[]).includes(x) ? (x as Lang) : null;
}
/** "lp", "d", "mint"… → condition code, or null */
export function condCode(s: unknown): Cond | null {
  let x = String(s || '')
    .trim()
    .toUpperCase();
  if (x === 'D' || x === 'DM' || x === 'DAMAGED') x = 'DMG';
  if (x === 'M' || x === 'MINT') x = 'NM';
  return (CONDS as readonly string[]).includes(x) ? (x as Cond) : null;
}
/** card number as the catalog index compares it: upper case, no leading zeros ("025" → "25", "tg05" → "TG5") */
export const normNumber = (s: unknown): string =>
  String(s)
    .trim()
    .toUpperCase()
    .replace(/^([A-Z]*)0+(?=\d)/, '$1');

export interface Entry {
  /** 1 adds, -1 removes */
  sign: 1 | -1;
  qty: number;
  /** the number without the variant suffix ("25" for "25r") */
  base: string;
  /** everything typed as the number, in case the suffix is really part of it ("25a", "SV107") */
  full: string;
  /** variant from the suffix, or null (automatic) */
  v: string | null;
  /** condition for this entry only, or null (the current one) */
  cond: Cond | null;
  /** "1-30": every number from `from` to `to` (inclusive, from <= to); null for a single card */
  range: { from: number; to: number } | null;
}

export function parseEntry(raw: string): Entry | null {
  let s = raw.trim();
  if (!s) return null;
  // "25r lp": condition for this card only
  let cond: Cond | null = null;
  const mc = s.match(/^(.+?)\s+(nm|lp|mp|hp|dmg)$/i);
  if (mc) {
    s = mc[1]!;
    cond = mc[2]!.toUpperCase() as Cond;
  }
  let sign: 1 | -1 = 1;
  if (s[0] === '-') {
    sign = -1;
    s = s.slice(1).trim();
  }
  let qty = 1;
  const mq = s.match(/^(.*?)\s*[*x]\s*(\d+)$/i);
  if (mq && mq[1]) {
    s = mq[1];
    qty = parseInt(mq[2]!, 10);
  }
  // "25 lp*2": the condition can also come before the quantity
  const mc2 = !cond && s.match(/^(.+?)\s+(nm|lp|mp|hp|dmg)$/i);
  if (mc2) {
    s = mc2[1]!;
    cond = mc2[2]!.toUpperCase() as Cond;
  }
  s = s.replace(/\s+/g, '');
  let base = s,
    v: string | null = null;
  const last = s.slice(-1).toLowerCase();
  if (s.length > 1 && SUFFIX[last]) {
    base = s.slice(0, -1);
    v = SUFFIX[last];
  }
  // "1-30", "1-30r", "30-1": a range of numbers (a number that really has a dash wins later, in the expansion's index)
  const mr = base.match(/^(\d+)-(\d+)$/);
  const range = mr ? { from: Math.min(+mr[1]!, +mr[2]!), to: Math.max(+mr[1]!, +mr[2]!) } : null;
  return { sign, qty, base, full: s, v, cond, range };
}

/** variant when the entry has no suffix: normal for common, uncommon, rare and promo (or unknown); holo otherwise */
export function autoVariant(rarity: string | null | undefined): 'normal' | 'holo' {
  if (rarity == null) return 'normal';
  const r = rarity.toLowerCase();
  return !r || ['common', 'uncommon', 'rare', 'promo'].includes(r) ? 'normal' : 'holo';
}
