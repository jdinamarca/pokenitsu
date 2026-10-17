// Cargar and Mi inventario (cargar-e-inventario-en-arma): the same inventory as Nitsu, through @pokenitsu/inventory,
// always inside asViewer. Prices are only read: what Nitsu has stored, never downloaded here.
import type { FastifyInstance } from 'fastify';
import { searchSetsLang } from '@pokenitsu/core';
import { CARD_COLS, createInventory, getFx, ownClp, priceSettings, type RowBody } from '@pokenitsu/inventory';
import { pool, tx } from './db.ts';
import { requireViewer } from './session.ts';
import { asViewer } from './viewerTx.ts';

// catalog downloads (cards, exchange rate) are shared by every account: plain connections
const inv = createInventory({ query: (text, params) => pool.query(text, params) as Promise<never>, tx });

interface SetRow {
  id: string;
  name: string;
  name_ja: string;
  series: string | null;
  code: string;
  date: string;
  total: number | null;
  printed: number | null;
  sym: string;
  source: string;
  lang: string | null;
  has_cards: boolean;
}
type OwnRow = { card_id: string; variant: string; clp: number | null; usd: number | null };
// my own prices of some cards, in CLP (in USD they follow today's rate): { "cardId|variant": clp }
const ownMap = (rows: OwnRow[], fx: { usd: number } | null) =>
  Object.fromEntries(rows.map(r => [`${r.card_id}|${r.variant}`, ownClp(r, fx)]));
// the names of the variants, as Nitsu shows them (cosmosholo → Cosmos Holo)
const variantLabels = () =>
  pool
    .query<{ slug: string; label: string }>('SELECT slug, label FROM variant_labels')
    .then(r => Object.fromEntries(r.rows.map(x => [x.slug, x.label])));

// for a card without a picture: one of the same Pokémon from an international expansion, as Nitsu's /api/dex
// (shown dimmed, as a reference, never as the card's own)
async function refImages(dexes: number[]): Promise<Map<number, string>> {
  if (!dexes.length) return new Map();
  const { rows } = await pool.query<{ dex: number; img: string }>(
    `SELECT DISTINCT ON (d) d AS dex, c.image_small AS img
     FROM cards c JOIN sets s ON s.id = c.set_id, unnest(c.dex) d
     WHERE d = ANY ($1) AND s.source = 'ptcg' AND c.supertype = 'Pokémon' AND cardinality(c.dex) = 1 AND c.image_small IS NOT NULL
     ORDER BY d, (s.id ~ '^(mcd|ru1|tk|bp|fut20)' OR s.name ~* 'promo') ASC,
              (position(' ' in c.name) = 0 OR c.name LIKE 'Nidoran%' OR c.name LIKE 'Mr. %') DESC, (c.rarity = 'Common') DESC, length(c.name), s.release_date DESC NULLS LAST`,
    [dexes],
  );
  return new Map(rows.map(r => [r.dex, r.img]));
}
type Pictured = { img: string | null; dex: number[] | null };
const loneDex = (r: Pictured) => (!r.img && r.dex?.length === 1 ? r.dex[0]! : null);
// the reference picture of each card without its own
async function withRefs<T extends Pictured>(rows: T[]): Promise<(T & { ref: string | null })[]> {
  const refs = await refImages([...new Set(rows.map(loneDex).filter((d): d is number => d != null))]);
  return rows.map(r => ({ ...r, ref: refs.get(loneDex(r) ?? -1) ?? null }));
}

