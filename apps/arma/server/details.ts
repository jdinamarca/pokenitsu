// The Japanese cards' details (detalles-de-japonesas-en-arma): what TCGdex left empty, filled from Arma without waiting
// for Nitsu. Three steps: TCGdex (as Nitsu's details.js), the Pokédex from the name (PokéAPI's names) and the illustrator
// from the same card in English (Bulbapedia says which one; the illustrator is our catalog's). Only empty fields are
// written, never one that is already there. The catalog is shared: the pool, not asViewer.
import {
  dexFromJaName,
  normNumber,
  parseSpeciesCsv,
  speciesIndex,
  standardVariants,
  type DesignLink,
  type SpeciesIndex,
} from '@pokenitsu/core';
import { pool } from './db.ts';
import { loadCatalog, type Catalog } from './sources/catalog.ts';
import { bulbapediaLinks, NoCardList } from './sources/bulbapedia.ts';
import { fetchJson, fetchText, mapLimit, SourceBusy, stats } from './sources/http.ts';

const TCGDEX = 'https://api.tcgdex.net/v2';
const SPECIES_CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';
const DAYS_30 = 30 * 24 * 3600 * 1000;
const SUPERTYPE: Record<string, string> = { Pokemon: 'Pokémon', Trainer: 'Trainer', Energy: 'Energy' };
const JA = `s.source = 'tcgdex-ja'`;
const NO_ARTIST = `coalesce(c.artist, '') = ''`;
/** never asked to TCGdex and something missing */
const ASK_TCGDEX = `c.details_at IS NULL AND (${NO_ARTIST} OR c.supertype IS NULL OR (cardinality(c.dex) = 0 AND c.supertype = 'Pokémon'))`;
const NO_DEX = `cardinality(c.dex) = 0 AND c.supertype = 'Pokémon'`;
const NO_ARTIST_PK = `${NO_ARTIST} AND c.supertype = 'Pokémon'`;

// ---------- TCGdex: one card ----------
interface TdCard {
  category?: string;
  illustrator?: string;
  rarity?: string;
  dexId?: number[];
  variants?: Record<string, boolean>;
}
/** only what is written is kept in the cache, not the prices that come with it */
const keep = (x: unknown): TdCard => {
  const c = x as TdCard;
  return { category: c.category, illustrator: c.illustrator, rarity: c.rarity, dexId: c.dexId, variants: c.variants };
};
/** TCGdex marks a form with a decimal (Rayquaza δ is 384.1): the species is the integer part */
export const dexIds = (d: unknown): number[] | null => {
  const ids = Array.isArray(d)
    ? [
        ...new Set(
          d
            .map(Number)
            .filter(n => n >= 1)
            .map(Math.trunc),
        ),
      ]
    : [];
  return ids.length ? ids : null;
};
/** the same fill as Nitsu's details.js: coalesce everywhere, dex and variants only when they were empty */
async function applyTcgdex(cardId: string, x: TdCard) {
  const vs = x.variants ? standardVariants(Object.keys(x.variants).filter(k => x.variants![k])) : null;
  await pool.query(
    `UPDATE cards SET artist = coalesce(nullif(artist, ''), $2), rarity = coalesce(nullif(rarity, ''), $3),
       dex = CASE WHEN cardinality(dex) = 0 AND $4::int[] IS NOT NULL THEN $4::int[] ELSE dex END,
       supertype = coalesce(supertype, $5), details_at = now(),
       variants = CASE WHEN variants IS NULL AND $6::text[] IS NOT NULL AND cardinality($6::text[]) > 0 THEN $6::text[] ELSE variants END,
       variants_guessed = CASE WHEN variants IS NULL AND $6::text[] IS NOT NULL AND cardinality($6::text[]) > 0 THEN false ELSE variants_guessed END
     WHERE id = $1`,
    [
      cardId,
      x.illustrator || null,
      x.rarity && x.rarity !== 'None' ? x.rarity : null,
      dexIds(x.dexId),
      SUPERTYPE[x.category || ''] || null,
      vs,
    ],
  );
}
/** 'filled' | 'missing' (TCGdex doesn't have it: marked, not asked again); a failure throws and leaves it unmarked */
async function askTcgdex(cardId: string): Promise<'filled' | 'missing'> {
  const url = `${TCGDEX}/ja/cards/${encodeURIComponent(cardId.replace(/^ja-/, ''))}`;
  // the trimmed answer under its own key: the importer keeps the whole one under the URL (master-set-familia-eevee)
  const opts = { transform: keep, cacheKey: `${url}#detalles` };
  let x: TdCard | null;
  try {
    x = await fetchJson<TdCard>(url, opts);
  } catch (e) {
    if (!(e instanceof SourceBusy)) throw e;
    await sleep(e.retryAfterMs);
    x = await fetchJson<TdCard>(url, opts);
  }
  if (!x) {
    await pool.query('UPDATE cards SET details_at = now() WHERE id = $1', [cardId]);
    return 'missing';
  }
  await applyTcgdex(cardId, x);
  return 'filled';
}

