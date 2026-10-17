// Bill's Archive (https://billsarchive.com): scans of the old Japanese expansions, Trainers and Energies included, for
// local use only (fotos-billsarchive-japonesas). One page per expansion (/rocket-gang-jp.html) lists every card's image,
// named with TCGdex's set code and number, the catalog's own: tcgdex_cards_jp/e4/e4-10_yanma.webp is ja-E4 #010.
import { normNumber } from '@pokenitsu/core';
import { fetchText } from './http.ts';

const SITE = 'https://billsarchive.com';
const DAYS_30 = 30 * 24 * 3600 * 1000;

export interface BillsPage {
  /** TCGdex's set code, lower case: pmcg5, e4, neo2 */
  code: string;
  /** distinct cards on the page */
  count: number;
  images: { n: string; url: string }[];
}

/** a page's images, each card once (the page repeats them); null without any */
export function parseBillsPage(html: string): BillsPage | null {
  const re = /https:\/\/[^"'\s]*\/tcgdex_cards_jp\/([a-z0-9]+)\/\1-([0-9]+)_[^"'\s]*?\.webp/gi;
  const byN = new Map<string, string>();
  let code = '';
  for (const m of html.matchAll(re)) {
    code ||= m[1]!.toLowerCase();
    if (m[1]!.toLowerCase() !== code) continue;
    const n = normNumber(m[2]!);
    if (!byN.has(n)) byN.set(n, m[0]);
  }
  return byN.size ? { code, count: byN.size, images: [...byN].map(([n, url]) => ({ n, url })) } : null;
}
/** an expansion's English name as Bill's Archive writes it in its URLs: "Leaders' Stadium" → leaders-stadium */
export const billsSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** an expansion's page, read and kept 30 days; null when there is none */
export const billsPage = (slug: string) => fetchText(`${SITE}/${slug}-jp.html`, parseBillsPage, { ttl: DAYS_30 });

export interface BillsCard {
  id: string;
  set_id: string;
  number: string;
}
/**
 * The image of each catalog card of the page's expansion: same set (ja-<code>) and number. When the page doesn't have as
 * many cards as the expansion in the catalog, nothing: it may not be the same expansion (mismatch).
 */
export function matchBills(
  page: BillsPage,
  setId: string,
  setCards: number,
  cards: BillsCard[],
): { mismatch: boolean; found: Map<string, string> } {
  if (setId.toLowerCase() !== `ja-${page.code}` || page.count !== setCards) return { mismatch: true, found: new Map() };
  const byN = new Map(page.images.map(i => [i.n, i.url]));
  const found = new Map<string, string>();
  for (const c of cards) {
    const url = c.set_id === setId ? byN.get(normNumber(c.number)) : undefined;
    if (url) found.set(c.id, url);
  }
  return { mismatch: false, found };
}
