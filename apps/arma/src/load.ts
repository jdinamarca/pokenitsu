// What Cargar and Mi inventario derive from the API (cargar-e-inventario-en-arma): which row an entry loads, as Nitsu
// decides it (variant, condition, location), and the inventory grouped into shelves.
import {
  autoVariant,
  eraOf,
  langCode,
  pickLocation,
  pickPrice,
  removalLocation,
  setProgress,
  type Cond,
  type Copies,
  type Entry,
  type Lang,
  type LocationLike,
  type PickedPrice,
} from '@pokenitsu/core';
import type { CardSet, Fx, InvLocation, InvRow, PriceCfg, SetCard, VariantPhoto, VariantPhotos } from './api.ts';

export const VARIANT_LABEL: Record<string, string> = {
  normal: 'Normal',
  holo: 'Holo',
  reverse: 'Reverse',
  firstedition: '1st Edition',
  pokeballholo: 'Poké Ball',
  masterballholo: 'Master Ball',
};
// the catalog's names (variant_labels), set when an answer brings them
let labels: Record<string, string> = {};
export const setVariantLabels = (l: Record<string, string>) => {
  labels = { ...labels, ...l };
};
export const variantName = (v: string) => labels[v] || VARIANT_LABEL[v] || v;
export const LANG_LABEL: Record<string, string> = {
  ES: 'Español',
  EN: 'Inglés',
  PT: 'Portugués',
  FR: 'Francés',
  DE: 'Alemán',
  IT: 'Italiano',
  JA: 'Japonés',
  KO: 'Coreano',
  ZH: 'Chino',
};
export const COND_LABEL: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Dañada',
};

/** the load session: language, condition, for sale or personal, and where to file (automatic or a fixed location) */
export interface Session {
  lang: Lang;
  cond: Cond;
  personal: boolean;
  dest: 'auto' | number;
  /** the last Western language used, to go back to when an international expansion opens after an Asian one */
  west?: Lang;
}

// idioma-al-abrir-expansion: the languages no international expansion is printed in
const ASIAN = new Set<string>(['JA', 'KO', 'ZH']);
const LANG_ORDER = ['EN', 'ES', 'ES-MX', 'PT', 'PT-BR', 'FR', 'DE', 'IT', 'NL', 'JA', 'ZH-TW', 'ZH-CN', 'KO', 'TH', 'ID'];
/** the session with its last Western language remembered */
export const withWest = (s: Session): Session => (ASIAN.has(s.lang) ? s : { ...s, west: s.lang });
/**
 * The language an expansion opens in: the one typed in the search ("SWSHP JA"), the expansion's own (a Japanese one), or
 * the recent's or the session's; an international expansion never opens in an Asian language unless typed: it goes back
 * to the last Western one, or English
 */
export function openLang(o: { typed: Lang | null; setLang: Lang | null; current: Lang; west?: Lang | undefined }): Lang {
  if (o.typed) return o.typed;
  if (o.setLang) return o.setLang;
  return ASIAN.has(o.current) ? o.west || 'EN' : o.current;
}
/** the languages a card came out in, per its Full, when the session's isn't one of them (ZH covers ZH-TW and ZH-CN);
 *  null when it is, or when the Full doesn't know the card */