// ---------- the Pokédex from the name ----------
interface Species {
  idx: SpeciesIndex;
  en: Map<number, string>;
  /** the name in kana (the CSV's language 1 comes before the kanji one) */
  ja: Map<number, string>;
}
let species: Promise<Species> | null = null;
/** PokéAPI's names, one file asked once a month; kept as what is used, not the CSV */
export function speciesNames(): Promise<Species> {
  species ??= fetchText(SPECIES_CSV, parseSpeciesCsv, { ttl: DAYS_30 })
    .then(n => {
      if (!n?.ja.length) throw new Error('PokéAPI no trajo la lista de nombres');
      const ja = new Map<number, string>();
      for (const [name, dex] of n.ja) if (!ja.has(dex)) ja.set(dex, name);
      return { idx: speciesIndex(n.ja), en: new Map(n.en), ja };
    })
    .catch(e => {
      species = null;
      throw e;
    });
  return species;
}
async function dexByName(cards: { id: string; name: string }[]): Promise<{ filled: number; missing: number }> {
  if (!cards.length) return { filled: 0, missing: 0 };
  const { idx } = await speciesNames();
  let filled = 0;
  for (const c of cards) {
    const dex = dexFromJaName(c.name, idx);
    if (!dex.length) continue;
    const r = await pool.query(`UPDATE cards SET dex = $2 WHERE id = $1 AND cardinality(dex) = 0`, [c.id, dex]);
    filled += r.rowCount || 0;
  }
  return { filled, missing: cards.length - filled };
}

// ---------- the cards just loaded ----------
/** after a load answered: TCGdex if never asked, then the Pokédex from the name; errors only go to the log */
export async function fillJaDetails(cardIds: string[]): Promise<void> {
  const ids = cardIds.filter(id => id.startsWith('ja-'));
  if (!ids.length) return;
  const ask = await pool.query<{ id: string }>(
    `SELECT c.id FROM cards c JOIN sets s ON s.id = c.set_id WHERE c.id = ANY ($1) AND ${JA} AND ${ASK_TCGDEX}`,
    [ids],
  );
  for (const { id } of ask.rows) await askTcgdex(id);
  const noDex = await pool.query<{ id: string; name: string }>(
    `SELECT c.id, c.name FROM cards c JOIN sets s ON s.id = c.set_id WHERE c.id = ANY ($1) AND ${JA} AND ${NO_DEX}`,
    [ids],
  );
  await dexByName(noDex.rows);
}

// ---------- the illustrator from the same card in English ----------
export interface JaCard {
  id: string;
  set_id: string;
  number_norm: string;
  artist: string | null;
}
/**
 * Which Japanese cards of one species get which illustrator: the pair's Japanese card when it has no illustrator and
 * its English one has; a pair without a Japanese number (old sets) only when the species has a single card in that set.
 * A card two pairs give different illustrators gets none.
 */
export function artistsFromLinks(
  links: readonly DesignLink[],
  jaCards: readonly JaCard[],
  enArtist: (setKey: string, number: string) => string | null | undefined,
): Map<string, string> {
  const bySet = new Map<string, JaCard[]>();
  for (const c of jaCards) bySet.set(c.set_id, [...(bySet.get(c.set_id) || []), c]);
  const got = new Map<string, Set<string>>();
  for (const l of links) {
    const artist = enArtist(l.a.setKey, l.a.number)?.trim();
    if (!artist) continue;
    const inSet = bySet.get(l.b.setKey) || [];
    const card = l.b.number ? inSet.find(c => c.number_norm === normNumber(l.b.number)) : inSet.length === 1 ? inSet[0] : undefined;
    if (!card || card.artist?.trim()) continue;
    got.set(card.id, (got.get(card.id) || new Set()).add(artist));
  }
  return new Map([...got].filter(([, a]) => a.size === 1).map(([id, a]) => [id, [...a][0]!]));
}

