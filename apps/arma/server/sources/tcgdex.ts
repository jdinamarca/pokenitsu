// TCGdex in every language it has: the cards of one Pokémon (by Pokédex number and by its name in that language),
// their set and number, and their detailed variants (finish, foil, stamps, size). Open API: pictures allowed.
import { variantFromTcgdex, type ArmaVariant, type Claim, type TcgdexVariantDetail } from '@pokenitsu/core';
import { cardIdOf, type Catalog } from './catalog.ts';
import { fetchJson, mapLimit } from './http.ts';

const API = 'https://api.tcgdex.net/v2';
// TCGdex language → our language code (pt-br only has TCG Pocket cards, which are digital)
export const TCGDEX_LANGS: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
  'es-mx': 'ES-MX',
  it: 'IT',
  pt: 'PT',
  de: 'DE',
  ja: 'JA',
  ko: 'KO',
  'zh-tw': 'ZH-TW',
  'zh-cn': 'ZH-CN',
  th: 'TH',
  id: 'ID',
};
const WESTERN_TD = ['en', 'fr', 'es', 'es-mx', 'it', 'pt', 'de'];
// TCG Pocket is a digital game: its sets (A1, B1, P-A…) are never printed
const POCKET = /^(A\d|B\d|P-A)/i;

interface SpeciesNames {
  [tcgdexLang: string]: string[];
}
/** the species' name in each TCGdex language, from PokéAPI (Thai is not there: TH relies on the Pokédex number) */
export async function speciesNames(dex: number): Promise<{ en: string; byLang: SpeciesNames }> {
  const sp = await fetchJson<{ names: { language: { name: string }; name: string }[] }>(`https://pokeapi.co/api/v2/pokemon-species/${dex}`);
  const n = (l: string) => sp?.names.find(x => x.language.name === l)?.name;
  const en = n('en') || String(dex);
  const byLang: SpeciesNames = {
    en: [en],
    fr: [n('fr'), 'Evoli'].filter(Boolean) as string[],
    es: [n('es') || en],
    'es-mx': [n('es') || en],
    it: [n('it') || en],
    pt: [en],
    de: [n('de') || en],
    ja: [n('ja-hrkt') || n('ja') || en],
    ko: [n('ko') || en],
    'zh-tw': [n('zh-hant') || en],
    'zh-cn': [n('zh-hans') || en],
    id: [en],
    th: [],
  };
  return { en, byLang };
}

// a card is of the species when its name starts with it, after Radiant / 光輝 / かがやく (not an evolution like Leafeon)
const isSpecies = (name: string, names: string[]) => {
  const core = name.replace(/^(Radiant |Strahlendes |Radieux |光輝|かがやく|빛나는 )/, '');
  return names.some(n => core.startsWith(n) || name.endsWith(` ${n}`));
};

interface TdCard {
  id: string;
  localId: string;
  name: string;
  illustrator?: string;
  image?: string;
  set: { id: string; name: string; releaseDate?: string };
  variants?: Record<string, boolean>;
  variants_detailed?: TcgdexVariantDetail[];
  dexId?: number[];
}

// our set key for a TCGdex set: the catalog's international or Japanese set; Asian translations of a Japanese set share
// the Japanese set (same code and number, other language); otherwise a TCGdex-only key
function setKeyOf(cat: Catalog, lang: string, setId: string): string {
  if (WESTERN_TD.includes(lang)) return cat.fromTcgdex.get(setId) || `td:${setId}`;
  if (cat.sets.has(`ja-${setId}`)) return `ja-${setId}`;
  return `td-${lang}:${setId}`;
}

const fromFlags = (v: Record<string, boolean> | undefined): ArmaVariant[] => {
  const out: ArmaVariant[] = [];
  if (v?.normal) out.push({ finish: 'normal', stamp: null });
  if (v?.holo) out.push({ finish: 'holo', stamp: null });
  if (v?.reverse) out.push({ finish: 'reverse', stamp: null });
  if (v?.firstEdition) out.push({ finish: 'normal', stamp: '1st-edition' });
  return out;
};

export async function tcgdexClaims(cat: Catalog, dex: number): Promise<{ claims: Claim[]; cards: number; byLang: Record<string, number> }> {
  const { byLang: names } = await speciesNames(dex);
  const claims: Claim[] = [];
  const byLang: Record<string, number> = {};
  let cards = 0;
  for (const [lang, code] of Object.entries(TCGDEX_LANGS)) {
    const ids = new Set<string>();
    for (const c of (await fetchJson<{ id: string }[]>(`${API}/${lang}/cards?dexId=eq:${dex}`)) || []) ids.add(c.id);
    for (const n of names[lang] || []) {
      const list = (await fetchJson<{ id: string; name: string }[]>(`${API}/${lang}/cards?name=${encodeURIComponent(n)}`)) || [];
      for (const c of list) if (isSpecies(c.name, names[lang]!)) ids.add(c.id);
    }
    const wanted = [...ids].filter(id => !POCKET.test(id));
    const details = await mapLimit(wanted, 4, id => fetchJson<TdCard>(`${API}/${lang}/cards/${encodeURIComponent(id)}`).catch(() => null));
    for (const d of details) {
      if (!d || POCKET.test(d.set.id)) continue;
      const setKey = setKeyOf(cat, lang, d.set.id);
      const vs = (d.variants_detailed || []).map(variantFromTcgdex).filter((x): x is ArmaVariant => !!x);
      const variants = vs.length ? vs : fromFlags(d.variants);
      const cardId = cardIdOf(cat, setKey, d.localId);
      for (const v of variants.length ? variants : [{ finish: 'normal' as const, stamp: null }]) {
        claims.push({
          setKey,
          number: d.localId,
          lang: code,
          ...v,
          source: 'tcgdex',
          ref: `${lang}/${d.id}`,
          name: d.name,
          setName: d.set.name,
          ...(d.illustrator ? { artist: d.illustrator } : {}),
          ...(d.set.releaseDate ? { release: d.set.releaseDate } : {}),
          ...(d.image ? { image: `${d.image}/high.webp` } : {}),
          ...(cardId ? { cardId } : {}),
        });
      }
      cards++;
      byLang[code] = (byLang[code] || 0) + 1;
    }
  }
  return { claims, cards, byLang };
}
