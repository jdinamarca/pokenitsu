// Bulbapedia's card list of one Pokémon ("Eevee (TCG)", MediaWiki API): which English and Japanese cards are the
// same design. License CC BY-NC-SA (to review before production); only these links are kept, never images.
import { normNumber, type DesignLink } from '@pokenitsu/core';
import { intlSetByName, nameKey, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

// overridable to check what happens when the source is down
const API = process.env.ARMA_BULBAPEDIA_API || 'https://bulbapedia.bulbagarden.net/w/api.php';

/** the species has no card list in Bulbapedia (not a failure: nothing to ask again) */
export class NoCardList extends Error {}

const field = (s: string, k: string) => s.match(new RegExp(`(?:^|\\|)${k}=([^|]*)`))?.[1]?.trim();

export async function bulbapediaLinks(
  cat: Catalog,
  speciesEn: string,
  { ttl }: { ttl?: number } = {},
): Promise<{ links: DesignLink[]; designs: number; unmatched: number }> {
  const page = encodeURIComponent(`${speciesEn} (TCG)`);
  const d = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(`${API}?action=parse&page=${page}&prop=wikitext&format=json`, {
    ttl,
  });
  const text = d?.parse?.wikitext?.['*'];
  if (!text) throw new NoCardList('Bulbapedia no trajo la lista de cartas');
  const blocks = text.split('{{card list/card|').slice(1);
  const links: DesignLink[] = [];
  let unmatched = 0;
  for (const b of blocks) {
    const releases = [...b.matchAll(/\{\{card list\/release\|([^}]*)\}\}/g)].map(m => m[1]!);
    const en = releases.filter(r => field(r, 'enset') && field(r, 'ennum'));
    const jp = releases.filter(r => field(r, 'jpset'));
    // one Japanese card and its English original (the first English release; later ones are reprints, other cards)
    if (!en.length || jp.length !== 1) continue;
    const enSet = intlSetByName(cat, field(en[0]!, 'enset'));
    const jpSet = cat.jaByName.get(nameKey(field(jp[0]!, 'jpset')));
    if (!enSet || !jpSet) {
      unmatched++;
      continue;
    }
    // no Japanese number on the page (old sets): resolved later from the Full when that set has a single card
    const jpNum = field(jp[0]!, 'jpnum');
    links.push({
      a: { setKey: enSet, number: normNumber(field(en[0]!, 'ennum')!.split('/')[0]) },
      b: { setKey: jpSet, number: jpNum ? normNumber(jpNum.split('/')[0]) : '' },
      source: 'bulbapedia',
    });
  }
  return { links, designs: blocks.length, unmatched };
}
