// Cameos: cards where a Pokémon appears without being the card's subject (the Natu on Legendary Treasures Bouffalant…).
// Source: RotomAmiti's Cameo Pokémon Card Database, a public Google Sheet with one tab per generation
// (columns: Ndex, Cameo Pokémon, Card name, Set, #, Notes; Ndex and name only on each Pokémon's first row).
// Each import downloads every tab first and only then replaces the table, so a failed download keeps the old data.
import { pool, tx } from './db.js';

const SHEET = '18nIkOgqQrHZTz0TrH_gL1e1nL1RcHiCmPF5finAjToY';
export const CAMEO_SOURCE = { name: "RotomAmiti's Cameo Pokémon Card Database", url: `https://docs.google.com/spreadsheets/d/${SHEET}` };
// Gen 1 … Gen 9 (the welcome and trainers tabs are left out)
const TABS = ['0', '2112540589', '1642805847', '623394955', '907311085', '1750206679', '2096460131', '692781906', '1784063283'];
const HEADER = ['Ndex', 'Cameo Pokémon', 'Card name', 'Set', '#', 'Notes'];

// RFC 4180 CSV (quoted fields, "" escapes, newlines inside quotes)
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
async function downloadTab(gid) {
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${gid}`, { redirect: 'follow' });
  if (!r.ok) throw new Error(`pestaña ${gid}: HTTP ${r.status}`);
  const rows = parseCsv(await r.text());
  const head = (rows[0] || []).map(s => s.trim());
  if (HEADER.some((h, i) => head[i] !== h)) throw new Error(`pestaña ${gid}: la planilla cambió de formato (${head.slice(0, 6).join(', ')})`);
  const out = []; let dex = null, species = null;
  for (const r of rows.slice(1)) {
    if (r[0] && r[0].trim() && /^\d+$/.test(r[0].trim())) dex = +r[0].trim();
    if (r[1] && r[1].trim()) species = r[1].trim();
    const card = (r[2] || '').trim();
    if (!card || !dex) continue;
    out.push({ dex, species, card, set: (r[3] || '').trim(), num: (r[4] || '').trim(), note: (r[5] || '').trim() });
  }
  return out;
}

// the sheet's set names that differ from the catalog's
const SET_ALIAS = {
  'wizards promos': 'basep', 'xy promos': 'xyp', 'sm promos': 'smp', 'swsh promos': 'swshp', 'sv promos': 'svp', 'bw promos': 'bwp',
  'dp promos': 'dpp', 'hgss promos': 'hsp', 'nintendo promos': 'np', '151': 'sv3pt5', 'expedition': 'ecard1', 'undaunted': 'hgss3',
  'unleashed': 'hgss2', 'triumphant': 'hgss4', 'base set': 'base1', 'twlight masquerade': 'sv6',
};
// promo numbers are printed with a prefix in the catalog (176 → XY176)
const PROMO_PREFIX = { xyp: 'XY', smp: 'SM', swshp: 'SWSH', bwp: 'BW', dpp: 'DP', hsp: 'HGSS', svp: 'SVP' };
// Shiny Vault subsets live in their own catalog expansion
const SHINY_VAULT = { swsh45: 'swsh45sv', sm115: 'sma' };
const normNum = n => String(n).trim().toUpperCase().replace(/^([A-Z]*)0+(?=\d)/, '$1');

async function catalogIndex() {
  const [{ rows: sets }, { rows: cards }] = await Promise.all([
    pool.query("SELECT id, lower(name) AS name FROM sets WHERE source = 'ptcg'"),
    pool.query("SELECT c.id, c.set_id, c.number FROM cards c JOIN sets s ON s.id = c.set_id WHERE s.source = 'ptcg'"),
  ]);
  const byName = new Map(sets.map(s => [s.name, s.id]));
  const card = new Map(cards.map(c => [c.set_id + '|' + normNum(c.number), c.id]));
  return { byName, card };
}
export function matchCameo(c, ix) {
  const k = c.set.toLowerCase(), sid = SET_ALIAS[k] || ix.byName.get(k);
  if (!sid) return null;
  const n = normNum(c.num), cands = [[sid, n]];
  if (PROMO_PREFIX[sid]) cands.push([sid, PROMO_PREFIX[sid] + n]);
  const sub = n.match(/^(GG|TG)\d+$/); if (sub) cands.push([sid + sub[1].toLowerCase(), n]);
  if (n.startsWith('SV') && SHINY_VAULT[sid]) cands.push([SHINY_VAULT[sid], n]);
  for (const [s, nn] of cands) { const id = ix.card.get(s + '|' + nn); if (id) return id; }
  return null;
}

let job = null;
export const cameosJob = () => job;
export async function syncCameos() {
  if (job?.running) return job;
  job = { running: true, tabs: 0 };
  try {
    const all = [];
    for (const gid of TABS) { all.push(...await downloadTab(gid)); job.tabs++; }
    if (all.length < 1000) throw new Error(`la planilla trajo muy pocos cameos (${all.length})`);
    const ix = await catalogIndex();
    let matched = 0;
    await tx(async c => {
      await c.query('DELETE FROM cameo_refs');
      for (let i = 0; i < all.length; i += 500) {
        const part = all.slice(i, i + 500), vals = [], args = [];
        for (const x of part) {
          const id = matchCameo(x, ix); if (id) matched++;
          args.push(x.dex, x.species, x.card, x.set, x.num, x.note, id);
          const b = args.length - 7;
          vals.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7})`);
        }
        await c.query(`INSERT INTO cameo_refs (dex, species, card_name, set_name, number, note, card_id) VALUES ${vals.join(', ')}`, args);
      }
    });
    Object.assign(job, { running: false, total: all.length, matched, species: new Set(all.map(x => x.dex)).size, at: new Date().toISOString() });
  } catch (e) { Object.assign(job, { running: false, error: e.message }); }
  return job;
}
