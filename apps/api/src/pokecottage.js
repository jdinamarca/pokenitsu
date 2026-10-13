// Imports a PokeCottage master-set checklist (e.g. https://pokecottage.com/pokemon-master-sets/eevee) into a collection.
// Each checklist card is matched to our catalog so copies loaded from "Cargar" count:
//   International → pokemontcg.io card (same set id, or same release date + number)
//   Japan         → TCGdex card (same set code + number)
// Cards we can't match (trainer kits, Chinese sets…) are created in 'pokecottage' sets with the checklist's images.
import { pool, tx } from './db.js';
import { norm, ensureSetCards } from './catalog.js';

const DATA = 'https://pokecottagecdn.com/mastersets/data/';
const LANG_OF = { International: '', Japan: 'JA', China: 'ZH' };

async function fetchText(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'Mozilla/5.0 (inventario-pokemon)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return r.text();
}

// The checklist page names its data file in data-masterset="133-eevee"
async function dataKey(url) {
  const u = new URL(url);
  if (u.hostname !== 'pokecottage.com' || !u.pathname.startsWith('/pokemon-master-sets/')) throw Object.assign(new Error('Pega el link de una guía de PokeCottage: https://pokecottage.com/pokemon-master-sets/…'), { statusCode: 400 });
  const html = await fetchText(u.href);
  const m = html.match(/data-masterset="([\w-]+)"/);
  if (!m) throw new Error('No encontré la checklist en esa página');
  return m[1];
}

// inventory variant for a checklist variant: the three basic ones keep their names
export const variantSlug = id => ({ standard: 'normal', holo: 'holo', reverseholo: 'reverse' }[String(id).toLowerCase()] || String(id).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60) || 'normal');

// one entry per printed card (the checklist repeats a card once per variant)
function distinctCards(list) {
  const map = new Map();
  for (const x of list) {
    const e = map.get(x.cardId);
    // the entry id ends with the variant (133-base2-51-firstEditionDMisprint); variantId alone repeats in a few decks
    const key = x.id.startsWith(`${x.pokemonNumber}-${x.cardId}-`) ? x.id.slice(`${x.pokemonNumber}-${x.cardId}-`.length) : x.variantId;
    const v = { slug: variantSlug(key), label: x.variant, type: x.variantType, img: x.thumbnailUrl || x.imageUrl || null };
    if (e) {
      if (e.vlist.some(y => y.slug === v.slug)) continue;
      // same name for two variants (Fire Quarter Deck 1st Edition / unlimited): add the id so they can be told apart
      const twin = e.vlist.find(y => y.label === v.label);
      if (twin) v.label += ` (${v.slug === 'normal' ? 'Unlimited' : key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^first Edition/i, '1st Edition')})`;
      e.vlist.push(v); e.variants.push(v.label); continue;
    }
    map.set(x.cardId, { ...x, variants: [x.variant], vlist: [v] });
  }
  return [...map.values()];
}

