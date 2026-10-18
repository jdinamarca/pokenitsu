import names_ from './fixtures/pokeapi-species-names.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import { dexFromJaName, parseSpeciesCsv, speciesIndex } from '../src/index.js';

// PokéAPI's pokemon_species_names.csv, only Japanese (1, 11) and English (9)
const names = parseSpeciesCsv(names_.csv);
const idx = speciesIndex(names.ja);
const dex = (n: string) => dexFromJaName(n, idx);

describe('parseSpeciesCsv', () => {
  it('reads the 1025 species in Japanese and English', () => {
    expect(new Set(names.ja.map(([, d]) => d)).size).toBe(1025);
    expect(names.en).toContainEqual([133, 'Eevee']);
    expect(new Map(names.ja).get('イーブイ')).toBe(133);
  });
  it('drops a name two species share', () => {
    const p = parseSpeciesCsv('id,l,name,genus\n1,1,ダブリ,\n2,1,ダブリ,\n3,1,ヒトリ,\n');
    expect(p.ja).toEqual([['ヒトリ', 3]]);
  });
});

describe('dexFromJaName', () => {
  it('ignores ex, GX, V, VMAX and VSTAR', () => {
    expect(dex('エーフィex')).toEqual([196]);
    expect(dex('ブラッキーGX')).toEqual([197]);
    expect(dex('リーフィアVSTAR')).toEqual([470]);
    expect(dex('ピカチュウVMAX')).toEqual([25]);
    expect(dex('イーブイV')).toEqual([133]);
  });
  it('ignores Mega, Mega X and the old M', () => {
    expect(dex('メガミミロップex')).toEqual([428]);
    expect(dex('メガリザードンXex')).toEqual([6]);
    expect(dex('MリザードンEX')).toEqual([6]);
  });
  it("ignores an owner (ロケット団の, …の), かがやく, a region and Ogerpon's masks", () => {
    expect(dex('ロケット団のニャース')).toEqual([52]);
    expect(dex('タケシのイワーク')).toEqual([95]);
    expect(dex('かがやくゲッコウガ')).toEqual([658]);
    expect(dex('パルデア ケンタロス')).toEqual([128]);
    expect(dex('オーガポン いどのめんex')).toEqual([1017]);
    expect(dex('ガチグマ アカツキex')).toEqual([901]);
  });
  it('finds Mewtwo, not Mew, inside ミュウツー', () => {
    expect(dex('ミュウツーGX')).toEqual([150]);
    expect(dex('ミュウex')).toEqual([151]);
  });
  it('gives one number per Pokémon of a TAG TEAM, with & or ＆', () => {
    expect(dex('ピカチュウ&ゼクロムGX')).toEqual([25, 644]);
    expect(dex('ミュウツー＆ミュウGX')).toEqual([150, 151]);
  });
  it('gives nothing for a Trainer or an Energy', () => {
    expect(dex('バトルコロシアム')).toEqual([]);
    expect(dex('ジャンボアイス')).toEqual([]);
    expect(dex('イグニッションエネルギー')).toEqual([]);
  });
  it('gives nothing when one part names two species', () => {
    expect(dex('ピカチュウとゼクロム')).toEqual([]);
  });
});
