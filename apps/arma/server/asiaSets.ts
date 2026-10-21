// The expansions only China has (expansiones-chinas-en-cargar), as catalog expansions (source 'asia'): the Full's Chinese
// printings that are not a Japanese expansion's translation, one expansion per code and language. Its name, date and
// cards come from TCGdex when it has them; an expansion TCGdex has without cards is built from the Full's printings
// (PokeCottage's text, allowed in production), marked list_source = 'full'. The Full's printings are linked to its cards.
import { normNumber } from '@pokenitsu/core';
import { pool, tx } from './db.ts';
import { fetchJson } from './sources/http.ts';

const TCGDEX = 'https://api.tcgdex.net/v2';
export type ChineseLang = 'ZH-CN' | 'ZH-TW';
const TD_LANG: Record<ChineseLang, string> = { 'ZH-CN': 'zh-cn', 'ZH-TW': 'zh-tw' };

/** an expansion's code in the Full's key: pc:scn_cbb4 → cbb4, td-zh-tw:SCC → SCC; null for any other key */
export function codeOfKey(setKey: string): string | null {
  const m = setKey.match(/^pc:scn_(.+)$/) || setKey.match(/^td-zh-(?:cn|tw):(.+)$/);
  return m ? m[1]! : null;
}
/** TCGdex's id for a code in that language: PokeCottage's with the C the printed code ends in (cbb4 → CBB4C), which
 *  TCGdex prefers when it has both (CSM1aC and csm1a), or the same code */
export function crossCode(code: string, tdIds: readonly string[]): string | null {
  const up = (x: string) => x.toUpperCase();
  return tdIds.find(id => up(id) === up(code) + 'C') ?? tdIds.find(id => up(id) === up(code)) ?? null;
}
/** our expansion's id: zh-cn-CBB4C */
export const asiaSetId = (lang: ChineseLang, code: string) => `${TD_LANG[lang]}-${code}`;

export interface FullPrinting {
  set_key: string;
  set_name: string | null;
  lang: ChineseLang;
  number: string;
  name: string | null;
  dex: number;
  artist: string | null;
  release: string | null;
}
export interface AsiaSet {
  id: string;
  lang: ChineseLang;
  code: string;
  /** TCGdex's id in that language, when it has the expansion */
  td: string | null;
  keys: string[];
  printings: FullPrinting[];
}
/** the Full's Chinese printings grouped into our expansions, crossed with TCGdex's ids of each language */
export function groupAsiaSets(printings: readonly FullPrinting[], tdIds: Record<ChineseLang, readonly string[]>): AsiaSet[] {
  const out = new Map<string, AsiaSet>();
  for (const p of printings) {
    const code = codeOfKey(p.set_key);
    if (!code) continue;
    const td = crossCode(code, tdIds[p.lang]);
    const id = asiaSetId(p.lang, td ?? code.toUpperCase());
    const s = out.get(id) ?? { id, lang: p.lang, code: td ?? code.toUpperCase(), td, keys: [], printings: [] };
    if (!s.keys.includes(p.set_key)) s.keys.push(p.set_key);
    s.printings.push(p);
    out.set(id, s);
  }
  return [...out.values()];
}
/** one card per number from the Full's printings: the first with a name, its Pokédex and illustrator */
export function cardsFromFull(s: Pick<AsiaSet, 'id' | 'printings'>) {
  const byNum = new Map<string, FullPrinting[]>();
  for (const p of s.printings) byNum.set(normNumber(p.number), [...(byNum.get(normNumber(p.number)) || []), p]);
  return [...byNum].map(([n, ps]) => {
    const p = ps.find(x => x.name) ?? ps[0]!;
    return {
      id: `${s.id}-${n}`,
      number: p.number,
      number_norm: n,
      name: p.name || '',
      dex: [...new Set(ps.map(x => x.dex))],
      artist: ps.find(x => x.artist)?.artist ?? null,
    };
  });
}

