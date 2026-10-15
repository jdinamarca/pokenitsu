// "Arma tu colección" (ADR 0020): the Full of printings of a Pokémon and the rules that reduce it to a collection.
// A printing is card (set + number) × language × variant (finish + optional stamp or product). Pure functions only.
import { normNumber } from './entry.js';

export const ARMA_FINISHES = ['normal', 'holo', 'reverse', 'cosmos', 'reversecosmos', 'pokeball', 'masterball'] as const;
export type ArmaFinish = (typeof ARMA_FINISHES)[number];
export interface ArmaVariant {
  finish: ArmaFinish;
  /** stamp or product slug (1st-edition, set-logo, jumbo, world-championships-2007-jun-hasebe…), null when none */
  stamp: string | null;
  /** how a source named it, for the label when we have no translation */
  label?: string;
}

const FINISH_CODE: Record<ArmaFinish, string> = {
  normal: 'N',
  holo: 'H',
  reverse: 'R',
  cosmos: 'HC',
  reversecosmos: 'RC',
  pokeball: 'PB',
  masterball: 'MB',
};
export const FINISH_LABEL: Record<ArmaFinish, string> = {
  normal: 'Normal',
  holo: 'Holo',
  reverse: 'Reverse',
  cosmos: 'Holo cosmos',
  reversecosmos: 'Reverse cosmos',
  pokeball: 'Poké Ball',
  masterball: 'Master Ball',
};
export const STAMP_LABEL: Record<string, string> = {
  '1st-edition': '1st Edition',
  'set-logo': 'Sello de la expansión',
  jumbo: 'Jumbo',
  prerelease: 'Prerelease',
  staff: 'Staff',
  'pokemon-center': 'Pokémon Center',
  'jr-stamp-rally': 'JR Stamp Rally',
  'pokemon-together': 'Pokémon Together',
  snowflake: 'Copo de nieve',
  'pokemon-card-gym': 'Pokémon TCG Gym',
  glossy: 'Glossy',
  'starlight-holo': 'Starlight Holo',
};

