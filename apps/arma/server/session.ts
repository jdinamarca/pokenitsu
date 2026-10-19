// Who is asking: the Better Auth session (cookie pokenitsu.session_token, its signature checked), served by this API
// itself since cuentas-en-arma; the same session as Nitsu's.
import type { FastifyRequest } from 'fastify';
import { compactStamp, variantFromInventory } from '@pokenitsu/core';
import { sessionOf } from './auth.ts';
import { pool } from './db.ts';

export interface Viewer {
  id: string;
  name: string;
}
export async function viewerOf(req: FastifyRequest): Promise<Viewer | null> {
  const s = await sessionOf(req.headers).catch(() => null);
  return s ? { id: s.user.id, name: s.user.name } : null;
}
export async function requireViewer(req: FastifyRequest): Promise<Viewer> {
  const v = await viewerOf(req);
  if (!v) throw Object.assign(new Error('Entra para ver tu colección'), { statusCode: 401 });
  return v;
}

/** the administrator: the first account created, as in Nitsu (isOwner) */
export async function isOwner(v: Viewer | null): Promise<boolean> {
  if (!v) return false;
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM "user" ORDER BY "createdAt" LIMIT 1');
  return rows[0]?.id === v.id;
}
export async function requireOwner(req: FastifyRequest): Promise<Viewer> {
  const v = await requireViewer(req);
  if (!(await isOwner(v))) throw Object.assign(new Error('Solo el administrador puede hacer esto.'), { statusCode: 403 });
  return v;
}

export interface OwnedCopy {
  code: string;
  qty: number;
  personal: number;
  lang: string;
  cond: string;
  loc: string | null;
}
/**
 * The viewer's copies of one Pokémon's printings, read with their Row Level Security (app.user_id), never written.
 * A copy fills a printing when card, language and variant match.
 */
export async function ownedCopies(userId: string, dex: number): Promise<OwnedCopy[]> {
  type InvRow = { card_id: string; variant: string; lang: string; cond: string; loc: string | null; qty: number; personal: number };
  // the account's copies inside its own transaction, and the connection given back before asking for anything else:
  // holding it while waiting for another one could leave the pool (max 6) waiting for itself
  const c = await pool.connect();
  let inv: InvRow[];
  try {
    await c.query('BEGIN READ ONLY');
    await c.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    inv = (
      await c.query<InvRow>(
        `SELECT i.card_id, i.variant, i.lang, i.cond, l.name AS loc, i.qty, i.personal
         FROM public.inventory i JOIN public.cards k ON k.id = i.card_id LEFT JOIN public.locations l ON l.id::text = i.loc::text
         WHERE $1 = ANY (k.dex)`,
        [dex],
      )
    ).rows;
    await c.query('COMMIT');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
  const { rows: prints } = await pool.query<{ code: string; card_id: string; lang: string; finish: string; stamp: string | null }>(
    'SELECT code, card_id, lang, finish, stamp FROM arma.printings WHERE dex = $1 AND card_id IS NOT NULL',
    [dex],
  );
  // stamps compared without dashes: the inventory's bacharizard26 is the Full's ba-charizard-26 (variantes-al-cargar)
  const index = new Map(prints.map(p => [`${p.card_id}|${p.lang}|${p.finish}|${compactStamp(p.stamp)}`, p.code]));
  const out: OwnedCopy[] = [];
  for (const r of inv) {
    const v = variantFromInventory(r.variant);
    // an international card without a language counts as English, a Japanese set's card as Japanese
    const lang = r.lang || (r.card_id.startsWith('ja-') ? 'JA' : 'EN');
    const code = index.get(`${r.card_id}|${lang}|${v.finish}|${compactStamp(v.stamp)}`);
    if (code) out.push({ code, qty: r.qty, personal: r.personal, lang, cond: r.cond, loc: r.loc });
  }
  return out;
}
