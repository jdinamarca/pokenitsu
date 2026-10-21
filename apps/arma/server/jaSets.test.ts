import { describe, expect, it, vi } from 'vitest';

// no database
vi.mock('./db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const { indexDate, jaSetIdOf, missingJaSets, parseLimitlessIndex, setOfPcKey } = await import('./jaSets.ts');

// rows of Limitless's index, as https://limitlesstcg.com/cards/jp writes them
const heading = (era: string) => `<tr>
            <th class="sub-heading" colspan=4>${era}</th>
        </tr>`;
const row = (code: string, name: string, date: string, cards: number) => `<tr>
                <td><a href="/cards/jp/${code}"><img class="set" alt="${code}" src="https://s3.limitlesstcg.com/sets/jp/${code}.png" loading="lazy"> ${name} <span class="code annotation">${code}</span></a></td>
                <td><a href="/cards/jp/${code}">${date}</a></td>
                <td class="md-only"><a href="/cards/jp/${code}">${cards} <span class="playability" data-tooltip="percentage of cards in this set that appear in our decklist database">84.21%</span></a></td>
                            </tr>`;

describe('expansiones-japonesas-de-limitless: el índice de Limitless', () => {
  const html = `<table class="data-table sets-table striped">
        <tr>
        <th>Name</th>
        <th>Release Date</th>
        <th class="md-only">Cards</th>
            </tr>
    ${heading('Sun &amp; Moon')}
    ${row('SM12a', 'Tag All Stars', '18 Oct 19', 173)}
    ${row('SMI', 'Starter Sets Flareon &amp; Jolteon &amp; Vaporeon', '23 Nov 18', 38)}
    ${row('SMP', 'Sun and Moon Promotional Cards', '', 440)}
    ${heading('XY')}
    ${row('XY1x', 'Collection X', '13 Dec 13', 63)}
    ${row('SMI', 'Starter Sets Flareon &amp; Jolteon &amp; Vaporeon', '23 Nov 18', 38)}
  </table>`;
  const sets = parseLimitlessIndex(html);
  it('cada expansión una vez, con su código y su nombre', () =>
    expect(sets.map(s => `${s.code} ${s.name}`)).toEqual([
      'SM12a Tag All Stars',
      'SMI Starter Sets Flareon & Jolteon & Vaporeon',
      'SMP Sun and Moon Promotional Cards',
      'XY1x Collection X',
    ]));
  it('la era, la fecha y las cartas', () => {
    expect(sets[1]).toEqual({
      code: 'SMI',
      name: 'Starter Sets Flareon & Jolteon & Vaporeon',
      era: 'Sun & Moon',
      release: '2018-11-23',
      cards: 38,
    });
    expect(sets[3]!.era).toBe('XY');
  });
  it('una promo sin fecha', () => expect(sets[2]!.release).toBeNull());
  it('una página sin índice', () => expect(parseLimitlessIndex('<html><body>Not found</body></html>')).toEqual([]));
  it('fechas', () => {
    expect(indexDate('5 Sep 25')).toBe('2025-09-05');
    expect(indexDate('')).toBeNull();
  });
});

describe('expansiones-japonesas-de-limitless: qué falta en el catálogo', () => {
  it('el id como lo escribe TCGdex', () => {
    expect(jaSetIdOf('SMI')).toBe('ja-SMI');
    expect(jaSetIdOf('SMP')).toBe('ja-SM-P');
    expect(jaSetIdOf('SVP')).toBe('ja-SV-P');
    expect(jaSetIdOf('XY1x')).toBe('ja-XY1a');
    // Limitless's XY8b is Blue Shock, TCGdex's XY8a; its XY8r is Red Flash, TCGdex's XY8b
    expect(jaSetIdOf('XY8b')).toBe('ja-XY8a');
    expect(jaSetIdOf('XY8r')).toBe('ja-XY8b');
  });
  const idx = (code: string) => ({ code, name: code, era: null, release: null, cards: 1 });
  it('solo las que no tiene, sin distinguir mayúsculas', () =>
    expect(
      missingJaSets(
        [idx('SM12a'), idx('SMI'), idx('SVP'), idx('XY1x'), idx('XY8r'), idx('BW4')],
        ['ja-SM12A', 'ja-SV-P', 'ja-XY1a', 'ja-XY8b'],
      ).map(s => s.id),
    ).toEqual(['ja-SMI', 'ja-BW4']));
});

describe('expansiones-japonesas-de-limitless: la expansión de una clave de PokeCottage', () => {
  const ours = ['ja-SMI', 'ja-SML', 'ja-BW8n', 'ja-XY', 'ja-S-P', 'ja-SM-P', 'ja-BW-P', 'ja-SM1p', 'ja-SC'];
  it('por su código', () => {
    expect(setOfPcKey('pc:jpn_smi', ours)).toBe('ja-SMI');
    expect(setOfPcKey('pc:jpn_sml', ours)).toBe('ja-SML');
  });
  it('por el nombre que le da PokeCottage', () => {
    expect(setOfPcKey('pc:jpn_bw8t', ours)).toBe('ja-BW8n');
    expect(setOfPcKey('pc:jpn_smxy', ours)).toBe('ja-XY');
    expect(setOfPcKey('pc:jpn_swshp', ours)).toBe('ja-S-P');
    expect(setOfPcKey('pc:jpn_bwsc', ours)).toBe('ja-SC');
    expect(setOfPcKey('pc:jpn_sm1+', ours)).toBe('ja-SM1p');
  });
  it('las promos, en minúsculas en PokeCottage', () => {
    expect(setOfPcKey('pc:jpn_smp', ours)).toBe('ja-SM-P');
    expect(setOfPcKey('pc:jpn_bwp', ours)).toBe('ja-BW-P');
  });
  it('una que el catálogo no tiene', () => expect(setOfPcKey('pc:jpn_dp4b', ours)).toBeNull());
  it('una clave que no es japonesa de PokeCottage', () => expect(setOfPcKey('pc:scn_cbb4', ours)).toBeNull());
});
