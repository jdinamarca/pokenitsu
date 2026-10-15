// Builds the Full of one Pokémon from every source and stores it in arma.* (never anywhere else).
// A source that fails keeps what it had brought before; the summary says which one failed and why.
import {
  buildEquivalences,
  catalogCode,
  mergeClaims,
  misfiled,
  normNumber,
  type Claim,
  type DesignLink,
  type MergedPrinting,
} from '@pokenitsu/core';
import { pool, tx } from './db.ts';
import { cardIdOf, catalogClaims, loadCatalog } from './sources/catalog.ts';
import { stats } from './sources/http.ts';
import { bulbapediaLinks } from './sources/bulbapedia.ts';
import { pokecottageClaims } from './sources/pokecottage.ts';
import { speciesNames, tcgdexClaims } from './sources/tcgdex.ts';

export interface SourceSummary {
  ok: boolean;
  error?: string;
  claims?: number;
  [k: string]: unknown;
}
export interface ImportSummary {
  dex: number;
  species: string;
  printings: number;
  added: number;
  updated: number;
  removed: number;
  equivalences: number;
  unmatched: number;
  requests: { cached: number; fetched: number };
  sources: Record<string, SourceSummary>;
}

const running = new Map<number, Promise<ImportSummary>>();
/** one import per Pokémon at a time */
export function importDex(dex: number): Promise<ImportSummary> {
  if (!running.has(dex))
    running.set(
      dex,
      run(dex).finally(() => running.delete(dex)),
    );
  return running.get(dex)!;
}

