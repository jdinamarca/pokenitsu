import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) } }));
const { dataUrl, matchPokecottage, pcSlug } = await import('./pokecottage.ts');

const jaByName = new Map([['pokemonjungle', 'ja-PMCG2']]);
const jungle = { id: 'jpn_b02', name: 'Pokémon Jungle' };
const entry = (over: object) => ({
  id: 'e',
  url: 'https://pokecottagecdn.com/a.webp',
  pokemonNumber: 133,
  cardNumber: '37',
  variantType: 'default',
  set: jungle,
  ...over,
});
const eevee = { id: 'ja-PMCG2-037', set_id: 'ja-PMCG2', number: '037', dex: [133] };

describe('fotos-pokecottage-en-catalogo: el cruce con el álbum', () => {
  it('Jungle #37 calza con la carta 037', () =>
    expect(matchPokecottage([entry({})], [eevee], jaByName).get('ja-PMCG2-037')).toBe('https://pokecottagecdn.com/a.webp'));
  it('otro Pokédex con la misma expansión y número no calza', () =>
    expect(matchPokecottage([entry({ pokemonNumber: 25 })], [eevee], jaByName).size).toBe(0));
  it('una china (scn_) sin expansiones chinas no calza', () =>
    expect(matchPokecottage([entry({ set: { id: 'scn_b02', name: 'Pokémon Jungle' } })], [eevee], jaByName).size).toBe(0));
  it('una expansión que no conocemos no calza', () =>
    expect(matchPokecottage([entry({ set: { id: 'jpn_x', name: 'Otra' } })], [eevee], jaByName).size).toBe(0));
  it('sin foto no calza', () => expect(matchPokecottage([entry({ url: null })], [eevee], jaByName).size).toBe(0));
  it('gana la estándar, venga antes o después', () => {
    const noSymbol = entry({ url: 'https://pokecottagecdn.com/sin-simbolo.webp', variantType: 'variant' });
    const std = entry({ url: 'https://pokecottagecdn.com/estandar.webp' });
    expect(matchPokecottage([noSymbol, std], [eevee], jaByName).get(eevee.id)).toBe(std.url);
    expect(matchPokecottage([std, noSymbol], [eevee], jaByName).get(eevee.id)).toBe(std.url);
  });
  it('un alias por el id de PokeCottage', () =>
    expect(
      matchPokecottage(
        [entry({ pokemonNumber: 25, set: { id: 'jpn_sm1+', name: 'Sun & Moon' } })],
        [{ id: 'ja-SM1p-037', set_id: 'ja-SM1p', number: '037', dex: [25] }],
        jaByName,
      ).size,
    ).toBe(1));
  it('número con total impreso', () => expect(matchPokecottage([entry({ cardNumber: '037/048' })], [eevee], jaByName).size).toBe(1));
});

describe('fotos-pokecottage-en-chinas: las chinas del álbum', () => {
  const zhCodes = ['CBB4C', '30TH', '30THD', 'CSM1aC'];
  const zh = (id: string, cardNumber: string, over: object = {}) => entry({ set: { id, name: 'x' }, cardNumber, ...over });
  const card = (set_id: string, number: string, dex = [133]) => ({ id: `${set_id}-${number}`, set_id, number, dex });
  it('Gem Pack Vol. 4 (scn_cbb4) #401 es la CBB4C 401', () =>
    expect(matchPokecottage([zh('scn_cbb4', '401')], [card('zh-cn-CBB4C', '401')], jaByName, zhCodes).size).toBe(1));
  it('el mismo código: scn_30thd #25', () =>
    expect(matchPokecottage([zh('scn_30thd', '25')], [card('zh-cn-30THD', '25')], jaByName, zhCodes).size).toBe(1));
  it('número con total: 75/103 es la 75', () =>
    expect(matchPokecottage([zh('scn_30th', '75/103')], [card('zh-cn-30TH', '75')], jaByName, zhCodes).size).toBe(1));
  it('el código con minúsculas de TCGdex: scn_csm1a es CSM1aC', () =>
    expect(matchPokecottage([zh('scn_csm1a', '101')], [card('zh-cn-CSM1aC', '101')], jaByName, zhCodes).size).toBe(1));
  it('otro Pokédex en el mismo número no calza', () =>
    expect(matchPokecottage([zh('scn_cbb4', '401', { pokemonNumber: 25 })], [card('zh-cn-CBB4C', '401')], jaByName, zhCodes).size).toBe(0));
  it('una expansión china que no tenemos no calza', () =>
    expect(matchPokecottage([zh('scn_otra', '401')], [card('zh-cn-CBB4C', '401')], jaByName, zhCodes).size).toBe(0));
  it('una china no calza con una japonesa del mismo número', () =>
    expect(matchPokecottage([zh('scn_b02', '37')], [eevee], jaByName, zhCodes).size).toBe(0));
  it('gana la estándar', () => {
    const v = zh('scn_cbb4', '401', { url: 'https://pokecottagecdn.com/variante.webp', variantType: 'master' });
    const std = zh('scn_cbb4', '401', { url: 'https://pokecottagecdn.com/estandar.webp' });
    expect(matchPokecottage([v, std], [card('zh-cn-CBB4C', '401')], jaByName, zhCodes).get('zh-cn-CBB4C-401')).toBe(std.url);
  });
});

describe('el nombre del álbum en PokeCottage', () => {
  // each one checked against pokecottagecdn.com (200)
  const cases: [string, string][] = [
    ['Eevee', 'eevee'],
    ['Nidoran♀', 'nidoran-female'],
    ['Nidoran ♂', 'nidoran-male'],
    ['Mr. Mime', 'mr-mime'],
    ['Ho-Oh', 'ho-oh'],
    ["Farfetch'd", 'farfetchd'],
    ['Type: Null', 'type-null'],
    ['Mime Jr.', 'mime-jr'],
    ['Tapu Koko', 'tapu-koko'],
    ['Porygon-Z', 'porygon-z'],
    ['Flabébé', 'flabebe'],
    ['Wo-Chien', 'wo-chien'],
    ['Great Tusk', 'great-tusk'],
  ];
  for (const [name, slug] of cases) it(name, () => expect(pcSlug(name)).toBe(slug));
  it('la dirección', () => expect(dataUrl(29, 'Nidoran♀')).toBe('https://pokecottagecdn.com/mastersets/data/29-nidoran-female.json'));
});
