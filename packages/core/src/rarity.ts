// Rarity (from the catalog) and card type from the name (ex, GX, V…).

/** [short code, Spanish label, color class, filter group] */
export type RarityInfo = readonly [code: string, label: string, cls: string, group: RarityGroup];
export type RarityGroup = 'base' | 'rare' | 'ultra' | 'ir' | 'sir' | 'secret' | 'shiny' | 'promo';

// rarity from the API → [short code, Spanish label, color class, filter group]
export const RARITY: Record<string, RarityInfo> = {
  Common: ['C', 'Común', 'r-c', 'base'],
  Uncommon: ['U', 'Poco común', 'r-c', 'base'],
  Rare: ['R', 'Rara', 'r-r', 'rare'],
  'Rare Holo': ['H', 'Rara holo', 'r-h', 'rare'],
  Promo: ['PR', 'Promo', 'r-pr', 'promo'],
  'Double Rare': ['DR', 'Doble rara', 'r-dr', 'ultra'],
  'Rare Ultra': ['UR', 'Ultra rara (full art)', 'r-ur', 'ultra'],
  'Ultra Rare': ['UR', 'Ultra rara (full art)', 'r-ur', 'ultra'],
  'Illustration Rare': ['IR', 'Ilustración rara', 'r-ir', 'ir'],
  'Special Illustration Rare': ['SIR', 'Ilustración rara especial', 'r-sir', 'sir'],
  'Hyper Rare': ['HR', 'Hiper rara (dorada)', 'r-hr', 'secret'],
  'Mega Hyper Rare': ['MHR', 'Mega hiper rara', 'r-hr', 'secret'],
  'Rare Secret': ['SR', 'Secreta', 'r-hr', 'secret'],
  'Rare Rainbow': ['RB', 'Arcoíris', 'r-rb', 'secret'],
  'ACE SPEC Rare': ['ACE', 'AS Táctico', 'r-ace', 'ultra'],
  'Rare ACE': ['ACE', 'AS Táctico', 'r-ace', 'ultra'],
  'Rare Holo EX': ['H', 'Rara holo EX', 'r-h', 'rare'],
  'Rare Holo GX': ['H', 'Rara holo GX', 'r-h', 'rare'],
  'Rare Holo V': ['H', 'Rara holo V', 'r-h', 'rare'],
  'Rare Holo VMAX': ['H', 'Rara holo VMAX', 'r-h', 'rare'],
  'Rare Holo VSTAR': ['H', 'Rara holo VSTAR', 'r-h', 'rare'],
  'Rare Holo LV.X': ['H', 'Rara holo LV.X', 'r-h', 'rare'],
  'Rare BREAK': ['BRK', 'Rara BREAK', 'r-h', 'rare'],
  'Rare Prism Star': ['◇', 'Prisma', 'r-h', 'rare'],
  'Rare Prime': ['PRM', 'Prime', 'r-h', 'rare'],
  'Rare Holo Star': ['★', 'Estrella', 'r-hr', 'secret'],
  LEGEND: ['LGD', 'LEYENDA', 'r-h', 'rare'],
  'Rare Shining': ['SHN', 'Brillante', 'r-sh', 'shiny'],
  'Rare Shiny': ['S', 'Variocolor', 'r-sh', 'shiny'],
  'Shiny Rare': ['S', 'Variocolor', 'r-sh', 'shiny'],
  'Rare Shiny GX': ['S', 'Variocolor GX', 'r-sh', 'shiny'],
  'Shiny Ultra Rare': ['SSR', 'Variocolor ultra', 'r-sh', 'shiny'],
  'Radiant Rare': ['RAD', 'Radiante', 'r-sh', 'shiny'],
  'Amazing Rare': ['AR', 'Asombrosa', 'r-rb', 'secret'],
  'Trainer Gallery Rare Holo': ['TG', 'Galería de entrenador', 'r-ir', 'ir'],
  'Pikachu Rare': ['PK', 'Pikachu rara', 'r-r', 'rare'],
  MEGA_ATTACK_RARE: ['MAR', 'Mega ataque rara', 'r-ur', 'ultra'],
  'Character Rare': ['CHR', 'Character Rare (personaje)', 'r-ir', 'ir'],
  'Classic Collection': ['CC', 'Classic Collection', 'r-hr', 'secret'],
  'Holo Rare V': ['H', 'Rara holo V', 'r-h', 'rare'],
  'Holo Rare VMAX': ['H', 'Rara holo VMAX', 'r-h', 'rare'],
  'Holo Rare VSTAR': ['H', 'Rara holo VSTAR', 'r-h', 'rare'],
  None: ['', 'Sin rareza', 'r-c', 'base'],
  'No Rarity': ['', 'Sin rareza', 'r-c', 'base'],
  'Futuristic Rare': ['FR', 'Futurista', 'r-ur', 'ultra'],
  'Black White Rare': ['BWR', 'Blanco y negro', 'r-hr', 'secret'],
};

