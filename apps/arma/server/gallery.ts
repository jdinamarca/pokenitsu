// Ilustradores and Pokédex (ilustradores-y-pokedex-en-arma): every illustrator and every species with how many of
// their cards exist and how many the account has, and the cards of one of them. Read only: "have" is any copy in the
// account's inventory, which Row Level Security keeps to its own (asViewer).
import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { pool } from './db.ts';
import { requireViewer } from './session.ts';
import { asViewer } from './viewerTx.ts';
import { cardPhotos, withRefs } from './inventory.ts';
import { speciesNames } from './details.ts';
import type { CardPhotos } from './photoOrder.ts';

type Scope = 'all' | 'intl' | 'ja';
const scopeOf = (v: unknown): Scope => (v === 'intl' || v === 'ja' ? v : 'all');
const SOURCES: Record<Scope, string[]> = { all: ['ptcg', 'tcgdex-ja'], intl: ['ptcg'], ja: ['tcgdex-ja'] };
// the account's cards with copies (inside asViewer: only its own)
const MINE = `mine AS (SELECT card_id, sum(qty)::int AS q FROM inventory WHERE qty > 0 GROUP BY card_id)`;
// promos, McDonald's, Rumble, trainer kits… last: several have no picture or look odd (Nitsu's /api/dex)
const ODD_SET = `(s.id ~ '^(mcd|ru1|tk|bp|fut20)' OR s.name ~* 'promo')`;
// a card that has something to show: the catalog's picture or a photo of ours
const HAS_PIC = `(c.image_small IS NOT NULL OR EXISTS (SELECT 1 FROM arma.card_photos p WHERE p.card_id = c.id))`;

export interface Picture {
  img: string | null;
  own_card: string | null;
  local: CardPhotos['local'];
  ref: string | null;
}
/** the picture of each card, in Mi inventario's order (own photo, catalog, local only, a reference of its Pokémon) */
async function pictures(ids: string[]): Promise<Map<string, Picture>> {
  if (!ids.length) return new Map();
  const { rows } = await pool.query<{ id: string; img: string | null; dex: number[] | null }>(
    `SELECT id, image_small AS img, dex FROM cards WHERE id = ANY ($1)`,
    [ids],
  );
  const [photos, withRef] = await Promise.all([cardPhotos(ids), withRefs(rows)]);
  return new Map(
    withRef.map(r => {
      const p = photos.get(r.id);
      return [r.id, { img: r.img, own_card: p?.own_card ?? null, local: p?.local ?? null, ref: r.ref }];
    }),
  );
}

export interface GalleryRow extends Picture {
  id: string;
  set_id: string;
  set_name: string;
  set_code: string;
  release: string;
  number: string;
  number_norm: string;
  name: string;
  rarity: string | null;
  qty: number;
}
/** the cards that match `where` ($1 = the scope's sources, $2 = the illustrator or the Pokédex number), with pictures */
async function galleryCards(c: pg.PoolClient, where: string, scope: Scope, arg: string | number): Promise<GalleryRow[]> {
  const { rows } = await c.query<Omit<GalleryRow, keyof Picture>>(
    `WITH ${MINE}
     SELECT c.id, c.set_id, coalesce(s.name_en, s.name) AS set_name, coalesce(s.code, '') AS set_code,
            coalesce(to_char(s.release_date, 'YYYY-MM-DD'), '') AS release, c.number, c.number_norm, c.name, c.rarity,
            coalesce(m.q, 0) AS qty
     FROM cards c JOIN sets s ON s.id = c.set_id LEFT JOIN mine m ON m.card_id = c.id
     WHERE s.source = ANY ($1) AND ${where}`,
    [SOURCES[scope], arg],
  );
  const pics = await pictures(rows.map(r => r.id));
  return rows.map(r => ({ ...r, ...(pics.get(r.id) || { img: null, own_card: null, local: null, ref: null }) }));
}