const numOf = x => String(x.cardNumber).split('/')[0].replace(/^#/, '');

async function matchIntl(c, x) {
  const num = numOf(x);
  const { rows } = await c.query(
    `SELECT c.id FROM cards c JOIN sets s ON s.id = c.set_id
     WHERE s.source = 'ptcg' AND c.number_norm = $3 AND (s.id = $1 OR s.release_date = $2::date)
     ORDER BY (s.id = $1) DESC, (c.name ILIKE '%' || $4 || '%') DESC LIMIT 1`,
    [x.set.id, x.set.releaseDate || null, norm(num), x.pokemonName]);
  return rows[0]?.id || null;
}

// PokeCottage → TCGdex set codes when they differ (jpn_b02 → PMCG2, jpn_ecard2 → E2, jpn_svp → SV-P…)
function jaCode(id) {
  const code = id.replace(/^jpn_/, '');
  let m;
  if ((m = code.match(/^b0(\d)$/))) return 'PMCG' + m[1];
  if ((m = code.match(/^ecard(\d)$/))) return 'E' + m[1];
  return { svp: 'SV-P', mp: 'M-P', 'sm1+': 'SM1p', 'sm4+': 'SM4p' }[code] || code;
}
// ---------- photos of Japanese cards (TCGdex has none for most old ones) ----------
// Only when POKECOTTAGE_IMAGES=on: PokeCottage's terms allow personal use; other installations need their permission.
export const pcImagesOn = () => String(process.env.POKECOTTAGE_IMAGES || '').toLowerCase() === 'on';
// PokeCottage set → TCGdex code where jaCode() is not enough
const PC_TO_TCGDEX = { xy1x: 'XY1a', xy1y: 'XY1b', xy5g: 'XY5a', xy8r: 'XY8b', xy11c: 'XY11b', xypc: 'CP4', xypk: 'CP3', xyls: 'CP2', xyml: 'CP5', xyep: 'CP6', l1hg: 'L1a', l1ss: 'L1b', lll: 'LL', versus1: 'VS1', sm0p: 'SM0' };
const tcgdexCode = id => PC_TO_TCGDEX[id.replace(/^jpn_/, '')] || jaCode(id);
// checklist file of a species: 23-ekans, 122-mr-mime, 29-nidoran-female, 83-farfetchd
export const speciesKey = (dex, name) => `${dex}-${String(name).replace(/♀/g, ' female').replace(/♂/g, ' male').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/['’.:]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

// Fills the photos of Japanese cards without an image in a set, one PokeCottage checklist per species (each one fills every Japanese set)
export async function fillJaImages(setId) {
  if (!pcImagesOn()) return { enabled: false, filled: 0, asked: 0 };
  const { rows: todo } = await pool.query(
    `SELECT DISTINCT c.dex[1] AS dex FROM cards c JOIN sets s ON s.id = c.set_id
     WHERE c.set_id = $1 AND s.source = 'tcgdex-ja' AND c.image_small IS NULL AND cardinality(c.dex) = 1
       AND NOT EXISTS (SELECT 1 FROM pokecottage_checks k WHERE k.dex = c.dex[1] AND k.checked_at > now() - interval '30 days')`, [setId]);
  if (!todo.length) return { enabled: true, filled: 0, asked: 0 };
  // the species' English name, as on international cards (the same pick as /api/dex)
  const { rows: names } = await pool.query(
    `SELECT DISTINCT ON (d) d AS dex, c.name FROM cards c JOIN sets s ON s.id = c.set_id, unnest(c.dex) d
     WHERE s.source = 'ptcg' AND c.supertype = 'Pokémon' AND cardinality(c.dex) = 1 AND d = ANY($1::int[])
     ORDER BY d, (position(' ' in c.name) = 0 OR c.name LIKE 'Nidoran%' OR c.name LIKE 'Mr. %') DESC, length(c.name)`, [todo.map(r => r.dex)]);
  let filled = 0, i = 0;
  const worker = async () => {
    while (i < names.length) {
      const { dex, name } = names[i++];
      let found = 0;
      try {
        const j = JSON.parse(await fetchText(`${DATA}${speciesKey(dex, name)}.json`));
        const ja = (Array.isArray(j) ? j : j.cards || []).filter(x => x.region === 'Japan' && x.set?.id && (x.imageUrl || x.thumbnailUrl));
        if (ja.length) {
          const r = await pool.query(
            `UPDATE cards c SET image_small = v.small, image_large = v.large
             FROM sets s, unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS v(code, num, small, large)
             WHERE s.id = c.set_id AND s.source = 'tcgdex-ja' AND lower(s.code) = lower(v.code) AND c.number_norm = v.num
               AND c.image_small IS NULL AND $5 = ANY(c.dex)`,
            [ja.map(x => tcgdexCode(x.set.id)), ja.map(x => norm(numOf(x))), ja.map(x => x.thumbnailUrl || x.imageUrl), ja.map(x => x.imageUrl || x.thumbnailUrl), dex]);
          found = r.rowCount;
        }
      } catch (e) {
        if (!/HTTP 404/.test(e.message)) { console.warn(`fotos de PokeCottage (${dex}):`, e.message); continue; }
      }
      filled += found;
      await pool.query('INSERT INTO pokecottage_checks (dex, found) VALUES ($1, $2) ON CONFLICT (dex) DO UPDATE SET checked_at = now(), found = $2', [dex, found]);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { enabled: true, filled, asked: names.length };
}

async function matchJa(c, x) {
  const code = jaCode(x.set.id);
  const { rows: sets } = await c.query("SELECT id FROM sets WHERE source = 'tcgdex-ja' AND lower(code) = lower($1)", [code]);
  if (!sets.length) return null;
  await ensureSetCards(sets[0].id).catch(() => {});
  const { rows } = await c.query('SELECT id FROM cards WHERE set_id = $1 AND number_norm = $2', [sets[0].id, norm(numOf(x))]);
  return rows[0]?.id || null;
}

async function createCard(c, x, dexNum, isMain, sharedNumber) {
  const lang = LANG_OF[x.region] ?? '';
  const setId = 'pc-' + x.set.id;
  await c.query(
    `INSERT INTO sets (id, name, series, code, release_date, printed_total, source, lang, cards_synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pokecottage', $7, now())
     ON CONFLICT (id) DO UPDATE SET name = $2, series = $3, release_date = coalesce(sets.release_date, $5)`,
    [setId, x.set.name, x.set.series || null, x.set.id.replace(/^(jpn|scn)_/, '').toUpperCase(), x.set.releaseDate || null, x.set.printedTotal || null, lang]);
  // two cards with the same printed number in one set (Battle Academy decks): tell them apart by the checklist id
  const num = sharedNumber ? `${numOf(x)} (${x.cardId.split('-').pop()})` : numOf(x);
  const id = `${setId}-${num}`;
  await c.query(
    `INSERT INTO cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (set_id, number) DO UPDATE SET name = $5, artist = coalesce($8, cards.artist), image_small = $10, image_large = $11`,
    [id, setId, num, norm(num), x.name, isMain ? 'Pokémon' : null, x.rarity || null, x.artist?.name || null,
     isMain ? [dexNum] : [], x.thumbnailUrl || x.imageUrl || null, x.imageUrl || null]);
  const { rows } = await c.query('SELECT id FROM cards WHERE set_id = $1 AND number = $2', [setId, num]);
  return rows[0].id;
}

export async function importChecklist(collectionId, url) {
  const { rows: [col] } = await pool.query('SELECT * FROM collections WHERE id = $1', [collectionId]);
  if (!col) throw Object.assign(new Error('Colección no encontrada'), { statusCode: 404 });
  const key = await dataKey(url);
  const data = JSON.parse(await fetchText(`${DATA}${key}.json`));
  const name = data.pokemon?.name || '';
  const cards = distinctCards(data.cards || []);
  const perNumber = new Map();
  for (const x of cards) { const k = x.set.id + '|' + numOf(x); perNumber.set(k, (perNumber.get(k) || 0) + 1); }
  const stats = { cards: cards.length, matched: 0, created: 0, cameos: 0, byRegion: {} };
  await tx(async c => {
    // keep the main/cameo choices I made by hand
    const { rows: prev } = await c.query('SELECT card_id, role FROM collection_cards WHERE collection_id = $1', [collectionId]);
    const manualRole = new Map(prev.map(r => [r.card_id, r.role]));
    await c.query('DELETE FROM collection_cards WHERE collection_id = $1 AND from_checklist', [collectionId]);
    for (const x of cards) {
      // the Pokémon is the protagonist when its name is on the card (Eevee, Eevee ex, Lt. Surge's Eevee…); otherwise a cameo
      const isMain = !!name && x.name.toLowerCase().includes(name.toLowerCase());
      const shared = perNumber.get(x.set.id + '|' + numOf(x)) > 1;
      let id = shared ? null : x.region === 'International' ? await matchIntl(c, x) : x.region === 'Japan' ? await matchJa(c, x) : null;
      if (id) {
        stats.matched++;
        // the catalog may lack the picture or the artist (TCGdex has many Japanese cards without image)
        await c.query(
          `UPDATE cards SET image_small = coalesce(image_small, $2), image_large = coalesce(image_large, $3), artist = coalesce(artist, $4) WHERE id = $1`,
          [id, x.thumbnailUrl || x.imageUrl || null, x.imageUrl || null, x.artist?.name || null]);
      } else { id = await createCard(c, x, data.pokemon?.number, isMain, shared); stats.created++; }
      const role = manualRole.get(id) || (isMain ? 'main' : 'cameo');
      if (role === 'cameo') stats.cameos++;
      stats.byRegion[x.region] = (stats.byRegion[x.region] || 0) + 1;
      await c.query(
        `INSERT INTO collection_cards (collection_id, card_id, role, variants, from_checklist, name, set_name, vlist) VALUES ($1, $2, $3, $4, true, $5, $6, $7)
         ON CONFLICT (collection_id, card_id) DO UPDATE SET variants = $4, from_checklist = true, name = $5, set_name = $6, vlist = $7`,
        [collectionId, id, role, x.variants, x.name, x.set.name, JSON.stringify(x.vlist)]);
      for (const v of x.vlist) await c.query('INSERT INTO variant_labels VALUES ($1, $2) ON CONFLICT DO NOTHING', [v.slug, v.label]);
    }
    await c.query('UPDATE collections SET checklist_url = $2, checklist_at = now() WHERE id = $1', [collectionId, url]);
    // checklist cards that are no longer used by anything (e.g. now matched to the catalog)
    await c.query(`DELETE FROM cards c USING sets s WHERE s.id = c.set_id AND s.source = 'pokecottage'
      AND NOT EXISTS (SELECT 1 FROM collection_cards x WHERE x.card_id = c.id) AND NOT EXISTS (SELECT 1 FROM inventory x WHERE x.card_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM inventory_log x WHERE x.card_id = c.id) AND NOT EXISTS (SELECT 1 FROM art_group_cards x WHERE x.card_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM collection_hidden x WHERE x.card_id = c.id)`);
    await c.query("DELETE FROM sets s WHERE s.source = 'pokecottage' AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id)");
  });
  return stats;
}
