import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) } }));
const { parseBattleAcademy, placeBattleAcademy, releasedIn } = await import('./battleAcademy.ts');

// lines as Bulbapedia writes them (Battle Academy 2020, 2022 and 2024)
const p2020 = `This product contains exclusive prints of {{TCG ID|Dragon Majesty|Charizard|3}}
{{halfdecklist/nmheader|title=Charizard Deck|type=Fire|symbol=no}}
{{halfdecklist/nmentry|2|{{TCG|Fire Energy}}|Energy|Fire|1}}
{{halfdecklist/nmentry|26|{{TCG ID|Hidden Fates|Eevee|49}} <small>'''[Hidden Fates 49/68]'''</small>|Colorless||1}}
{{halfdecklist/nmentry|27|{{TCG ID|SM Promo|Flareon|186}} <small>'''[SM Promo 186]'''</small>|Fire||1}}
{{halfdecklist/nmheader|title=Mewtwo Deck|type=Psychic|symbol=no}}
{{halfdecklist/nmentry|89/214|{{TCG ID|Lost Thunder|Espeon|89}} <small>'''[Lost Thunder]'''</small>|Psychic||2}}
{{halfdecklist/nmentry|None|{{TCG|Psychic Energy}}|Energy|Psychic|18}}`;
const p2022 = `{{halfdecklist/header|title=Eevee Deck|type=Darkness|symbol=no}}
{{halfdecklist/entry|SWSH065|D|[[Eevee V (SWSH Promo 65)|Eevee]]{{TCGV}} <small>'''[SWSH Promos]'''</small>|Colorless||1}}
{{halfdecklist/header|title=Pikachu Deck|type=Lightning|symbol=no}}
{{halfdecklist/entry|60|D|[[Pikachu V (Vivid Voltage 43)|Pikachu]]{{TCGV}} <small>'''[Vivid Voltage 043/185]'''</small>|Lightning||1}}`;
const p2024 = `{{halfdecklist/header|title=Armarouge Deck|type=Fire|symbol=no}}
{{halfdecklist/entry|[[Image:SetSymbolScarlet and Violet.png|x18px|link=Scarlet & Violet (TCG)]] 033/198|G|{{TCG ID|Scarlet & Violet|Houndour|33}}|Fire||3}}`;

describe('mazos-y-campeonatos-de-la-familia: las listas de Battle Academy', () => {
  it('2020: número del mazo en los mazos numerados, sin número en el de Mewtwo; sin energías', () =>
    expect(parseBattleAcademy(p2020, 2020)).toEqual([
      { year: 2020, deck: 'Charizard', deckNo: '26', name: 'Eevee', setName: 'Hidden Fates', number: '49' },
      { year: 2020, deck: 'Charizard', deckNo: '27', name: 'Flareon', setName: 'SM Promo', number: '186' },
      { year: 2020, deck: 'Mewtwo', deckNo: null, name: 'Espeon', setName: 'Lost Thunder', number: '89' },
    ]));
  it('2022 y 2024: la carta como enlace con su sufijo, y el número de expansión con imagen', () => {
    expect(parseBattleAcademy(p2022, 2022)).toEqual([
      { year: 2022, deck: 'Eevee', deckNo: null, name: 'Eevee V', setName: 'SWSH Promo', number: '65' },
      { year: 2022, deck: 'Pikachu', deckNo: '60', name: 'Pikachu V', setName: 'Vivid Voltage', number: '43' },
    ]);
    expect(parseBattleAcademy(p2024, 2024)).toEqual([
      { year: 2024, deck: 'Armarouge', deckNo: null, name: 'Houndour', setName: 'Scarlet & Violet', number: '33' },
    ]);
  });
  it('en el catálogo: la expansión y el número como los escribe (SM186, SWSH065)', () => {
    const cat = {
      sets: new Map([
        ['sm115', { name: 'Hidden Fates' }],
        ['smp', { name: 'SM Black Star Promos' }],
        ['swshp', { name: 'SWSH Black Star Promos' }],
      ]),
      intlByName: new Map([
        ['hiddenfates', 'sm115'],
        ['smblackstarpromos', 'smp'],
        ['swshblackstarpromos', 'swshp'],
      ]),
      cardIds: new Map([
        ['sm115|49', 'sm115-49'],
        ['smp|SM186', 'smp-SM186'],
        ['swshp|SWSH65', 'swshp-SWSH065'],
      ]),
    } as never;
    const r = placeBattleAcademy(cat, [...parseBattleAcademy(p2020, 2020), ...parseBattleAcademy(p2022, 2022)]);
    expect(r.cards.map(c => `${c.setKey}|${c.number}|${c.deck}|${c.deckNo}|${c.setName}`)).toEqual([
      'sm115|49|Charizard|26|Hidden Fates',
      'smp|SM186|Charizard|27|SM Black Star Promos',
      'swshp|SWSH065|Eevee|null|SWSH Black Star Promos',
    ]);
    expect(r.unmatched).toBe(2);
  });
});

// the 2018 Sun & Moon Trainer Kit, as Bulbapedia writes it
const kit = `{{Halfdecklist/nmheader|title=Alolan Ninetales Half Deck|type=Fairy|symbol=no}}
{{Halfdecklist/nmentry|1|{{TCG|Grass Energy}}|Energy|Grass|1}}
{{Halfdecklist/nmentry|17|{{TCG ID|SM Promo|Alolan Ninetales|128}} <small>'''[SM Promo 128; Non Holofoil]'''</small>|Fairy||1}}
{{Halfdecklist/nmentry|26|{{TCG ID|Ultra Prism|Eevee|104}} <small>'''[Ultra Prism 104/156]'''</small>|Colorless||1}}
{{Halfdecklist/nmentry|30|{{TCG ID|SM Promo|Alolan Ninetales|128}} <small>'''[SM Promo 128; Water Web Holofoil]'''</small>|Fairy||1}}
{{Halfdecklist/nmfooter}}

==Languages this set is released in==
The Sun & Moon Trainer Kits: Alolan Sandslash & Alolan Ninetales are released in English, German, French, Italian, Spanish, and Portuguese.`;

describe('trainer-kit-sun-moon: la lista del kit de Alolan Sandslash y Alolan Ninetales', () => {
  it('el mazo sin "Half Deck", el número del mazo y el acabado de la nota', () =>
    expect(parseBattleAcademy(kit, 2018)).toEqual([
      {
        year: 2018,
        deck: 'Alolan Ninetales',
        deckNo: '17',
        name: 'Alolan Ninetales',
        setName: 'SM Promo',
        number: '128',
        finish: 'normal',
      },
      { year: 2018, deck: 'Alolan Ninetales', deckNo: '26', name: 'Eevee', setName: 'Ultra Prism', number: '104' },
      { year: 2018, deck: 'Alolan Ninetales', deckNo: '30', name: 'Alolan Ninetales', setName: 'SM Promo', number: '128', finish: 'holo' },
    ]));
  it('los idiomas en que salió; inglés si la página no lo dice', () => {
    expect(releasedIn(kit)).toEqual(['EN', 'DE', 'FR', 'IT', 'ES', 'PT']);
    expect(releasedIn('nada')).toEqual(['EN']);
  });
});
