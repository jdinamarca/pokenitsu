// How complete an expansion is, in three modes:
// - base: the printed numbers (1 to the printed total, e.g. 165/165 in 151)
// - secrets: every card of the expansion (numbers over the printed total and subsets such as TG, GG…)
// - master: every standard variant of every card (normal, reverse, holo, 1st Edition), as the catalog lists them

export interface SetTotals {
  /** the number printed after the slash ("025/165" → 165); null when the expansion has none (promos) */
  printed: number | null;
  /** every card of the expansion in the catalog, secrets included */
  total: number;
  /** promo expansions: their numbers are not "of N", so base = every card */
  promo?: boolean;
}
export interface Count {
  have: number;
  total: number;
}

/** "025" with 165 printed → true; "199", "TG05", "25a" → false */
export function isPrintedNumber(number: string, printed: number | null | undefined): boolean {
  if (!printed || !/^\d+$/.test(number)) return false;
  const n = parseInt(number, 10);
  return n >= 1 && n <= printed;
}

/**
 * Base and with-secrets progress from the card numbers the user owns in this expansion.
 * When nothing is "over the printed total" (promos, subsets whose numbers all carry a prefix such as TG01 / GG01 / SV1,
 * Classic Collection reprints with their original numbers), every card counts as printed.
 */
export function setProgress(set: SetTotals, owned: Iterable<string>): { base: Count; secrets: Count } {
  const nums = new Set(owned);
  const all = !set.printed || set.promo || set.printed >= set.total;
  let printedHave = 0;
  if (all) printedHave = nums.size;
  else for (const n of nums) if (isPrintedNumber(n, set.printed)) printedHave++;
  const base = all ? set.total : set.printed!;
  return { base: { have: Math.min(printedHave, base), total: base }, secrets: { have: Math.min(nums.size, set.total), total: set.total } };
}

// catalog variant names (TCGdex) → inventory variant
const VARIANT_OF: Record<string, string> = {
  normal: 'normal',
  reverse: 'reverse',
  holo: 'holo',
  firstEdition: 'firstedition',
  firstedition: 'firstedition',
};
export const MASTER_VARIANTS = ['normal', 'holo', 'reverse', 'firstedition'];

/** The standard variants of a card as inventory variant names, in a stable order. */
export function standardVariants(variants: readonly string[] | null | undefined): string[] {
  const vs = new Set((variants || []).map(v => VARIANT_OF[v]).filter((v): v is string => !!v));
  return MASTER_VARIANTS.filter(v => vs.has(v));
}

/**
 * Master set progress: each (card, standard variant) is one slot.
 * owned: "number|variant" of the copies the user has. Cards whose variants are still unknown are counted apart (unknown),
 * so the total is never presented as final while they are missing.
 */
export function masterProgress(
  cards: readonly { number: string; variants: readonly string[] | null | undefined }[],
  owned: Iterable<string>,
): Count & { unknown: number } {
  const have = new Set(owned);
  let total = 0,
    got = 0,
    unknown = 0;
  for (const c of cards) {
    if (c.variants == null) {
      unknown++;
      continue;
    }
    for (const v of standardVariants(c.variants)) {
      total++;
      if (have.has(c.number + '|' + v)) got++;
    }
  }
  return { have: got, total, unknown };
}

/** Rarity-based guess of the standard variants when the catalog does not know them */
export function guessVariants(rarity: string | null | undefined): string[] {
  const r = String(rarity || '').toLowerCase();
  if (!r || ['common', 'uncommon', 'rare'].includes(r)) return ['normal', 'reverse'];
  if (r === 'rare holo') return ['holo', 'reverse'];
  return ['holo'];
}
