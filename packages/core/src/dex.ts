// The Pokédex number of a Japanese card from its name (detalles-de-japonesas-en-arma): TCGdex leaves it empty in many
// Scarlet & Violet ex. The species names come from PokéAPI's pokemon_species_names.csv.

export interface SpeciesNames {
  /** Japanese name (kana and kanji, NFKC) → Pokédex number */
  ja: [string, number][];
  /** Pokédex number → English name */
  en: [number, string][];
}

/** PokéAPI's CSV (pokemon_species_id,local_language_id,name,genus): languages 1 and 11 are Japanese, 9 English */
export function parseSpeciesCsv(csv: string): SpeciesNames {
  const ja = new Map<string, number>();
  const clash = new Set<string>();
  const en: [number, string][] = [];
  for (const line of csv.split(/\r?\n/).slice(1)) {
    const [id, lang, name] = line.split(',');
    const dex = Number(id);
    if (!name || !Number.isInteger(dex) || dex <= 0) continue;
    if (lang === '9') en.push([dex, name]);
    else if (lang === '1' || lang === '11') {
      const n = name.normalize('NFKC');
      if (ja.has(n) && ja.get(n) !== dex) clash.add(n);
      ja.set(n, dex);
    }
  }
  for (const n of clash) ja.delete(n);
  return { ja: [...ja], en };
}

/** the names longest first, so ミュウツー is found before ミュウ can match inside it */
export const speciesIndex = (ja: SpeciesNames['ja']) => ({
  byName: new Map(ja),
  names: ja.map(([n]) => n).sort((a, b) => b.length - a.length),
});
export type SpeciesIndex = ReturnType<typeof speciesIndex>;

/**
 * The species of a Japanese Pokémon card's name, one per Pokémon of a TAG TEAM (ピカチュウ&ゼクロムGX → [25, 644]).
 * What decorates the name (ex, GX, V, メガ, ロケット団の, かがやく, パルデア, Ogerpon's masks) is simply ignored: the
 * species names are looked for inside it. Any part with no species or with two different ones → [] (better nothing
 * than a wrong number).
 */
export function dexFromJaName(name: string, idx: SpeciesIndex): number[] {
  const out: number[] = [];
  for (const part of name.normalize('NFKC').split('&')) {
    let rest = part;
    const hits = new Set<number>();
    for (const n of idx.names) {
      if (!rest.includes(n)) continue;
      hits.add(idx.byName.get(n)!);
      rest = rest.split(n).join('\u0000');
    }
    if (hits.size !== 1) return [];
    out.push([...hits][0]!);
  }
  return out;
}