// ---------- the administrator's job, from "Por reemplazar" ----------
export interface StepCount {
  total: number;
  done: number;
  filled: number;
  missing: number;
  failed: number;
}
export interface DetailsJob {
  running: boolean;
  phase: 'tcgdex' | 'pokedex' | 'ilustrador';
  /** the card (ja-M2-010) or the species (#196 Espeon) being asked */
  current: string | null;
  steps: { tcgdex: StepCount; pokedex: StepCount; ilustrador: StepCount };
  /** a source asked to wait (or failed): the next request after this */
  waitingUntil?: string;
  /** Bulbapedia failed too many times in a row: asking again goes on with what's left */
  stopped?: string;
  error?: string;
}
export interface Pending {
  tcgdex: number;
  pokedex: number;
  ilustrador: number;
}
/** sets: only those expansions (to try it without the whole catalog) */
export async function pendingDetails(sets: string[] | null = null): Promise<Pending> {
  const { rows } = await pool.query<Pending>(
    `SELECT count(*) FILTER (WHERE ${ASK_TCGDEX})::int AS tcgdex, count(*) FILTER (WHERE ${NO_DEX})::int AS pokedex,
            count(*) FILTER (WHERE ${NO_ARTIST_PK})::int AS ilustrador
     FROM cards c JOIN sets s ON s.id = c.set_id WHERE ${JA} AND ($1::text[] IS NULL OR c.set_id = ANY ($1))`,
    [sets],
  );
  return rows[0]!;
}

export interface Polite {
  /** after a species' page actually asked (not one from the cache) */
  pagePause: number;
  /** after a failure that isn't a "wait" (SourceBusy says its own) */
  errorPause: number;
  /** this many failures in a row stop the step */
  maxFails: number;
}
export const POLITE: Polite = { pagePause: 1500, errorPause: 5000, maxFails: 3 };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const count = (): StepCount => ({ total: 0, done: 0, filled: 0, missing: 0, failed: 0 });

export interface ArtistGroup {
  dex: number;
  name: string;
}
export interface ArtistIo {
  links: (g: ArtistGroup) => Promise<DesignLink[]>;
  /** writes what the links give and says how many it filled and how many of the species stay without one */
  write: (g: ArtistGroup, links: DesignLink[]) => Promise<{ filled: number; missing: number }>;
}
/** one species at a time: a pause after each page asked, what a 429/503 asks, and a stop after maxFails in a row */
export async function artistStep(groups: readonly ArtistGroup[], io: ArtistIo, j: DetailsJob, polite: Polite = POLITE) {
  const s = j.steps.ilustrador;
  let fails = 0;
  for (const g of groups) {
    j.current = `#${g.dex} ${g.name}`;
    for (;;) {
      const before = stats.fetched;
      try {
        const links = await io.links(g);
        fails = 0;
        const r = await io.write(g, links);
        s.filled += r.filled;
        s.missing += r.missing;
        if (stats.fetched > before) await sleep(polite.pagePause);
        break;
      } catch (e) {
        if (e instanceof NoCardList) {
          fails = 0;
          s.missing += (await io.write(g, [])).missing;
          break;
        }
        if (++fails >= polite.maxFails) {
          s.failed++;
          j.stopped = `Bulbapedia respondió con errores ${fails} veces seguidas (${e instanceof Error ? e.message : String(e)})`;
          return;
        }
        const ms = e instanceof SourceBusy ? e.retryAfterMs : polite.errorPause;
        j.waitingUntil = new Date(Date.now() + ms).toISOString();
        await sleep(ms);
        j.waitingUntil = undefined;
        if (!(e instanceof SourceBusy)) {
          s.failed++;
          break;
        }
      }
    }
    s.done++;
  }
}

