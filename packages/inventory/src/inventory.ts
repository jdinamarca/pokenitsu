// The inventory operations of both apps (Nitsu and Arma tu colección), moved from apps/api/src/index.js without changing
// their SQL or answers. Each one gets a client already in a transaction with app.user_id set: Row Level Security keeps
// every account to its own rows. A row is one card + variant + language + condition + location.
import { addToCopies, CONDS, LANGS, moveSplit, normNumber, undoCopies } from '@pokenitsu/core';
import { createCatalog } from './catalog.js';
import { bad, type Db, type Queryable } from './db.js';
import { getFx, ownClp } from './fx.js';

export interface Row {
  cardId: string;
  num?: string;
  variant: string;
  lang: string;
  cond: string;
  loc: number;
}
/** what a request says about a row: expansion + number as typed, and the rest */
export interface RowBody {
  sid?: unknown;
  num?: unknown;
  variant?: unknown;
  lang?: unknown;
  cond?: unknown;
  loc?: unknown;
}

export const CARD_COLS = `c.set_id AS sid, c.number AS num, c.name, c.dex, c.artist, c.rarity, c.image_small AS img, c.supertype`;

// normal / holo / reverse, or a special variant slug (firstedition, pokeballholo…)
const VARIANT_RE = /^[a-z0-9]{1,60}$/;
export const checkVariant = (v: unknown): string => {
  if (!VARIANT_RE.test(String(v))) throw bad(`Variante inválida: ${v}`);
  return String(v);
};
// card condition, NM unless said otherwise (bulk is almost always NM)
export const checkCond = (c: unknown): string => {
  const x = String(c ?? 'NM').toUpperCase() || 'NM';
  if (!(CONDS as readonly string[]).includes(x)) throw bad(`Estado inválido: ${x}`);
  return x;
};
export const checkLang = (l: unknown, allowEmpty = true): string => {
  const x = String(l ?? '').toUpperCase();
  if (x === '' && allowEmpty) return x;
  if (!(LANGS as readonly string[]).includes(x)) throw bad(`Idioma inválido: ${x}`);
  return x;
};
export const checkLoc = (l: unknown): number => {
  const x = parseInt(String(l ?? 0), 10) || 0;
  if (x < 0) throw bad('Ubicación inválida');
  return x;
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROW_WHERE = 'card_id = $1 AND variant = $2 AND lang = $3 AND cond = $4 AND loc = $5';
const rowArgs = (r: Row) => [r.cardId, r.variant, r.lang, r.cond, r.loc];

// Writes a row's quantities (deletes it at 0)
export async function writeRow(c: Queryable, r: Row, qty: number, personal: number) {
  if (qty <= 0) await c.query(`DELETE FROM inventory WHERE ${ROW_WHERE}`, rowArgs(r));
  else
    await c.query(
      `INSERT INTO inventory (card_id, variant, lang, cond, loc, qty, personal) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, card_id, variant, lang, cond, loc) DO UPDATE SET qty = $6, personal = $7, updated_at = now()`,
      [...rowArgs(r), qty, Math.min(Math.max(personal, 0), qty)],
    );
}
export const lockRow = (c: Queryable, r: Row) =>
  c
    .query<{ qty: number; personal: number; added_at: Date | null }>(
      `SELECT qty, personal, added_at FROM inventory WHERE ${ROW_WHERE} FOR UPDATE`,
      rowArgs(r),
    )
    .then(x => x.rows[0] || { qty: 0, personal: 0, added_at: null });

/** The inventory half, over one app's database layer (its catalog downloads cards it doesn't have yet). */
export function createInventory(db: Db) {
  const catalog = createCatalog(db);

  // Finds the card id for a set + number as typed (exact first, then normalized: 025 → 25, TG05 → TG5)
  async function resolveCard(c: Queryable, sid: unknown, num: unknown): Promise<{ id: string; number: string } | null> {
    const q = () =>
      c.query<{ id: string; number: string }>(
        'SELECT id, number FROM cards WHERE set_id = $1 AND (number = $2 OR number_norm = $3) ORDER BY (number = $2) DESC LIMIT 1',
        [sid, String(num), normNumber(num)],
      );
    let { rows } = await q();
    if (!rows.length) {
      await catalog.ensureSetCards(String(sid));
      ({ rows } = await q());
    }
    return rows[0] || null;
  }

  // the row a request talks about (resolves set + number to the card)
  async function rowOf(c: Queryable, b: RowBody): Promise<Row> {
    const variant = checkVariant(b.variant),
      lang = checkLang(b.lang),
      cond = checkCond(b.cond),
      loc = checkLoc(b.loc);
    if (loc) {
      const { rows } = await c.query('SELECT 1 FROM locations WHERE id = $1', [loc]);
      if (!rows.length) throw bad('Esa ubicación ya no existe');
    }
    const card = await resolveCard(c, b.sid, b.num);
    if (!card) throw bad(`La carta ${b.num} no existe en la expansión ${b.sid}`, 404);
    return { cardId: card.id, num: card.number, variant, lang, cond, loc };
  }

  /** personal: the added copies go to my personal collection; batch: id shared by every card of a range, undone together */
  async function add(c: Queryable, b: RowBody & { delta?: unknown; personal?: unknown; batch?: unknown }) {
    const d = parseInt(String(b.delta), 10);
    if (!d || Math.abs(d) > 10000) throw bad('Cantidad inválida');
    if (b.batch != null && !UUID_RE.test(String(b.batch))) throw bad('Grupo inválido');
    const r = await rowOf(c, b);
    const cur = await lockRow(c, r);
    const next = addToCopies(cur, d, !!b.personal);
    await writeRow(c, r, next.qty, next.personal);
    let logId: number | null = null;
    if (next.real) {
      const { rows } = await c.query<{ id: number }>(
        'INSERT INTO inventory_log (card_id, variant, lang, cond, loc, delta, personal, batch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [...rowArgs(r), next.real, next.personal - cur.personal, b.batch || null],
      );
      logId = rows[0]!.id;
    }
    return {
      sid: b.sid,
      num: r.num,
      variant: r.variant,
      lang: r.lang,
      cond: r.cond,
      loc: r.loc,
      qty: next.qty,
      personal: next.personal,
      real: next.real,
      logId,
    };
  }

  /** How many copies of a row are personal (0..qty) */
  async function setPersonal(c: Queryable, b: RowBody & { personal?: unknown }) {
    const n = parseInt(String(b.personal), 10);
    if (!(n >= 0)) throw bad('Cantidad inválida');
    const r = await rowOf(c, b);
    const cur = await lockRow(c, r);
    if (!cur.qty) throw bad('No tienes copias de esa carta');
    await writeRow(c, r, cur.qty, n);
    return { personal: Math.min(n, cur.qty) };
  }

  /**
   * Undoes the account's last load; when it was part of a range (batch), the whole range at once. With a target, exactly
   * that load (logId) or range (batch), whatever came after (arma's session undoes only its own loads); gone → nothing.
   */
  async function undo(c: Queryable, target: { logId?: unknown; batch?: unknown } = {}) {
    const logId = target.logId == null ? null : Number(target.logId);
    const batch = target.batch == null ? null : String(target.batch);
    if (logId != null && !(Number.isInteger(logId) && logId > 0)) throw bad('Carga inválida');
    if (batch != null && !UUID_RE.test(batch)) throw bad('Grupo inválido');
    const {
      rows: [last],
    } = await c.query<{ id: number; batch: string | null }>(
      batch != null
        ? 'SELECT id, batch FROM inventory_log WHERE batch = $1 ORDER BY id DESC LIMIT 1 FOR UPDATE'
        : logId != null
          ? 'SELECT id, batch FROM inventory_log WHERE id = $1 FOR UPDATE'
          : 'SELECT id, batch FROM inventory_log ORDER BY id DESC LIMIT 1 FOR UPDATE',
      batch != null ? [batch] : logId != null ? [logId] : [],
    );
    if (!last) return { undone: null, rows: [] };
    const { rows: entries } = await c.query(
      `SELECT l.*, ${CARD_COLS} FROM inventory_log l JOIN cards c ON c.id = l.card_id
       WHERE ${last.batch ? 'l.batch = $1' : 'l.id = $1'} ORDER BY l.id DESC FOR UPDATE OF l`,
      [last.batch || last.id],
    );
    const out = [];
    for (const e of entries) {
      const r: Row = { cardId: e.card_id, variant: e.variant, lang: e.lang, cond: e.cond, loc: e.loc };
      const cur = await lockRow(c, r);
      const next = undoCopies(cur, e.delta, e.personal);
      await writeRow(c, r, next.qty, next.personal);
      await c.query('DELETE FROM inventory_log WHERE id = $1', [e.id]);
      out.push({
        undone: e.id,
        sid: e.sid,
        num: e.num,
        variant: e.variant,
        lang: e.lang,
        cond: e.cond,
        loc: e.loc,
        qty: next.qty,
        personal: next.qty ? next.personal : 0,
      });
    }
    return { ...out[0], batch: last.batch, rows: out };
  }

  // Moves n copies (default all; copies for sale go first) of a row to another variant / language / condition / location,
  // merging if that row already exists. Log entries follow when the whole row moves, so undo stays coherent.
  async function moveRow(c: Queryable, from: Row, to: Row, n = Infinity): Promise<number> {
    const cur = await lockRow(c, from);
    if (!cur.qty || (['variant', 'lang', 'cond', 'loc'] as const).every(k => from[k] === to[k])) return 0;
    const { moved: k, personal: kp } = moveSplit(cur, n);
    await writeRow(c, from, cur.qty - k, cur.personal - kp);
    await c.query(
      `INSERT INTO inventory (card_id, variant, lang, cond, loc, qty, personal, added_at) VALUES ($1, $2, $3, $4, $5, $6, $7, coalesce($8, now()))
       ON CONFLICT (user_id, card_id, variant, lang, cond, loc) DO UPDATE SET qty = inventory.qty + excluded.qty, personal = inventory.personal + excluded.personal,
         added_at = least(inventory.added_at, excluded.added_at), updated_at = now()`,
      [...rowArgs(to), k, kp, cur.added_at],
    );
    if (k === cur.qty)
      await c.query(`UPDATE inventory_log SET variant = $6, lang = $7, cond = $8, loc = $9 WHERE ${ROW_WHERE}`, [
        ...rowArgs(from),
        to.variant,
        to.lang,
        to.cond,
        to.loc,
      ]);
    return k;
  }

  /** n copies (default all) of a row to another variant, language, condition and/or location: body = row + {to, n?, logId?} */
  async function move(
    c: Queryable,
    b: RowBody & { to?: { variant?: unknown; lang?: unknown; cond?: unknown; loc?: unknown }; n?: unknown; logId?: unknown },
  ) {
    const t = b.to || {};
    const n = b.n == null ? Infinity : parseInt(String(b.n), 10);
    if (!(n > 0)) throw bad('Cantidad inválida');
    const from = await rowOf(c, b);
    const to: Row = {
      ...from,
      variant: t.variant !== undefined ? checkVariant(t.variant) : from.variant,
      lang: t.lang !== undefined ? checkLang(t.lang, false) : from.lang,
      cond: t.cond !== undefined ? checkCond(t.cond) : from.cond,
      loc: t.loc !== undefined ? checkLoc(t.loc) : from.loc,
    };
    if (to.loc) {
      const { rows } = await c.query('SELECT 1 FROM locations WHERE id = $1', [to.loc]);
      if (!rows.length) throw bad('Esa ubicación ya no existe');
    }
    const moved = await moveRow(c, from, to, n);
    // the copies just loaded were re-filed (e.g. its price sent it to the binder): undo must find them in the new place
    if (moved && b.logId)
      await c.query('UPDATE inventory_log SET variant = $2, lang = $3, cond = $4, loc = $5 WHERE id = $1', [
        b.logId,
        to.variant,
        to.lang,
        to.cond,
        to.loc,
      ]);
    return { moved };
  }

  /** my own price (NM) for a card + variant, in usd or clp; both empty = back to the market price */
  async function ownPrice(q: Queryable, b: { sid?: unknown; num?: unknown; variant?: unknown; usd?: unknown; clp?: unknown }) {
    const variant = checkVariant(b.variant);
    const card = await resolveCard(q, b.sid, b.num);
    if (!card) throw bad(`La carta ${b.num} no existe en la expansión ${b.sid}`);
    const usd = b.usd == null || b.usd === '' ? null : Math.round(Number(b.usd) * 100) / 100;
    if (usd == null && (b.clp == null || b.clp === ''))
      await q.query('DELETE FROM price_overrides WHERE card_id = $1 AND variant = $2', [card.id, variant]);
    else {
      if (usd != null && !(usd >= 0)) throw bad('Precio inválido');
      const clp = usd != null ? ownClp({ usd }, await getFx(db)) : parseInt(String(b.clp), 10);
      if (!(clp != null && clp >= 0)) throw bad(usd != null ? 'No tengo el tipo de cambio para convertir a CLP' : 'Precio inválido');
      // saving the same value again counts as "checked today"
      await q.query(
        `INSERT INTO price_overrides (card_id, variant, clp, usd) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, card_id, variant) DO UPDATE SET clp = $3, usd = $4, updated_at = now()`,
        [card.id, variant, clp, usd],
      );
    }
    return { ok: true };
  }

  return { ...catalog, resolveCard, rowOf, moveRow, add, setPersonal, undo, move, ownPrice };
}
export type Inventory = ReturnType<typeof createInventory>;
