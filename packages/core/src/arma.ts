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
  // PokeCottage's JREastRally2000
  'jreast-rally2000': 'jr-stamp-rally',
  'jr-east-rally2000': 'jr-stamp-rally',
  'pokemon-card-gym': 'pokemon-card-gym',
  // the catalog's (and the inventory's) names: setstamp, jreastrally2000
  setstamp: 'set-logo',
  jreastrally2000: 'jr-stamp-rally',
  // PokeCottage names Eevee's copy of Jimmy Ballard's 2006 deck apart from his other cards (mazos-y-campeonatos-de-la-familia)
  worldchampionshipsdeck2006eeveelutionsbyjimmyballard: 'world-championships-deck2006-jimmy-ballard',
};
export const stampKey = (s: unknown): string | null => {
  const k = slug(s);
  return k ? STAMP_ALIAS[k] || k : null;
};

export const variantLabel = (v: ArmaVariant): string => {
  const f = FINISH_LABEL[v.finish];
  if (!v.stamp) return f;
  if (v.stamp === '1st-edition' && v.finish === 'normal') return '1st Edition';
  const ba = BA_STAMP.exec(v.stamp);
  const tk = KIT_STAMP.exec(v.stamp);
  const s =
    STAMP_LABEL[v.stamp] ||
    v.label ||
    (tk && kitLabel(tk[1]!, titled(tk[2]!), tk[3]!)) ||
    (ba
      ? baLabel(
          null,
          ba[1]!.replace(/^./, x => x.toUpperCase()),
          ba[2],
        )
      : v.stamp);
  return v.finish === 'normal' ? s : `${f} · ${s}`;
};

// ---------- each source's variant names → finish + stamp ----------
export interface TcgdexVariantDetail {
  type?: string | null;
  foil?: string | null;
  stamp?: readonly string[] | null;
  size?: string | null;
}
const STANDARD_SIZE = ['standard', 'estandar', 'padrao', 'standaard'];
export function variantFromTcgdex(v: TcgdexVariantDetail): ArmaVariant | null {
  const t = v.type === 'holo' || v.type === 'reverse' || v.type === 'normal' ? v.type : null;
  if (!t) return null;
  let finish: ArmaFinish = t;
  if (v.foil === 'pokeball') finish = 'pokeball';
  else if (v.foil === 'masterball') finish = 'masterball';
  else if (v.foil === 'cosmos') finish = t === 'reverse' ? 'reversecosmos' : 'cosmos';
  const stamps = [...(v.stamp || [])].map(stampKey).filter((x): x is string => !!x);
  // TCGdex translates the size ("Standard", "estándar", "Padrão"): only a size that is not the standard one is a variant
  if (v.size && !STANDARD_SIZE.includes(stampKey(v.size)!)) stamps.push(stampKey(v.size)!);
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
    // finishes some entries name another way (catalogo-desde-tcgdex): McDonald's 2024 "normal", Undaunted's "nonHolo"
    normal: 'normal',
    nonHolo: 'normal',
    holofoil: 'holo',
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
  // a stamped holo or reverse, as the catalog writes them (reverseholohd5chxcnz) and inventoryVariant gives them
  const pre = /^(reverseholo|holo)(.+)$/.exec(v);
  if (pre) return { finish: pre[1] === 'holo' ? 'holo' : 'reverse', stamp: stampKey(pre[2]) };
  const [f, s] = v.split('~');
  const finish = (ARMA_FINISHES as readonly string[]).includes(f!) ? (f as ArmaFinish) : 'normal';
  return { finish, stamp: stampKey(s ?? v) };
}