export function otherLangs(card: Pick<SetCard, 'full'>, lang: string): string[] | null {
  const langs = [...new Set((card.full || []).map(f => f.lang))];
  if (!langs.length || langs.some(l => l === lang || l.startsWith(lang + '-'))) return null;
  const rank = (l: string) => (LANG_ORDER.includes(l) ? LANG_ORDER.indexOf(l) : LANG_ORDER.length);
  return langs.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
/** what Cargar knows about the expansion open in it */
export interface SetContext {
  set: CardSet;
  locations: InvLocation[];
  cfg: PriceCfg;
  fx: Fx | null;
  /** my own prices: { "cardId|variant": clp } */
  own: Record<string, number | null>;
}

/** the price of a copy (own price first), as Nitsu's priceOf */
export const priceFor = (card: SetCard, variant: string, cond: string, ctx: Pick<SetContext, 'cfg' | 'fx' | 'own'>): PickedPrice | null =>
  pickPrice(card.prices, variant, cond, ctx.cfg, ctx.fx, ctx.own[`${card.id}|${variant}`] ?? null);

/** a row the API understands */
export interface LoadRow {
  sid: string;
  num: string;
  variant: string;
  lang: string;
  cond: string;
  loc: number;
}
/**
 * The row an entry loads in a card, as Nitsu's loadOne: the suffix's variant, the one marked or the automatic one, the entry's condition
 * or the session's, and the location: to remove, where there are copies (the fixed one first); to add, the fixed one or
 * the most specific rule that takes it (with its stored price for price rules).
 */
export function planRow(
  card: SetCard,
  e: Pick<Entry, 'v' | 'cond' | 'sign'>,
  s: Session,
  ctx: SetContext,
  chosen?: string | null,
): LoadRow {
  // a typed suffix first, then the variant marked in the sheet (variantes-al-cargar), then the automatic one
  const variant = e.v || chosen || autoVariant(card.rarity);
  const cond = e.cond || s.cond;
  const same = card.copies.filter(c => c.variant === variant && c.lang === s.lang && c.cond === cond);
  let loc: number;
  if (e.sign < 0) {
    const byLoc: Record<number, Copies> = {};
    for (const c of same) byLoc[c.loc] = { qty: c.qty, personal: c.personal };
    loc = removalLocation(byLoc, s.dest === 'auto' ? null : s.dest);
  } else if (s.dest !== 'auto') loc = s.dest;
  else
    loc = pickLocation(ctx.locations as LocationLike[], {
      setId: ctx.set.id,
      era: eraOf(ctx.set),
      origin: ctx.set.lang || 'INT',
      name: card.name,
      rarity: card.rarity || '',
      variant,
      personal: s.personal,
      price: () => priceFor(card, variant, cond, ctx)?.clp ?? null,
    });
  return { sid: card.sid, num: card.num, variant, lang: s.lang, cond, loc };
}

// the basic variants first, in this order; the stamped ones after, by name
const VARIANT_RANK = ['normal', 'holo', 'reverse', 'firstedition', 'pokeballholo', 'masterballholo', 'cosmosholo', 'reversecosmos'];
/**
 * The variants a card can be loaded as (variantes-al-cargar), without repeats: its Full's in the session's language (or
 * in all its languages when the Full doesn't have it in that one), the catalog's and the ones the account has of it;
 * Normal, Holo and Reverse when none is known
 */
export function variantsOf(card: Pick<SetCard, 'full' | 'variants' | 'copies'>, lang: string): string[] {
  const full = card.full || [];
  // ZH covers ZH-TW and ZH-CN (expansiones-chinas-en-cargar)
  const inLang = full.filter(f => f.lang === lang || f.lang.startsWith(lang + '-'));
  const found = new Set([
    ...(inLang.length ? inLang : full).map(f => f.variant),
    ...(card.variants || []),
    ...card.copies.map(c => c.variant),
  ]);
  const list = found.size ? [...found] : ['normal', 'holo', 'reverse'];
  const rank = (v: string) => (VARIANT_RANK.includes(v) ? VARIANT_RANK.indexOf(v) : VARIANT_RANK.length);
  return list.sort((a, b) => rank(a) - rank(b) || variantName(a).localeCompare(variantName(b), 'es'));
}
/** the variant marked at first: the automatic one when the card has it, else the first */
export const firstVariant = (card: Pick<SetCard, 'rarity'>, list: string[]) => {
  const auto = autoVariant(card.rarity);
  return list.includes(auto) ? auto : list[0] || auto;
};

/** copies of a card in every variant, language and condition */
export const cardQty = (card: Pick<SetCard, 'copies'>) => card.copies.reduce((n, c) => n + c.qty, 0);

/** a row as the API answers it after a change: replaces (or removes, at 0) that row of the card */
export function withRow(card: SetCard, r: LoadRow & { qty: number; personal: number }): SetCard {
  const same = (c: SetCard['copies'][number]) => c.variant === r.variant && c.lang === r.lang && c.cond === r.cond && c.loc === r.loc;
  const rest = card.copies.filter(c => !same(c));
  return {
    ...card,
    copies: r.qty > 0 ? [...rest, { variant: r.variant, lang: r.lang, cond: r.cond, loc: r.loc, qty: r.qty, personal: r.personal }] : rest,
  };
}

/** "N / total encendidas": the printed numbers lit (all the cards in promos and sets without a printed total) */
export function litCount(set: CardSet, cards: SetCard[]) {
  const owned = cards.filter(c => cardQty(c) > 0).map(c => c.num);
  return setProgress({ printed: set.printed || null, total: set.total || cards.length, promo: /promo/i.test(set.name) }, owned).base;
}

/** the expansion's line under its name: series · year · code */
/** the language an expansion is loaded in: its own (JA), Chinese for a Chinese one (ZH-CN, ZH-TW → ZH), or null */
export const setLangOf = (lang: string | null | undefined): Lang | null => langCode(lang?.split('-')[0]);
/** a Chinese expansion's language (expansiones-chinas-en-cargar) */
export const CHINESE: Record<string, string> = { 'ZH-CN': 'Chino simplificado', 'ZH-TW': 'Chino tradicional' };
export const setLine = (s: CardSet) => [eraOf(s), s.date.slice(0, 4), s.code || s.id].filter(Boolean).join(' · ');

export interface Shelf {
  /** the location's id; 0 = without one */
  id: number;
  name: string;
  /** what the location takes, in a line */
  sub: string;
  rows: InvRow[];
}
/** the inventory as shelves: one per location in the user's order, "Sin ubicación" last (only when it has copies) */
export function shelvesOf(rows: InvRow[], locations: InvLocation[]): Shelf[] {
  const by = new Map<number, InvRow[]>();
  for (const r of rows) by.set(r.loc, [...(by.get(r.loc) || []), r]);
  const known = new Set(locations.map(l => l.id));
  const out: Shelf[] = [...locations]
    .sort((a, b) => a.pos - b.pos || a.id - b.id)
    .map(l => ({ id: l.id, name: l.name, sub: ruleLine(l), rows: by.get(l.id) || [] }));
  // rows whose location no longer exists go with the ones without a location
  const loose = rows.filter(r => !known.has(r.loc));
  if (loose.length) out.push({ id: 0, name: 'Sin ubicación', sub: 'Asígnalas desde la ficha', rows: loose });
  return out;
}

/** what a location takes, in a few words, from its rule (or its note) */
export function ruleLine(l: InvLocation): string {
  const r = l.rule || {};
  const bits: string[] = [];
  if (r.personal === true) bits.push('Personal · no se venden');
  if (r.minPrice) bits.push(`Desde $${r.minPrice.toLocaleString('es-CL')}`);
  if (r.special?.length) bits.push('Cartas especiales');
  if (r.series?.length) bits.push(r.series.join(', '));
  if (r.sets?.length) bits.push(r.sets.length === 1 ? '1 expansión' : `${r.sets.length} expansiones`);
  if (r.bulk) bits.push('Challa');
  if (r.personal === false) bits.push('Para vender');
  if (r.auto === false) bits.push('Solo a mano');
  return bits.join(' · ') || l.note || 'Recibe todo';
}

/** a search over the inventory: name, expansion, number or illustrator, without accents or case */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function rowMatches(r: InvRow, q: string): boolean {
  const f = fold(q.trim());
  if (!f) return true;
  return [r.name, r.set_name, r.set_code, r.sid, r.num, r.artist || ''].some(x => fold(String(x)).includes(f));
}
export type ForFilter = 'all' | 'sale' | 'personal';
/** "Para": the rows with copies for sale, or with personal ones */
export const rowFor = (r: InvRow, f: ForFilter) => f === 'all' || (f === 'personal' ? r.personal > 0 : r.qty - r.personal > 0);

export type CardPictureKind = 'photo' | 'local' | 'ref' | 'none';
/**
 * What a card shows (fotos-solo-local-en-catalogo), the first it has: your photo of the variant, the card's own photo,
 * the catalog's, the one for local use only (marked), or a reference of the same Pokémon (dimmed)
 */
export function pictureOf(
  own: string | null | undefined,
  ownCard: string | null | undefined,
  img: string | null,
  local: { src: string; source: string } | null | undefined,
  ref: string | null,
  variant?: VariantPhoto | null,
): { src: string | null; kind: CardPictureKind; source?: string } {
  // a stamped variant's own photo goes before the card's, which doesn't show the stamp (foto-de-la-variante-con-sello)
  if (!own && variant)
    return variant.local ? { src: variant.src, kind: 'local', source: variant.source } : { src: variant.src, kind: 'photo' };
  const photo = own || ownCard || img;
  if (photo) return { src: photo, kind: 'photo' };
  if (local) return { src: local.src, kind: 'local', source: local.source };
  return ref ? { src: ref, kind: 'ref' } : { src: null, kind: 'none' };
}
/** a stamped variant's photo in a language; for an international card, the English one when that language has none */
export const variantPhoto = (byLang: VariantPhotos | null | undefined, lang: string): VariantPhoto | null =>
  byLang?.[lang] ||
  (lang === 'ZH' ? byLang?.['ZH-CN'] || byLang?.['ZH-TW'] : undefined) ||
  (lang !== 'JA' && lang !== 'ZH' ? byLang?.EN : undefined) ||
  null;
export const REF_NOTE = 'Foto de referencia: esta carta no tiene foto';

export const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
