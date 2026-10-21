import { describe, expect, it, vi } from 'vitest';

// no database
vi.mock('./db.ts', () => ({ pool: { query: async () => ({ rows: [] }) }, tx: async () => {} }));
const { jaLocalId, limitlessListUrl, parseLimitlessList } = await import('./jaLists.ts');

// a row of Limitless's list view, as https://limitlesstcg.com/cards/jp/S10D?display=list writes it
const row = (set: string, n: number, name: string, kind: string, rarity: string) => `
  <tr data-hover="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/${set}/${set}_${n}_R_JP_XS.png">
    <td><span class="card-set" data-tooltip="タイムゲイザー"><img class="set" alt="${set}" src="https://s3.limitlesstcg.com/sets/jp/${set}.png" loading="lazy">${set}</span></td>
    <td><a href="/cards/jp/${set}/${n}">${n}</a></td>
    <td><a href="/cards/jp/${set}/${n}">${name}</a></td>
    <td class="md-only">
      <a href="/cards/jp/${set}/${n}">
        ${kind}
      </a>
    </td>
    <td class="md-only"><a href="/cards/jp/${set}/${n}"> ${rarity} </a></td>
    <td></td>
    <td></td>
  </tr>`;

describe('lista-de-limitless-en-japonesas-vacias: la lista de Limitless', () => {
  const html = `<table>${[
    row('S10D', 52, 'イーブイ', '<span class="ptcg-symbol">C</span> Basic', 'Common'),
    row('S10D', 60, 'いれかえカート', 'Item', 'Uncommon'),
    row('S10D', 68, 'ヒスイ ドレディアV', '<span class="ptcg-symbol">G</span> Basic', 'Secret Rare'),
    row('SV4a', 188, 'セラピーエネルギー', 'Special Energy', 'Uncommon'),
    row('S10D', 52, 'イーブイ', '<span class="ptcg-symbol">C</span> Basic', 'Common'),
  ].join('')}</table>`;
  const cards = parseLimitlessList(html);
  it('cada carta una vez, con su número y su nombre japonés', () =>
    expect(cards.map(c => `${c.number} ${c.name}`)).toEqual([
      '52 イーブイ',
      '60 いれかえカート',
      '68 ヒスイ ドレディアV',
      '188 セラピーエネルギー',
    ]));
  it('Pokémon, Entrenador o Energía', () => expect(cards.map(c => c.supertype)).toEqual(['Pokémon', 'Trainer', 'Pokémon', 'Energy']));
  it('la rareza', () => expect(cards[2]!.rarity).toBe('Secret Rare'));
  it('una página sin lista', () => expect(parseLimitlessList('<html><body>Not found</body></html>')).toEqual([]));
  it('el número como lo escribe TCGdex', () => {
    expect(jaLocalId('52')).toBe('052');
    expect(jaLocalId('188')).toBe('188');
    expect(jaLocalId('TG05')).toBe('TG05');
  });
  it('la dirección de la lista', () => expect(limitlessListUrl('S10D')).toBe('https://limitlesstcg.com/cards/jp/S10D?display=list'));
});