export function galleryRoutes(app: FastifyInstance) {
  // every illustrator: their cards, the ones the account has, their years and a cover (the newest of theirs it has,
  // else the newest from a regular expansion with something to show)
  app.get<{ Querystring: { scope?: string } }>('/api/artists', async req => {
    const scope = scopeOf(req.query.scope);
    const rows = await asViewer(
      await requireViewer(req),
      async c =>
        (
          await c.query<{ name: string; total: number; mine: number; from: number | null; to: number | null; cover_id: string | null }>(
            `WITH ${MINE}
             SELECT c.artist AS name, count(*)::int AS total, count(m.q)::int AS mine,
                    min(extract(year FROM s.release_date))::int AS "from", max(extract(year FROM s.release_date))::int AS "to",
                    coalesce((array_agg(c.id ORDER BY s.release_date DESC NULLS LAST, c.id) FILTER (WHERE m.q IS NOT NULL AND ${HAS_PIC}))[1],
                             (array_agg(c.id ORDER BY ${ODD_SET}, s.release_date DESC NULLS LAST, c.id) FILTER (WHERE ${HAS_PIC}))[1]) AS cover_id
             FROM cards c JOIN sets s ON s.id = c.set_id LEFT JOIN mine m ON m.card_id = c.id
             WHERE coalesce(c.artist, '') <> '' AND s.source = ANY ($1)
             GROUP BY c.artist`,
            [SOURCES[scope]],
          )
        ).rows,
      true,
    );
    const pics = await pictures(rows.map(r => r.cover_id).filter((x): x is string => !!x));
    return rows.map(({ cover_id, ...r }) => ({ ...r, cover: cover_id ? pics.get(cover_id) || null : null }));
  });

  app.get<{ Querystring: { name?: string; scope?: string } }>('/api/artists/cards', async req => {
    const name = String(req.query.name ?? '').trim();
    if (!name) throw Object.assign(new Error('Falta el nombre del ilustrador'), { statusCode: 400 });
    const scope = scopeOf(req.query.scope);
    return asViewer(await requireViewer(req), c => galleryCards(c, 'c.artist = $2', scope, name), true);
  });

  // every species: its cards, the ones the account has and a picture (the newest of its own it has, else a representative
  // one: a common with a simple name from a regular expansion, as Nitsu's /api/dex)
  app.get<{ Querystring: { scope?: string } }>('/api/pokedex', async req => {
    const scope = scopeOf(req.query.scope);
    const [rows, names] = await Promise.all([
      asViewer(
        await requireViewer(req),
        async c =>
          (
            await c.query<{ dex: number; total: number; mine: number; mine_id: string | null; rep_id: string | null }>(
              `WITH ${MINE},
               pc AS (SELECT c.id, d, m.q, s.release_date, ${HAS_PIC} AS pic, ${ODD_SET} AS odd, s.source,
                             (position(' ' in c.name) = 0 OR c.name LIKE 'Nidoran%' OR c.name LIKE 'Mr. %') AS simple,
                             cardinality(c.dex) = 1 AS lone, coalesce(c.rarity, '') IN ('Common', 'Commune', 'C') AS common
                      FROM cards c JOIN sets s ON s.id = c.set_id LEFT JOIN mine m ON m.card_id = c.id, unnest(c.dex) d
                      WHERE s.source = ANY ($1) AND d BETWEEN 1 AND 1025)
               SELECT d AS dex, count(*)::int AS total, count(q)::int AS mine,
                      (array_agg(id ORDER BY release_date DESC NULLS LAST, id) FILTER (WHERE q IS NOT NULL AND pic))[1] AS mine_id,
                      (array_agg(id ORDER BY pic DESC, source = 'ptcg' DESC, lone DESC, odd, simple DESC, common DESC,
                                         release_date DESC NULLS LAST, id))[1] AS rep_id
               FROM pc GROUP BY d ORDER BY d`,
              [SOURCES[scope]],
            )
          ).rows,
        true,
      ),
      speciesNames().catch(() => null),
    ]);
    const pics = await pictures(rows.map(r => r.mine_id || r.rep_id).filter((x): x is string => !!x));
    return rows.map(r => {
      const id = r.mine_id || r.rep_id;
      return {
        dex: r.dex,
        name: names?.en.get(r.dex) || `#${r.dex}`,
        ja: names?.ja.get(r.dex) || '',
        total: r.total,
        mine: r.mine,
        pic: id ? pics.get(id) || null : null,
      };
    });
  });

  app.get<{ Params: { dex: string }; Querystring: { scope?: string } }>('/api/pokedex/:dex', async req => {
    const dex = Number(req.params.dex);
    if (!Number.isInteger(dex) || dex < 1 || dex > 1025) throw Object.assign(new Error('Número de Pokédex inválido'), { statusCode: 400 });
    const scope = scopeOf(req.query.scope);
    const [cards, names] = await Promise.all([
      asViewer(await requireViewer(req), c => galleryCards(c, '$2 = ANY (c.dex)', scope, dex), true),
      speciesNames().catch(() => null),
    ]);
    return { dex, name: names?.en.get(dex) || `#${dex}`, ja: names?.ja.get(dex) || '', cards };
  });
}
