// "Arma tu Master Set" (master-set-familia-eevee): every member of the family with what the fan needs to count it the way
// the case would, with the active rules (its printings, reduced to what the rules read, and the codes the account has)
// and its portrait. Read only: the copies come with the account's Row Level Security.
import type { FastifyInstance } from 'fastify';
import { FAMILIES, MEMBER_NAMES } from '@pokenitsu/core';
import { pool } from './db.ts';
import { ownedCopies, requireViewer } from './session.ts';
import { asViewer } from './viewerTx.ts';
import { speciesPortraits } from './gallery.ts';
import { speciesNames } from './details.ts';

export function masterSetRoutes(app: FastifyInstance) {
  app.get('/api/master-sets', async req => {
    const v = await requireViewer(req);
    const family = FAMILIES[0]!;
    const dexes = [...family.members];
    const [prints, portraits, names] = await Promise.all([
      pool.query<{ dex: number; code: string; lang: string; stamp: string | null; equiv_id: string | null }>(
        `SELECT dex, code, lang, stamp, equiv_id FROM arma.printings WHERE dex = ANY ($1) ORDER BY dex, code`,
        [dexes],
      ),
      asViewer(v, c => speciesPortraits(c, dexes), true),
      speciesNames().catch(() => null),
    ]);
    // one member after the other: each reads holding a connection and asks the pool for another (max 6), so nine at once
    // would wait for each other forever
    const owned: Awaited<ReturnType<typeof ownedCopies>>[] = [];
    for (const d of dexes) owned.push(await ownedCopies(v.id, d));
    return {
      family: { id: family.id, name: family.name, base: family.base },
      members: dexes.map((dex, i) => ({
        dex,
        name: MEMBER_NAMES[dex] || names?.en.get(dex) || `#${dex}`,
        ja: names?.ja.get(dex) || '',
        printings: prints.rows.filter(p => p.dex === dex).map(({ code, lang, stamp, equiv_id }) => ({ code, lang, stamp, equiv_id })),
        have: [...new Set(owned[i]!.filter(o => o.qty > 0).map(o => o.code))],
        pic: portraits.get(dex) || null,
      })),
    };
  });
}
