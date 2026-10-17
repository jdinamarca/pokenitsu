// Cajas y carpetas (cajas-y-carpetas-en-arma): what each location holds, computed from Mi inventario's rows,
// and what the rules need to know about a row. The rules themselves (chips, warnings, the plan) are in @pokenitsu/core.
import { autoAssignPlan, eraOf, type CopyInfo, type LocationFull, type LocationKind, type RuleTextCtx } from '@pokenitsu/core';
import type { CardSet, InvLocation, InvRow } from './api.ts';
import { clp, pictureOf } from './load.ts';

export interface LocStats {
  qty: number;
  /** every copy at its price (personal ones too: a binder's worth) */
  value: number;
  sets: number;
  /** pictures of its cards, the most valuable first, each once */
  cards: string[];
}
export const NO_STATS: LocStats = { qty: 0, value: 0, sets: 0, cards: [] };

/** each location's copies, expansions, value and best cards; rows whose location no longer exists count as without one (0) */
export function locationStats(rows: InvRow[], locations: Pick<InvLocation, 'id'>[], price: (r: InvRow) => number): Map<number, LocStats> {
  const known = new Set(locations.map(l => l.id));
  const acc = new Map<number, { qty: number; value: number; sets: Set<string>; cards: { src: string; clp: number }[] }>();
  for (const r of rows) {
    const id = known.has(r.loc) ? r.loc : 0;
    const e = acc.get(id) || { qty: 0, value: 0, sets: new Set<string>(), cards: [] };
    const p = price(r);
    e.qty += r.qty;
    e.value += p * r.qty;
    e.sets.add(r.sid);
    const src = pictureOf(r.own_img, r.own_card, r.img, r.local, null).src;
    if (src) e.cards.push({ src, clp: p });
    acc.set(id, e);
  }
  const out = new Map<number, LocStats>();
  for (const [id, e] of acc) {
    const seen = new Set<string>();
    const cards = e.cards
      .sort((a, b) => b.clp - a.clp)
      .filter(c => !seen.has(c.src) && !!seen.add(c.src))
      .map(c => c.src);
    out.set(id, { qty: e.qty, value: e.value, sets: e.sets.size, cards });
  }
  return out;
}

/** what a rule needs about a row (personal is decided by the plan) */
export const rowCopyInfo =
  (price: (r: InvRow) => number | null) =>
  (r: InvRow): Omit<CopyInfo, 'personal'> => ({
    setId: r.sid,
    era: eraOf({ id: r.sid, source: r.set_source, series: r.set_series, code: r.set_code }),
    origin: r.set_lang || 'INT',
    name: r.name,
    rarity: r.rarity || '',
    variant: r.variant,
    price: () => price(r),
  });

/** the rows without location that the rules can place, with where each goes */
export const planFor = (rows: InvRow[], locations: InvLocation[], price: (r: InvRow) => number | null) =>
  autoAssignPlan(rows, sorted(locations), rowCopyInfo(price));

/** the locations in their list order */
export const sorted = <L extends Pick<InvLocation, 'pos' | 'id'>>(locations: L[]) =>
  [...locations].sort((a, b) => a.pos - b.pos || a.id - b.id);

export const asFull = (l: InvLocation): LocationFull => ({ ...l, kind: kindOf(l.kind), note: l.note || '' });
export const kindOf = (k: string): LocationKind => (k === 'binder' || k === 'other' ? k : 'box');
export const KIND: Record<LocationKind, { icon: string; name: string }> = {
  box: { icon: '📦', name: 'Caja' },
  binder: { icon: '📒', name: 'Carpeta' },
  other: { icon: '🗃️', name: 'Otra' },
};

// personal is violet, special or priced is gold, the rest take a color by position (Nitsu's palette)
const COLORS = ['#ff5a3c', '#5aa8ff', '#2fd28a', '#ff8a4c', '#ff6b9a', '#4fc3c9', '#e0b03a', '#8f96b0'];
export function locColor(l: Pick<InvLocation, 'rule'>, index: number): string {
  const r = l.rule || {};
  if (r.personal === true) return '#a77bff';
  if (r.special?.length || r.minPrice) return '#ffc83d';
  return COLORS[index % COLORS.length]!;
}

/** the texts' view of the catalog: printed codes and series of the expansions */
export function textCtx(sets: CardSet[]): RuleTextCtx {
  const byId = new Map(sets.map(s => [s.id, s]));
  return {
    setCode: id => byId.get(id)?.code || id,
    setEra: id => eraOf(byId.get(id)),
    clp,
  };
}

/** the international series, the newest first (the form's checkboxes) */
export function seriesList(sets: CardSet[]): string[] {
  const last = new Map<string, string>();
  for (const s of sets) if (s.source === 'ptcg' && s.series && (last.get(s.series) || '') < s.date) last.set(s.series, s.date);
  return [...last].sort((a, b) => b[1].localeCompare(a[1])).map(x => x[0]);
}

/** expansions typed by printed code or id ("MEW, PAF, sv8") → their ids, and the ones not found */
export function setsFromCodes(text: string, sets: CardSet[]): { ids: string[]; unknown: string[] } {
  const ids: string[] = [],
    unknown: string[] = [];
  for (const c of text
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)) {
    const lc = c.toLowerCase();
    const s = sets.find(s => s.code.toLowerCase() === lc || s.id.toLowerCase() === lc);
    if (s) ids.push(s.id);
    else unknown.push(c);
  }
  return { ids, unknown };
}
