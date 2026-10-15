// The shared variant list of a card: finish + optional stamp or product (Battle Academy with its deck and number).
// Slugs of the standard prints never change, so copies already in the inventory keep counting.

export const FINISHES = ['normal', 'holo', 'reverse', 'cosmos', 'reversecosmos', 'pokeball', 'masterball'] as const;
export type Finish = (typeof FINISHES)[number];

const FINISH_SLUG: Record<Finish, string> = {
  normal: 'normal',
  holo: 'holo',
  reverse: 'reverse',
  cosmos: 'cosmosholo',
  reversecosmos: 'reversecosmos',
  pokeball: 'pokeballholo',
  masterball: 'masterballholo',
};
const FINISH_LABEL: Record<Finish, string> = {
  normal: 'Normal',
  holo: 'Holo',
  reverse: 'Reverse',
  cosmos: 'Holo cosmos',
  reversecosmos: 'Reverse cosmos',
  pokeball: 'Poké Ball',
  masterball: 'Master Ball',
};
// stamps and products the owner picks from, plus the ones TCGdex names
export const STAMP_LABEL: Record<string, string> = {
  '1st-edition': '1st Edition',
  prerelease: 'Prerelease',
  staff: 'Staff',
  'pokemon-center': 'Pokémon Center',
  'play-pokemon': 'Play! Pokémon',
  league: 'Liga',
  'battle-academy': 'Battle Academy',
  'set-logo': 'Logo de la expansión',
  snowflake: 'Snowflake',
  'pokemon-together': 'Pokémon Together',
  'jr-stamp-rally': 'JR Stamp Rally',
  platinum: 'Platinum',
  'jun-hasebe': 'Jun Hasebe',
  jumbo: 'Jumbo',
};

export interface VariantSpec {
  finish: Finish;
  /** a STAMP_LABEL key or free text ("Otro…"); empty = no stamp */
  stamp?: string | null;
  /** Battle Academy only */
  deck?: string | null;
  deckNo?: string | null;
}

/** "Pokémon Center" → "pokemon-center": lower case, no accents, dashes */
export const slugify = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const stampKey = (s: VariantSpec): string => slugify(s.stamp);

export function variantSlug(s: VariantSpec): string {
  const f = FINISH_SLUG[s.finish],
    st = stampKey(s);
  if (!st) return f;
  if (st === '1st-edition' && s.finish === 'normal') return 'firstedition';
  if (st === 'battle-academy') return `${f}~ba-${slugify(s.deck) || 'mazo'}-${slugify(s.deckNo) || 'x'}`;
  return `${f}~${st}`;
}

export function variantLabel(s: VariantSpec): string {
  const st = stampKey(s);
  if (st === '1st-edition' && s.finish === 'normal') return '1st Edition';
  const f = FINISH_LABEL[s.finish];
  if (!st) return f;
  if (st === 'battle-academy')
    return `${f} · Battle Academy · ${String(s.deck || '').trim() || '?'} #${String(s.deckNo || '').trim() || '?'}`;
  const known = STAMP_LABEL[st];
  return `${f} · ${known || String(s.stamp).trim()}`;
}

/** 'default': one of the card's standard prints (see slotVariants); 'variant': stamped or product-only */
export const variantType = (s: VariantSpec): 'default' | 'variant' =>
  stampKey(s) || ['pokeball', 'masterball', 'reversecosmos'].includes(s.finish) ? 'variant' : 'default';

// ---------- suggestions from the two sources ----------
export type VariantSource = 'tcgdex' | 'tcgplayer';
export interface TcgdexVariant {
  type?: string | null;
  foil?: string | null;
  stamp?: readonly string[] | null;
  size?: string | null;
}
export interface Suggestion extends VariantSpec {
  slug: string;
  label: string;
  type: 'default' | 'variant';
  sources: VariantSource[];
}