/** "Pokémon Card Gym" / "pokemonCardGym" → "pokemon-card-gym" */
export const slug = (s: unknown): string =>
  String(s ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// the same stamp under each source's name
const STAMP_ALIAS: Record<string, string> = {
  'first-edition': '1st-edition',
  '1st-edition': '1st-edition',
  'set-stamp': 'set-logo',
  'expansion-stamp': 'set-logo',
  'jr-east-rally-2000': 'jr-stamp-rally',
  'pokemon-card-gym': 'pokemon-card-gym',
};
export const stampKey = (s: unknown): string | null => {
  const k = slug(s);
  return k ? STAMP_ALIAS[k] || k : null;
};

export const variantLabel = (v: ArmaVariant): string => {
  const f = FINISH_LABEL[v.finish];
  if (!v.stamp) return f;
  if (v.stamp === '1st-edition' && v.finish === 'normal') return '1st Edition';
  const s = STAMP_LABEL[v.stamp] || v.label || v.stamp;
  return v.finish === 'normal' ? s : `${f} · ${s}`;
};

// ---------- each source's variant names → finish + stamp ----------
export interface TcgdexVariantDetail {
  type?: string | null;
  foil?: string | null;
  stamp?: readonly string[] | null;
  size?: string | null;
}
export function variantFromTcgdex(v: TcgdexVariantDetail): ArmaVariant | null {
  const t = v.type === 'holo' || v.type === 'reverse' || v.type === 'normal' ? v.type : null;
  if (!t) return null;
  let finish: ArmaFinish = t;
  if (v.foil === 'pokeball') finish = 'pokeball';
  else if (v.foil === 'masterball') finish = 'masterball';
  else if (v.foil === 'cosmos') finish = t === 'reverse' ? 'reversecosmos' : 'cosmos';
  const stamps = [...(v.stamp || [])].map(stampKey).filter((x): x is string => !!x);
  if (v.size && v.size !== 'standard') stamps.push(stampKey(v.size)!);
  return { finish, stamp: stamps.join('+') || null };
}
/** TCGplayer price keys from pokemontcg.io */
export function variantFromTcgplayer(k: string): ArmaVariant | null {
  if (k === 'normal' || k === 'unlimited' || k === 'unlimitedNormal') return { finish: 'normal', stamp: null };
  if (k === 'holofoil' || k === 'unlimitedHolofoil') return { finish: 'holo', stamp: null };
  if (k === 'reverseHolofoil') return { finish: 'reverse', stamp: null };
  if (k === '1stEdition' || k === '1stEditionNormal') return { finish: 'normal', stamp: '1st-edition' };
  if (k === '1stEditionHolofoil') return { finish: 'holo', stamp: '1st-edition' };
  return null;
}
/** PokeCottage master-set entries: variantId (pokeBallHolo, firstEditionReverseHolo, charizarddeck…) and its label */
export function variantFromPokecottage(variantId: string, label?: string): ArmaVariant {
  const id = String(variantId);
  const base: Record<string, ArmaFinish> = {
    standard: 'normal',
    holo: 'holo',
    reverseHolo: 'reverse',
    cosmosHolo: 'cosmos',
    pokeBallHolo: 'pokeball',
    masterBallHolo: 'masterball',
  };
  if (base[id]) return { finish: base[id], stamp: null };
  if (id === 'firstEdition') return { finish: 'normal', stamp: '1st-edition' };
  if (id === 'firstEditionReverseHolo') return { finish: 'reverse', stamp: '1st-edition' };
  if (id === 'starlightHolo') return { finish: 'holo', stamp: 'starlight-holo' };
  return { finish: 'normal', stamp: stampKey(id), ...(label ? { label } : {}) };
}
/** inventory variant slugs of the current app (normal, firstedition, pokeballholo, normal~ba-charizard-12…) */
export function variantFromInventory(v: string): ArmaVariant {
  const known: Record<string, ArmaVariant> = {
    normal: { finish: 'normal', stamp: null },
    holo: { finish: 'holo', stamp: null },
    reverse: { finish: 'reverse', stamp: null },
    firstedition: { finish: 'normal', stamp: '1st-edition' },
    pokeballholo: { finish: 'pokeball', stamp: null },
    masterballholo: { finish: 'masterball', stamp: null },
    cosmosholo: { finish: 'cosmos', stamp: null },
    reversecosmos: { finish: 'reversecosmos', stamp: null },
  };
  if (known[v]) return known[v];
  const [f, s] = v.split('~');
  const finish = (ARMA_FINISHES as readonly string[]).includes(f!) ? (f as ArmaFinish) : 'normal';
  return { finish, stamp: stampKey(s ?? v) };
}

// ---------- identity ----------
export interface PrintingId {
  setKey: string;
  number: string;
  lang: string;
  finish: ArmaFinish;
  stamp: string | null;
}
export const printingKey = (p: PrintingId): string => `${p.setKey}|${normNumber(p.number)}|${p.lang}|${p.finish}|${p.stamp || ''}`;
/** stable catalog code: EEV·SV3PT5·133·EN·N, a stamp after ~ (EEV·BASE2·51·EN·N~1ST-EDITION) */
export const catalogCode = (prefix: string, p: PrintingId): string =>
  [prefix, p.setKey.toUpperCase(), normNumber(p.number), p.lang, FINISH_CODE[p.finish] + (p.stamp ? '~' + p.stamp.toUpperCase() : '')].join(
    '·',
  );

// ---------- merging what the sources claim ----------
export type ArmaField = 'exists' | 'name' | 'number' | 'artist' | 'image' | 'price' | 'equivalence' | 'variant';
export interface Claim extends PrintingId {
  source: string;
  ref?: string;
  name?: string;
  artist?: string;
  image?: string;
  /** price as the source states it ("US$ 0.25") */
  price?: string;
  release?: string;
  setName?: string;
  cardId?: string;
  designId?: string;
  label?: string;
}
export interface Fact {
  field: ArmaField;
  source: string;
  value: string | null;
  ref: string | null;
}
export interface MergedPrinting extends PrintingId {
  key: string;
  name: string | null;
  artist: string | null;
  setName: string | null;
  release: string | null;
  cardId: string | null;
  designId: string | null;
  label: string | null;
  facts: Fact[];
}

const first = <T>(xs: (T | undefined)[]): T | null => xs.find(x => x !== undefined && x !== null && x !== '') ?? null;

/**
 * One printing per (set, number, language, finish, stamp), with every source behind each fact. Before grouping,
 * prints the sources name differently are reconciled per card: a promo's TCGplayer "holo" is TCGdex's cosmos holo;
 * a TCGdex "normal" that TCGplayer only has as holo is that holo; a TCGplayer "normal" TCGdex only has as holo is it.
 */
export function mergeClaims(claims: readonly Claim[]): MergedPrinting[] {
  const card = (c: Claim) => `${c.setKey}|${normNumber(c.number)}|${c.lang}`;
  const byCard = new Map<string, Claim[]>();
  for (const c of claims) byCard.set(card(c), [...(byCard.get(card(c)) || []), c]);
  const fixed: Claim[] = [];
  for (const list of byCard.values()) {
    const has = (src: string, f: ArmaFinish) => list.some(c => c.source === src && c.finish === f && !c.stamp);
    const td = (f: ArmaFinish) => has('tcgdex', f),
      tp = (f: ArmaFinish) => has('tcgplayer', f);
    for (const c of list) {
      let finish = c.finish;
      if (c.source === 'tcgplayer' && !c.stamp) {
        if (finish === 'holo' && !td('holo') && td('cosmos')) finish = 'cosmos';
        else if (finish === 'normal' && !td('normal') && (td('holo') || td('cosmos')) && !tp('holo'))
          finish = td('holo') ? 'holo' : 'cosmos';
      }
      if (c.source === 'tcgdex' && !c.stamp && finish === 'normal' && tp('holo') && !tp('normal') && !td('holo') && !td('cosmos'))
        finish = 'holo';
      fixed.push(finish === c.finish ? c : { ...c, finish });
    }
  }
  const map = new Map<string, Claim[]>();
  for (const c of fixed) map.set(printingKey(c), [...(map.get(printingKey(c)) || []), c]);
  return [...map.entries()].map(([key, cs]) => {
    const c0 = cs[0]!;
    const facts: Fact[] = [];
    const add = (field: ArmaField, c: Claim, value: string | null | undefined) => {
      if (value === undefined || value === null || value === '') return;
      if (!facts.some(f => f.field === field && f.source === c.source)) facts.push({ field, source: c.source, value, ref: c.ref ?? null });
    };
    for (const c of cs) {
      add('exists', c, 'true');
      add('variant', c, c.label || variantLabel(c));
      add('name', c, c.name);
      add('number', c, c.number);
      add('artist', c, c.artist);
      add('image', c, c.image);
      add('price', c, c.price);
    }
    return {
      key,
      setKey: c0.setKey,
      number: first(cs.map(c => c.number)) || c0.number,
      lang: c0.lang,
      finish: c0.finish,
      stamp: c0.stamp,
      name: first(cs.map(c => c.name)),
      artist: first(cs.map(c => c.artist)),
      setName: first(cs.map(c => c.setName)),
      release: first(cs.map(c => c.release)),
      cardId: first(cs.map(c => c.cardId)),
      designId: first(cs.map(c => c.designId)),
      label: first(cs.map(c => c.label)),
      facts,
    };
  });
}

// ---------- equivalences ----------
/** a source saying two cards (set + number) are the same design, e.g. Bulbapedia's English and Japanese releases */
export interface DesignLink {
  a: { setKey: string; number: string };
  b: { setKey: string; number: string };
  source: string;
}
export interface Equivalence {
  id: string;
  keys: string[];
  sources: string[];
}
/**
 * Printings that only differ in language or region: the same international card (set + number) in every language,
 * plus the cards a source links as one design; always the same finish and stamp.
 */
export function buildEquivalences(printings: readonly MergedPrinting[], links: readonly DesignLink[] = []): Equivalence[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const cardKey = (setKey: string, number: string) => `${setKey}|${normNumber(number)}`;
  const union = (a: string, b: string) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  const viaLinks = new Map<string, Set<string>>();
  for (const l of links) {
    const a = cardKey(l.a.setKey, l.a.number),
      b = cardKey(l.b.setKey, l.b.number);
    union(a, b);
    for (const k of [a, b]) viaLinks.set(k, new Set([...(viaLinks.get(k) || []), l.source]));
  }
  const groups = new Map<string, { keys: string[]; sources: Set<string> }>();
  for (const p of printings) {
    const ck = cardKey(p.setKey, p.number);
    const g = `${find(ck)}|${p.finish}|${p.stamp || ''}`;
    const cur = groups.get(g) || { keys: [], sources: new Set<string>() };
    cur.keys.push(p.key);
    for (const s of viaLinks.get(ck) || []) cur.sources.add(s);
    for (const f of p.facts) if (f.field === 'exists') cur.sources.add(f.source);
    groups.set(g, cur);
  }
  return [...groups.entries()].map(([id, g]) => ({ id, keys: g.keys.sort(), sources: [...g.sources].sort() }));
}

// ---------- rules ----------
export interface ArmaRules {
  /** same design and variant in USA, LatAm and Europe: only the English one (western languages only) */
  onlyEnglish: boolean;
  /** Asian translations count as the Japanese one (JA, ZH-TW, ZH-CN, KO, TH, ID) */
  asiaAsJapanese: boolean;
  /** stamps, products and decks (1st Edition is always in) */
  stampsAndDecks: boolean;
  /** World Championship Decks */
  wcd: boolean;
  jumbo: boolean;
}
export const FULL_RULES: ArmaRules = { onlyEnglish: false, asiaAsJapanese: false, stampsAndDecks: true, wcd: true, jumbo: true };
// ES-MX: Latin American Spanish printings; ZH-TW / ZH-CN: traditional (Taiwan) and simplified (mainland) Chinese
export const WESTERN = ['EN', 'ES', 'ES-MX', 'FR', 'DE', 'IT', 'PT', 'PT-BR', 'NL', 'PL', 'RU'];
export const ASIAN = ['JA', 'ZH-TW', 'ZH-CN', 'KO', 'TH', 'ID'];
export type RuleId = keyof ArmaRules;
export interface RulePrinting {
  key: string;
  lang: string;
  stamp: string | null;
  equivId: string | null;
}
export interface RuleResult {
  in: boolean;
  /** the rule that leaves it out */
  by: RuleId | null;
}
const isWcd = (s: string | null) => !!s && s.includes('world-championship');
const isJumbo = (s: string | null) => !!s && s.split('+').includes('jumbo');

/** Which printings of the Full count for the collection. Nothing is ever removed from the Full: out means dimmed. */
export function applyRules(printings: readonly RulePrinting[], rules: ArmaRules): Map<string, RuleResult> {
  const out = new Map<string, RuleResult>();
  for (const p of printings) {
    let by: RuleId | null = null;
    if (isJumbo(p.stamp)) by = rules.jumbo ? null : 'jumbo';
    else if (isWcd(p.stamp)) by = rules.wcd ? null : 'wcd';
    else if (p.stamp && p.stamp !== '1st-edition' && !rules.stampsAndDecks) by = 'stampsAndDecks';
    out.set(p.key, { in: !by, by });
  }
  // within one equivalence keep one language per group: EN (else alphabetical) among western, JA (else the list order) among Asian
  const pick = (group: RulePrinting[], prefer: readonly string[]) =>
    [...group].sort((a, b) => {
      const ia = prefer.indexOf(a.lang),
        ib = prefer.indexOf(b.lang);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.lang.localeCompare(b.lang);
    })[0];
  const byEquiv = new Map<string, RulePrinting[]>();
  for (const p of printings) if (p.equivId && out.get(p.key)!.in) byEquiv.set(p.equivId, [...(byEquiv.get(p.equivId) || []), p]);
  for (const group of byEquiv.values()) {
    for (const [on, langs, prefer, id] of [
      [rules.onlyEnglish, WESTERN, ['EN'], 'onlyEnglish'],
      [rules.asiaAsJapanese, ASIAN, ASIAN, 'asiaAsJapanese'],
    ] as const) {
      if (!on) continue;
      const members = group.filter(p => langs.includes(p.lang));
      if (members.length < 2) continue;
      const keep = pick(members, prefer)!;
      for (const p of members) if (p.key !== keep.key) out.set(p.key, { in: false, by: id });
    }
  }
  return out;
}

// ---------- what variant a photo shows (fotos-por-variante) ----------
/** the stamp a photo shows: a stamp key ('1st-edition'…) or '' for the printing with no stamp (unlimited) */
export type PhotoShows = string;
export interface PhotoHolder {
  stamp: string | null;
}
/**
 * The variant a photo of `holder` shows. A mark made by hand wins. Otherwise, a photo shared by the unlimited and the
 * 1st Edition of the same card (same set, number and language: `holders`, all that have this photo) is the 1st
 * Edition's: the catalogs keep one scan per card, and for WotC cards it carries the stamp. Otherwise, the holder's own.
 */
export function photoShows(holder: PhotoHolder, holders: readonly PhotoHolder[], mark?: PhotoShows | null): PhotoShows {
  if (mark != null) return mark;
  const stamps = new Set(holders.map(h => h.stamp || ''));
  if (stamps.has('1st-edition') && stamps.has('')) return '1st-edition';
  return holder.stamp || '';
}
