// PokeCottage's master set of one Pokémon (https://pokecottage.com/pokemon-master-sets/…): text only.
// PokeCottage authorized its text, also for production; never its pictures, so no image URL is ever kept.
import { variantFromPokecottage, type Claim } from '@pokenitsu/core';
import { cardIdOf, intlSetByName, nameKey, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

interface PcEntry {
  id: string;
  cardId: string;
  cardNumber: string;
  name: string;
  variant: string;
  variantId: string;
  variantType: string;
  region: 'International' | 'Japan' | 'China' | string;
  releaseDate?: string;
  artist?: { name?: string } | null;
  set: { id: string; name: string; releaseDate?: string };
}
interface PcData {
  cards: PcEntry[];
}
const LANG: Record<string, string> = { International: 'EN', Japan: 'JA', China: 'ZH-CN' };

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

/** the data file of a Pokémon's master set: 133 → 133-eevee */
const dataUrl = (dex: number, name: string) => `https://pokecottagecdn.com/mastersets/data/${dex}-${nameKey(name)}.json`;

export async function pokecottageClaims(
  cat: Catalog,
  dex: number,
  speciesEn: string,
): Promise<{ claims: Claim[]; entries: number; unmatched: number }> {
  const data = await fetchJson<PcData>(dataUrl(dex, speciesEn), { transform: withoutPictures });
  if (!data || !Array.isArray(data.cards)) throw new Error('PokeCottage no trajo el master set (¿cambió el formato?)');
  const claims: Claim[] = [];
  let unmatched = 0;
  for (const e of data.cards) {
    if (!e.cardId || !e.cardNumber || !e.set?.id) throw new Error(`PokeCottage: entrada sin carta, número o expansión (${e.id})`);
    // the set says the language better than the region: PokeCottage marks some Japanese promos "International"
    const region = e.set.id.startsWith('jpn_') ? 'Japan' : e.set.id.startsWith('scn_') ? 'China' : e.region;
    const lang = LANG[region] || 'ZH-CN';
    // international set ids are pokemontcg.io's; Japanese ones are found by their English collector name
    let setKey: string | undefined;
    // a few use their own ids (sv35 for 151, sv85 for Prismatic Evolutions): then by name
    if (region === 'International') setKey = cat.sets.has(e.set.id) ? e.set.id : intlSetByName(cat, e.set.name);
    if (region === 'Japan') setKey = cat.jaByName.get(nameKey(e.set.name));
    if (!setKey) {
      setKey = `pc:${e.set.id}`;
      unmatched++;
    }
    const v = variantFromPokecottage(e.variantId, e.variant);
    const cardId = cardIdOf(cat, setKey, e.cardNumber);
    claims.push({
      setKey,
      number: String(e.cardNumber).split('/')[0]!.replace(/^#/, ''),
      lang,
      ...v,
      label: e.variant,
      source: 'pokecottage',
      ref: e.id,
      name: e.name,
      setName: e.set.name,
      ...(e.artist?.name ? { artist: e.artist.name } : {}),
      ...(e.releaseDate || e.set.releaseDate ? { release: (e.releaseDate || e.set.releaseDate)! } : {}),
      ...(cardId ? { cardId } : {}),
    });
  }
  return { claims, entries: data.cards.length, unmatched };
}
