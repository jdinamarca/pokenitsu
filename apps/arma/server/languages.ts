// Cards in other languages (cartas-en-otros-idiomas): the Spanish printings WikiDex confirms, and the Italian and
// Portuguese ones deduced from TCGdex's set lists. Only the card's base finish: a variant is never deduced.
import { baseFinish, normNumber, WESTERN, type Claim } from '@pokenitsu/core';
import type { Catalog } from './sources/catalog.ts';
import { fetchJson } from './sources/http.ts';
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

const DEDUCED: Record<string, string> = { IT: 'it', PT: 'pt' };
/**
 * The Italian and Portuguese printings no source lists, of the sets TCGdex lists in that language with their name there:
 * the set came out in that language, so its cards did. Never Spanish (WikiDex says it better) nor Latin American Spanish.
 */
export async function deducedClaims(cat: Catalog, claims: Claim[]) {
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
      if (known.has(k)) continue;
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
