// PokeCottage's master set of one Pokémon (https://pokecottage.com/pokemon-master-sets/…).
// Its text is authorized, also for production: the claims never keep an image URL. Its pictures only for local use
// (fotos-pokecottage-en-catalogo): the album with its picture URLs is cached apart, under its own key.
import { compactStamp, normNumber, variantFromPokecottage, type Claim } from '@pokenitsu/core';
import { tdSetId } from '@pokenitsu/inventory';
import { cardIdOf, intlSetByName, nameKey, tdSetByName, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

interface PcEntry {
  id: string;
  cardId: string;
  cardNumber: string;
  name: string;
  variant: string;
  variantId: string;
  variantType: string;
  /** the finish, only in some entries ("Normal") */
  foil?: string;
  region: 'International' | 'Japan' | 'China' | string;
  releaseDate?: string;
  artist?: { name?: string } | null;
  set: { id: string; name: string; releaseDate?: string };
}
interface PcData {
  cards: PcEntry[];
}
const LANG: Record<string, string> = { International: 'EN', Japan: 'JA', China: 'ZH-CN' };
// stamped variants whose finish PokeCottage's id does say
const KNOWN_FINISH = new Set(['firstEdition', 'firstEditionReverseHolo', 'starlightHolo']);

// every picture field (imageUrl, thumbnailUrl, lightboxImageUrl…) is dropped before anything is stored
const withoutPictures = (x: unknown): unknown =>
  Array.isArray(x)
    ? x.map(withoutPictures)
    : x && typeof x === 'object'
      ? Object.fromEntries(
          Object.entries(x)
            .filter(([k]) => !/url$/i.test(k))
            .map(([k, v]) => [k, withoutPictures(v)]),
        )
      : x;

/**
 * PokeCottage's name of a Pokémon in its URLs: lower case without accents, ♀/♂ as -female/-male, no apostrophes, dots
 * or colons, and a hyphen for spaces and hyphens (checked against its CDN: nidoran-female, mr-mime, ho-oh, farfetchd,
 * type-null, mime-jr, tapu-koko, porygon-z, flabebe)
 */
export const pcSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*♀/g, '-female')
    .replace(/\s*♂/g, '-male')
    .replace(/['’.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
/** the data file of a Pokémon's master set: 133 → 133-eevee, 29 → 29-nidoran-female */
export const dataUrl = (dex: number, name: string) => `https://pokecottagecdn.com/mastersets/data/${dex}-${pcSlug(name)}.json`;

export async function pokecottageClaims(
  cat: Catalog,
  dex: number,
  speciesEn: string,
): Promise<{ claims: Claim[]; entries: number; unmatched: number; incomplete?: string[] }> {
  const data = await fetchJson<PcData>(dataUrl(dex, speciesEn), { transform: withoutPictures });
  if (!data || !Array.isArray(data.cards)) throw new Error('PokeCottage no trajo el master set (¿cambió el formato?)');
  const claims: Claim[] = [];
  let unmatched = 0;
  // an entry without its card, number or set can't be placed: it is left out and named, not the whole source
  // (Vaporeon's 134-jpn_dp4a-14-firstEdition); only when none is complete the format must have changed
  const incomplete = data.cards.filter(e => !e.cardId || !e.cardNumber || !e.set?.id).map(e => String(e.id));
  if (data.cards.length && incomplete.length === data.cards.length)
    throw new Error(`PokeCottage: ninguna entrada trae carta, número y expansión (¿cambió el formato?)`);
  for (const e of data.cards) {
    if (!e.cardId || !e.cardNumber || !e.set?.id) continue;
    // the set says the language better than the region: PokeCottage marks some Japanese promos "International"
    const region = e.set.id.startsWith('jpn_') ? 'Japan' : e.set.id.startsWith('scn_') ? 'China' : e.region;
    const lang = LANG[region] || 'ZH-CN';
    // international set ids are pokemontcg.io's; Japanese ones are found by their English collector name
    let setKey: string | undefined;
    // a few use their own ids (sv35 for 151, sv85 for Prismatic Evolutions): then by name
    if (region === 'International') setKey = cat.sets.has(e.set.id) ? e.set.id : intlSetByName(cat, e.set.name);
    // a set only TCGdex has (catalogo-desde-tcgdex): by the same id (mep), by name, or a trainer kit by its Pokémon
    let kit = false;
    if (region === 'International' && !setKey) {
      setKey = cat.sets.has(tdSetId(e.set.id)) ? tdSetId(e.set.id) : tdSetByName(cat, e.set.name);
      kit = !!setKey && /trainer kit/i.test(e.set.name);
    }
    if (region === 'Japan') setKey = cat.jaByName.get(nameKey(e.set.name));
    if (!setKey) {
      setKey = `pc:${e.set.id}`;
      unmatched++;
    }
    let v = variantFromPokecottage(e.variantId, e.variant);
    // a kit's card carries its half deck as a stamp ("Sylveon Deck"): the set already says it
    if (kit && v.stamp && /deck$/.test(compactStamp(v.stamp))) v = { finish: v.finish, stamp: null };
    // a stamp PokeCottage gives no finish for: "normal" is only the default (sellos-y-cruce-de-expansiones)
    const finishUnknown = !!v.stamp && !e.foil && !KNOWN_FINISH.has(e.variantId);
    const cardId = cardIdOf(cat, setKey, e.cardNumber);
    claims.push({
      setKey,
      number: String(e.cardNumber).split('/')[0]!.replace(/^#/, ''),
      lang,
      ...v,
      label: e.variant,
      ...(finishUnknown ? { finishUnknown } : {}),
      source: 'pokecottage',
      ref: e.id,
      name: e.name,
      setName: e.set.name,
      ...(e.artist?.name ? { artist: e.artist.name } : {}),
      ...(e.releaseDate || e.set.releaseDate ? { release: (e.releaseDate || e.set.releaseDate)! } : {}),
      ...(cardId ? { cardId } : {}),
    });
  }
  return { claims, entries: data.cards.length, unmatched, ...(incomplete.length ? { incomplete } : {}) };
}

// ---------- its pictures, for local use only ----------
/** an album entry, with only what the local photos use */
export interface PcPhotoEntry {
  id: string;
  url: string | null;
  pokemonNumber: number | null;
  cardNumber: string;
  variantType: string;
  set: { id: string; name: string };
}
const DAYS_30 = 30 * 24 * 3600 * 1000;
/** a Pokémon's album with its picture URLs, kept 30 days so it is asked once; null when PokeCottage hasn't it */
export async function pokecottageAlbum(dex: number, speciesEn: string): Promise<PcPhotoEntry[] | null> {
  const url = dataUrl(dex, speciesEn);
  const data = await fetchJson<{ cards: PcPhotoEntry[] }>(url, {
    ttl: DAYS_30,
    // one try: whoever calls decides when to ask again (never a quick retry to PokeCottage)
    tries: 1,
    cacheKey: url + '#fotos-v2',
    transform: raw => ({
      cards: ((raw as { cards?: Record<string, unknown>[] }).cards || []).map(c => {
        const set = (c.set || {}) as { id?: string; name?: string };
        return {
          id: String(c.id ?? ''),
          url: (c.imageUrl || c.originalImageUrl || null) as string | null,
          pokemonNumber: Number(c.pokemonNumber) || null,
          cardNumber: String(c.cardNumber ?? ''),
          variantType: String(c.variantType ?? ''),
          set: { id: String(set.id ?? ''), name: String(set.name ?? '') },
        };
      }),
    }),
  });
  return data ? data.cards : null;
}

/**
 * PokeCottage's Japanese sets whose name isn't the catalog's English name: PokeCottage's set id → our set id (by id,
 * since its names repeat: "Sun & Moon"). Each one checked against TCGdex and Bulbapedia before it goes here.
 */
export const PC_SET_ALIASES: Record<string, string> = {
  // サン＆ムーン (SM1+), 51 cards, 2017-01-27: TCGdex's "Strength Expansion Pack Sun & Moon", Bulbapedia's
  // "Enhanced Expansion Pack Sun & Moon"; PokeCottage calls it "Sun & Moon"
  'jpn_sm1+': 'ja-SM1p',
  // Neo Premium File 2: a set the catalog took from PokeCottage itself, with its id
  jpn_neop2: 'pc-jpn_neop2',
};

export interface PcCard {
  id: string;
  set_id: string;
  number: string;
  dex: number[];
}
const plainNumber = (n: string) => normNumber(String(n).split('/')[0]!.replace(/^#/, ''));
/**
 * The photo of each catalog card in a Pokémon's album: a Japanese entry of the same expansion (by its English name or
 * an alias), the same number and a Pokédex number of the card's (so a wrong set match can't give another Pokémon's
 * photo). The standard entry wins over its variants. Card id → picture URL.
 */
export function matchPokecottage(entries: PcPhotoEntry[], cards: PcCard[], jaByName: Map<string, string>): Map<string, string> {
  const want = new Map(cards.map(c => [`${c.set_id}|${plainNumber(c.number)}`, c]));
  const out = new Map<string, { url: string; std: boolean }>();
  for (const e of entries) {
    if (!e.url || !e.set.id.startsWith('jpn_')) continue;
    const setId = PC_SET_ALIASES[e.set.id] ?? jaByName.get(nameKey(e.set.name));
    const card = setId && want.get(`${setId}|${plainNumber(e.cardNumber)}`);
    if (!card || e.pokemonNumber == null || !card.dex.includes(e.pokemonNumber)) continue;
    const std = e.variantType === 'default';
    const had = out.get(card.id);
    if (!had || (std && !had.std)) out.set(card.id, { url: e.url, std });
  }
  return new Map([...out].map(([id, x]) => [id, x.url]));
}
