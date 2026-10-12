// Personal collections that follow a checklist: each checklist variant is a slot of its own.
import { BULK_VARIANTS } from './locations.js';

export interface ChecklistVariant {
  slug: string;
  type?: string | null;
}
export interface SlotLike {
  v: ChecklistVariant;
  vlist?: readonly ChecklistVariant[] | null;
}

/**
 * Inventory variants that count for a slot. When the card's only standard print has a special name
 * ("Cosmos Holo", a stamp…), a normal or holo copy is that print, so it counts too.
 */
export function slotVariants(sl: SlotLike): string[] {
  const out = [sl.v.slug];
  if (sl.v.type === 'default' && !BULK_VARIANTS.includes(sl.v.slug) && !(sl.vlist || []).some(x => ['normal', 'holo'].includes(x.slug)))
    out.push('normal', 'holo');
  return out;
}
