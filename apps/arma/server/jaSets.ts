// The Japanese expansions only Limitless TCG has (expansiones-japonesas-de-limitless): BW's, the BW-P/XY-P/SM-P/S-P
// promos, the decks and starter sets TCGdex lacks. For local use only (ARMA_FOTOS_LOCALES=1), each one as a catalog
// expansion (source 'limitless') with Limitless's list, and the Full's printings linked to its cards.
import { pool } from './db.ts';
import { fillJaSetFromLimitless } from './jaLists.ts';
import { limitlessFile, PROMO, XY_CODES } from './limitless.ts';
import { localPhotosOn } from './local.ts';
import { fetchText } from './sources/http.ts';
import { PC_SET_ALIASES } from './sources/pokecottage.ts';

export interface IndexedJaSet {
  code: string;
  name: string;
  /** the era it is listed under: "Sun & Moon" */
  era: string | null;
  release: string | null;
  cards: number;
}
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "23 Nov 18" → 2018-11-23 (Limitless's index starts in 2010); null for a promo set without date */
export function indexDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2}) ([A-Z][a-z]{2}) (\d{2})$/);
  const month = m ? MONTHS.indexOf(m[2]!) + 1 : 0;
  return m && month ? `20${m[3]}-${String(month).padStart(2, '0')}-${m[1]!.padStart(2, '0')}` : null;
}

/**
 * Limitless's index of Japanese expansions (/cards/jp): a sub-heading per era, then a row per expansion with its code,
 * its English name, its date and how many cards it has
 */
export function parseLimitlessIndex(html: string): IndexedJaSet[] {
  const out: IndexedJaSet[] = [];
  const seen = new Set<string>();
  let era: string | null = null;
  for (const part of html.split(/<tr[\s>]/).slice(1)) {
    const heading = part.match(/<th class="sub-heading"[^>]*>([\s\S]*?)<\/th>/);
    if (heading) {
      era = text(heading[1]!) || null;
      continue;
    }
    const cells = [...part.split('</tr>')[0]!.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]!);
    const code = cells[0]?.match(/href="\/cards\/jp\/([A-Za-z0-9-]+)"/)?.[1];
    if (!code || cells.length < 3 || seen.has(code)) continue;
    seen.add(code);
    const name = text(cells[0]!.replace(/<span class="code[^"]*">[\s\S]*?<\/span>/, ''));
    const cards = parseInt(text(cells[2]!.replace(/<span class="playability"[\s\S]*?<\/span>/, '')), 10);
    out.push({ code, name, era, release: indexDate(text(cells[1]!)), cards: Number.isFinite(cards) ? cards : 0 });
  }
  return out;
}
export const LIMITLESS_INDEX = 'https://limitlesstcg.com/cards/jp';

const PROMO_OF = Object.fromEntries(Object.entries(PROMO).map(([td, l]) => [l, td]));
const XY_OF = Object.fromEntries(Object.entries(XY_CODES).map(([td, l]) => [l, td]));
/** our id for a Limitless code: its promos and the XY coded otherwise as TCGdex writes them (SMP → ja-SM-P, XY1x → ja-XY1a) */
export const jaSetIdOf = (code: string) => `ja-${PROMO_OF[code] ?? XY_OF[code] ?? code}`;

/** the expansions of the index the catalog doesn't have, by our id without telling capitals apart */
export function missingJaSets(index: readonly IndexedJaSet[], ourIds: readonly string[]) {
  const have = new Set(ourIds.map(id => id.toLowerCase()));
  return index.filter(s => !have.has(jaSetIdOf(s.code).toLowerCase())).map(s => ({ ...s, id: jaSetIdOf(s.code) }));
}

/** PokeCottage's Japanese sets named otherwise than Limitless, each checked by name and cards: PokeCottage's code → Limitless's */
const PC_CODES: Record<string, string> = {
  bw8s: 'BW8f', // Spiral Force
  bw8t: 'BW8n', // Thunder Knuckle, Limitless's "Raiden Knuckle"
  bwsc: 'SC', // Shiny Collection
  smxy: 'XY', // THE BEST OF XY
  swshp: 'SP', // Sword & Shield Promos
  svs: 'SD', // V Starter Decks
  sfp: 'SH', // Sword & Shield Family Pokémon Card Game
};
/** the catalog expansion of a Full's PokeCottage Japanese key (pc:jpn_smi → ja-SMI), among our ids; null when none */
export function setOfPcKey(setKey: string, ourIds: readonly string[]): string | null {
  const m = setKey.match(/^pc:(jpn_(.+))$/);
  if (!m) return null;
  const byLower = new Map(ourIds.map(id => [id.toLowerCase(), id]));
  const alias = PC_SET_ALIASES[m[1]!];
  if (alias) return byLower.get(alias.toLowerCase()) ?? null;
  // PokeCottage writes the promos in lower case (jpn_smp); its own codes are never Limitless's XY ones
  const code = PC_CODES[m[2]!] ?? m[2]!;
  const promo = Object.keys(PROMO_OF).find(l => l.toLowerCase() === code.toLowerCase());
  return byLower.get((promo ? jaSetIdOf(promo) : `ja-${code}`).toLowerCase()) ?? null;
}

