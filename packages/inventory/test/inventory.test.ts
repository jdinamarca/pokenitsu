import { describe, expect, it } from 'vitest';
import { createInventory, type Db, type Queryable } from '../src/index.js';

// a fake database: answers each query by its text, and records what was asked
function fakeDb(answer: (sql: string, params: unknown[]) => unknown[]) {
  const log: { sql: string; params: unknown[] }[] = [];
  const c: Queryable = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      return { rows: answer(sql, params) as never[] };
    },
  };
  const db: Db = { ...c, tx: fn => fn(c) };
  return { db, c, log };
}
const card = { id: 'sv3pt5-133', number: '133' };

describe('sumar copias', () => {
  it('suma, escribe la fila y deja la entrada para deshacer', async () => {
    const { db, c, log } = fakeDb(sql =>
      sql.includes('FROM cards WHERE set_id')
        ? [card]
        : sql.includes('FOR UPDATE')
          ? [{ qty: 1, personal: 0, added_at: null }]
          : sql.includes('RETURNING id')
            ? [{ id: 7 }]
            : [],
    );
    const r = await createInventory(db).add(c, {
      sid: 'sv3pt5',
      num: '133',
      variant: 'reverse',
      lang: 'es',
      cond: 'nm',
      loc: 0,
      delta: 2,
      personal: true,
    });
    expect(r).toMatchObject({ num: '133', lang: 'ES', cond: 'NM', qty: 3, personal: 2, real: 2, logId: 7 });
    const write = log.find(q => q.sql.startsWith('INSERT INTO inventory '))!;
    expect(write.params).toEqual(['sv3pt5-133', 'reverse', 'ES', 'NM', 0, 3, 2]);
    expect(log.find(q => q.sql.startsWith('INSERT INTO inventory_log'))!.params).toEqual([
      'sv3pt5-133',
      'reverse',
      'ES',
      'NM',
      0,
      2,
      2,
      null,
    ]);
  });
  it('quitar sin copias no escribe el historial', async () => {
    const { db, c, log } = fakeDb(sql => (sql.includes('FROM cards WHERE set_id') ? [card] : sql.includes('FOR UPDATE') ? [] : []));
    const r = await createInventory(db).add(c, { sid: 'sv3pt5', num: '133', variant: 'normal', lang: 'ES', delta: -1 });
    expect(r.real).toBe(0);
    expect(log.some(q => q.sql.includes('inventory_log'))).toBe(false);
  });
  it('valida cantidad, variante y grupo', async () => {
    const { db, c } = fakeDb(() => [card]);
    const inv = createInventory(db);
    await expect(inv.add(c, { sid: 's', num: '1', variant: 'normal', delta: 0 })).rejects.toThrow('Cantidad inválida');
    await expect(inv.add(c, { sid: 's', num: '1', variant: 'Normal!', delta: 1 })).rejects.toThrow('Variante inválida');
    await expect(inv.add(c, { sid: 's', num: '1', variant: 'normal', delta: 1, batch: 'x' })).rejects.toThrow('Grupo inválido');
  });
  it('una carta que no existe da 404', async () => {
    const { db, c } = fakeDb(sql => (sql.includes('FROM sets') ? [{ cards_synced_at: new Date(), source: 'ptcg' }] : []));
    await expect(createInventory(db).add(c, { sid: 'sv3pt5', num: '999', variant: 'normal', delta: 1 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('mover', () => {
  it('mueve 2 de 3 a otra ubicación, las de venta primero', async () => {
    const { db, c, log } = fakeDb(sql =>
      sql.includes('FROM cards WHERE set_id')
        ? [card]
        : sql.includes('FROM locations')
          ? [{}]
          : sql.includes('FOR UPDATE')
            ? [{ qty: 3, personal: 2, added_at: null }]
            : [],
    );
    const r = await createInventory(db).move(c, {
      sid: 'sv3pt5',
      num: '133',
      variant: 'normal',
      lang: 'EN',
      cond: 'NM',
      loc: 1,
      to: { loc: 2 },
      n: 2,
    });
    expect(r).toEqual({ moved: 2 });
    const writes = log.filter(q => q.sql.startsWith('INSERT INTO inventory '));
    expect(writes[0]!.params.slice(4)).toEqual([1, 1, 1]);
    expect(writes[1]!.params.slice(4, 7)).toEqual([2, 2, 1]);
    expect(log.some(q => q.sql.startsWith('UPDATE inventory_log'))).toBe(false);
  });
});

describe('deshacer', () => {
  it('revierte el rango completo', async () => {
    const entries = [
      { id: 9, card_id: 'a', variant: 'normal', lang: 'ES', cond: 'NM', loc: 0, delta: 1, personal: 0, sid: 's', num: '2' },
      { id: 8, card_id: 'b', variant: 'normal', lang: 'ES', cond: 'NM', loc: 0, delta: 1, personal: 0, sid: 's', num: '1' },
    ];
    const { db, c, log } = fakeDb(sql =>
      sql.includes('ORDER BY id DESC LIMIT 1')
        ? [{ id: 9, batch: 'g' }]
        : sql.includes('FROM inventory_log l')
          ? entries
          : sql.includes('FOR UPDATE')
            ? [{ qty: 1, personal: 0 }]
            : [],
    );
    const r = await createInventory(db).undo(c);
    expect(r.rows.map(x => x.qty)).toEqual([0, 0]);
    expect(log.filter(q => q.sql.startsWith('DELETE FROM inventory WHERE')).length).toBe(2);
    expect(log.filter(q => q.sql.startsWith('DELETE FROM inventory_log')).map(q => q.params[0])).toEqual([9, 8]);
  });
});

describe('cartas de una expansión', () => {
  it('no baja dos veces una expansión ya descargada', async () => {
    const { db, log } = fakeDb(() => [{ cards_synced_at: new Date(), source: 'ptcg' }]);
    await createInventory(db).ensureSetCards('sv3pt5');
    expect(log.length).toBe(1);
  });
  it('una expansión que no existe da 404', async () => {
    const { db } = fakeDb(() => []);
    await expect(createInventory(db).ensureSetCards('nada')).rejects.toMatchObject({ statusCode: 404 });
  });
});
