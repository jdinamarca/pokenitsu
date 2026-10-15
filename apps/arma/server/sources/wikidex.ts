// WikiDex (https://www.wikidex.net, the Spanish Pokémon wiki, CC BY-SA 3.0): which cards of a Pokémon came out in
// Spanish, in what set and number, and which sets were never released in Spain. Text only: its card scans are Nintendo's.
import { normNumber } from '@pokenitsu/core';
import { bySeriesSuffix, intlSetByName, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

const API = process.env.ARMA_WIKIDEX_API || 'https://www.wikidex.net/api.php';

interface Revisions {
  query?: {
    redirects?: { from: string; to: string }[];
    normalized?: { from: string; to: string }[];
    pages?: Record<string, { title: string; missing?: string; revisions?: { slots: { main: { '*': string } } }[] }>;
  };
}
/** the pages each page links to (also those its templates make), a few pages per request */
async function linksOf(titles: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (let i = 0; i < titles.length; i += 10) {
    let cont = '';
    do {
      const d = await fetchJson<{
        continue?: { plcontinue: string };
        query?: { pages?: Record<string, { title: string; links?: { title: string }[] }> };
      }>(
        `${API}?action=query&prop=links&pllimit=max&format=json&titles=${encodeURIComponent(titles.slice(i, i + 10).join('|'))}${cont ? `&plcontinue=${encodeURIComponent(cont)}` : ''}`,
        { ttl: 24 * 3600 * 1000 },
      );
      for (const p of Object.values(d?.query?.pages || {}))
        out.set(p.title, [...(out.get(p.title) || []), ...(p.links || []).map(l => l.title)]);
      cont = d?.continue?.plcontinue || '';
    } while (cont);
  }
  return out;
}

/** the wikitext of many pages, 50 per request (WikiDex answers 429 to one request per page): asked title → its page */
async function wikitexts(titles: string[]): Promise<Map<string, { title: string; text: string }>> {
  const out = new Map<string, { title: string; text: string }>();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const d = await fetchJson<Revisions>(
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=${encodeURIComponent(batch.join('|'))}`,
    );
    const by = new Map<string, { title: string; text: string }>();
    for (const p of Object.values(d?.query?.pages || {})) {
      const text = p.revisions?.[0]?.slots.main['*'];
      if (text) by.set(p.title, { title: p.title, text });
    }
    const hop = (t: string, list?: { from: string; to: string }[]) => list?.find(x => x.from === t)?.to ?? t;
    for (const t of batch) {
      const page = by.get(hop(hop(t, d?.query?.normalized), d?.query?.redirects));
      if (page) out.set(t, page);
    }
  }
  return out;
}
// "[[Jungla (TCG)|Jungla]]" or "''Jungla''" → "Jungla"
const plain = (s: string) =>
  s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
const field = (text: string, k: string) => text.match(new RegExp(`^\\|\\s*${k}\\s*=\\s*(.*)$`, 'm'))?.[1]?.trim();

export interface SpanishCard {
  setKey: string;
  number: string;
  /** the set's Spanish name (Jungla) */
  setName: string;
  /** the WikiDex page that says it */
  page: string;
}
export interface WikidexResult {
  cards: SpanishCard[];
  /** sets WikiDex says were never released in Spain ("No distribuida (ES)") */
  notReleased: { setKey: string; name: string }[];
  pages: number;
  /** sets with no Spanish release date and no "No distribuida": nothing is said */
  unknown: string[];
  /** set names that match none of ours */
  unmatched: string[];
}

export async function wikidexSpanish(cat: Catalog, species: string): Promise<WikidexResult> {
  const list = await fetchJson<{ query?: { allpages: { title: string }[] } }>(
    `${API}?action=query&list=allpages&aplimit=500&format=json&apprefix=${encodeURIComponent(`${species} (`)}`,
  );
  if (!list?.query) throw new Error('WikiDex no trajo la lista de páginas');
  // the TCG cards: not the Pocket game, nor the Japanese-, Korean- or Indonesian-only ones (JTCG, KTCG, ITCG)
  const titles = list.query.allpages.map(p => p.title).filter(t => / TCG\)$/.test(t) && !/(Pocket|JTCG|KTCG|ITCG)/.test(t));
  const pages = new Map<string, string>();
  for (const p of (await wikitexts(titles)).values()) pages.set(p.title, p.text); // a redirect lands on its page once
  // a set's page is the one the card links to: "Jungla (TCG)", or with its series ("Escarlata y Púrpura (TCG): 151")
  const links = await linksOf([...pages.keys()]);
  const setTitle = new Map<string, string>();
  for (const [page, text] of pages)
    for (let i = 1; i <= 8; i++) {
      const exp = field(text, `expansión${i === 1 ? '' : ` ${i}`}`);
      if (!exp) continue;
      const name = plain(exp);
      const to = (links.get(page) || []).find(l => l === `${name} (TCG)` || l.endsWith(`(TCG): ${name}`));
      if (to) setTitle.set(name, to);
    }
  const setPages = await wikitexts([...new Set(setTitle.values())]);

  const sets = new Map<string, { setKey?: string; released: boolean | null; spanish: string }>();
  const setOf = (name: string) => {
    if (!sets.has(name)) {
      const t = setTitle.get(name);
      const p = t ? setPages.get(t) : undefined;
      const out = { released: null as boolean | null, spanish: name, setKey: undefined as string | undefined };
      if (p) {
        const launch = field(p.text, 'lanzamiento') || '';
        // "2000 (ES)", "1 de jul. de 2022 (IN/ES)": a date for Spain; "No distribuida (ES)": never there
        out.released = /No distribuida \((?:[A-Z]{2}\/)*ES(?:\/[A-Z]{2})*\)/i.test(launch)
          ? false
          : /\d{4}[^<(]*\((?:[A-Z]{2}\/)*ES(?:\/[A-Z]{2})*\)/.test(launch)
            ? true
            : null;
        out.spanish = plain(field(p.text, 'nombre') || name);
        // "'''Jungla''' ('''''Jungle''''' en inglés…": the set's English name leads to ours
        const english = p.text.match(/'''''([^']+)'''''\s*en inglés/)?.[1];
        out.setKey =
          intlSetByName(cat, english || name) ?? intlSetByName(cat, name) ?? (english ? bySeriesSuffix(cat, english) : undefined);
      }
      sets.set(name, out);
    }
    return sets.get(name)!;
  };

  const cards: SpanishCard[] = [];
  const notReleased = new Map<string, string>();
  const unknown = new Set<string>(),
    unmatched = new Set<string>();
  for (const [page, text] of pages) {
    for (let i = 1; i <= 8; i++) {
      const suffix = i === 1 ? '' : ` ${i}`;
      const exp = field(text, `expansión${suffix}`),
        num = field(text, `número${suffix}`);
      if (!exp || !num) continue;
      const name = plain(exp);
      const s = setOf(name);
      if (!s.setKey) {
        unmatched.add(name);
        continue;
      }
      if (s.released === false) notReleased.set(s.setKey, s.spanish);
      else if (s.released === null) unknown.add(name);
      else {
        const number = normNumber(plain(num).split('/')[0]!);
        // an alternate print (101a, the "Yellow A" ones): the set came out in Spain, but that print may not have
        if (/^\d+[A-Z]$/.test(number)) unknown.add(`${name} #${number}`);
        else cards.push({ setKey: s.setKey, number, setName: s.spanish, page });
      }
    }
  }
  // one card per set and number, whatever page says it
  const seen = new Set<string>();
  return {
    cards: cards.filter(c => !seen.has(`${c.setKey}|${c.number}`) && seen.add(`${c.setKey}|${c.number}`)),
    notReleased: [...notReleased].map(([setKey, name]) => ({ setKey, name })),
    pages: pages.size,
    unknown: [...unknown],
    unmatched: [...unmatched],
  };
}
