import { describe, expect, it } from 'vitest';
import { checkLocation, createInventory, createLocations, type Db, type Queryable } from '../src/index.js';

function fakeDb(answer: (sql: string, params: unknown[]) => unknown[] | Promise<unknown[]>) {
  const log: { sql: string; params: unknown[] }[] = [];
  const c: Queryable = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      return { rows: (await answer(sql, params)) as never[] };
    },
  };
  const db: Db = { ...c, tx: fn => fn(c) };
  return { db, c, log };
}
const locsOf = (db: Db) => createLocations(createInventory(db));

describe('cajas-y-carpetas-en-arma: validar una ubicación', () => {
  it('nombre vacío', () => expect(() => checkLocation({ name: '  ' })).toThrow('Ponle un nombre a la ubicación'));
  it('limpia el nombre y deja solo las partes de la regla que dicen algo', () => {
    expect(
      checkLocation({
        name: ' Caja | 1 ',
        kind: 'cajón',
        rule: { series: [], sets: ['sv1', ''], minPrice: '0', personal: 'x', auto: true, bulk: true, special: ['ir'] },
      }),
    ).toEqual({ name: 'Caja / 1', kind: 'box', note: '', rule: { sets: ['sv1'], special: ['ir'], bulk: true } });
    expect(checkLocation({ name: 'C', kind: 'binder', rule: { personal: false, auto: false, minPrice: 5000 } }).rule).toEqual({
      personal: false,
      auto: false,
      minPrice: 5000,
    });
  });
});

describe('cajas-y-carpetas-en-arma: guardar ubicaciones', () => {
  it('una nueva va al final', async () => {
    const { db, c, log } = fakeDb(sql => (sql.includes('RETURNING id') ? [{ id: 9 }] : []));
    expect(await locsOf(db).create(c, { name: 'Carpeta IR', kind: 'binder', rule: { special: ['ir'] } })).toEqual({ id: 9 });
    expect(log[0]!.sql).toContain('coalesce(max(pos), 0) + 1');
    expect(log[0]!.params).toEqual(['Carpeta IR', 'binder', '', '{"special":["ir"]}']);
  });
  it('nombre repetido', async () => {
    const { db, c } = fakeDb(() => Promise.reject(Object.assign(new Error('dup'), { code: '23505' })));
    await expect(locsOf(db).create(c, { name: 'Caja 1' })).rejects.toThrow('Ya existe una ubicación con ese nombre');
    await expect(locsOf(db).update(c, 3, { name: 'Caja 1' })).rejects.toThrow('Ya existe una ubicación con ese nombre');
  });
  it('ordenar', async () => {
    const { db, c, log } = fakeDb(() => []);
    await locsOf(db).reorder(c, ['4', 3]);
    expect(log.map(q => q.params)).toEqual([
      [4, 1],
      [3, 2],
    ]);
  });
  it('borrar deja sus copias y su historial sin ubicación', async () => {
    const { db, c, log } = fakeDb(sql =>
      sql.includes('FROM inventory WHERE loc')
        ? [{ card_id: 'sv1-1', variant: 'normal', lang: 'EN', cond: 'NM' }]
        : sql.includes('FOR UPDATE')
          ? [{ qty: 4, personal: 1, added_at: null }]
          : [],
    );
    expect(await locsOf(db).remove(c, '3')).toEqual({ ok: true, moved: 1 });
    const into = log.find(q => q.sql.startsWith('INSERT INTO inventory '))!;
    expect(into.params.slice(0, 7)).toEqual(['sv1-1', 'normal', 'EN', 'NM', 0, 4, 1]);
    expect(log.some(q => q.sql === 'UPDATE inventory_log SET loc = 0 WHERE loc = $1')).toBe(true);
    expect(log.at(-1)!.sql).toBe('DELETE FROM locations WHERE id = $1');
  });
  it('mover varias filas ignora destinos que no son de la cuenta', async () => {
    const { db, c, log } = fakeDb(sql =>
      sql.startsWith('SELECT id FROM locations')
        ? [{ id: 3 }]
        : sql.includes('FROM cards WHERE set_id')
          ? [{ id: 'sv1-1', number: '1' }]
          : sql.includes('FOR UPDATE')
            ? [{ qty: 2, personal: 0, added_at: null }]
            : [],
    );
    const row = { sid: 'sv1', num: '1', variant: 'normal', lang: 'EN', cond: 'NM', loc: 0 };
    expect(
      await locsOf(db).moveMany(c, [
        { ...row, to: 3 },
        { ...row, to: 99 },
      ]),
    ).toEqual({ moved: 2 });
    expect(log.filter(q => q.sql.startsWith('INSERT INTO inventory ')).map(q => q.params[4])).toEqual([3]);
  });
});
