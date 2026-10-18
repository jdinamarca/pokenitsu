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
/** without accents or case: TCGdex writes "Evoli" where PokéAPI says "Évoli" */
export const bare = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
/** a name and, when it has accents, the same without them (both are searched in TCGdex) */
const withBare = (names: (string | undefined)[]) => {
  const out: string[] = [];
  for (const n of names) {
    if (!n) continue;
    const plain = n.normalize('NFKD').replace(/\p{M}/gu, '');
    for (const x of [n, plain]) if (!out.includes(x)) out.push(x);
  }
  return out;
};
/** the species' name in each TCGdex language, from PokéAPI (Thai is not there: TH relies on the Pokédex number) */
export async function speciesNames(dex: number): Promise<{ en: string; byLang: SpeciesNames }> {
  const sp = await fetchJson<{ names: { language: { name: string }; name: string }[] }>(`https://pokeapi.co/api/v2/pokemon-species/${dex}`);
  const n = (l: string) => sp?.names.find(x => x.language.name === l)?.name;
  const en = n('en') || String(dex);
  const byLang: SpeciesNames = {
    en: [en],
    fr: withBare([n('fr')]),
    es: withBare([n('es') || en]),
    'es-mx': withBare([n('es') || en]),
    it: withBare([n('it') || en]),
    pt: [en],
    de: withBare([n('de') || en]),
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
// (compared without accents or case)
export const isSpecies = (name: string, names: string[]) => {
  const full = bare(name);
  const core = bare(name.replace(/^(Radiant |Strahlendes |Radieux |光輝|かがやく|빛나는 )/, ''));
  return names.some(n => core.startsWith(bare(n)) || full.endsWith(` ${bare(n)}`));
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
    // a card's answer without its set is not one of ours (an older trimmed copy kept under the same URL): asked again
    const details = await mapLimit(wanted, 4, id =>
      fetchJson<TdCard>(`${API}/${lang}/cards/${encodeURIComponent(id)}`, { valid: d => !!d?.set?.id }).catch(() => null),
    );
    for (const d of details) {
      // a card TCGdex lists without its set (it happens) can't be placed: left out, not the whole source
      if (!d?.set?.id || POCKET.test(d.set.id)) continue;
      const setKey = setKeyOf(cat, lang, d.set.id);
      // a holo without its foil (or from the old flags) does not say which holo it is
      const vs = (d.variants_detailed || [])
        .map(v => (x => x && { ...x, genericFinish: x.finish === 'holo' && !v.foil })(variantFromTcgdex(v)))
        .filter((x): x is ArmaVariant & { genericFinish: boolean } => !!x);
      const variants = vs.length ? vs : fromFlags(d.variants).map(v => ({ ...v, genericFinish: v.finish === 'holo' }));
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
