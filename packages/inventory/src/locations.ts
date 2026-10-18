// Where copies are stored (boxes, binders…), moved from apps/api/src/index.js without changing their SQL or answers
// (cajas-y-carpetas-en-arma), so Nitsu's Ubicaciones and Arma's Cajas y carpetas save the same. Each operation gets a
// client with app.user_id set: Row Level Security keeps every account to its own locations.
import type { LocationRule } from '@pokenitsu/core';
import { bad, type Queryable } from './db.js';
import { checkLoc, type Inventory, type RowBody } from './inventory.js';

export const LOCATION_KINDS = ['box', 'binder', 'other'] as const;
export interface LocationInput {
  name: string;
  kind: (typeof LOCATION_KINDS)[number];
  note: string;
  rule: LocationRule;
}

/** a location as a request sends it, cleaned: name without "|", only the rule parts that say something */
export function checkLocation(b: unknown): LocationInput {
  const o = (b || {}) as Record<string, unknown>;
  const name = String(o.name ?? '')
    .trim()
    .replace(/\|/g, '/')
    .slice(0, 80);
  if (!name) throw bad('Ponle un nombre a la ubicación');
  const r = (o.rule || {}) as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x : []).map(String).filter(Boolean).slice(0, 500);
  const rule: LocationRule = {};
  if (list(r.series).length) rule.series = list(r.series);
  if (list(r.sets).length) rule.sets = list(r.sets);
  if (list(r.special).length) rule.special = list(r.special);
  if (list(r.origin).length) rule.origin = list(r.origin); // INT (international), JA, ZH…: the set's region
  const min = parseInt(String(r.minPrice), 10);
  if (min > 0) rule.minPrice = min;
  if (r.personal === true || r.personal === false) rule.personal = r.personal;
  if (r.auto === false) rule.auto = false; // never assigned automatically, only by hand
  if (r.bulk === true) rule.bulk = true; // only bulk: common/uncommon/rare/rare holo without ex/GX/V…, normal/holo/reverse
  const kind = LOCATION_KINDS.includes(o.kind as LocationInput['kind']) ? (o.kind as LocationInput['kind']) : 'box';
  return { name, kind, note: String(o.note ?? '').slice(0, 2000), rule };
}
const uniqueName = (e: { code?: string }) => {
  if (e.code === '23505') throw bad('Ya existe una ubicación con ese nombre');
  throw e;
};

export function createLocations(inv: Pick<Inventory, 'rowOf' | 'moveRow'>) {
  /** a new location, last in the list */
  async function create(c: Queryable, b: unknown) {
    const l = checkLocation(b);
    const { rows } = await c
      .query<{ id: number }>(
        `INSERT INTO locations (name, kind, note, rule, pos) VALUES ($1, $2, $3, $4, (SELECT coalesce(max(pos), 0) + 1 FROM locations)) RETURNING id`,
        [l.name, l.kind, l.note, JSON.stringify(l.rule)],
      )
      .catch(uniqueName);
    return { id: rows[0]!.id };
  }
  async function update(c: Queryable, id: unknown, b: unknown) {
    const l = checkLocation(b);
    await c
      .query('UPDATE locations SET name = $2, kind = $3, note = $4, rule = $5 WHERE id = $1', [
        id,
        l.name,
        l.kind,
        l.note,
        JSON.stringify(l.rule),
      ])
      .catch(uniqueName);
    return { ok: true };
  }
  /** order = which rule wins a tie: ids in the new order */
  async function reorder(c: Queryable, ids: unknown) {
    const list = (Array.isArray(ids) ? ids : []).map(Number);
    for (let i = 0; i < list.length; i++) await c.query('UPDATE locations SET pos = $2 WHERE id = $1', [list[i], i + 1]);
    return { ok: true };
  }
  /** deleting a location leaves its copies (and their load history) without location */
  async function remove(c: Queryable, idParam: unknown) {
    const id = parseInt(String(idParam), 10);
    const { rows } = await c.query<{ card_id: string; variant: string; lang: string; cond: string }>(
      'SELECT card_id, variant, lang, cond FROM inventory WHERE loc = $1',
      [id],
    );
    for (const r of rows) {
      const from = { cardId: r.card_id, variant: r.variant, lang: r.lang, cond: r.cond, loc: id };
      await inv.moveRow(c, from, { ...from, loc: 0 });
    }
    await c.query('UPDATE inventory_log SET loc = 0 WHERE loc = $1', [id]);
    await c.query('DELETE FROM locations WHERE id = $1', [id]);
    return { ok: true, moved: rows.length };
  }
  /** several whole rows to new locations at once (auto-assign): moves [{sid, num, variant, lang, cond, loc, to}] */
  async function moveMany(c: Queryable, moves: unknown) {
    const list = (Array.isArray(moves) ? moves : []) as (RowBody & { to?: unknown })[];
    const { rows: locs } = await c.query<{ id: number }>('SELECT id FROM locations');
    const ok = new Set([0, ...locs.map(l => l.id)]);
    let moved = 0;
    for (const m of list) {
      const from = await inv.rowOf(c, m),
        to = { ...from, loc: checkLoc(m.to) };
      if (!ok.has(to.loc)) continue;
      moved += await inv.moveRow(c, from, to);
    }
    return { moved };
  }
  return { create, update, reorder, remove, moveMany };
}
export type Locations = ReturnType<typeof createLocations>;
