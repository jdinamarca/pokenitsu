// Cards in other languages: the printings Bulbapedia confirms by set (idiomas-desde-bulbapedia: base, 1st Edition and
// reverse where it names them), the Spanish ones WikiDex confirms (cartas-en-otros-idiomas), and, only for sets Bulbapedia
// does not list, the Italian and Portuguese ones deduced from TCGdex's set lists (base finish only).
import { baseFinish, normNumber, WESTERN, type Claim } from '@pokenitsu/core';
import type { Catalog } from './sources/catalog.ts';
import { fetchJson } from './sources/http.ts';
import type { SetLanguages } from './sources/bulbapedia-idiomas.ts';
import type { SpanishCard } from './sources/wikidex.ts';

const card = (setKey: string, number: string) => `${setKey}|${normNumber(number)}`;
// the international cards the other sources brought: set and number → what is known of them
function international(claims: Claim[]) {
  const by = new Map<string, Claim[]>();
  for (const c of claims)
    if (WESTERN.includes(c.lang) && !/^(ja-|pc:|td)/.test(c.setKey))
      by.set(card(c.setKey, c.number), [...(by.get(card(c.setKey, c.number)) || []), c]);
  return by;
}
const alternate = (number: string) => /^\d+[A-Z]$/i.test(normNumber(number));
const has = (claims: Claim[], lang: string) => new Set(claims.filter(c => c.lang === lang).map(c => card(c.setKey, c.number)));
// what a new claim takes from the international card: its name, number, artist and base finish
const from = (cs: Claim[]) => {
  const en = cs.find(c => c.lang === 'EN') || cs[0]!;
  return {
    setKey: en.setKey,
    number: normNumber(en.number),
    finish: baseFinish(cs.filter(c => c.lang === en.lang)),
    stamp: null,
    ...(en.name ? { name: en.name } : {}),
    ...(en.artist ? { artist: en.artist } : {}),
    ...(en.cardId ? { cardId: en.cardId } : {}),
  };
};

/** the Spanish printing of every card WikiDex says came out in Spain (whether another source lists it or not) */
export function spanishClaims(cards: SpanishCard[], claims: Claim[]): Claim[] {
  const intl = international(claims);
  return cards.flatMap(c => {
    const cs = intl.get(card(c.setKey, c.number));
    if (!cs) return [];
    return [{ ...from(cs), lang: 'ES', source: 'wikidex', ref: c.page, setName: c.setName, label: 'Confirmada en español por WikiDex' }];
  });
}

/** a set that never came out in a language, and who says so */
export interface NotReleased {
  setKey: string;
  lang: string;
  name: string;
  source: string;
}

/**
 * Every language Bulbapedia says a set of the Full came out in: the card's base finish, its 1st Edition where the set's
 * sentence names that language "in both 1st and unlimited edition", its reverse where it says "Reverse Holofoils"; only
 * what the card has in English. Never a promo set.
 */
export function confirmedClaims(bySet: Map<string, SetLanguages>, claims: Claim[]) {
  const out: Claim[] = [];
  const notReleased: NotReleased[] = [];
  for (const [setKey, s] of bySet) {
    if (/promo/i.test(s.english)) continue;
    for (const [lang, name] of Object.entries(s.names))
      if (name === null) notReleased.push({ setKey, lang, name: s.english, source: 'Bulbapedia' });
  }
  for (const cs of international(claims).values()) {
    // an alternate print (101a, the "Yellow A" ones) may exist only in English: never confirmed by set
    if (alternate(cs[0]!.number)) continue;
    const s = bySet.get(cs[0]!.setKey);
    if (!s || /promo/i.test(s.english)) continue;
    const en = cs.filter(c => c.lang === 'EN');
    const base = from(cs);
    const ref = `bulbapedia:${s.page}`;
    for (const [lang, name] of Object.entries(s.names)) {
      if (!name) continue;
      const claim = { ...base, lang, source: 'bulbapedia-idiomas', ref, setName: name };
      out.push(claim);
      if (s.firstEdition.includes(lang) && en.some(c => c.stamp === '1st-edition'))
        out.push({ ...claim, finish: 'normal', stamp: '1st-edition' });
      if (s.reverse.includes(lang) && en.some(c => c.finish === 'reverse' && !c.stamp)) out.push({ ...claim, finish: 'reverse' });
    }
  }
  return { claims: out, notReleased };
}

const DEDUCED: Record<string, string> = { IT: 'it', PT: 'pt' };
/**
 * The Italian and Portuguese printings no source lists, of the sets TCGdex lists in that language with their name there:
 * the set came out in that language, so its cards did. Never Spanish (WikiDex says it better) nor Latin American Spanish.
 */
export async function deducedClaims(cat: Catalog, claims: Claim[], listed: Set<string> = new Set()) {
  const intl = international(claims);
  const toTcgdex = new Map([...cat.fromTcgdex].map(([td, ours]) => [ours, td]));
  const out: Claim[] = [];
  const byLang: Record<string, number> = {};
  const notListed: Record<string, string[]> = {};
  const promos: Record<string, string[]> = {};
  for (const [lang, code] of Object.entries(DEDUCED)) {
    const sets = new Map(
      ((await fetchJson<{ id: string; name: string }[]>(`https://api.tcgdex.net/v2/${code}/sets`)) || []).map(s => [s.id, s.name]),
    );
    if (!sets.size) throw new Error(`TCGdex no trajo sus expansiones en ${code}`);
    const known = has(claims, lang);
    for (const [k, cs] of intl) {
      // Bulbapedia's tables say it better: deduce only for the sets they do not list
      if (known.has(k) || listed.has(cs[0]!.setKey) || alternate(cs[0]!.number)) continue;
      // the catalog's TCGdex id, or the same id (most international sets share it: hgss3, svp)
      const td = toTcgdex.get(cs[0]!.setKey) ?? cs[0]!.setKey;
      const name = td && sets.get(td);
      // a promo set in that language does not mean each promo was handed out there: promos are never deduced
      if (name && /promo/i.test(name)) {
        const list = (promos[lang] ||= []);
        if (!list.includes(cs[0]!.setKey)) list.push(cs[0]!.setKey);
        continue;
      }
      if (!name) {
        const list = (notListed[lang] ||= []);
        if (!list.includes(cs[0]!.setKey)) list.push(cs[0]!.setKey);
        continue;
      }
      out.push({ ...from(cs), lang, source: 'tcgdex-expansiones', ref: `${code}/sets/${td}`, setName: name, label: `Deducida de ${name}` });
      byLang[lang] = (byLang[lang] || 0) + 1;
    }
  }
  return { claims: out, deduced: byLang, setsNotListed: notListed, promoSetsSkipped: promos };
}
