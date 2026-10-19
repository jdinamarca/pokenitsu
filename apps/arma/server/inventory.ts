// Cargar and Mi inventario (cargar-e-inventario-en-arma): the same inventory as Nitsu, through @pokenitsu/inventory,
// always inside asViewer. Prices are only read: what Nitsu has stored, never downloaded here.
import type { FastifyInstance } from 'fastify';
import { inventoryVariant, searchSetsLang, variantLabel, type ArmaFinish } from '@pokenitsu/core';
import { CARD_COLS, createInventory, createLocations, getFx, ownClp, priceSettings, type RowBody } from '@pokenitsu/inventory';
import { pool, tx } from './db.ts';
import { requireViewer } from './session.ts';
import { ensureLocalCardPhotos, PRINTED_PHOTOS } from './catalogPhotos.ts';
import { pickCardPhotos, type CardPhotos } from './photoOrder.ts';
import { localPhotosOn } from './local.ts';
import { asViewer } from './viewerTx.ts';
import { fillJaDetails } from './details.ts';

// catalog downloads (cards, exchange rate) are shared by every account: plain connections
const inv = createInventory({ query: (text, params) => pool.query(text, params) as Promise<never>, tx });
/**
 * The international sets only TCGdex has (catalogo-desde-tcgdex), when there are none yet or the last sync is over 3 days
 * old: in the background at start, so the server never waits for TCGdex
 */
export async function ensureTdSets() {
  const { rows } = await pool.query<{ n: number; fresh: boolean }>(
    `SELECT count(*)::int AS n, coalesce(max(synced_at) > now() - interval '3 days', false) AS fresh FROM sets WHERE source = 'tcgdex-en'`,
  );
  if (rows[0]!.n && rows[0]!.fresh) return 0;
  return inv.syncTdSets();
}
// boxes and binders (cajas-y-carpetas-en-arma): the same operations as Nitsu's Ubicaciones
const locs = createLocations(inv);

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

// a Full's stamp the catalog has no name for, by its inventory name (trainer-kit-sun-moon): tksmalolanninetales26 →
// "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26"; a stamp without a better name than itself is left out
type Stamped = { finish: string; stamp: string | null };
const stampLabels = (rows: Stamped[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const p of rows) {
    if (!p.stamp) continue;
    const name = variantLabel({ finish: p.finish as ArmaFinish, stamp: p.stamp });
    if (!name.endsWith(p.stamp)) out[inventoryVariant(p.finish, p.stamp)] = name;
  }
  return out;
};

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
export async function cardPhotos(ids: string[]): Promise<Map<string, CardPhotos>> {
  const out = new Map<string, CardPhotos>();
  if (!ids.length) return out;
  const { rows } = await pool.query<{ card_id: string; source_id: string; src: string; name: string; permission: string }>(
    `SELECT p.card_id, p.source_id, p.src, s.name, s.permission FROM arma.card_photos p JOIN arma.sources s ON s.id = p.source_id
     WHERE p.card_id = ANY ($1)`,
    [ids],
  );
  const { rows: printed } = await pool.query<{ card_id: string; source_id: string; src: string; name: string; permission: string }>(
    `SELECT DISTINCT ON (p.card_id, p.source_id) p.card_id, p.source_id, p.src, s.name, s.permission
     FROM ${PRINTED_PHOTOS} p JOIN arma.sources s ON s.id = p.source_id
     WHERE p.card_id = ANY ($1)
     ORDER BY p.card_id, p.source_id, p.stamp IS NOT NULL, p.finish <> 'normal', p.code`,
    [ids],
  );
  return pickCardPhotos([...rows.map(r => ({ ...r, printed: false })), ...printed.map(r => ({ ...r, printed: true }))], localPhotosOn());
}
const NO_PHOTOS: CardPhotos = { own_card: null, local: null };

