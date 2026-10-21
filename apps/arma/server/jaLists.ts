// The card list of a Japanese expansion TCGdex has without cards (lista-de-limitless-en-japonesas-vacias), from
// Limitless TCG: for local use only (ARMA_FOTOS_LOCALES=1), each card marked with list_source = 'limitless' so it can
// be replaced by a source with permission. Ids as TCGdex would write them (ja-S10D-052), so its list adds nothing twice.
import { dexFromJaName, normNumber } from '@pokenitsu/core';
import { pool, tx } from './db.ts';
import { speciesNames } from './details.ts';
import { limitlessFile } from './limitless.ts';
import { localPhotosOn } from './local.ts';
import { fetchText } from './sources/http.ts';

export interface ListedJaCard {
  number: string;
  name: string;
  supertype: 'Pokémon' | 'Trainer' | 'Energy';
  rarity: string | null;
}
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Limitless's list view (?display=list): one <tr> per card with its number, its Japanese name, its kind (a type
 * symbol and a stage for a Pokémon; Item, Supporter, Stadium, Pokémon Tool; Basic or Special Energy) and its rarity
 */
export function parseLimitlessList(html: string): ListedJaCard[] {
  const out: ListedJaCard[] = [];
  const seen = new Set<string>();
  for (const row of html.split(/<tr data-hover=/).slice(1)) {
    const cells = [...row.split('</tr>')[0]!.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]!);
    if (cells.length < 5) continue;
    const number = text(cells[1]!);
    const name = text(cells[2]!);
    if (!/^[A-Za-z0-9-]+$/.test(number) || !name || seen.has(number)) continue;
    seen.add(number);
    const kind = text(cells[3]!);
    const supertype = /energy/i.test(kind) ? 'Energy' : /ptcg-symbol/.test(cells[3]!) ? 'Pokémon' : 'Trainer';
    out.push({ number, name, supertype, rarity: text(cells[4]!) || null });
  }
  return out;
}
/** the number as TCGdex writes it in a Japanese set: three digits (052), or as it is when it has letters */
export const jaLocalId = (n: string) => (/^\d+$/.test(n) ? n.padStart(3, '0') : n);
export const limitlessListUrl = (code: string) => `https://limitlesstcg.com/cards/jp/${encodeURIComponent(code)}?display=list`;

/** TCGdex was asked for its cards and gave none */
export const ASKED_EMPTY = `s.cards_synced_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id)`;
/** 'filled' with how many cards, 'missing' when Limitless doesn't have it, null when there was nothing to do */
export type ListResult = { filled: number } | 'missing' | null;
const filling = new Map<string, Promise<ListResult>>();
/** A Japanese expansion still without cards gets Limitless's list: only in local mode, one fill per expansion at a time */
export function fillJaSetFromLimitless(setId: string): Promise<ListResult> {
  if (!localPhotosOn() || !setId.startsWith('ja-')) return Promise.resolve(null);
  if (!filling.has(setId))
    filling.set(
      setId,
      fill(setId).finally(() => filling.delete(setId)),
    );
  return filling.get(setId)!;
}
async function fill(setId: string): Promise<ListResult> {
  const { rows } = await pool.query(`SELECT 1 FROM sets s WHERE s.id = $1 AND s.source = 'tcgdex-ja' AND ${ASKED_EMPTY}`, [setId]);
  const f = limitlessFile(setId, '1');
  if (!rows.length || !f) return null;
  const cards = (await fetchText(limitlessListUrl(f.code), parseLimitlessList)) ?? [];
  if (!cards.length) return 'missing';
  const { idx } = await speciesNames();
  const code = setId.slice(3);
  await tx(async c => {
    for (const x of cards) {
      const n = jaLocalId(x.number);
      const dex = x.supertype === 'Pokémon' ? dexFromJaName(x.name, idx) : [];
      await c.query(
        `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, dex, list_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'limitless') ON CONFLICT DO NOTHING`,
        [`ja-${code}-${n}`, setId, n, normNumber(n), x.name, x.supertype, x.rarity, dex],
      );
    }
    // the Full's printings of this expansion, imported before it had cards: linked now, as an import would (normNumber)
    await c.query(
      `UPDATE arma.printings p SET card_id = k.id FROM cards k
       WHERE p.set_key = $1 AND p.card_id IS NULL AND k.set_id = $1
         AND k.number_norm = regexp_replace(upper(trim(p.number)), '^([A-Z]*)0+(?=\\d)', '\\1')`,
      [setId],
    );
  });
  return { filled: cards.length };
}
