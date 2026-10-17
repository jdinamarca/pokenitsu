import { describe, expect, it, vi } from 'vitest';

vi.mock('../db.ts', () => ({ pool: { query: async () => ({ rows: [] }) } }));
const { matchPokecottage } = await import('./pokecottage.ts');

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
  it('una china (scn_) no calza', () =>
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