function fromTcgdex(v: TcgdexVariant): VariantSpec | null {
  const t = v.type === 'holo' || v.type === 'reverse' ? v.type : v.type === 'normal' ? 'normal' : null;
  if (!t) return null;
  let finish: Finish = t;
  if (v.foil === 'pokeball') finish = 'pokeball';
  else if (v.foil === 'masterball') finish = 'masterball';
  else if (v.foil === 'cosmos') finish = t === 'reverse' ? 'reversecosmos' : 'cosmos';
  const stamps = [...(v.stamp || [])];
  if (v.size && v.size !== 'standard') stamps.push(v.size);
  return { finish, stamp: stamps.join('+') || null };
}
// TCGplayer price keys (pokemontcg.io) → print
function fromTcgplayer(k: string): VariantSpec | null {
  if (k === 'normal' || k === 'unlimited' || k === 'unlimitedNormal') return { finish: 'normal' };
  if (k === 'holofoil' || k === 'unlimitedHolofoil') return { finish: 'holo' };
  if (k === 'reverseHolofoil') return { finish: 'reverse' };
  if (k === '1stEdition' || k === '1stEditionNormal') return { finish: 'normal', stamp: '1st-edition' };
  if (k === '1stEditionHolofoil') return { finish: 'holo', stamp: '1st-edition' };
  return null;
}

const ORDER: Finish[] = ['normal', 'holo', 'cosmos', 'reverse', 'reversecosmos', 'pokeball', 'masterball'];

/**
 * The card's variants according to TCGdex (variants_detailed) and TCGplayer (price keys), each print once:
 * the two sources name some prints differently (a promo's holo is TCGdex's cosmos holo; a GX promo is "normal"
 * at TCGdex and holo at TCGplayer; Futsal's holo is "normal" at TCGplayer).
 */
export function suggestVariants(
  tcgdex: readonly TcgdexVariant[] | null | undefined,
  tcgplayer: readonly string[] | null | undefined,
): Suggestion[] {
  const map = new Map<string, Suggestion>();
  const add = (s: VariantSpec | null, src: VariantSource) => {
    if (!s) return;
    const slug = variantSlug(s);
    const cur = map.get(slug);
    if (cur) {
      if (!cur.sources.includes(src)) cur.sources.push(src);
      return;
    }
    map.set(slug, { ...s, stamp: s.stamp || null, slug, label: variantLabel(s), type: variantType(s), sources: [src] });
  };
  const td = (tcgdex || []).map(fromTcgdex).filter((x): x is VariantSpec => !!x);
  const tp = (tcgplayer || []).map(fromTcgplayer).filter((x): x is VariantSpec => !!x);
  const plain = (xs: VariantSpec[], f: Finish) => xs.some(x => x.finish === f && !x.stamp);
  const tdHolo = plain(td, 'holo'),
    tdCosmos = plain(td, 'cosmos'),
    tdNormal = plain(td, 'normal');
  const tpHolo = plain(tp, 'holo'),
    tpNormal = plain(tp, 'normal');
  td.forEach(s => add(s, 'tcgdex'));
  for (const s of tp) {
    let x: VariantSpec = s;
    if (!s.stamp && s.finish === 'holo' && !tdHolo && tdCosmos) x = { finish: 'cosmos' };
    else if (!s.stamp && s.finish === 'normal' && !tdNormal && (tdHolo || tdCosmos) && !tpHolo) x = { finish: tdHolo ? 'holo' : 'cosmos' };
    add(x, 'tcgplayer');
  }
  // a print TCGdex calls normal that TCGplayer only has as holo is that holo
  if (tpHolo && !tpNormal && tdNormal && !tdHolo && !tdCosmos && map.has('normal') && map.has('holo')) {
    map.get('holo')!.sources = ['tcgdex', 'tcgplayer'];
    map.delete('normal');
  }
  return [...map.values()].sort(
    (a, b) => (a.stamp ? 1 : 0) - (b.stamp ? 1 : 0) || ORDER.indexOf(a.finish) - ORDER.indexOf(b.finish) || a.label.localeCompare(b.label),
  );
}
