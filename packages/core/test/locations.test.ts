import { describe, expect, it } from 'vitest';
import catalog from './fixtures/catalog.json' with { type: 'json' };
// @ts-expect-error frozen JS copy, no types
import { makeLegacy } from './legacy/legacy.js';
import { eraOf, isBulk, pickLocation, ruleAccepts, ruleScore, type CopyInfo, type LocationLike, type LocationRule } from '../src/index.js';

const copy = (o: Partial<CopyInfo>): CopyInfo => ({
  setId: 'sv1',
  era: 'Scarlet & Violet',
  origin: 'INT',
  name: 'Pikachu',
  rarity: 'Common',
  variant: 'normal',
  personal: false,
  price: () => 100,
  ...o,
});

describe('ubicaciones (escenarios)', () => {
  const sv: LocationLike = { id: 3, rule: { series: ['Scarlet & Violet', 'Mega Evolution'], origin: ['INT'], bulk: true } };
  const meg: LocationLike = { id: 8, rule: { series: ['Mega Evolution'], origin: ['INT'], bulk: true } };
  it('la caja de Mega Evolution gana aunque esté más abajo que la caja que acepta la serie', () => {
    expect(pickLocation([sv, meg], copy({ era: 'Mega Evolution' }))).toBe(8);
    expect(pickLocation([sv, meg], copy({ era: 'Scarlet & Violet' }))).toBe(3);
  });
  it('la expansión nombrada gana a la serie', () => {
    const set: LocationLike = { id: 5, rule: { sets: ['sv1'] } };
    expect(pickLocation([sv, set], copy({}))).toBe(5);
  });
  const especiales: LocationRule = { special: ['ir', 'sir'], minPrice: 5000, personal: false };
  it('carpeta de especiales: acepta por rareza o por precio', () => {
    expect(ruleAccepts(especiales, copy({ rarity: 'Illustration Rare', price: () => 10 }))).toBe(true);
    expect(ruleAccepts(especiales, copy({ rarity: 'Common', price: () => 5000 }))).toBe(true);
    expect(ruleAccepts(especiales, copy({ rarity: 'Common', price: () => 4999 }))).toBe(false);
    expect(ruleAccepts(especiales, copy({ rarity: 'Common', price: () => null }))).toBe(false);
  });
  it('el precio solo se calcula si la regla tiene precio mínimo', () => {
    let calls = 0;
    ruleAccepts(
      { special: ['ir'] },
      copy({
        price: () => {
          calls++;
          return 1;
        },
      }),
    );
    expect(calls).toBe(0);
  });
  it('auto: false nunca se asigna sola', () => expect(pickLocation([{ id: 1, rule: { auto: false } }], copy({}))).toBe(0));
  it('personal: la carpeta personal solo recibe copias personales y gana a todo', () => {
    const pers: LocationLike = { id: 1, rule: { personal: true } };
    expect(pickLocation([sv, pers], copy({ personal: true }))).toBe(1);
    expect(pickLocation([sv, pers], copy({ personal: false }))).toBe(3);
  });
  it('caja general sin regla acepta todo con la menor especificidad; empate: gana la de más arriba', () => {
    expect(ruleScore({})).toBe(0);
    expect(
      pickLocation(
        [
          { id: 6, rule: {} },
          { id: 7, rule: {} },
        ],
        copy({}),
      ),
    ).toBe(6);
  });
  it('challa: sin ex/V/GX, común a rara holo, en normal/holo/reverse', () => {
    expect(isBulk({ name: 'Pikachu', rarity: 'Rare Holo' }, 'reverse')).toBe(true);
    expect(isBulk({ name: 'Charizard ex', rarity: 'Double Rare' }, 'holo')).toBe(false);
    expect(isBulk({ name: 'Pikachu', rarity: 'Common' }, 'pokeballholo')).toBe(false);
  });
});