interface TdSetDetail {
  id: string;
  name: string;
  releaseDate?: string;
  serie?: { name?: string };
  cardCount?: { total?: number; official?: number };
  cards?: { id: string; localId: string; name: string; image?: string }[];
}
let running: Promise<{ sets: number; cards: number; linked: number }> | null = null;
/** Every Chinese expansion of the Full in the catalog, with its cards and the Full linked; one run at a time */
export function syncAsiaSets() {
  running ??= run().finally(() => (running = null));
  return running;
}
async function run() {
  const { rows } = await pool.query<FullPrinting>(
    `SELECT set_key, set_name, lang, number, name, dex, artist, to_char(release, 'YYYY-MM-DD') AS release FROM arma.printings
     WHERE lang IN ('ZH-CN', 'ZH-TW') AND set_key NOT LIKE 'ja-%'`,
  );
  if (!rows.length) return { sets: 0, cards: 0, linked: 0 };
  const tdIds = {} as Record<ChineseLang, string[]>;
  for (const lang of ['ZH-CN', 'ZH-TW'] as const)
    tdIds[lang] = ((await fetchJson<{ id: string }[]>(`${TCGDEX}/${TD_LANG[lang]}/sets`)) || []).map(s => s.id);
  let cards = 0,
    linked = 0;
  const sets = groupAsiaSets(rows, tdIds);
  for (const s of sets) {
    const td = s.td ? await fetchJson<TdSetDetail>(`${TCGDEX}/${TD_LANG[s.lang]}/sets/${encodeURIComponent(s.td)}`) : null;
    const fullName = s.printings.find(p => p.set_name)?.set_name ?? s.code;
    // PokeCottage names it in English; TCGdex's key (td-zh-tw:SCC) already brings the Chinese name
    const english = s.keys.some(k => k.startsWith('pc:')) ? fullName : null;
    const release =
      td?.releaseDate ||
      s.printings
        .map(p => p.release)
        .filter(Boolean)
        .sort()[0] ||
      null;
    const fromFull = cardsFromFull(s);
    await tx(async c => {
      await c.query(
        `INSERT INTO sets (id, name, name_en, series, code, release_date, total, printed_total, source, lang, cards_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'asia', $9, now())
         ON CONFLICT (id) DO UPDATE SET name = $2, name_en = $3, series = $4, code = $5, release_date = $6, total = $7,
           printed_total = $8, lang = $9, cards_synced_at = now()`,
        [
          s.id,
          td?.name || fullName,
          english && english !== (td?.name || fullName) ? english : null,
          td?.serie?.name || null,
          s.code,
          release,
          td?.cardCount?.total || td?.cards?.length || fromFull.length,
          td?.cardCount?.official ?? null,
          s.lang,
        ],
      );
      for (const x of td?.cards || []) {
        const r = await c.query(
          `INSERT INTO cards (id, set_id, number, number_norm, name, image_small, image_large)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
          [
            `${s.id}-${normNumber(x.localId)}`,
            s.id,
            x.localId,
            normNumber(x.localId),
            x.name,
            x.image ? `${x.image}/low.webp` : null,
            x.image ? `${x.image}/high.webp` : null,
          ],
        );
        cards += r.rowCount || 0;
      }
      // the Full's numbers TCGdex doesn't list (all of them when it has no cards), and the Pokédex TCGdex doesn't bring
      for (const x of fromFull) {
        const r = await c.query(
          `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, dex, artist, list_source)
           VALUES ($1, $2, $3, $4, $5, 'Pokémon', $6, $7, 'full')
           ON CONFLICT DO NOTHING`,
          [x.id, s.id, x.number, x.number_norm, x.name, x.dex, x.artist],
        );
        cards += r.rowCount || 0;
        await c.query(
          `UPDATE cards SET dex = $3, supertype = coalesce(supertype, 'Pokémon'), artist = coalesce(artist, $4)
           WHERE set_id = $1 AND number_norm = $2 AND cardinality(dex) = 0`,
          [s.id, x.number_norm, x.dex, x.artist],
        );
      }
      // as an import would link them (normNumber), also the ones imported before the expansion existed
      const l = await c.query(
        `UPDATE arma.printings p SET card_id = k.id FROM cards k
         WHERE p.set_key = ANY ($1) AND p.lang = $3 AND p.card_id IS NULL AND k.set_id = $2
           AND k.number_norm = regexp_replace(upper(trim(p.number)), '^([A-Z]*)0+(?=\\d)', '\\1')`,
        [s.keys, s.id, s.lang],
      );
      linked += l.rowCount || 0;
    });
  }
  return { sets: sets.length, cards, linked };
}