/** filter groups for the UI; 'mech' = cards with ex, GX, V… in the name */
export const RGROUPS: ReadonlyArray<readonly [RarityGroup | 'mech', string]> = [
  ['base', 'Comunes y poco comunes'],
  ['rare', 'Raras y holo'],
  ['ultra', 'Doble rara, ultra rara, AS'],
  ['ir', 'IR (ilustración rara)'],
  ['sir', 'SIR (ilustración especial)'],
  ['secret', 'Hiper, secretas, arcoíris'],
  ['shiny', 'Variocolor y radiantes'],
  ['promo', 'Promos'],
  ['mech', 'Con mecánica (ex, GX, V…)'],
];

const RARITY_LC: Record<string, RarityInfo> = Object.fromEntries(Object.entries(RARITY).map(([k, v]) => [k.toLowerCase(), v]));

/** Known rarity, or an improvised one (initials) for rarities we don't know yet, which count as 'rare'. */
export function rarityOf(r: string | null | undefined): RarityInfo | null {
  return (
    RARITY[r ?? ''] ||
    RARITY_LC[String(r || '').toLowerCase()] ||
    (r
      ? [
          r
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .toUpperCase(),
          r,
          'r-r',
          'rare',
        ]
      : null)
  );
}

// card type from its name: Charizard ex, Mewtwo-EX, Pikachu & Zekrom-GX, Eternatus VMAX…
export function mechOf(name: string | null | undefined): string {
  const n = name || '';
  if (/\bVMAX\b/.test(n)) return 'VMAX';
  if (/\bVSTAR\b/.test(n)) return 'VSTAR';
  if (/\bV-UNION\b/.test(n)) return 'V-UNION';
  if (/([- ]|[^\x00-\x7F])GX\b/.test(n)) return n.includes('&') ? 'TAG TEAM' : 'GX';
  if (/(-|[^\x00-\x7F])EX\b/.test(n)) return 'EX';
  if (/( |[^\x00-\x7F])ex\b/.test(n)) return 'ex';
  if (/(^|[^A-Za-z])V$/.test(n)) return 'V';
  if (/\bBREAK\b/.test(n)) return 'BREAK';
  if (/LV\.X/.test(n)) return 'LV.X';
  if (/◇|\{\*\}/.test(n)) return 'Prisma';
  if (/★|\bStar\b/.test(n)) return '★';
  if (/^Radiant /.test(n)) return 'Radiante';
  if (/^(M|Mega) /.test(n)) return 'Mega';
  return '';
}

export const rarityGroup = (rarity: string | null | undefined): RarityGroup => {
  const r = rarityOf(rarity);
  return r ? r[3] : 'base';
};
/** f: a rarity group, 'mech' (has ex/GX/V… in the name) or '' (any) */
export const rarityMatches = (f: string, rarity: string | null | undefined, name: string | null | undefined): boolean =>
  !f || (f === 'mech' ? !!mechOf(name) : rarityGroup(rarity) === f);