describe('equivalencia con el código anterior', () => {
  // a sample of real expansions and cards from the catalog
  const sets = catalog.sets.filter((_, i) => i % 7 === 0);
  const setById: Record<string, (typeof sets)[number]> = Object.fromEntries(sets.map(s => [s.id, s]));
  const cardsFx = (catalog.cards as [string, string | null][]).filter((_, i) => i % 97 === 0);
  const metaOf: Record<string, [string, number[], string, string, string, string]> = {};
  const copies: { sid: string; num: string; v: string; cond: string; personal: boolean }[] = [];
  cardsFx.forEach(([name, rarity], i) => {
    const s = sets[i % sets.length]!,
      num = String(i + 1);
    metaOf[s.id + '|' + num] = [name, [], '', rarity || '', '', 'Pokémon'];
    for (const v of ['normal', 'holo', 'reverse', 'pokeballholo'])
      for (const personal of [false, true]) copies.push({ sid: s.id, num, v, cond: i % 2 ? 'NM' : 'LP', personal });
  });
  const price = (sid: string, num: string, v: string, cond: string) =>
    (sid.length * 997 + +num * 131 + v.length * 523 + (cond === 'NM' ? 1000 : 0)) % 12000;
  const legacy = makeLegacy({
    setById,
    meta: (sid: string, num: string) => metaOf[sid + '|' + num],
    keyOf: (sid: string, num: string, v: string, _l: string, cond: string) => [sid, num, v, cond].join('|'),
    priceOf: (k: string) => {
      const [sid, num, v, cond] = k.split('|') as [string, string, string, string];
      return { clp: price(sid, num, v, cond) };
    },
  });
  const info = (c: (typeof copies)[number]): CopyInfo => {
    const m = metaOf[c.sid + '|' + c.num]!,
      s = setById[c.sid];
    return {
      setId: c.sid,
      era: eraOf(s || ({} as never)),
      origin: s && s.lang ? s.lang : 'INT',
      name: m[0],
      rarity: m[3],
      variant: c.v,
      personal: c.personal,
      price: () => price(c.sid, c.num, c.v, c.cond),
    };
  };
  const eras = [...new Set(sets.map(s => eraOf(s)))].filter(Boolean);
  const rules: LocationRule[] = [];
  for (const series of [undefined, [eras[0]!], eras.slice(1, 3)])
    for (const st of [undefined, [sets[3]!.id]])
      for (const origin of [undefined, ['INT'], ['JA', 'ZH']])
        for (const special of [undefined, ['ir', 'sir'], ['ultra', 'mech']])
          for (const minPrice of [undefined, 5000])
            for (const personal of [undefined, true, false])
              for (const bulk of [undefined, true])
                for (const auto of [undefined, false]) {
                  const r: LocationRule = {};
                  if (series) r.series = series;
                  if (st) r.sets = st;
                  if (origin) r.origin = origin;
                  if (special) r.special = special;
                  if (minPrice) r.minPrice = minPrice;
                  if (personal !== undefined) r.personal = personal;
                  if (bulk) r.bulk = bulk;
                  if (auto === false) r.auto = false;
                  rules.push(r);
                }
  it(`ruleAccepts, ruleScore e isBulk: ${rules.length} reglas × ${copies.length} copias`, () => {
    const diffs: unknown[] = [];
    for (const r of rules) {
      if (ruleScore(r) !== legacy.locScore(r)) diffs.push(['score', r]);
      for (const c of copies)
        if (ruleAccepts(r, info(c)) !== legacy.locMatches({ rule: r }, c.sid, c.num, c.v, c.cond, c.personal))
          diffs.push(['accepts', r, c]);
    }
    for (const c of copies) {
      const m = metaOf[c.sid + '|' + c.num]!;
      if (isBulk({ name: m[0], rarity: m[3] }, c.v) !== legacy.isBulk(c.sid, c.num, c.v)) diffs.push(['bulk', c]);
    }
    expect(diffs.slice(0, 5)).toEqual([]);
  });
  it('pickLocation en 300 listas de ubicaciones', () => {
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const diffs: unknown[] = [];
    for (let t = 0; t < 300; t++) {
      const locs = Array.from({ length: 2 + Math.floor(rnd() * 7) }, (_, i) => ({
        id: i + 1,
        rule: rules[Math.floor(rnd() * rules.length)]!,
      }));
      legacy.setLocs(locs);
      for (const c of copies)
        if (pickLocation(locs, info(c)) !== legacy.suggestLoc(c.sid, c.num, c.v, c.cond, c.personal)) diffs.push([t, c]);
    }
    expect(diffs.slice(0, 5)).toEqual([]);
  });
});