// each Pokémon's English name, from the international catalog (the most common name of its single-Pokémon cards):
// computed once while the server runs, since the catalog doesn't change in a session (cargar-selector-y-nombre)
let species: Promise<Map<number, string>> | null = null;
function speciesNamesEn(): Promise<Map<number, string>> {
  species ||= pool
    .query<{ dex: number; name: string }>(
      `SELECT dex, mode() WITHIN GROUP (ORDER BY nm) AS name
       FROM (SELECT unnest(c.dex) AS dex, c.name AS nm FROM cards c JOIN sets s ON s.id = c.set_id
             WHERE s.lang <> 'JA' AND c.supertype = 'Pokémon' AND cardinality(c.dex) = 1) x
       GROUP BY dex`,
    )
    .then(r => new Map(r.rows.map(x => [x.dex, x.name])))
    .catch(e => {
      species = null;
      throw e;
    });
  return species;
}
/** a card's Pokémon in English ("Pikachu & Zekrom" for a TAG TEAM); null without a Pokédex number */
const englishName = (dex: number[] | null, names: Map<number, string>) =>
  dex?.length
    ? dex
        .map(d => names.get(d))
        .filter(Boolean)
        .join(' & ') || null
    : null;

type Pictured = { img: string | null; dex: number[] | null };
const loneDex = (r: Pictured) => (!r.img && r.dex?.length === 1 ? r.dex[0]! : null);
// the reference picture of each card without its own
export async function withRefs<T extends Pictured>(rows: T[]): Promise<(T & { ref: string | null })[]> {
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

  // the account's progress per expansion (cargar-selector-y-nombre): distinct cards with copies, as litCount lights them
  app.get('/api/sets/progress', async req =>
    asViewer(await requireViewer(req), async c => {
      const { rows } = await c.query<{ set_id: string; have: number }>(
        `SELECT k.set_id, count(DISTINCT k.number_norm)::int AS have
         FROM inventory i JOIN cards k ON k.id = i.card_id WHERE i.qty > 0 GROUP BY 1`,
      );
      return Object.fromEntries(rows.map(r => [r.set_id, r.have]));
    }),
  );

  // an expansion's cards (downloaded the first time), with the account's copies and the stored prices
  app.get<{ Params: { id: string } }>('/api/sets/:id/cards', async req => {
    const v = await requireViewer(req);
    const sid = req.params.id;
    const { rows: set } = await pool.query('SELECT 1 FROM sets WHERE id = $1', [sid]);
    if (!set.length) throw Object.assign(new Error('Esa expansión no existe'), { statusCode: 404 });
    await inv.ensureSetCards(sid);
    // a Japanese expansion's photos for local use only download in the background: the case never waits for them
    void ensureLocalCardPhotos(sid).catch(() => {});
    const [fx, labels] = await Promise.all([getFx(pool), variantLabels()]);
    return asViewer(
      v,
      async c => {
        const [cards, prices, copies, own, cfg, prints, photos] = await Promise.all([
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
          // the variants of each card in its Full, in the inventory's names (variantes-al-cargar)
          pool.query<{ card_id: string; lang: string; finish: string; stamp: string | null }>(
            `SELECT DISTINCT p.card_id, p.lang, p.finish, p.stamp FROM arma.printings p JOIN cards k ON k.id = p.card_id WHERE k.set_id = $1`,
            [sid],
          ),
          // the account's own photos of a variant (variant_images, set in Nitsu)
          c.query<{ card_id: string; variant: string; img: string }>(
            `SELECT v.card_id, v.variant, v.img FROM variant_images v JOIN cards k ON k.id = v.card_id WHERE k.set_id = $1`,
            [sid],
          ),
        ]);
        const photosOf = new Map<string, Record<string, string>>();
        for (const p of photos.rows) photosOf.set(p.card_id, { ...photosOf.get(p.card_id), [p.variant]: p.img });
        const [photosOfCard, speciesEn] = await Promise.all([cardPhotos(cards.rows.map(r => r.id)), speciesNamesEn()]);
        const fullOf = new Map<string, { lang: string; variant: string }[]>();
        for (const p of prints.rows)
          fullOf.set(p.card_id, [...(fullOf.get(p.card_id) || []), { lang: p.lang, variant: inventoryVariant(p.finish, p.stamp) }]);
        const fullLabels = stampLabels(prints.rows);
        const priceOf = new Map(prices.rows.map(({ card_id, ...p }) => [card_id, p]));
        const copiesOf = new Map<string, unknown[]>();
        for (const { card_id, ...r } of copies.rows) copiesOf.set(card_id, [...(copiesOf.get(card_id) || []), r]);
        return {
          cfg,
          fx,
          labels: { ...fullLabels, ...labels },
          own: ownMap(own.rows, fx),
          cards: (await withRefs(cards.rows)).map(r => ({
            ...r,
            name_en: englishName(r.dex, speciesEn),
            ...(photosOfCard.get(r.id) || NO_PHOTOS),
            photos: photosOf.get(r.id) || {},
            prices: priceOf.get(r.id) || null,
            copies: copiesOf.get(r.id) || [],
            full: fullOf.get(r.id) || [],
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
          c.query<Pictured & { card_id: string }>(
            `SELECT i.card_id, i.variant, i.lang, i.cond, i.loc, i.qty, i.personal, (extract(epoch FROM i.added_at) * 1000)::bigint AS added,
                    ${CARD_COLS}, coalesce(s.name_en, s.name) AS set_name, coalesce(s.code, '') AS set_code,
                    s.series AS set_series, s.source AS set_source, s.lang AS set_lang,
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
        const ids = [...new Set(rows.rows.map(r => r.card_id))];
        const [photosOfCard, stamped] = await Promise.all([
          cardPhotos(ids),
          pool.query<Stamped>('SELECT DISTINCT finish, stamp FROM arma.printings WHERE card_id = ANY ($1) AND stamp IS NOT NULL', [ids]),
        ]);
        return {
          cfg,
          fx,
          labels: { ...stampLabels(stamped.rows), ...labels },
          own: ownMap(own.rows, fx),
          rows: (await withRefs(rows.rows)).map(r => ({ ...r, ...(photosOfCard.get(r.card_id) || NO_PHOTOS) })),
          locations: locations.rows,
        };
      },
      true,
    );
  });

  // the same contract as Nitsu's (apps/api), so both answer the same
  type AddBody = RowBody & { delta?: unknown; personal?: unknown; batch?: unknown };
  app.post<{ Body: AddBody }>('/api/inventory/add', async req => {
    const r = await asViewer(await requireViewer(req), c => inv.add(c, req.body || {}));
    // a Japanese card without its details gets them after answering (detalles-de-japonesas-en-arma)
    if (r.real > 0)
      fillJaDetails([r.cardId]).catch(e => console.warn(`[arma] detalles de ${r.cardId}:`, e instanceof Error ? e.message : e));
    return r;
  });
  // { logId } or { batch }: exactly that load (Cargar's session); without them, the account's last one
  app.post<{ Body: { logId?: unknown; batch?: unknown } }>('/api/inventory/undo', async req =>
    asViewer(await requireViewer(req), c => inv.undo(c, { logId: req.body?.logId, batch: req.body?.batch })),
  );
  app.post<{ Body: Parameters<typeof inv.move>[1] }>('/api/inventory/move', async req =>
    asViewer(await requireViewer(req), c => inv.move(c, req.body || {})),
  );
  app.post<{ Body: RowBody & { personal?: unknown } }>('/api/inventory/personal', async req =>
    asViewer(await requireViewer(req), c => inv.setPersonal(c, req.body || {})),
  );
  app.put<{ Body: Parameters<typeof inv.ownPrice>[1] }>('/api/prices/own', async req =>
    asViewer(await requireViewer(req), c => inv.ownPrice(c, req.body || {})),
  );

  // boxes and binders: the same contract as Nitsu's
  app.post('/api/locations', async req => asViewer(await requireViewer(req), c => locs.create(c, req.body)));
  app.put<{ Params: { id: string } }>('/api/locations/:id', async req =>
    asViewer(await requireViewer(req), c => locs.update(c, req.params.id, req.body)),
  );
  // order = which rule wins a tie: ids in the new order
  app.put<{ Body: { ids?: unknown } }>('/api/locations-order', async req =>
    asViewer(await requireViewer(req), c => locs.reorder(c, req.body?.ids)),
  );
  // its copies are left without location
  app.delete<{ Params: { id: string } }>('/api/locations/:id', async req =>
    asViewer(await requireViewer(req), c => locs.remove(c, req.params.id)),
  );
  // auto-assign: several whole rows to their location, in one transaction
  app.post<{ Body: { moves?: unknown } }>('/api/inventory/move-locs', { bodyLimit: 20 * 1024 * 1024 }, async req =>
    asViewer(await requireViewer(req), c => locs.moveMany(c, req.body?.moves)),
  );
}
