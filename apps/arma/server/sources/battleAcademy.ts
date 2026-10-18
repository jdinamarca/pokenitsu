// Bulbapedia's deck lists of each Battle Academy (mazos-y-campeonatos-de-la-familia): which original card each deck
// reprints and, in the numbered decks, its number there. License CC BY-NC-SA (to review before production); text only.
import { normNumber, type BattleAcademyCard } from '@pokenitsu/core';
import { intlSetByName, type Catalog } from './catalog.ts';
import { fetchJson } from './http.ts';

const API = process.env.ARMA_BULBAPEDIA_API || 'https://bulbapedia.bulbagarden.net/w/api.php';
export const BATTLE_ACADEMY_YEARS = [2020, 2022, 2024];

export interface ListedCard {
  year: number;
  deck: string;
  deckNo: string | null;
  name: string;
  setName: string;
  number: string;
}
// {{TCGV}}, {{ex}}, {{TT GX}}… after a card's link: its suffix
const SUFFIX = /\{\{(?:TCG|TT )?(VMAX|VSTAR|V|ex|EX|GX)\}\}/;

/**
 * One Battle Academy page: each deck opens with {{halfdecklist/(nm)header|title=Charizard Deck}}; its entries give the
 * deck number first (1–60) in a numbered deck, the set number in one without numbers (89/214, SWSH065), and the card as
 * {{TCG ID|set|name|number}} or [[Eevee V (SWSH Promo 65)|Eevee]]{{TCGV}}. Energy and unknown lines are skipped.
 */
export function parseBattleAcademy(wikitext: string, year: number): ListedCard[] {
  const out: ListedCard[] = [];
  let deck = '';
  for (const line of wikitext.split('\n')) {
    const h = line.match(/\{\{halfdecklist\/(?:nm)?header\|title=([^|}]+?)(?: Deck)?\s*[|}]/);
    if (h) {
      deck = h[1]!.trim();
      continue;
    }
    const e = line.match(/\{\{halfdecklist\/(?:nm)?entry\|([^|]*)\|(.*)$/);
    if (!e || !deck) continue;
    const first = e[1]!.trim();
    const deckNo = /^\d{1,2}$/.test(first) ? String(Number(first)) : null;
    const id = e[2]!.match(/\{\{TCG ID\|([^|}]+)\|([^|}]+)\|([^|}]+)\}\}/);
    const link = e[2]!.match(/\[\[([^|\]]+?) \(([^)]+?) (\w+)\)\|[^\]]*\]\]/);
    let name: string, setName: string, number: string;
    if (id) [, setName, name, number] = id as unknown as [string, string, string, string];
    else if (link) [, name, setName, number] = link as unknown as [string, string, string, string];
    else continue;
    const suffix = !id && e[2]!.match(SUFFIX)?.[1];
    out.push({
      year,
      deck,
      deckNo,
      name: (suffix && !name.endsWith(' ' + suffix) ? `${name} ${suffix}` : name).trim(),
      setName: setName.trim(),
      number: number.trim(),
    });
  }
  return out;
}

// Bulbapedia's short promo names
const PROMO: Record<string, string> = {
  'SM Promo': 'SM Black Star Promos',
  'SWSH Promo': 'SWSH Black Star Promos',
  'XY Promo': 'XY Black Star Promos',
  'BW Promo': 'BW Black Star Promos',
  'DP Promo': 'DP Black Star Promos',
  'HGSS Promo': 'HGSS Black Star Promos',
  'SVP Promo': 'Scarlet & Violet Black Star Promos',
};
const PREFIXES = ['', 'SM', 'SWSH', 'XY', 'BW', 'HGSS', 'DP', 'SVP', 'SV'];

/** the listed cards in our catalog: our set and the card's number as the catalog writes it (SM186, SWSH065) */
export function placeBattleAcademy(cat: Catalog, listed: readonly ListedCard[]): { cards: BattleAcademyCard[]; unmatched: number } {
  const cards: BattleAcademyCard[] = [];
  let unmatched = 0;
  for (const l of listed) {
    const setKey = intlSetByName(cat, l.setName) ?? intlSetByName(cat, PROMO[l.setName]);
    const n = normNumber(l.number.split('/')[0]!.replace(/^[A-Z]+/i, ''));
    const id = setKey && PREFIXES.map(p => cat.cardIds.get(`${setKey}|${normNumber(p + n)}`)).find(Boolean);
    if (!setKey || !id) {
      unmatched++;
      continue;
    }
    cards.push({ ...l, setKey, setName: cat.sets.get(setKey)?.name ?? l.setName, number: id.slice(setKey.length + 1) });
  }
  return { cards, unmatched };
}

/** every Battle Academy's lists, one page after another (cached a day) */
export async function battleAcademyList(cat: Catalog): Promise<{ cards: BattleAcademyCard[]; listed: number; unmatched: number }> {
  const listed: ListedCard[] = [];
  for (const year of BATTLE_ACADEMY_YEARS) {
    const page = encodeURIComponent(`Battle Academy ${year} (TCG)`);
    const d = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(
      `${API}?action=parse&page=${page}&prop=wikitext&format=json&redirects=1`,
    );
    const text = d?.parse?.wikitext?.['*'];
    if (!text) throw new Error(`Bulbapedia no trajo Battle Academy ${year}`);
    const cards = parseBattleAcademy(text, year);
    if (!cards.length) throw new Error(`Battle Academy ${year}: ninguna carta (¿cambió el formato?)`);
    listed.push(...cards);
  }
  const placed = placeBattleAcademy(cat, listed);
  return { ...placed, listed: listed.length };
}