async function run(dex: number): Promise<ImportSummary> {
  const before = { ...stats };
  const cat = await loadCatalog();
  const { en } = await speciesNames(dex);
  const prefix = en.slice(0, 3).toUpperCase();
  const sources: Record<string, SourceSummary> = {};
  const claims: Claim[] = [];
  let links: DesignLink[] = [];
  const attempt = async (ids: string[], fn: () => Promise<Record<string, unknown> & { claims?: Claim[] }>) => {
    try {
      const r = await fn();
      // a claim no source should make (a Japan-only stamp on a Western card) is left out and counted
      if (r.claims) claims.push(...r.claims.filter(c => !misfiled(c)));
      for (const id of ids) {
        const mine = r.claims?.filter(c => c.source === id).length;
        const wrong = r.claims?.filter(c => c.source === id && misfiled(c)).length;
        sources[id] = {
          ok: true,
          ...(mine !== undefined ? { claims: mine } : {}),
          ...(wrong ? { misfiled: wrong } : {}),
          ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'claims')),
        };
      }
    } catch (e) {
      for (const id of ids) sources[id] = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
  await attempt(['pokemontcg', 'tcgplayer'], async () => ({ claims: await catalogClaims(dex) }));
  await attempt(['tcgdex'], () => tcgdexClaims(cat, dex));
  await attempt(['pokecottage'], () => pokecottageClaims(cat, dex, en));
  await attempt(['bulbapedia'], async () => {
    const r = await bulbapediaLinks(cat, en);
    links = r.links;
    return { links: r.links.length, designs: r.designs, unmatched: r.unmatched };
  });

  // Bulbapedia down: its links are rebuilt from the equivalences it backed in the last import, so none is lost
  if (!sources.bulbapedia?.ok) {
    const { rows } = await pool.query<{ set_key: string; number: string; value: string }>(
      `SELECT DISTINCT p.set_key, p.number, f.value FROM arma.facts f JOIN arma.printings p ON p.code = f.printing_code
       WHERE p.dex = $1 AND f.source_id = 'bulbapedia' AND f.field = 'equivalence'`,
      [dex],
    );
    const byGroup = new Map<string, { setKey: string; number: string }[]>();
    for (const r of rows) byGroup.set(r.value, [...(byGroup.get(r.value) || []), { setKey: r.set_key, number: r.number }]);
    for (const cards of byGroup.values())
      for (const b of cards.slice(1)) if (b.setKey !== cards[0]!.setKey) links.push({ a: cards[0]!, b, source: 'bulbapedia' });
    sources.bulbapedia = { ...sources.bulbapedia!, kept: links.length };
  }
  const merged = mergeClaims(claims);
  for (const p of merged) p.cardId ||= cardIdOf(cat, p.setKey, p.number) ?? null;
  // a link whose Japanese number Bulbapedia does not give: the only card of the species in that set, if there is one
  links = links.flatMap(l => {
    if (l.b.number) return [l];
    const nums = [...new Set(merged.filter(p => p.setKey === l.b.setKey).map(p => normNumber(p.number)))];
    return nums.length === 1 ? [{ ...l, b: { ...l.b, number: nums[0]! } }] : [];
  });
  const equivs = buildEquivalences(merged, links);
  const equivOf = new Map<string, { id: string; sources: string[] }>();
  for (const e of equivs) for (const k of e.keys) equivOf.set(k, e);
  const ok = Object.entries(sources)
    .filter(([, s]) => s.ok)
    .map(([id]) => id);

  const codeOf = (p: MergedPrinting) => catalogCode(prefix, p);
  const { rows: existing } = await pool.query<{ code: string }>('SELECT code FROM arma.printings WHERE dex = $1', [dex]);
  const had = new Set(existing.map(r => r.code));
  let added = 0,
    updated = 0;
  await tx(async c => {
    for (const p of merged) {
      const e = equivOf.get(p.key)!;
      const design = `${prefix}:${e.id.split('|').slice(0, 2).join('|')}`;
      await c.query(
        `INSERT INTO arma.designs (id, dex, name, artist, sort_date) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = coalesce(EXCLUDED.name, arma.designs.name), artist = coalesce(arma.designs.artist, EXCLUDED.artist),
           sort_date = least(arma.designs.sort_date, EXCLUDED.sort_date)`,
        [design, dex, p.name || en, p.artist, p.release],
      );
      const code = codeOf(p);
      if (had.has(code)) updated++;
      else added++;
      await c.query(
        `INSERT INTO arma.printings (code, dex, set_key, set_name, number, lang, finish, stamp, name, artist, release, design_id, card_id, equiv_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
         ON CONFLICT (code) DO UPDATE SET set_name = coalesce(EXCLUDED.set_name, arma.printings.set_name), number = EXCLUDED.number,
           name = coalesce(EXCLUDED.name, arma.printings.name), artist = coalesce(EXCLUDED.artist, arma.printings.artist),
           release = coalesce(EXCLUDED.release, arma.printings.release), design_id = EXCLUDED.design_id,
           card_id = coalesce(EXCLUDED.card_id, arma.printings.card_id), equiv_id = EXCLUDED.equiv_id, updated_at = now()`,
        [code, dex, p.setKey, p.setName, p.number, p.lang, p.finish, p.stamp, p.name, p.artist, p.release, design, p.cardId, e.id],
      );
    }
    // the facts of the sources that answered are replaced; a failed source keeps its old ones
    await c.query(
      `DELETE FROM arma.facts f USING arma.printings p WHERE p.code = f.printing_code AND p.dex = $1 AND f.source_id = ANY ($2)`,
      [dex, ok],
    );
    for (const p of merged) {
      const code = codeOf(p),
        e = equivOf.get(p.key)!;
      const facts = [
        ...p.facts,
        ...e.sources.filter(s => ok.includes(s)).map(s => ({ field: 'equivalence' as const, source: s, value: e.id, ref: null })),
      ];
      for (const f of facts)
        await c.query(
          `INSERT INTO arma.facts (printing_code, field, source_id, value, ref) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (printing_code, field, source_id) DO UPDATE SET value = EXCLUDED.value, ref = EXCLUDED.ref, fetched_at = now()`,
          [code, f.field, f.source, f.value, f.ref],
        );
    }
  });
  // a printing no source says exists anymore (every source behind it answered and none brought it) is gone, with what
  // still hung from it (a local photo, by cascade): otherwise a misfiled printing would live on through its photo
  const { rowCount: removed } = await pool.query(
    `DELETE FROM arma.printings p WHERE p.dex = $1
     AND NOT EXISTS (SELECT 1 FROM arma.facts f WHERE f.printing_code = p.code AND f.field = 'exists')`,
    [dex],
  );
  const summary: ImportSummary = {
    dex,
    species: en,
    printings: merged.length,
    added,
    updated,
    removed: removed ?? 0,
    equivalences: equivs.length,
    unmatched: merged.filter(p => p.setKey.includes(':')).length,
    requests: { cached: stats.cached - before.cached, fetched: stats.fetched - before.fetched },
    sources,
  };
  await pool.query('INSERT INTO arma.imports (dex, summary) VALUES ($1, $2)', [dex, JSON.stringify(summary)]);
  return summary;
}
