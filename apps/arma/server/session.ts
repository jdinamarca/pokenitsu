// Who is asking: the Better Auth session of the current app (cookie pokenitsu.session_token = "token.signature").
// Cookies ignore the port, so the one set by localhost:3000 also reaches this app on localhost.
import type { FastifyRequest } from 'fastify';
import { variantFromInventory } from '@pokenitsu/core';
import { pool } from './db.ts';

const COOKIE = 'pokenitsu.session_token';

export interface Viewer {
  id: string;
  name: string;
}
export async function viewerOf(req: FastifyRequest): Promise<Viewer | null> {
  const raw = (req.headers.cookie || '')
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(COOKIE + '=') || c.startsWith('__Secure-' + COOKIE + '='));
  if (!raw) return null;
  const token = decodeURIComponent(raw.slice(raw.indexOf('=') + 1)).split('.')[0];
  if (!token) return null;
  const { rows } = await pool.query<Viewer>(
    `SELECT u.id, u.name FROM public."session" s JOIN public."user" u ON u.id = s."userId" WHERE s.token = $1 AND s."expiresAt" > now()`,
    [token],
  );
  return rows[0] || null;
}
export async function requireViewer(req: FastifyRequest): Promise<Viewer> {
  const v = await viewerOf(req);
  if (!v) throw Object.assign(new Error('Entra en Nitsu para ver tu colección'), { statusCode: 401 });
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
  const c = await pool.connect();
  try {
    await c.query('BEGIN READ ONLY');
    await c.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const { rows: inv } = await c.query<{
      card_id: string;
      variant: string;
      lang: string;
      cond: string;
      loc: string | null;
      qty: number;
      personal: number;
    }>(
      `SELECT i.card_id, i.variant, i.lang, i.cond, l.name AS loc, i.qty, i.personal
       FROM public.inventory i JOIN public.cards k ON k.id = i.card_id LEFT JOIN public.locations l ON l.id::text = i.loc::text
       WHERE $1 = ANY (k.dex)`,
      [dex],
    );
    await c.query('COMMIT');
    const { rows: prints } = await pool.query<{ code: string; card_id: string; lang: string; finish: string; stamp: string | null }>(
      'SELECT code, card_id, lang, finish, stamp FROM arma.printings WHERE dex = $1 AND card_id IS NOT NULL',
      [dex],
    );
    const index = new Map(prints.map(p => [`${p.card_id}|${p.lang}|${p.finish}|${p.stamp || ''}`, p.code]));
    const out: OwnedCopy[] = [];
    for (const r of inv) {
      const v = variantFromInventory(r.variant);
      // an international card without a language counts as English, a Japanese set's card as Japanese
      const lang = r.lang || (r.card_id.startsWith('ja-') ? 'JA' : 'EN');
      const code = index.get(`${r.card_id}|${lang}|${v.finish}|${v.stamp || ''}`);
      if (code) out.push({ code, qty: r.qty, personal: r.personal, lang, cond: r.cond, loc: r.loc });
    }
    return out;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
