// Bulbapedia's deck lists of each Battle Academy (mazos-y-campeonatos-de-la-familia) and of the 2018 Sun & Moon Trainer
// Kit (trainer-kit-sun-moon): which original card each deck reprints and, in the numbered decks, its number there. License CC BY-NC-SA (to review before production); text only.
import { normNumber, type ArmaFinish, type BattleAcademyCard } from '@pokenitsu/core';
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
  kit?: string;
  finish?: ArmaFinish;
  langs?: string[];
}
// the Sun & Moon Trainer Kit whose cards are reprints with the deck's number in a circle (trainer-kit-sun-moon)
export const SM_KIT_PAGE = 'Sun & Moon Trainer Kit: Alolan Sandslash & Alolan Ninetales (TCG)';
const LANG_NAMES: Record<string, string> = {
  English: 'EN',
  German: 'DE',
  French: 'FR',
  Italian: 'IT',
  Spanish: 'ES',
  Portuguese: 'PT',
  Dutch: 'NL',
};
/** "are released in English, German, French, Italian, Spanish, and Portuguese": its codes; English when it doesn't say */
export function releasedIn(wikitext: string): string[] {
  const m = wikitext.match(/released in ([A-Za-z ,]+?)\./);
  const langs = m
    ? m[1]!
        .split(/,\s*(?:and\s+)?|\s+and\s+/)
        .map(x => LANG_NAMES[x.trim()])
        .filter((x): x is string => !!x)
    : [];
  return langs.length ? [...new Set(langs)] : ['EN'];
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
    const h = line.match(/\{\{[Hh]alfdecklist\/(?:nm)?header\|title=([^|}]+?)(?: Half)?(?: Deck)?\s*[|}]/);
    if (h) {
      deck = h[1]!.trim();
      continue;
    }
    const e = line.match(/\{\{[Hh]alfdecklist\/(?:nm)?entry\|([^|]*)\|(.*)$/);
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
    // the kit's note says the finish: [SM Promo 128; Water Web Holofoil], [SM Promo 128; Non Holofoil]
    const note = e[2]!.match(/\[[^\]]*;\s*([^\]]+)\]/)?.[1];
    const finish: ArmaFinish | undefined = note
      ? /non[- ]holo/i.test(note)
        ? 'normal'
        : /holo/i.test(note)
          ? 'holo'
          : undefined
      : undefined;
    out.push({
      year,
      deck,
      deckNo,
      name: (suffix && !name.endsWith(' ' + suffix) ? `${name} ${suffix}` : name).trim(),
      setName: setName.trim(),
      number: number.trim(),
      ...(finish ? { finish } : {}),
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

/** every Battle Academy's lists and the Sun & Moon Trainer Kit's, one page after another (cached a day) */
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
  // the Sun & Moon Trainer Kit of 2018, in every language it came out in
  const d = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(
    `${API}?action=parse&page=${encodeURIComponent(SM_KIT_PAGE)}&prop=wikitext&format=json&redirects=1`,
  );
  const kit = d?.parse?.wikitext?.['*'];
  if (!kit) throw new Error('Bulbapedia no trajo el Trainer Kit Sun & Moon');
  const langs = releasedIn(kit);
  const kitCards = parseBattleAcademy(kit, 2018).filter(c => c.deckNo);
  if (!kitCards.length) throw new Error('Trainer Kit Sun & Moon: ninguna carta (¿cambió el formato?)');
  listed.push(...kitCards.map(c => ({ ...c, kit: 'sm', langs })));
  const placed = placeBattleAcademy(cat, listed);
  return { ...placed, listed: listed.length };
}
