import { describe, expect, it } from 'vitest';
import {
  autoAssignPlan,
  describeRule,
  locationShadows,
  ruleChips,
  suggestedLocations,
  type LocationFull,
  type RuleTextCtx,
} from '../src/index.js';

const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const CODES: Record<string, string> = { sv3pt5: 'MEW', sv4pt5: 'PAF' };
const ctx: RuleTextCtx = { setCode: id => CODES[id] || id, setEra: id => (id.startsWith('sv') ? 'Scarlet & Violet' : ''), clp };
const loc = (id: number, rule: LocationFull['rule'], name = `Ubicación ${id}`): LocationFull => ({ id, name, kind: 'box', rule });

describe('cajas-y-carpetas-en-arma: lo que recibe cada ubicación', () => {
  it('caja general', () => {
    expect(ruleChips({}, ctx)).toEqual(['📦 Todo lo demás']);
    expect(describeRule(null, ctx)).toBe('Todo lo que no calce en las anteriores (caja general)');
  });
  it('colección personal', () => expect(ruleChips({ personal: true }, ctx)).toEqual(['🔒 Colección personal']));
  it('solo a mano', () => expect(ruleChips({ auto: false, personal: true }, ctx)).toEqual(['✋ Solo a mano']));
  it('especiales o desde un precio', () => {
    const r = { special: ['ir', 'sir'], minPrice: 5000, personal: false };
    expect(ruleChips(r, ctx)).toEqual(['💰 Para vender', '✨ IR · SIR', 'o desde $5.000']);
    expect(describeRule(r, ctx)).toBe(
      'Cartas: copias para vender · IR (ilustración rara) o SIR (ilustración especial) o valen $5.000 o más',
    );
  });
  it('challa de una serie internacional y expansiones por código', () => {
    expect(ruleChips({ bulk: true, series: ['Scarlet & Violet'], origin: ['INT'] }, ctx)).toEqual([
      'Challa',
      'Scarlet & Violet',
      '🌎 Internacionales',
    ]);
    expect(ruleChips({ sets: ['sv3pt5', 'sv4pt5'] }, ctx)).toEqual(['MEW · PAF']);
  });
});

describe('cajas-y-carpetas-en-arma: reglas que chocan', () => {
  it('dos cajas con la misma serie: avisa la de más abajo', () => {
    const a = loc(3, { series: ['Scarlet & Violet'], origin: ['INT'] }, 'Caja 1 · S&V');
    const b = loc(4, { series: ['Scarlet & Violet'], origin: ['INT'] }, 'Caja 2 · S&V');
    expect(locationShadows([a, b], b, ctx)).toEqual([{ by: a, what: 'Scarlet & Violet' }]);
    expect(locationShadows([a, b], a, ctx)).toEqual([]);
  });
  it('sin aviso cuando la otra solo toma las especiales, la challa o las personales', () => {
    const b = loc(4, { series: ['Scarlet & Violet'] });
    for (const q of [{ special: ['ir'] }, { minPrice: 5000 }, { personal: true }])
      expect(locationShadows([loc(1, q), b], b, ctx)).toEqual([]);
    const bulkFirst = loc(1, { bulk: true, series: ['Scarlet & Violet'] });
    expect(locationShadows([bulkFirst, b], b, ctx)).toEqual([]);
  });
  it('sin aviso cuando la otra es de otra región', () => {
    const b = loc(4, { series: ['Scarlet & Violet'] });
    expect(locationShadows([loc(1, { series: ['Scarlet & Violet'], origin: ['INT'] }), b], b, ctx)).toEqual([]);
  });
  it('una serie le quita una expansión nombrada', () => {
    const b = loc(4, { sets: ['sv3pt5'] });
    const a = loc(1, { sets: ['sv3pt5', 'sv4pt5'], series: ['Scarlet & Violet'] });
    expect(locationShadows([a, b], b, ctx)).toEqual([{ by: a, what: 'MEW' }]);
  });
  it('una caja general más arriba le quita todo a otra general', () => {
    const a = loc(1, {}),
      b = loc(2, {});
    expect(locationShadows([a, b], b, ctx)).toEqual([{ by: a, what: 'todas sus cartas' }]);
  });
});

describe('cajas-y-carpetas-en-arma: asignar automáticamente', () => {
  const locs = [loc(1, { personal: true }), loc(3, { series: ['Scarlet & Violet'], origin: ['INT'] })];
  const info = (r: { era: string; origin: string }) => ({
    setId: 'sv1',
    era: r.era,
    origin: r.origin,
    name: 'Pikachu',
    rarity: 'Common',
    variant: 'normal',
    price: () => 100,
  });
  const row = (o: Partial<{ loc: number; qty: number; personal: number; era: string; origin: string }>) => ({
    loc: 0,
    qty: 1,
    personal: 0,
    era: 'Scarlet & Violet',
    origin: 'INT',
    ...o,
  });
  it('solo las sin ubicación que alguna regla acepta', () => {
    const rows = [row({}), row({ loc: 3 }), row({ era: 'Base', origin: 'INT' }), row({ qty: 0 })];
    const plan = autoAssignPlan(rows, locs, info);
    expect(plan.map(p => [rows.indexOf(p.row), p.to])).toEqual([[0, 3]]);
  });
  it('personal solo si todas sus copias lo son', () => {
    expect(autoAssignPlan([row({ qty: 2, personal: 2 })], locs, info)[0]!.to).toBe(1);
    expect(autoAssignPlan([row({ qty: 2, personal: 1 })], locs, info)[0]!.to).toBe(3);
  });
});

describe('cajas-y-carpetas-en-arma: orden sugerido', () => {
  it('2 carpetas y 6 cajas, con el precio de alerta', () => {
    const s = suggestedLocations(7000, clp);
    expect(s.filter(l => l.kind === 'binder')).toHaveLength(2);
    expect(s.filter(l => l.kind === 'box')).toHaveLength(6);
    expect(s[1]!.rule.minPrice).toBe(7000);
    expect(s[1]!.note).toContain('$7.000');
    expect(new Set(s.map(l => l.name)).size).toBe(8);
  });
});
