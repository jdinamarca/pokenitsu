// Where a copy is stored: boxes for bulk, binders for the valuable ones…
// Among the locations whose rule accepts a copy, the most specific one wins (see docs/adr/0005).
import { mechOf, RGROUPS, rarityGroup, rarityMatches } from './rarity.js';

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

// ---------- the Cajas y carpetas screen (cajas-y-carpetas-en-arma): the same words and warnings as Nitsu's Ubicaciones ----------

export type LocationKind = 'box' | 'binder' | 'other';
export interface LocationFull extends LocationLike {
  name: string;
  kind: LocationKind;
  note?: string;
}
/** what the texts need to know about the catalog */
export interface RuleTextCtx {
  /** an expansion's printed code (or its id) */
  setCode: (id: string) => string;
  /** an expansion's series in English (eraOf) */
  setEra?: (id: string) => string;
  /** CLP without decimals: $5.000 */
  clp: (n: number) => string;
}

const ORIGIN_CHIP: Record<string, string> = { INT: '🌎 Internacionales', JA: '🇯🇵 Japonesas', ZH: '🇨🇳 Chinas', KO: '🇰🇷 Coreanas' };
const ORIGIN_WORD: Record<string, string> = { INT: 'internacionales', JA: 'japonesas', ZH: 'chinas', KO: 'coreanas' };
const SPECIAL_CHIP: Record<string, string> = {
  base: 'Comunes',
  rare: 'Raras y holo',
  ultra: 'Full art',
  ir: 'IR',
  sir: 'SIR',
  secret: 'Secretas',
  shiny: 'Variocolor',
  promo: 'Promos',
  mech: 'ex · GX · V',
};

/** a location's rule in collector words, one chip per part */
export function ruleChips(r: LocationRule | null | undefined, ctx: RuleTextCtx): string[] {
  r = r || {};
  if (r.auto === false) return ['✋ Solo a mano'];
  const out: string[] = [];
  if (r.personal === true) out.push('🔒 Colección personal');
  if (r.personal === false) out.push('💰 Para vender');
  if (r.bulk) out.push('Challa');
  for (const x of r.series || []) out.push(x);
  if (r.sets?.length) out.push(r.sets.map(ctx.setCode).join(' · '));
  for (const o of r.origin || []) out.push(ORIGIN_CHIP[o] || o);
  if (r.special?.length) out.push('✨ ' + r.special.map(g => SPECIAL_CHIP[g] || g).join(' · '));
  if (r.minPrice) out.push(`${r.special?.length ? 'o ' : ''}desde ${ctx.clp(r.minPrice)}`);
  return out.length ? out : ['📦 Todo lo demás'];
}

/** the whole rule in one sentence (the chips' help) */
export function describeRule(r: LocationRule | null | undefined, ctx: RuleTextCtx): string {
  r = r || {};
  if (r.auto === false) return 'Solo a mano (no se asigna sola)';
  const parts: string[] = [];
  if (r.personal === true) parts.push('copias de tu colección personal');
  if (r.personal === false) parts.push('copias para vender');
  if (r.bulk) parts.push('challa (común, poco común, rara o rara holo sin ex/GX/V…; normal, holo o reverse)');
  if (r.series) parts.push('serie ' + r.series.join(', '));
  if (r.sets) parts.push('expansiones ' + r.sets.map(ctx.setCode).join(', '));
  if (r.origin) parts.push(r.origin.map(o => ORIGIN_WORD[o] || o).join(' y '));
  const label = (g: string) => RGROUPS_LABEL[g] || g;
  const sp = [...(r.special || []).map(label), ...(r.minPrice ? [`valen ${ctx.clp(r.minPrice)} o más`] : [])];
  if (sp.length) parts.push(sp.join(' o '));
  return parts.length ? 'Cartas: ' + parts.join(' · ') : 'Todo lo que no calce en las anteriores (caja general)';
}
const RGROUPS_LABEL: Record<string, string> = Object.fromEntries(RGROUPS);

export interface Shadow {
  /** the location that takes those cards first */
  by: LocationFull;
  /** which cards: series names, expansion codes or "todas sus cartas" */
  what: string;
}
/**
 * Cards this location asks for that another one takes first: one more specific, or as specific and higher in the list.
 * Only when that one takes ALL of those cards, not just a part (only special, only bulk, only personal, other regions…).
 */
