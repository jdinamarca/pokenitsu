// The level of a copy, from bulk ("challa") to gold/secret: "with what did I complete Kanto?"
// Names and order: docs/producto/mapa-de-funcionalidades.md. Computed from the card's rarity, its name (ex, V, GX…) and the copy's variant.
import { mechOf, rarityGroup } from './rarity.js';

export const TIERS = [
  { id: 'challa', rank: 1, label: 'Challa', short: 'Challa' },
  { id: 'holo', rank: 2, label: 'Challa holo', short: 'Holo' },
  { id: 'exvgx', rank: 3, label: 'ex/V/GX', short: 'ex/V/GX' },
  { id: 'especial', rank: 4, label: 'Edición especial', short: 'Especial' },
  { id: 'variocolor', rank: 5, label: 'Variocolor', short: 'Variocolor' },
  { id: 'fullart', rank: 6, label: 'Full art', short: 'Full art' },
  { id: 'ir', rank: 7, label: 'Ilustración (IR)', short: 'IR' },
  { id: 'sir', rank: 8, label: 'Ilustración especial (SIR)', short: 'SIR' },
  { id: 'dorada', rank: 9, label: 'Dorada/Secreta', short: 'Dorada' },
] as const;
export type TierId = (typeof TIERS)[number]['id'];
export type Tier = (typeof TIERS)[number];
export const TIER_BY_ID = Object.fromEntries(TIERS.map(t => [t.id, t])) as Record<TierId, Tier>;

// regular (not full art) ex / VMAX: in the "ultra" rarity group, but a plain ex/V/GX for collectors
const NOT_FULL_ART = ['double rare', 'triple rare'];
const PLAIN_VARIANTS = ['normal', 'holo', 'reverse'];

/** The first rule that applies wins, from the highest level down. Promos have no rule of their own. */
export function cardTier(card: { name: string | null | undefined; rarity: string | null | undefined }, variant: string): Tier {
  const g = rarityGroup(card.rarity),
    r = String(card.rarity || '').toLowerCase();
  const id: TierId =
    g === 'secret'
      ? 'dorada'
      : g === 'sir'
        ? 'sir'
        : g === 'ir'
          ? 'ir'
          : g === 'ultra' && !NOT_FULL_ART.includes(r)
            ? 'fullart'
            : g === 'shiny'
              ? 'variocolor'
              : !PLAIN_VARIANTS.includes(variant)
                ? 'especial'
                : mechOf(card.name) || NOT_FULL_ART.includes(r)
                  ? 'exvgx'
                  : variant !== 'normal' || r.includes('holo')
                    ? 'holo'
                    : 'challa';
  return TIER_BY_ID[id];
}