/** a stamp without its dashes: ba-charizard-26 and bacharizard26 are the same */
export const compactStamp = (s: string | null | undefined) => (s || '').replace(/-/g, '');
const INV_FINISH: Record<ArmaFinish, string> = {
  normal: 'normal',
  holo: 'holo',
  reverse: 'reverse',
  cosmos: 'cosmosholo',
  reversecosmos: 'reversecosmos',
  pokeball: 'pokeballholo',
  masterball: 'masterballholo',
};
// the catalog's names of some stamps (variant_labels)
const INV_STAMP: Record<string, string> = { '1st-edition': 'firstedition', 'set-logo': 'setstamp', 'jr-stamp-rally': 'jreastrally2000' };
/**
 * A Full's variant as the inventory names it (variantes-al-cargar), the inverse of variantFromInventory: normal,
 * cosmosholo…; a normal with a stamp is the stamp without dashes (fxewtfg7z, firstedition), a holo or a reverse one
 * goes after holo / reverseholo, as the catalog writes them (reverseholohd5chxcnz)
 */
export function inventoryVariant(finish: string, stamp: string | null | undefined): string {
  const f = (ARMA_FINISHES as readonly string[]).includes(finish) ? (finish as ArmaFinish) : 'normal';
  if (!stamp) return INV_FINISH[f];
  const st = INV_STAMP[stamp] || compactStamp(stamp).replace(/[^a-z0-9]/g, '');
  const out = f === 'normal' ? st : f === 'holo' ? 'holo' + st : f === 'reverse' ? 'reverseholo' + st : st;
  return out.slice(0, 60) || INV_FINISH[f];
}

// ---------- Battle Academy (mazos-y-campeonatos-de-la-familia) ----------
/** a card of a Battle Academy deck, as Bulbapedia lists it: the original card and, in a numbered deck, its number there */
export interface BattleAcademyCard {
  year: number;
  /** "Charizard", "Eevee" (without " Deck") */
  deck: string;
  /** the number printed next to the deck's silhouette; null in a deck without numbers (Mewtwo 2020, Eevee 2022) */
  deckNo: string | null;
  name: string;
  setKey: string;
  setName?: string;
  number: string;
  /** a Trainer Kit's deck instead of Battle Academy's (trainer-kit-sun-moon): 'sm' for the 2018 Sun & Moon kit */
  kit?: string;
  /** the finish the list states ("Water Web Holofoil"); otherwise holo for V/ex/GX and normal for the rest */
  finish?: ArmaFinish;
  /** the languages the product came out in; English when the list doesn't say */
  langs?: string[];
}
/** the deck's stamp on its original card: ba-charizard-26, ba-mewtwo (as the current app's inventory: normal~ba-charizard-12) */
export const baStamp = (deck: string, deckNo?: string | null) => `ba-${slug(deck)}${deckNo ? '-' + normNumber(deckNo) : ''}`;
export const baLabel = (year: number | null, deck: string, deckNo?: string | null) =>
  `Battle Academy${year ? ' ' + year : ''} · Mazo ${deck}${deckNo ? ' #' + normNumber(deckNo) : ''}`;
const BA_STAMP = /^ba-([a-z-]+?)(?:-(\d+))?$/;
// a Trainer Kit's reprint keeps its card's number and symbol, with the deck's number in a circle (trainer-kit-sun-moon)
const KIT_NAME: Record<string, string> = { sm: 'Sun & Moon' };
const KIT_STAMP = /^tk-([a-z]+)-([a-z-]+?)-(\d+)$/;
const kitLabel = (kit: string, deck: string, deckNo: string) =>
  `Trainer Kit ${KIT_NAME[kit] ?? kit.toUpperCase()} · Mazo ${deck} #${normNumber(deckNo)}`;
/** the stamp and name of a deck's card: Battle Academy's, or a Trainer Kit's (tk-sm-alolan-ninetales-26) */
export const deckStamp = (b: Pick<BattleAcademyCard, 'kit' | 'deck' | 'deckNo'>) =>
  b.kit && b.deckNo ? `tk-${b.kit}-${slug(b.deck)}-${normNumber(b.deckNo)}` : baStamp(b.deck, b.deckNo);