export function inventoryRoutes(app: FastifyInstance) {
  // every expansion, or the ones a search finds (Nitsu's criteria; "MEW ES" also says the language)
  app.get<{ Querystring: { q?: string } }>('/api/sets', async req => {
    await requireViewer(req);
    const { rows } = await pool.query<SetRow>(
      `SELECT id, coalesce(name_en, name) AS name, CASE WHEN name_en IS NOT NULL THEN name ELSE '' END AS name_ja, series,
              coalesce(code, '') AS code, coalesce(to_char(release_date, 'YYYY/MM/DD'), '') AS date, total, printed_total AS printed,
              coalesce(symbol_url, '') AS sym, source, lang, cards_synced_at IS NOT NULL AS has_cards
       FROM sets ORDER BY release_date DESC NULLS LAST, id`,
    );
    const q = String(req.query.q ?? '');
    return q.trim() ? searchSetsLang(rows, q) : { sets: rows, lang: null };
  });

  // an expansion's cards (downloaded the first time), with the account's copies and the stored prices
  app.get<{ Params: { id: string } }>('/api/sets/:id/cards', async req => {
    const v = await requireViewer(req);
    const sid = req.params.id;
    const { rows: set } = await pool.query('SELECT 1 FROM sets WHERE id = $1', [sid]);
    if (!set.length) throw Object.assign(new Error('Esa expansión no existe'), { statusCode: 404 });
    await inv.ensureSetCards(sid);
    const [fx, labels] = await Promise.all([getFx(pool), variantLabels()]);
    return asViewer(
      v,
      async c => {
        const [cards, prices, copies, own, cfg, photos] = await Promise.all([
          c.query<Pictured & { id: string }>(
            `SELECT c.id, ${CARD_COLS}, c.variants, c.variants_guessed AS vguess FROM cards c WHERE c.set_id = $1
             ORDER BY c.number_norm ~ '^[0-9]+$' DESC, nullif(regexp_replace(c.number_norm, '[^0-9]', '', 'g'), '')::int NULLS LAST, c.number`,
            [sid],
          ),
          c.query(
            `SELECT p.card_id, p.usd, p.eur, to_char(p.fetched_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS at
             FROM card_prices p JOIN cards k ON k.id = p.card_id WHERE k.set_id = $1`,
            [sid],
          ),
          c.query(
            `SELECT i.card_id, i.variant, i.lang, i.cond, i.loc, i.qty, i.personal
             FROM inventory i JOIN cards k ON k.id = i.card_id WHERE k.set_id = $1`,
            [sid],
          ),
          c.query<OwnRow>(
            `SELECT o.card_id, o.variant, o.clp, o.usd::float AS usd FROM price_overrides o JOIN cards k ON k.id = o.card_id
             WHERE k.set_id = $1`,
            [sid],
          ),
          priceSettings(c),
          // the account's own photos of a variant (variant_images, set in Nitsu)
          c.query<{ card_id: string; variant: string; img: string }>(
            `SELECT v.card_id, v.variant, v.img FROM variant_images v JOIN cards k ON k.id = v.card_id WHERE k.set_id = $1`,
            [sid],
          ),
        ]);
        const photosOf = new Map<string, Record<string, string>>();
        for (const p of photos.rows) photosOf.set(p.card_id, { ...photosOf.get(p.card_id), [p.variant]: p.img });
        const priceOf = new Map(prices.rows.map(({ card_id, ...p }) => [card_id, p]));
        const copiesOf = new Map<string, unknown[]>();
        for (const { card_id, ...r } of copies.rows) copiesOf.set(card_id, [...(copiesOf.get(card_id) || []), r]);
        return {
          cfg,
          fx,
          labels,
          own: ownMap(own.rows, fx),
          cards: (await withRefs(cards.rows)).map(r => ({
            ...r,
            photos: photosOf.get(r.id) || {},
            prices: priceOf.get(r.id) || null,
            copies: copiesOf.get(r.id) || [],
          })),
        };
      },
      true,
    );
  });

  // the account's inventory (each row with its card and expansion) and its locations, in their order
  app.get('/api/inventory', async req => {
    const v = await requireViewer(req);
    const [fx, labels] = await Promise.all([getFx(pool), variantLabels()]);
    return asViewer(
      v,
      async c => {
        const [rows, locations, own, cfg] = await Promise.all([
          c.query<Pictured>(
            `SELECT i.card_id, i.variant, i.lang, i.cond, i.loc, i.qty, i.personal, (extract(epoch FROM i.added_at) * 1000)::bigint AS added,
                    ${CARD_COLS}, coalesce(s.name_en, s.name) AS set_name, coalesce(s.code, '') AS set_code,
                    p.usd AS price_usd, p.eur AS price_eur, vi.img AS own_img
             FROM inventory i JOIN cards c ON c.id = i.card_id JOIN sets s ON s.id = c.set_id
             LEFT JOIN card_prices p ON p.card_id = c.id
             LEFT JOIN variant_images vi ON vi.card_id = i.card_id AND vi.variant = i.variant
             ORDER BY s.release_date NULLS LAST, s.id, c.number_norm ~ '^[0-9]+$' DESC,
                      nullif(regexp_replace(c.number_norm, '[^0-9]', '', 'g'), '')::int NULLS LAST, c.number, i.variant, i.lang, i.cond`,
          ),
          c.query('SELECT id, name, kind, pos, note, rule FROM locations ORDER BY pos, id'),
          c.query<OwnRow>('SELECT o.card_id, o.variant, o.clp, o.usd::float AS usd FROM price_overrides o'),
          priceSettings(c),
        ]);
        return { cfg, fx, labels, own: ownMap(own.rows, fx), rows: await withRefs(rows.rows), locations: locations.rows };
      },
      true,
    );
  });

  // the same contract as Nitsu's (apps/api), so both answer the same
  type AddBody = RowBody & { delta?: unknown; personal?: unknown; batch?: unknown };
  app.post<{ Body: AddBody }>('/api/inventory/add', async req => asViewer(await requireViewer(req), c => inv.add(c, req.body || {})));
  app.post('/api/inventory/undo', async req => asViewer(await requireViewer(req), c => inv.undo(c)));
  app.post<{ Body: Parameters<typeof inv.move>[1] }>('/api/inventory/move', async req =>
    asViewer(await requireViewer(req), c => inv.move(c, req.body || {})),
  );
  app.post<{ Body: RowBody & { personal?: unknown } }>('/api/inventory/personal', async req =>
    asViewer(await requireViewer(req), c => inv.setPersonal(c, req.body || {})),
  );
  app.put<{ Body: Parameters<typeof inv.ownPrice>[1] }>('/api/prices/own', async req =>
    asViewer(await requireViewer(req), c => inv.ownPrice(c, req.body || {})),
  );
}