export function locationShadows(locations: readonly LocationFull[], l: LocationFull, ctx: RuleTextCtx): Shadow[] {
  const r = l.rule || {},
    out: Shadow[] = [];
  if (r.auto === false) return out;
  const idx = locations.indexOf(l),
    mine = ruleScore(r);
  for (const e of locations) {
    const q = e.rule || {};
    if (e === l || !(ruleScore(q) > mine || (ruleScore(q) === mine && locations.indexOf(e) < idx))) continue;
    if (q.auto === false || q.special || q.minPrice) continue;
    if (q.bulk && !r.bulk) continue;
    if (q.personal !== undefined && q.personal !== r.personal) continue;
    if (q.origin && !(r.origin && r.origin.every(x => q.origin!.includes(x)))) continue;
    if (q.sets && !q.series && !(r.sets || []).some(x => q.sets!.includes(x))) continue;
    let what: string;
    if (!q.series && !q.sets) what = r.series ? r.series.join(', ') : r.sets ? 'esas expansiones' : 'todas sus cartas';
    else if (r.series) {
      const both = r.series.filter(x => (q.series || []).includes(x));
      if (!both.length) continue;
      what = both.join(', ');
    } else if (r.sets) {
      const both = r.sets.filter(x => (q.sets || []).includes(x) || (q.series || []).includes(ctx.setEra?.(x) || ''));
      if (!both.length) continue;
      what = both.map(ctx.setCode).join(', ');
    } else continue;
    out.push({ by: e, what });
  }
  return out;
}

/** the copies without location that some rule takes: each row with where it goes (rows whose copies are all personal count as personal) */
export function autoAssignPlan<R extends { loc: number; qty: number; personal: number }>(
  rows: readonly R[],
  locations: readonly LocationLike[],
  info: (r: R) => Omit<CopyInfo, 'personal'>,
): { row: R; to: number }[] {
  const out: { row: R; to: number }[] = [];
  for (const row of rows) {
    if (row.loc || !row.qty) continue;
    const to = pickLocation(locations, { ...info(row), personal: row.personal >= row.qty });
    if (to) out.push({ row, to });
  }
  return out;
}

export interface NewLocation {
  name: string;
  kind: LocationKind;
  rule: LocationRule;
  note: string;
}
/** Nitsu's suggested order: 2 binders (personal, special from the alert price) and 6 boxes by series */
export function suggestedLocations(alert: number, clp: (n: number) => string): NewLocation[] {
  return [
    {
      name: 'Carpeta colección personal',
      kind: 'binder',
      rule: { personal: true },
      note: 'Tus colecciones (ej. Eevee), en el mismo orden que Mis colecciones: por fecha de lanzamiento.',
    },
    {
      name: 'Carpeta especiales',
      kind: 'binder',
      rule: { special: ['ultra', 'ir', 'sir', 'secret', 'shiny'], minPrice: alert, personal: false },
      note: `Lo valioso para vender: ex/V full art, IR, SIR, doradas, variocolor, y todo lo que vale más de ${clp(alert)}. Por expansión y número.`,
    },
    {
      name: 'Caja 1 · Mega Evolution',
      kind: 'box',
      rule: { series: ['Mega Evolution'], origin: ['INT'], bulk: true },
      note: 'Un separador por expansión (código: MEG, PFL, ASC…), del más antiguo al más nuevo; dentro, por número.',
    },
    {
      name: 'Caja 2 · Scarlet & Violet',
      kind: 'box',
      rule: { series: ['Scarlet & Violet'], origin: ['INT'], bulk: true },
      note: 'Un separador por expansión (código: MEW, PAF…), del más antiguo al más nuevo; dentro, por número.',
    },
    {
      name: 'Caja 3 · Sword & Shield',
      kind: 'box',
      rule: { series: ['Sword & Shield'], origin: ['INT'], bulk: true },
      note: 'Un separador por expansión, dentro por número.',
    },
    {
      name: 'Caja 4 · Sun & Moon y XY',
      kind: 'box',
      rule: { series: ['Sun & Moon', 'XY'], origin: ['INT'], bulk: true },
      note: 'Un separador por expansión, dentro por número.',
    },
    {
      name: 'Caja 5 · Japonesas y otras',
      kind: 'box',
      rule: { origin: ['JA', 'ZH', 'KO'], bulk: true },
      note: 'Un separador por expansión japonesa (código impreso, ej. SV2a).',
    },
    {
      name: 'Caja 6 · Antiguas y otras',
      kind: 'box',
      rule: {},
      note: 'Todo lo demás: Black & White y anteriores, promos raras… Por expansión y número.',
    },
  ];
}
