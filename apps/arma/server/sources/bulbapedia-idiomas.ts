// In which languages each international set came out, and with which variants, from Bulbapedia (idiomas-desde-bulbapedia):
// the tables of "List of Pokémon Trading Card Game expansions in other languages" and the sentence on each set's page.
// CC BY-NC-SA like the Bulbapedia links: text only, to review before production.
import { parseAdditionalCards, parseLanguageSentence, parseLanguageTables, type AdditionalCard } from '@pokenitsu/core';
import { bySeriesSuffix, intlSetByName, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

const API = process.env.ARMA_BULBAPEDIA_API || 'https://bulbapedia.bulbagarden.net/w/api.php';
const LIST = 'List of Pokémon Trading Card Game expansions in other languages';

export interface SetLanguages {
  english: string;
  page: string;
  /** the set's name in each language; null: it never came out there */
  names: Record<string, string | null>;
  firstEdition: string[];
  reverse: string[];
  /** its stamped additional cards, from the same page (sellos-y-cruce-de-expansiones) */
  additional: AdditionalCard[];
}

/** the languages of the international sets of the Full (setKeys), by our set key */
export async function bulbapediaLanguages(cat: Catalog, setKeys: string[]) {
  const d = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(
    `${API}?action=parse&prop=wikitext&format=json&page=${encodeURIComponent(LIST)}`,
  );
  const text = d?.parse?.wikitext?.['*'];
  if (!text) throw new Error('Bulbapedia no trajo la lista de expansiones en otros idiomas');
  const wanted = new Set(setKeys);
  const bySet = new Map<string, SetLanguages>();
  const unmatched: string[] = [];
  for (const [english, names] of parseLanguageTables(text)) {
    const setKey = intlSetByName(cat, english) ?? bySeriesSuffix(cat, english);
    if (!setKey) {
      unmatched.push(english);
      continue;
    }
    if (wanted.has(setKey)) bySet.set(setKey, { english, page: `${english} (TCG)`, names, firstEdition: [], reverse: [], additional: [] });
  }
  // each set's page says its variants by language: 50 pages per request
  const sets = [...bySet.values()];
  for (let i = 0; i < sets.length; i += 50) {
    const batch = sets.slice(i, i + 50);
    const r = await fetchJson<{
      query?: {
        redirects?: { from: string; to: string }[];
        pages?: Record<string, { title: string; revisions?: { slots: { main: { '*': string } } }[] }>;
      };
    }>(
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=${encodeURIComponent(batch.map(s => s.page).join('|'))}`,
    );
    const texts = new Map(Object.values(r?.query?.pages || {}).map(p => [p.title, p.revisions?.[0]?.slots.main['*'] || '']));
    for (const s of batch) {
      const to = r?.query?.redirects?.find(x => x.from === s.page)?.to ?? s.page;
      const v = parseLanguageSentence(texts.get(to) || '', s.english);
      s.firstEdition = v.firstEdition;
      s.reverse = v.reverse;
      s.additional = parseAdditionalCards(texts.get(to) || '', s.english);
    }
  }
  return { bySet, unmatched };
}
