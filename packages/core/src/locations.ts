// Where a copy is stored: boxes for bulk, binders for the valuable ones…
// Among the locations whose rule accepts a copy, the most specific one wins (see docs/adr/0005).
import { mechOf, rarityGroup, rarityMatches } from './rarity.js';

/** All parts optional; an empty rule takes everything (a catch-all box). */
export interface LocationRule {
  /** series (era) names, e.g. "Scarlet & Violet" */
  series?: string[];
  /** expansion ids */
  sets?: string[];
  /** the expansion's region: INT (international), JA, ZH… */
  origin?: string[];
  /** rarity groups (ir, sir, ultra…) or 'mech'; with minPrice: either one is enough */
  special?: string[];
  minPrice?: number;
  /** true: only personal copies; false: only copies for sale */
  personal?: boolean;
  /** only bulk ("challa") */
  bulk?: boolean;
  /** false: never assigned automatically */
  auto?: boolean;
}
export interface LocationLike {
  id: number;
  rule?: LocationRule | null;
}

/** What a rule needs to know about a copy */
export interface CopyInfo {
  setId: string;
  /** the expansion's series in English (eraOf) */
  era: string;
  /** INT or the expansion's language */
  origin: string;
  name: string;
  rarity: string;
  variant: string;
  personal: boolean;
  /** CLP of this copy; only called when a rule has a minimum price */
  price: () => number | null;
}

// "challa": common, uncommon, rare or rare holo, without ex/GX/V… in the name, in a plain variant (normal, holo, reverse)
export const BULK_VARIANTS = ['normal', 'holo', 'reverse'];
export function isBulk(card: { name: string; rarity: string }, variant: string): boolean {
  return BULK_VARIANTS.includes(variant) && ['base', 'rare'].includes(rarityGroup(card.rarity)) && !mechOf(card.name);
}

export function ruleAccepts(rule: LocationRule | null | undefined, c: CopyInfo): boolean {
  const r = rule || {};
  if (r.auto === false) return false;
  if (r.personal === true && !c.personal) return false;
  if (r.personal === false && c.personal) return false;
  if ((r.series || r.sets) && !((r.series || []).includes(c.era) || (r.sets || []).includes(c.setId))) return false;
  if (r.origin && !r.origin.includes(c.origin)) return false;
  if (r.bulk && !isBulk(c, c.variant)) return false;
  if (r.special || r.minPrice) {
    const byRarity = (r.special || []).some(g => rarityMatches(g, c.rarity, c.name));
    const pr = r.minPrice ? c.price() : null;
    if (!byRarity && !(pr && pr >= r.minPrice!)) return false;
  }
  return true;
}

// my collection (personal) > special cards / price > named expansions > named series (fewer = more specific) > bulk > region
export function ruleScore(r: LocationRule | null | undefined = {}): number {
  r = r || {};
  return (
    (r.personal === true ? 1000 : 0) +
    (r.special || r.minPrice ? 500 : 0) +
    (r.sets ? 200 : 0) +
    (r.series ? 100 + Math.max(0, 20 - r.series.length) : 0) +
    (r.bulk ? 10 : 0) +
    (r.origin ? 5 : 0) +
    (r.personal === false ? 1 : 0)
  );
}

/** The location for a copy (0 = none). `locations` in list order: on a tie the one higher up wins. */
export function pickLocation(locations: readonly LocationLike[], c: CopyInfo): number {
  let best: LocationLike | null = null,
    bs = -1;
  for (const l of locations) {
    if (!ruleAccepts(l.rule, c)) continue;
    const sc = ruleScore(l.rule);
    if (sc > bs) {
      best = l;
      bs = sc;
    }
  }
  return best ? best.id : 0;
}
