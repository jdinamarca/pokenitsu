import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) } }));
const { billsSlug, matchBills, parseBillsPage } = await import('./billsarchive.ts');

const CDN = 'https://bills-archive.nyc3.cdn.digitaloceanspaces.com/tcgdex_cards_jp';
// what a set page looks like: each image twice (the grid and a lightbox), in both quotes, and links to the others
const page = (code: string, ns: number[]) =>
  `<nav><a href="/rocket-gang-jp.html">Rocket Gang</a><a href="/split-earth-jp.html">x</a><a href="/gym-heroes.html">x</a></nav>` +
  ns
    .map(n => `<img src="${CDN}/${code}/${code}-${n}_card-${n}.webp"><a onclick="open('${CDN}/${code}/${code}-${n}_card-${n}.webp')">`)
    .join('');

describe("fotos-billsarchive-japonesas: la página de Bill's Archive", () => {
  it('lee el código y cada carta una vez', () => {
    const p = parseBillsPage(page('pmcg5', [1, 2, 70]))!;
    expect(p.code).toBe('pmcg5');
    expect(p.count).toBe(3);
    expect(p.images.find(i => i.n === '70')?.url).toBe(`${CDN}/pmcg5/pmcg5-70_card-70.webp`);
  });
  it('una página sin imágenes', () => expect(parseBillsPage('<html></html>')).toBeNull());
  it('el nombre en la dirección', () => {
    expect(billsSlug("Leaders' Stadium")).toBe('leaders-stadium');
    expect(billsSlug('Pokémon Jungle')).toBe('pokemon-jungle');
    expect(billsSlug('Crossing the Ruins...')).toBe('crossing-the-ruins');
    expect(billsSlug('Golden Sky, Silvery Ocean')).toBe('golden-sky-silvery-ocean');
  });
});

describe('fotos-billsarchive-japonesas: el cruce con el catálogo', () => {
  const p = parseBillsPage(page('pmcg5', [1, 2, 70]))!;
  const card = (n: string, set = 'ja-PMCG5') => ({ id: `${set}-${n}`, set_id: set, number: n });
  it('pmcg5-70 va a ja-PMCG5 #070', () =>
    expect(matchBills(p, 'ja-PMCG5', 3, [card('070')]).found.get('ja-PMCG5-070')).toContain('pmcg5-70_'));
  it('e4-10 va a ja-E4 #010', () => {
    const e4 = parseBillsPage(page('e4', [10]))!;
    expect(matchBills(e4, 'ja-E4', 1, [card('010', 'ja-E4')]).found.get('ja-E4-010')).toContain('e4-10_');
  });
  it('si la cantidad no calza, nada', () => {
    const r = matchBills(p, 'ja-PMCG5', 96, [card('070')]);
    expect(r.mismatch).toBe(true);
    expect(r.found.size).toBe(0);
  });
  it('otra expansión, nada', () => expect(matchBills(p, 'ja-PMCG4', 3, [card('070', 'ja-PMCG4')]).mismatch).toBe(true));
  it('un número que la página no tiene, nada', () => expect(matchBills(p, 'ja-PMCG5', 3, [card('050')]).found.size).toBe(0));
});