export const deckLabel = (b: Pick<BattleAcademyCard, 'kit' | 'deck' | 'deckNo' | 'year'>) =>
  b.kit && b.deckNo ? kitLabel(b.kit, b.deck, b.deckNo) : baLabel(b.year, b.deck, b.deckNo);
const titled = (s: string) =>
  s
    .split('-')
    .map(w => w.replace(/^./, x => x.toUpperCase()))
    .join(' ');
/** the species' own cards: "Eevee", "Eevee V", "Eevee δ" (not "Eevee & Snorlax-GX"'s partner) */
const ofSpecies = (name: string, species: string) => name === species || (name.startsWith(species + ' ') && !name.includes('&'));
const HOLO_NAME = /\s(V|VMAX|VSTAR|ex|EX|GX)$/;

/**
 * Battle Academy cards in their physical form, the original card with the deck's stamp. PokeCottage's deck "sets"
 * (pc:ba20c, its id's third part the deck number) and its promos stamped "Battle Academy Charizard Deck #27" become that
 * card; what doesn't match Bulbapedia's lists stays as it came. Every card of the species in those lists is `added`.
 */
export function battleAcademyClaims(
  claims: readonly Claim[],
  list: readonly BattleAcademyCard[],
  species: string,
): { claims: Claim[]; added: Claim[]; converted: number } {
  let converted = 0;
  const as = (c: Claim, b: BattleAcademyCard): Claim => {
    converted++;
    // the deck's "set" name and card id were PokeCottage's: the original card's come from the catalog
    const rest: Claim = { ...c };
    delete rest.cardId;
    delete rest.setName;
    return {
      ...rest,
      setKey: b.setKey,
      number: b.number,
      // PokeCottage's variant names the deck ("eeveedeck"); its id ends in the finish: 133-ba22e-1-holo
      finish: b.finish ?? (c.finish === 'normal' && c.ref?.endsWith('-holo') ? 'holo' : c.finish),
      stamp: deckStamp(b),
      label: deckLabel(b),
      ...(b.setName ? { setName: b.setName } : {}),
    };
  };
  const out = claims.map(c => {
    // a Trainer Kit PokeCottage files as its own set (pc:tk11a #26): the species' card with that deck number
    if (/^pc:tk11[a-z]$/.test(c.setKey)) {
      const hit = list.filter(
        b => b.kit === 'sm' && b.deckNo && normNumber(b.deckNo) === normNumber(c.number) && ofSpecies(b.name, species),
      );
      return hit.length === 1 ? as(c, hit[0]!) : c;
    }
    const set = /^pc:ba(\d\d)([a-z])$/.exec(c.setKey);
    if (set) {
      const deck = list.filter(b => b.year === 2000 + Number(set[1]) && slug(b.deck)[0] === set[2] && ofSpecies(b.name, species));
      if (deck.some(b => b.deckNo)) {
        const no = c.ref?.split('-')[2];
        const hit = deck.find(b => b.deckNo && normNumber(b.deckNo) === normNumber(no ?? ''));
        return hit ? as(c, hit) : c;
      }
      // a deck without numbers: the species' only card in it
      const cards = [...new Map(deck.map(b => [`${b.setKey}|${normNumber(b.number)}`, b])).values()];
      return cards.length === 1 ? as(c, cards[0]!) : c;
    }
    const st = /^battle-academy-([a-z]+?)-?(\d+)?$/.exec(c.stamp || '');
    if (st) {
      const [, deck, no] = st;
      const hit = list.find(
        b =>
          !b.kit &&
          slug(b.deck) === deck &&
          (b.deckNo ? normNumber(b.deckNo) : '') === (no ? normNumber(no) : '') &&
          b.setKey === c.setKey &&
          normNumber(b.number) === normNumber(c.number),
      );
      converted++;
      return hit
        ? { ...c, stamp: baStamp(hit.deck, hit.deckNo), label: baLabel(hit.year, hit.deck, hit.deckNo) }
        : {
            ...c,
            stamp: baStamp(deck!, no),
            label: baLabel(
              null,
              deck!.replace(/^./, x => x.toUpperCase()),
              no,
            ),
          };
    }
    return c;
  });
  const added: Claim[] = list
    .filter(b => ofSpecies(b.name, species))
    .flatMap(b => {
      const stamp = deckStamp(b);
      const same = out.find(c => c.setKey === b.setKey && normNumber(c.number) === normNumber(b.number) && c.stamp === stamp);
      return (b.langs?.length ? b.langs : ['EN']).map(lang => {
        // the set's name in that language, as the other sources wrote it (Ultraprisma); the list's is English
        const setName = lang === 'EN' ? b.setName : out.find(c => c.setKey === b.setKey && c.lang === lang && c.setName)?.setName;
        return {
          setKey: b.setKey,
          number: b.number,
          lang,
          finish: b.finish ?? same?.finish ?? (HOLO_NAME.test(b.name) ? 'holo' : 'normal'),
          stamp,
          label: deckLabel(b),
          source: 'bulbapedia-mazos',
          ref: b.kit ? `Trainer Kit ${b.kit} ${b.year} (TCG)` : `Battle Academy ${b.year} (TCG)`,
          name: b.name,
          ...(setName ? { setName } : {}),
        };
      });
    });
  return { claims: out, added, converted };
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
  /** the source only says "holo", not which holo (pokemontcg.io, TCGplayer, TCGdex without foil) */
  genericFinish?: boolean;
  /** a stamp whose finish the source does not say (PokeCottage without foil): "normal" is only a default */
  finishUnknown?: boolean;
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
  const generic = (c: Claim) => c.genericFinish ?? (c.source === 'pokemontcg' || c.source === 'tcgplayer');
  for (const list of byCard.values()) {
    const has = (src: string, f: ArmaFinish) => list.some(c => c.source === src && c.finish === f && !c.stamp);
    const td = (f: ArmaFinish) => has('tcgdex', f),
      tp = (f: ArmaFinish) => has('tcgplayer', f);
    // what the sources that name the holo say (PokeCottage, TCGdex with its foil)
    const specific = (f: ArmaFinish) => list.some(c => !generic(c) && c.finish === f && !c.stamp);
    // the EX era's reverse holo carries its expansion's logo (reverse-con-sello-ex): where PokeCottage has the stamp and no
    // plain reverse, and another source has that reverse, the set's logo is it, however a source types it (TCGdex says
    // normal, reverse or holo; PokeCottage normal)
    const pcs = list.filter(c => c.source === 'pokecottage');
    const exReverse =
      /^ex\d+$/.test(list[0]!.setKey) &&
      pcs.some(c => c.stamp === 'set-logo') &&
      !pcs.some(c => c.finish === 'reverse' && !c.stamp) &&
      list.some(c => c.source !== 'pokecottage' && c.finish === 'reverse' && !c.stamp);
    // the finishes TCGdex gives a stamp on this card (sellos-y-cruce-de-expansiones)
    const tdStamp = (st: string) => list.filter(x => x.source === 'tcgdex' && x.stamp && compactStamp(x.stamp) === compactStamp(st));
    const out: Claim[] = [];
    for (const c of list) {
      // a PokeCottage stamp without its finish takes TCGdex's when TCGdex has that stamp with only one
      if (c.finishUnknown && c.stamp && !exReverse) {
        const tds = tdStamp(c.stamp);
        const fs = new Set(tds.map(x => x.finish));
        if (fs.size === 1) {
          out.push({ ...c, finish: tds[0]!.finish, stamp: tds[0]!.stamp });
          continue;
        }
      }
      if (exReverse && c.stamp === 'set-logo') {
        out.push({ ...c, finish: 'reverse', stamp: null, label: c.label || variantLabel(c) });
        continue;
      }
      let finish = c.finish;
      let inferred = false;
      if (c.source === 'tcgplayer' && !c.stamp && finish === 'normal' && !td('normal') && (td('holo') || td('cosmos')) && !tp('holo'))
        finish = td('holo') ? 'holo' : 'cosmos';
      if (c.source === 'tcgdex' && !c.stamp && finish === 'normal' && tp('holo') && !tp('normal') && !td('holo') && !td('cosmos')) {
        finish = 'holo';
        inferred = true; // deduced from TCGplayer's "holo": it does not say which holo either
      }
      // a plain "holo" is the cosmos holo when a source that names the holo says cosmos and none says plain holo
      if (!c.stamp && finish === 'holo' && (generic(c) || inferred) && specific('cosmos') && !specific('holo')) finish = 'cosmos';
      out.push(finish === c.finish ? c : { ...c, finish });
    }
    // one stamp under two names: TCGdex's "jun-hasebe" is PokeCottage's "world-championships-deck2007-jun-hasebe", and
    // its "trick-or-trade" is PokeCottage's "trick-or-trade24" (the same with its year)
    const pc = out.filter(c => c.source === 'pokecottage' && c.stamp);
    const sameStamp = (pcStamp: string, td: string) =>
      pcStamp.endsWith('-' + td) || new RegExp(`^${compactStamp(td)}\\d+$`).test(compactStamp(pcStamp));
    for (const c of out) {
      const longer = c.source === 'tcgdex' && c.stamp && pc.find(x => x.finish === c.finish && sameStamp(x.stamp!, c.stamp!));
      fixed.push(longer ? { ...c, stamp: longer.stamp } : c);
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
// without hyphens: a source's name run together still counts (worldchampionshipsdeck2006…)
const isWcd = (s: string | null) => !!s && s.replace(/-/g, '').includes('worldchampionship');
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

// ---------- classification checks (corregir-clasificacion-de-cartas) ----------
/** stamps only ever printed on Japanese cards: on a Western card they are a source's mistake */
export const JAPAN_ONLY_STAMPS = ['jr-stamp-rally'];
/** stamps usually seen on Japanese cards; on a Western one, worth checking */
export const USUALLY_JAPANESE_STAMPS = ['pokemon-card-gym'];
const isWestern = (lang: string) => WESTERN.includes(lang);
/** a claim no source should make: a Japan-only stamp on a card in a Western language */
export const misfiled = (c: Pick<Claim, 'lang' | 'stamp'>): boolean =>
  isWestern(c.lang) && (c.stamp || '').split('+').some(s => JAPAN_ONLY_STAMPS.includes(s));

export interface AuditPrinting {
  code: string;
  set_key: string;
  number: string;
  lang: string;
  finish: ArmaFinish;
  stamp: string | null;
  /** the sources that say it exists */
  sources: string[];
  /** the variant's name as each source gives it */
  labels: string[];
  /** deduced, not listed (cartas-en-otros-idiomas): the set's name in that language and the language */
  inferred?: { setName: string; language: string };
  /** a source says this set never came out in this language: the set, the language and who says it */
  notReleased?: { name: string; language: string; source: string };
}
export type AuditKind = 'region' | 'finish' | 'oneSource' | 'unnamed' | 'inferred' | 'notReleased';
export interface AuditReason {
  kind: AuditKind;
  text: string;
}
const JAPANESE_SET = /^(ja-|pc:jpn_|td-ja)/;
const listNames = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

/**
 * The printings whose classification is doubtful, each with its reasons, so a person checks them against Bulbapedia
 * and the other sources: sources make mistakes, and a collector does not know every master set.
 */
export function auditPrintings(
  printings: readonly AuditPrinting[],
  sourceName: (id: string) => string = id => id,
): Map<string, AuditReason[]> {
  const out = new Map<string, AuditReason[]>();
  const add = (code: string, r: AuditReason) => out.set(code, [...(out.get(code) || []), r]);
  const byCard = new Map<string, AuditPrinting[]>();
  for (const p of printings) {
    const k = `${p.set_key}|${normNumber(p.number)}|${p.lang}`;
    byCard.set(k, [...(byCard.get(k) || []), p]);
  }
  for (const ps of byCard.values()) {
    const knowCard = new Set(ps.flatMap(p => p.sources));
    const holo = ps.find(p => p.finish === 'holo' && !p.stamp),
      cosmos = ps.find(p => p.finish === 'cosmos' && !p.stamp);
    const sameSources = holo && cosmos && holo.sources.some(s => cosmos.sources.includes(s));
    for (const p of ps) {
      const stamps = (p.stamp || '').split('+').filter(Boolean);
      if (isWestern(p.lang) && stamps.some(s => JAPAN_ONLY_STAMPS.includes(s)))
        add(p.code, { kind: 'region', text: 'Lleva un sello que solo se imprimió en cartas japonesas, pero está en un idioma occidental' });
      // usually Japanese, but not proven to be only: say so, without claiming more than we know
      else if (isWestern(p.lang) && stamps.some(s => USUALLY_JAPANESE_STAMPS.includes(s)))
        add(p.code, { kind: 'region', text: 'Lleva un sello que normalmente es de cartas japonesas, pero está en un idioma occidental' });
      if (isWestern(p.lang) && JAPANESE_SET.test(p.set_key))
        add(p.code, { kind: 'region', text: 'Es de una expansión japonesa, pero está en un idioma occidental' });
      if (p.lang === 'JA' && !JAPANESE_SET.test(p.set_key))
        add(p.code, { kind: 'region', text: 'Está en japonés, pero en una expansión internacional' });
      if (holo && cosmos && !sameSources && (p === holo || p === cosmos))
        add(p.code, {
          kind: 'finish',
          text: `Las fuentes no coinciden en el brillo: holo según ${listNames(holo.sources.map(sourceName))}, holo cosmos según ${listNames(cosmos.sources.map(sourceName))}`,
        });
      const others = [...knowCard].filter(s => !p.sources.includes(s));
      // a deduced one has a single source by nature: its own reason says it better
      if (p.sources.length === 1 && others.length && !p.inferred)
        add(p.code, {
          kind: 'oneSource',
          text: `Solo ${sourceName(p.sources[0]!)} dice que existe; ${listNames(others.map(sourceName))} ${others.length === 1 ? 'conoce' : 'conocen'} la carta`,
        });
      if (p.inferred)
        add(p.code, {
          kind: 'inferred',
          text: `Deducida: TCGdex lista ${p.inferred.setName} en ${p.inferred.language}, pero ninguna fuente lista esta carta`,
        });
      if (p.notReleased)
        add(p.code, {
          kind: 'notReleased',
          text: `${p.notReleased.source} dice que ${p.notReleased.name} no salió en ${p.notReleased.language}`,
        });
      if (p.labels.some(l => /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(l)))
        add(p.code, { kind: 'unnamed', text: 'La fuente registra esta variante solo con un código, sin decir qué la distingue' });
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

/**
 * The finish a card is printed in when nothing else is said: normal, or its only holo. For a printing a source confirms
 * in another language without naming its variant (WikiDex) or one deduced from a set list: never a stamp nor a reverse.
 */
export function baseFinish(printings: readonly { finish: ArmaFinish; stamp: string | null }[]): ArmaFinish {
  const plain = printings.filter(p => !p.stamp).map(p => p.finish);
  return (['normal', 'holo', 'cosmos'] as const).find(f => plain.includes(f)) ?? plain[0] ?? 'normal';
}

// ---------- languages of each set, from Bulbapedia (idiomas-desde-bulbapedia) ----------
const LANGUAGE_NAMES: Record<string, string> = {
  english: 'EN',
  dutch: 'NL',
  french: 'FR',
  german: 'DE',
  italian: 'IT',
  'brazilian portuguese': 'PT',
  portuguese: 'PT',
  spanish: 'ES',
};
// "{{TCG|Jungle}}", "[[Jungla]]", "Neo Génesis<br>…" → the visible text
const wikiText = (s: string) =>
  s
    .replace(/\{\{TCG\|([^|}]+)(?:\|[^}]*)?\}\}/g, '$1')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<br\s*\/?>.*$/i, '')
    .replace(/'{2,}/g, '')
    .trim();

/**
 * Bulbapedia's "List of Pokémon Trading Card Game expansions in other languages": for each set by its English name, its
 * name in each language, null where it never came out ("—"); a language the table has no column for is left out.
 */
export function parseLanguageTables(wikitext: string): Map<string, Record<string, string | null>> {
  const out = new Map<string, Record<string, string | null>>();
  for (const table of wikitext
    .split('{|')
    .slice(1)
    .map(t => t.split('\n|}')[0]!)) {
    const lines = table.split('\n');
    const headers = lines.filter(l => l.startsWith('!')).map(l => wikiText(l.split('|').pop()!).toLowerCase());
    const english = headers.indexOf('english');
    if (english < 0) continue;
    for (const row of table.split('\n|-').slice(1)) {
      const cells: string[] = [];
      for (const line of row.split('\n').slice(1)) {
        if (!line.startsWith('|') || line.startsWith('|}')) continue;
        const m = line.match(/^\|\s*(?:colspan="?(\d+)"?\s*\|)?\s*(.*)$/)!;
        for (let i = 0; i < Number(m[1] || 1); i++) cells.push(m[2]!);
      }
      const name = cells[english] && wikiText(cells[english]);
      if (!name) continue;
      const langs: Record<string, string | null> = {};
      headers.forEach((h, i) => {
        const lang = LANGUAGE_NAMES[h];
        if (!lang || lang === 'EN' || cells[i] === undefined) return;
        const v = wikiText(cells[i]!);
        langs[lang] = !v || /^[—–-]+$/.test(v) ? null : v;
      });
      out.set(name, langs);
    }
  }
  return out;
}

/**
 * The sentence on a set's page that says where it came out and how: "The Jungle set is released in English, Dutch, …,
 * and Portuguese in both 1st and unlimited edition", "… with cards also available as Reverse Holofoils".
 */
export function parseLanguageSentence(
  wikitext: string,
  englishSet: string,
): { languages: string[]; firstEdition: string[]; reverse: string[] } {
  const none = { languages: [], firstEdition: [], reverse: [] };
  // the whole page on one line, links and templates as text (not wikiText: it keeps only what comes before a <br>)
  const plain = wikitext
    .replace(/\n/g, ' ')
    .replace(/\{\{TCG\|([^|}]+)(?:\|[^}]*)?\}\}/g, '$1')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '');
  const escaped = englishSet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = plain.match(new RegExp(`The ${escaped} set is (?:only )?released in ([^.]*)\\.`, 'i'));
  if (!m) return none;
  const body = m[1]!;
  const list = body.split(/\s+(?:in both|with|which)\b|,\s+in both\b/)[0]!;
  const languages = list
    .split(/,|\band\b/)
    .map(x => LANGUAGE_NAMES[x.trim().toLowerCase()])
    .filter((x): x is string => !!x);
  return {
    languages,
    firstEdition: /in both 1st and unlimited edition/i.test(body) ? languages : [],
    reverse: /Reverse Holo/i.test(body) ? languages : [],
  };
}

// ---------- the additional cards of a set's page in Bulbapedia (sellos-y-cruce-de-expansiones) ----------
export interface AdditionalCard {
  /** the card's number in the set, normalized (86 for 086/197) */
  number: string;
  /** the stamp in quotes, as a stamp key; the set's own name is its logo (set-logo) */
  stamp: string;
  /** the finish the note opens with, null when it says none */
  finish: ArmaFinish | null;
}
// the finish a note opens with: 'Reverse Holo "Obsidian Flames" stamp…', 'Cosmos Holo …'
const NOTE_FINISH: [RegExp, ArmaFinish][] = [
  [/^reverse holo(?:foil)?\b/i, 'reverse'],
  [/^cosmos holo(?:foil)?\b/i, 'cosmos'],
  [/^non-holo(?:foil)?\b/i, 'normal'],
  [/^holo(?:foil)?\b/i, 'holo'],
];
const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** the top-level fields of a template call, split on the pipes outside nested {{…}} and [[…]] */
function templateFields(body: string): string[] {
  const out: string[] = [];
  let depth = 0,
    cur = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      cur += two;
      i++;
    } else if (two === '}}' || two === ']]') {
      depth--;
      cur += two;
      i++;
    } else if (body[i] === '|' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += body[i];
  }
  out.push(cur);
  return out;
}
/**
 * The set list's stamped entries: {{Setlist/nmentry|086/197|{{TCG ID|Obsidian Flames|Espeon|86}}|Psychic|||Reverse Holo
 * "Obsidian Flames" stamp …}} (the note is the sixth field, or "6=…"); only entries with a stamp in quotes count
 */