/** the species' Japanese cards (all of them, to know when one is the only one in its set) and their pairs written */
function artistIo(cat: Catalog, sets: string[] | null): ArtistIo {
  return {
    links: g => bulbapediaLinks(cat, g.name, { ttl: DAYS_30 }).then(r => r.links),
    async write(g, links) {
      const { rows: ja } = await pool.query<JaCard>(
        `SELECT c.id, c.set_id, c.number_norm, c.artist FROM cards c JOIN sets s ON s.id = c.set_id
         WHERE ${JA} AND $1 = ANY (c.dex) AND c.supertype = 'Pokémon'`,
        [g.dex],
      );
      const pending = ja.filter(c => !c.artist?.trim() && (!sets || sets.includes(c.set_id)));
      if (!links.length) return { filled: 0, missing: pending.length };
      const { rows: en } = await pool.query<{ set_id: string; number_norm: string; artist: string | null }>(
        `SELECT c.set_id, c.number_norm, c.artist FROM cards c JOIN sets s ON s.id = c.set_id
         WHERE s.source = 'ptcg' AND $1 = ANY (c.dex) AND coalesce(c.artist, '') <> ''`,
        [g.dex],
      );
      const enBy = new Map(en.map(c => [`${c.set_id}|${c.number_norm}`, c.artist]));
      const give = artistsFromLinks(links, ja, (set, num) => enBy.get(`${set}|${normNumber(num)}`));
      let filled = 0;
      for (const c of pending) {
        const artist = give.get(c.id);
        if (!artist) continue;
        const r = await pool.query(`UPDATE cards SET artist = $2 WHERE id = $1 AND coalesce(artist, '') = ''`, [c.id, artist]);
        filled += r.rowCount || 0;
      }
      return { filled, missing: pending.length - filled };
    },
  };
}

let job: DetailsJob | null = null;
export const detailsJob = () => job;
/** never two at once: asking while it runs gives the running one */
export function startJaDetails({ sets }: { sets?: string[] } = {}, polite: Polite = POLITE): DetailsJob {
  if (job?.running) return job;
  const only = sets?.length ? sets : null;
  const j: DetailsJob = (job = {
    running: true,
    phase: 'tcgdex',
    current: null,
    steps: { tcgdex: count(), pokedex: count(), ilustrador: count() },
  });
  (async () => {
    const scope = `${JA} AND ($1::text[] IS NULL OR c.set_id = ANY ($1))`;
    // 1. TCGdex, three at a time, newest expansions first
    const ask = await pool.query<{ id: string }>(
      `SELECT c.id FROM cards c JOIN sets s ON s.id = c.set_id WHERE ${scope} AND ${ASK_TCGDEX}
       ORDER BY s.release_date DESC NULLS LAST, c.id`,
      [only],
    );
    const t = j.steps.tcgdex;
    t.total = ask.rows.length;
    await mapLimit(ask.rows, 3, async ({ id }) => {
      j.current = id;
      try {
        t[await askTcgdex(id)]++;
      } catch {
        t.failed++;
      }
      t.done++;
    });

    // 2. the Pokédex from the name, no request but the names' file
    j.phase = 'pokedex';
    j.current = null;
    const noDex = await pool.query<{ id: string; name: string }>(
      `SELECT c.id, c.name FROM cards c JOIN sets s ON s.id = c.set_id WHERE ${scope} AND ${NO_DEX}`,
      [only],
    );
    const p = j.steps.pokedex;
    p.total = noDex.rows.length;
    Object.assign(p, await dexByName(noDex.rows), { done: noDex.rows.length });

    // 3. the illustrator, one species after the other
    j.phase = 'ilustrador';
    const { rows } = await pool.query<{ dex: number }>(
      `SELECT DISTINCT d AS dex FROM cards c JOIN sets s ON s.id = c.set_id, unnest(c.dex) d WHERE ${scope} AND ${NO_ARTIST_PK} ORDER BY 1`,
      [only],
    );
    if (rows.length) {
      const { en } = await speciesNames();
      const groups = rows.map(r => ({ dex: r.dex, name: en.get(r.dex) || '' })).filter(g => g.name);
      j.steps.ilustrador.total = groups.length;
      await artistStep(groups, artistIo(await loadCatalog(), only), j, polite);
    }
  })().then(
    () => Object.assign(j, { running: false, current: null }),
    e => Object.assign(j, { running: false, current: null, error: e instanceof Error ? e.message : String(e) }),
  );
  return j;
}
