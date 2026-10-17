import { describe, expect, it } from 'vitest';
import { groupSets, matchesCardName, nameQuery } from '../src/index.js';

const ja = (id: string, code: string, date = '', series: string | null = null) => ({
  id,
  code,
  date,
  series,
  source: 'tcgdex-ja',
  lang: 'JA',
});
const intl = (id: string, series: string, date: string) => ({ id, code: id, date, series, source: 'ptcg', lang: null });

describe('cargar-selector-y-nombre: el panel agrupa por serie', () => {
  const sets = [
    ja('ja-PMCG1', 'PMCG1'),
    ja('ja-PMCG2', 'PMCG2', '1997/03/05'),
    ja('ja-PMCG4', 'PMCG4', '1997/11/21'),
    ja('ja-PMCG3', 'PMCG3'),
    ja('ja-SV2a', 'SV2a', '2023/06/16'),
    intl('swsh1', 'Sword & Shield', '2020/02/07'),
    intl('sv1', 'Scarlet & Violet', '2023/03/31'),
  ];
  it('las japonesas PMCG1–4 quedan juntas en "Base", sin fecha al final', () => {
    const base = groupSets(sets, 'ja').find(g => g.era === 'Base');
    expect(base?.sets.map(s => s.id)).toEqual(['ja-PMCG4', 'ja-PMCG2', 'ja-PMCG1', 'ja-PMCG3']);
  });
  it('la serie más nueva primero', () => expect(groupSets(sets, 'ja').map(g => g.era)).toEqual(['Scarlet & Violet', 'Base']));
  it('Scarlet & Violet antes que Sword & Shield, y sin las japonesas', () =>
    expect(groupSets(sets, 'intl').map(g => [g.era, g.sets.map(s => s.id)])).toEqual([
      ['Scarlet & Violet', ['sv1']],
      ['Sword & Shield', ['swsh1']],
    ]));
});

describe('cargar-selector-y-nombre: buscar una carta por nombre', () => {
  const meowth = { name: 'ニャース', name_en: 'Meowth' };
  it('meow encuentra Meowth por su nombre en inglés', () => expect(matchesCardName(nameQuery('meow')!, meowth)).toBe(true));
  it('el nombre japonés', () => expect(matchesCardName(nameQuery('ニャース')!, meowth)).toBe(true));
  it('katakana de medio ancho', () => expect(matchesCardName(nameQuery('ﾆｬｰｽ')!, meowth)).toBe(true));
  it('nidoran encuentra Nidoran ♀', () => expect(matchesCardName(nameQuery('nidoran')!, { name: 'Nidoran ♀' })).toBe(true));
  it('mr mime, MR. MIME y mrmime', () => {
    for (const q of ['mr mime', 'MR. MIME', 'mrmime']) expect(matchesCardName(nameQuery(q)!, { name_en: 'Mr. Mime' })).toBe(true);
  });
  it('tildes', () => expect(matchesCardName(nameQuery('flabebe')!, { name: 'Flabébé' })).toBe(true));
  it('no coincide', () => expect(matchesCardName(nameQuery('pikachu')!, meowth)).toBe(false));
  it('idioma, estado, números y rangos no son nombres', () => {
    for (const x of ['es', 'NM', 'lp', '25r', '1-30', '133', 'e', ' ']) expect(nameQuery(x)).toBeNull();
  });
});