export function parseAdditionalCards(wikitext: string, setName: string): AdditionalCard[] {
  const out: AdditionalCard[] = [];
  for (const m of wikitext.matchAll(/\{\{Setlist\/nmentry\|/g)) {
    // the entry up to its closing braces
    let depth = 1,
      i = m.index! + m[0].length;
    const start = i;
    while (i < wikitext.length && depth > 0) {
      const two = wikitext.slice(i, i + 2);
      if (two === '{{' || two === '}}') {
        depth += two === '{{' ? 1 : -1;
        i += 2;
      } else i++;
    }
    const fields = templateFields(wikitext.slice(start, i - 2));
    const named = fields.find(f => /^6=/.test(f));
    const note = (named ? named.slice(2) : fields[5] || '').trim();
    const quoted = note.match(/"([^"]+)"/)?.[1];
    const num = fields[0]?.trim().split('/')[0];
    if (!quoted || !num) continue;
    const finish = NOTE_FINISH.find(([re]) => re.test(note))?.[1] ?? null;
    const stamp = loose(quoted) === loose(setName) ? 'set-logo' : stampKey(quoted);
    if (stamp) out.push({ number: normNumber(num), stamp, finish });
  }
  return out;
}

/**
 * What the additional cards say of each stamped card's finish (sellos-y-cruce-de-expansiones): every English claim of that
 * set, number and stamp takes it, under one stamp name (the first claim's), and Bulbapedia backs the printing (`added`).
 * A note without a finish changes nothing.
 */
export function additionalCardClaims(
  claims: readonly Claim[],
  bySet: ReadonlyMap<string, readonly AdditionalCard[]>,
  source = 'bulbapedia-adicionales',
): { claims: Claim[]; added: Claim[]; changed: number } {
  const keyOf = (setKey: string, number: string, stamp: string) => `${setKey}|${normNumber(number)}|${compactStamp(stamp)}`;
  const notes = new Map<string, ArmaFinish>();
  for (const [setKey, cards] of bySet) for (const a of cards) if (a.finish) notes.set(keyOf(setKey, a.number, a.stamp), a.finish);
  const name = new Map<string, string>();
  const added = new Map<string, Claim>();
  let changed = 0;
  const out = claims.map(c => {
    const k = c.lang === 'EN' && c.stamp ? keyOf(c.setKey, c.number, c.stamp) : '';
    const finish = notes.get(k);
    if (!finish) return c;
    if (!name.has(k)) name.set(k, c.stamp!);
    const stamp = name.get(k)!;
    if (!added.has(k)) added.set(k, { setKey: c.setKey, number: c.number, lang: 'EN', finish, stamp, source });
    if (c.finish === finish && c.stamp === stamp && !c.finishUnknown) return c;
    changed++;
    const fixed: Claim = { ...c, finish, stamp };
    delete fixed.finishUnknown;
    return fixed;
  });
  return { claims: out, added: [...added.values()], changed };
}
