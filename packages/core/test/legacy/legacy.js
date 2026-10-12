// FROZEN COPY of the rules as they were in apps/web/public/index.html (commit d2e193f) before moving them to
// @pokenitsu/core. Only used by the equivalence tests: do not edit, do not import from app code.
// eslint-disable
// @ts-nocheck
export function makeLegacy(env) {
  const setById = env.setById, meta = env.meta, priceOf = env.priceOf, keyOf = env.keyOf; let LOCS = env.LOCS || [];
const SUFFIX = { n: 'normal', h: 'holo', r: 'reverse', e: 'firstedition', p: 'pokeballholo', m: 'masterballholo' };
const LANGS = ['ES', 'EN', 'PT', 'FR', 'DE', 'IT', 'JA', 'KO', 'ZH'];
const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const condCode = s => { s = String(s || '').trim().toUpperCase(); if (s === 'D' || s === 'DM' || s === 'DAMAGED') s = 'DMG'; if (s === 'M' || s === 'MINT') s = 'NM'; return CONDS.includes(s) ? s : null; };
const langCode = s => { s = String(s || '').trim().toUpperCase(); if (s === 'JP') s = 'JA'; if (s === 'SP') s = 'ES'; return LANGS.includes(s) ? s : null; };
const RARITY = {
  'Common': ['C', 'Común', 'r-c', 'base'], 'Uncommon': ['U', 'Poco común', 'r-c', 'base'], 'Rare': ['R', 'Rara', 'r-r', 'rare'],
  'Rare Holo': ['H', 'Rara holo', 'r-h', 'rare'], 'Promo': ['PR', 'Promo', 'r-pr', 'promo'],
  'Double Rare': ['DR', 'Doble rara', 'r-dr', 'ultra'], 'Rare Ultra': ['UR', 'Ultra rara (full art)', 'r-ur', 'ultra'], 'Ultra Rare': ['UR', 'Ultra rara (full art)', 'r-ur', 'ultra'],
  'Illustration Rare': ['IR', 'Ilustración rara', 'r-ir', 'ir'], 'Special Illustration Rare': ['SIR', 'Ilustración rara especial', 'r-sir', 'sir'],
  'Hyper Rare': ['HR', 'Hiper rara (dorada)', 'r-hr', 'secret'], 'Mega Hyper Rare': ['MHR', 'Mega hiper rara', 'r-hr', 'secret'],
  'Rare Secret': ['SR', 'Secreta', 'r-hr', 'secret'], 'Rare Rainbow': ['RB', 'Arcoíris', 'r-rb', 'secret'],
  'ACE SPEC Rare': ['ACE', 'AS Táctico', 'r-ace', 'ultra'], 'Rare ACE': ['ACE', 'AS Táctico', 'r-ace', 'ultra'],
  'Rare Holo EX': ['H', 'Rara holo EX', 'r-h', 'rare'], 'Rare Holo GX': ['H', 'Rara holo GX', 'r-h', 'rare'], 'Rare Holo V': ['H', 'Rara holo V', 'r-h', 'rare'],
  'Rare Holo VMAX': ['H', 'Rara holo VMAX', 'r-h', 'rare'], 'Rare Holo VSTAR': ['H', 'Rara holo VSTAR', 'r-h', 'rare'], 'Rare Holo LV.X': ['H', 'Rara holo LV.X', 'r-h', 'rare'],
  'Rare BREAK': ['BRK', 'Rara BREAK', 'r-h', 'rare'], 'Rare Prism Star': ['◇', 'Prisma', 'r-h', 'rare'], 'Rare Prime': ['PRM', 'Prime', 'r-h', 'rare'],
  'Rare Holo Star': ['★', 'Estrella', 'r-hr', 'secret'], 'LEGEND': ['LGD', 'LEYENDA', 'r-h', 'rare'], 'Rare Shining': ['SHN', 'Brillante', 'r-sh', 'shiny'],
  'Rare Shiny': ['S', 'Variocolor', 'r-sh', 'shiny'], 'Shiny Rare': ['S', 'Variocolor', 'r-sh', 'shiny'], 'Rare Shiny GX': ['S', 'Variocolor GX', 'r-sh', 'shiny'],
  'Shiny Ultra Rare': ['SSR', 'Variocolor ultra', 'r-sh', 'shiny'], 'Radiant Rare': ['RAD', 'Radiante', 'r-sh', 'shiny'], 'Amazing Rare': ['AR', 'Asombrosa', 'r-rb', 'secret'],
  'Trainer Gallery Rare Holo': ['TG', 'Galería de entrenador', 'r-ir', 'ir'], 'Pikachu Rare': ['PK', 'Pikachu rara', 'r-r', 'rare'],
  'MEGA_ATTACK_RARE': ['MAR', 'Mega ataque rara', 'r-ur', 'ultra'],
  'Character Rare': ['CHR', 'Character Rare (personaje)', 'r-ir', 'ir'], 'Classic Collection': ['CC', 'Classic Collection', 'r-hr', 'secret'],
  'Holo Rare V': ['H', 'Rara holo V', 'r-h', 'rare'], 'Holo Rare VMAX': ['H', 'Rara holo VMAX', 'r-h', 'rare'], 'Holo Rare VSTAR': ['H', 'Rara holo VSTAR', 'r-h', 'rare'],
  'None': ['', 'Sin rareza', 'r-c', 'base'], 'No Rarity': ['', 'Sin rareza', 'r-c', 'base'], 'Futuristic Rare': ['FR', 'Futurista', 'r-ur', 'ultra'], 'Black White Rare': ['BWR', 'Blanco y negro', 'r-hr', 'secret'],
};
const RGROUPS = [['base', 'Comunes y poco comunes'], ['rare', 'Raras y holo'], ['ultra', 'Doble rara, ultra rara, AS'], ['ir', 'IR (ilustración rara)'], ['sir', 'SIR (ilustración especial)'], ['secret', 'Hiper, secretas, arcoíris'], ['shiny', 'Variocolor y radiantes'], ['promo', 'Promos'], ['mech', 'Con mecánica (ex, GX, V…)']];
const RARITY_LC = Object.fromEntries(Object.entries(RARITY).map(([k, v]) => [k.toLowerCase(), v]));
const rarityOf = r => RARITY[r] || RARITY_LC[String(r || '').toLowerCase()] || (r ? [r.split(/\s+/).map(w => w[0]).join('').toUpperCase(), r, 'r-r', 'rare'] : null);
function mechOf(name) {
  const n = name || '';
  if (/\bVMAX\b/.test(n)) return 'VMAX';
  if (/\bVSTAR\b/.test(n)) return 'VSTAR';
  if (/\bV-UNION\b/.test(n)) return 'V-UNION';
  if (/([- ]|[^\x00-\x7F])GX\b/.test(n)) return n.includes('&') ? 'TAG TEAM' : 'GX';
  if (/(-|[^\x00-\x7F])EX\b/.test(n)) return 'EX';
  if (/( |[^\x00-\x7F])ex\b/.test(n)) return 'ex';
  if (/(^|[^A-Za-z])V$/.test(n)) return 'V';
  if (/\bBREAK\b/.test(n)) return 'BREAK';
  if (/LV\.X/.test(n)) return 'LV.X';
  if (/◇|\{\*\}/.test(n)) return 'Prisma';
  if (/★|\bStar\b/.test(n)) return '★';
  if (/^Radiant /.test(n)) return 'Radiante';
  if (/^(M|Mega) /.test(n)) return 'Mega';
  return '';
}
const rgroupOf = rarity => { const r = rarityOf(rarity); return r ? r[3] : 'base'; };
const rarityMatch = (f, rarity, name) => !f || (f === 'mech' ? !!mechOf(name) : rgroupOf(rarity) === f);
const norm = s => String(s).trim().toUpperCase().replace(/^([A-Z]*)0+(?=\d)/, '$1');
function parseUsd(a) {
  a = a.replace(/[^\d.,]/g, '');
  if (!a) return null;
  const m = a.match(/^(.*)[.,](\d{1,2})$/);
  const n = m ? Number(m[1].replace(/[.,]/g, '') + '.' + m[2]) : Number(a.replace(/[.,]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
// my own prices: when I set or confirmed them; stale after cfg.ownDays (7 by default)
const ERA_ALIAS = { 'MEGA': 'Mega Evolution', 'ポケモンカードゲーム MEGA': 'Mega Evolution', 'ポケモンカードゲーム スカーレット&バイオレット': 'Scarlet & Violet', '剣と盾': 'Sword & Shield',
  'サン＆ムーン': 'Sun & Moon', 'XY BREAK': 'XY', 'Diamond, Pearl and Platinum (DPt)': 'Diamond & Pearl', 'Black & White Promos': 'Black & White', 'LEGEND': 'HeartGold & SoulSilver',
  'ADV': 'EX', 'Advanced (ADV)': 'EX', 'PCG': 'EX', 'Pokémon Card Game (PCG)': 'EX', 'ポケモンカードe': 'E-Card', 'ポケモンカード★neo': 'Neo', 'ポケットモンスターカードゲーム': 'Base' };
const ERA_CODE = [[/^CSV|^CBB/i, 'Scarlet & Violet'], [/^CSM/i, 'Sun & Moon'], [/^CS\d/i, 'Sword & Shield'], [/^SV/i, 'Scarlet & Violet'], [/^SM/i, 'Sun & Moon'], [/^S\d|^S[A-Z]?\d/i, 'Sword & Shield'], [/^(XY|CP)/i, 'XY'], [/^BW/i, 'Black & White'], [/^M\d|^MC|^MBG|^MBD/i, 'Mega Evolution'],
  [/^L/i, 'HeartGold & SoulSilver'], [/^(DP|Pt)/i, 'Diamond & Pearl'], [/^(PCG|ADV)/i, 'EX'], [/^(E\d|VS|web)/i, 'E-Card'], [/^neo/i, 'Neo'], [/^PMCG/i, 'Base']];
function eraOf(s) {
  if (!s) return '';
  if (s.source === 'ptcg') return s.series || '';
  if (s.series && (ERA_ALIAS[s.series] || /^[\x00-\x7F]+$/.test(s.series))) return ERA_ALIAS[s.series] || s.series;
  const c = s.code || String(s.id).replace(/^(ja|pc)-(jpn_|scn_)?/, '');
  const hit = ERA_CODE.find(([re]) => re.test(c));
  return hit ? hit[1] : s.series || '';
}
const originOf = sid => { const s = setById[sid]; return s && s.lang ? s.lang : 'INT'; };
function locMatches(l, sid, num, v, cond, personal) {
  const r = l.rule || {}, s = setById[sid] || {};
  if (r.auto === false) return false;
  if (r.personal === true && !personal) return false;
  if (r.personal === false && personal) return false;
  if ((r.series || r.sets) && !((r.series || []).includes(eraOf(s)) || (r.sets || []).includes(sid))) return false;
  if (r.origin && !r.origin.includes(originOf(sid))) return false;
  if (r.bulk && !isBulk(sid, num, v)) return false;
  if (r.special || r.minPrice) {
    const m = meta(sid, num) || [];
    const byRarity = (r.special || []).some(g => rarityMatch(g, m[3], m[0]));
    const pr = r.minPrice ? priceOf(keyOf(sid, num, v, '', cond)) : null;
    if (!byRarity && !(pr && pr.clp >= r.minPrice)) return false;
  }
  return true;
}
// "challa": common, uncommon, rare or rare holo, without a mechanic (ex, GX, V, VMAX…), in a plain variant (normal, holo, reverse)
const BULK_VARIANTS = ['normal', 'holo', 'reverse'];
function isBulk(sid, num, v) {
  const m = meta(sid, num) || [];
  return BULK_VARIANTS.includes(v) && ['base', 'rare'].includes(rgroupOf(m[3])) && !mechOf(m[0]);
}
// The most specific location wins, whatever its place in the list; the order only breaks ties:
// my collection (personal) > special cards / price > named expansions > named series (fewer = more specific) > bulk > region
function locScore(r = {}) {
  return (r.personal === true ? 1000 : 0) + (r.special || r.minPrice ? 500 : 0) + (r.sets ? 200 : 0)
    + (r.series ? 100 + Math.max(0, 20 - r.series.length) : 0) + (r.bulk ? 10 : 0) + (r.origin ? 5 : 0) + (r.personal === false ? 1 : 0);
}
function suggestLoc(sid, num, v, cond, personal) {
  let best = null, bs = -1;
  for (const l of LOCS) {   // LOCS is in list order: on a tie the one higher up stays
    if (!locMatches(l, sid, num, v, cond, !!personal)) continue;
    const sc = locScore(l.rule);
    if (sc > bs) { best = l; bs = sc; }
  }
  return best ? best.id : 0;
}
function parseEntry(raw) {
  let s = raw.trim(); if (!s) return null;
  // "25r lp": condition for this card only
  let cond = null; const mc = s.match(/^(.+?)\s+(nm|lp|mp|hp|dmg)$/i);
  if (mc) { s = mc[1]; cond = mc[2].toUpperCase(); }
  let sign = 1; if (s[0] === '-') { sign = -1; s = s.slice(1).trim(); }
  let qty = 1; const mq = s.match(/^(.*?)\s*[*x]\s*(\d+)$/i);
  if (mq && mq[1]) { s = mq[1]; qty = parseInt(mq[2], 10); }
  // "25 lp*2": the condition can also come before the quantity
  const mc2 = !cond && s.match(/^(.+?)\s+(nm|lp|mp|hp|dmg)$/i);
  if (mc2) { s = mc2[1]; cond = mc2[2].toUpperCase(); }
  s = s.replace(/\s+/g, '');
  let base = s, v = null; const last = s.slice(-1).toLowerCase();
  if (s.length > 1 && SUFFIX[last]) { base = s.slice(0, -1); v = SUFFIX[last]; }
  return { sign, qty, base, full: s, v, cond };
}
function autoVariant(m) {
  if (!m) return 'normal';
  const r = m[3].toLowerCase();
  return (!r || ['common', 'uncommon', 'rare', 'promo'].includes(r)) ? 'normal' : 'holo';
}
function slotVariants(sl) {
  const out = [sl.v.slug];
  if (sl.v.type === 'default' && !BULK_VARIANTS.includes(sl.v.slug) && !(sl.vlist || []).some(x => ['normal', 'holo'].includes(x.slug))) out.push('normal', 'holo');
  return out;
}
  return { SUFFIX, langCode, condCode, RARITY, rarityOf, mechOf, rgroupOf, rarityMatch, norm, parseUsd, ERA_ALIAS, ERA_CODE, eraOf, originOf, locMatches, BULK_VARIANTS, isBulk, locScore, suggestLoc, setLocs: l => { LOCS = l; }, parseEntry, autoVariant, slotVariants };
}