/** The Full's printings without a card, linked: PokeCottage's Japanese keys to their expansion by number and Pokédex
 *  (a crossed code can never link another Pokémon; a Trainer with a cameo has none: BW-P 190 Pokémon Center), and the
 *  ja-* imported before their card existed by number */
export async function linkFullToJaSets(): Promise<number> {
  const { rows: ids } = await pool.query<{ id: string }>(`SELECT id FROM sets WHERE id LIKE 'ja-%'`);
  const ourIds = ids.map(r => r.id);
  const { rows: keys } = await pool.query<{ set_key: string }>(
    `SELECT DISTINCT set_key FROM arma.printings WHERE card_id IS NULL AND (set_key LIKE 'pc:jpn\\_%' OR set_key LIKE 'ja-%')`,
  );
  let linked = 0;
  for (const { set_key } of keys) {
    const pc = set_key.startsWith('pc:');
    const setId = pc ? setOfPcKey(set_key, ourIds) : set_key;
    if (!setId) continue;
    const r = await pool.query(
      `UPDATE arma.printings p SET card_id = k.id FROM cards k
       WHERE p.set_key = $1 AND p.card_id IS NULL AND k.set_id = $2 AND ($3 = false OR p.dex = ANY (k.dex) OR cardinality(k.dex) = 0)
         AND k.number_norm = regexp_replace(upper(trim(p.number)), '^([A-Z]*)0+(?=\\d)', '\\1')`,
      [set_key, setId, pc],
    );
    linked += r.rowCount || 0;
  }
  return linked;
}

export interface JaSetsResult {
  added: number;
  filled: number;
  cards: number;
  missing: string[];
  linked: number;
}
let running: Promise<JaSetsResult | null> | null = null;
/** Every Japanese expansion of Limitless's index in the catalog, with its cards, and the Full linked; one run at a time,
 *  only in local mode */
export function syncJaSets(): Promise<JaSetsResult | null> {
  if (!localPhotosOn()) return Promise.resolve(null);
  running ??= run().finally(() => (running = null));
  return running;
}
async function run(): Promise<JaSetsResult> {
  const index = (await fetchText(LIMITLESS_INDEX, parseLimitlessIndex)) ?? [];
  const res: JaSetsResult = { added: 0, filled: 0, cards: 0, missing: [], linked: 0 };
  if (index.length) {
    const { rows } = await pool.query<{ id: string }>(`SELECT id FROM sets WHERE id LIKE 'ja-%'`);
    for (const s of missingJaSets(
      index,
      rows.map(r => r.id),
    )) {
      // cards_synced_at already: @pokenitsu/inventory downloads nothing for it, its list comes from here
      const r = await pool.query(
        `INSERT INTO sets (id, name, series, code, release_date, total, source, lang, cards_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'limitless', 'JA', now()) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.era, s.code, s.release, s.cards || null],
      );
      res.added += r.rowCount || 0;
    }
    // the ones still without cards, one after the other: Limitless's own, and TCGdex's answered empty that Limitless lists
    const codes = new Set(index.map(s => s.code));
    const { rows: empty } = await pool.query<{ id: string }>(
      `SELECT s.id FROM sets s WHERE s.id LIKE 'ja-%' AND s.cards_synced_at IS NOT NULL AND s.source IN ('limitless', 'tcgdex-ja')
         AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id) ORDER BY s.release_date, s.id`,
    );
    for (const { id } of empty) {
      const f = limitlessFile(id, '1');
      if (!f || !codes.has(f.code)) continue;
      const r = await fillJaSetFromLimitless(id).catch(e => {
        console.warn(`[arma] lista de Limitless de ${id}:`, e instanceof Error ? e.message : e);
        return 'missing' as const;
      });
      if (r === 'missing') res.missing.push(id.slice(3));
      else if (r) {
        res.filled++;
        res.cards += r.filled;
      }
    }
  }
  res.linked = await linkFullToJaSets();
  return res;
}
