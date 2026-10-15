// What the screen derives from the Full: labels, the permission sticker of each printing, shelves and pictures
import { normNumber, variantLabel, type ArmaRules, type RuleId } from '@pokenitsu/core';
import type { Copy, Permission, Printing, Source } from './api.ts';

export const LANG_NAME: Record<string, string> = {
  EN: 'Inglés',
  ES: 'Español',
  'ES-MX': 'Español (Latam)',
  FR: 'Francés',
  DE: 'Alemán',
  IT: 'Italiano',
  PT: 'Portugués',
  'PT-BR': 'Portugués (Brasil)',
  JA: 'Japonés',
  'ZH-TW': 'Chino tradicional',
  'ZH-CN': 'Chino simplificado',
  KO: 'Coreano',
  TH: 'Tailandés',
  ID: 'Indonesio',
};
const LANG_ORDER = ['EN', 'ES', 'ES-MX', 'FR', 'DE', 'IT', 'PT', 'PT-BR', 'JA', 'ZH-TW', 'ZH-CN', 'KO', 'TH', 'ID'];
const FINISH_ORDER = ['normal', 'holo', 'cosmos', 'reverse', 'reversecosmos', 'pokeball', 'masterball'];

export const RULES: { id: RuleId; label: string; hint: string }[] = [
  { id: 'onlyEnglish', label: 'Mismo diseño en EE. UU., Latam y Europa: solo inglés', hint: 'Compara solo idiomas occidentales' },
  { id: 'asiaAsJapanese', label: 'Asiáticas traducidas cuentan como la japonesa', hint: 'Chino, coreano, tailandés e indonesio' },
  { id: 'stampsAndDecks', label: 'Incluir sellos, productos y mazos', hint: 'La 1st Edition siempre cuenta' },
  { id: 'wcd', label: 'Incluir World Championship Decks', hint: 'Reverso dorado y firma del jugador' },
  { id: 'jumbo', label: 'Incluir jumbo', hint: 'Cartas de tamaño gigante' },
];
// a rule ON for these two takes printings out; for the rest, OFF does
export const REDUCES = (id: RuleId, rules: ArmaRules) => (id === 'onlyEnglish' || id === 'asiaAsJapanese' ? rules[id] : !rules[id]);

export const STICKER: Record<Permission, { label: string; tone: string }> = {
  ok: { label: 'Con permiso', tone: 's-ok' },
  text_only: { label: 'Con permiso, solo texto', tone: 's-ok' },
  review: { label: 'Licencia por revisar', tone: 's-review' },
  none: { label: 'Sin permiso', tone: 's-none' },
  own: { label: 'Dato propio', tone: 's-own' },
  local: { label: 'Solo uso local', tone: 's-local' },
};
const RANK: Permission[] = ['ok', 'text_only', 'own', 'review', 'local', 'none'];

/** the best permission among the sources that say a printing exists: what it would take to keep it in production */
export function existsPermission(p: Printing, sources: Map<string, Source>): Permission {
  const ps = (p.facts.exists || []).map(f => sources.get(f.source)?.permission).filter((x): x is Permission => !!x);
  return RANK.find(r => ps.includes(r)) || 'none';
}

export interface Picture {
  src: string;
  /** a photo for local use only (fotos-solo-local): shown with the violet mark */
  local: boolean;
  source: string;
}
/** a picture only from a source allowed to show it: our own copy first, then TCGdex;
 *  a photo for local use only just when there is none of those */
export function pictureOf(p: Printing, sources: Map<string, Source>): Picture | null {
  const imgs = (p.facts.image || []).filter(f => f.value && sources.get(f.source)?.images);
  const allowed = imgs.filter(f => sources.get(f.source)?.permission !== 'local');
  const f = allowed.find(f => f.value!.startsWith('/img/')) || allowed[0] || imgs[0];
  return f
    ? { src: f.value!, local: sources.get(f.source)?.permission === 'local', source: sources.get(f.source)?.name || f.source }
    : null;
}

// the design's picture: one allowed to be shown if any printing has it, a local-only one otherwise
function designPicture(ps: Printing[], sources: Map<string, Source>): Picture | null {
  const pics = ps.map(p => pictureOf(p, sources)).filter((x): x is Picture => !!x);
  return pics.find(x => !x.local) || pics[0] || null;
}

export const variantName = (p: Printing): string => {
  const pc = p.facts.variant?.find(f => f.source === 'pokecottage')?.value;
  return p.stamp && pc && !/^(standard|holo|reverse holo)$/i.test(pc) ? pc : variantLabel({ finish: p.finish, stamp: p.stamp });
};
export const tagOf = (p: Printing) => `${p.lang} · ${variantName(p)}`;

export interface Shelf {
  id: string;
  title: string;
  subtitle: string;
  printings: Printing[];
  /** the picture of a printing's design, to show the same artwork on printings with none of their own */
  fallback: (p: Printing) => Picture | null;
}
/** one shelf per design (an artwork and its printings in every language), oldest first */
export function shelvesOf(printings: Printing[], sources: Map<string, Source>): Shelf[] {
  const by = new Map<string, Printing[]>();
  for (const p of printings) {
    const k = p.design_id || p.code;
    by.set(k, [...(by.get(k) || []), p]);
  }
  const shelves = [...by.entries()].map(([id, ps]) => {
    ps.sort(
      (a, b) =>
        LANG_ORDER.indexOf(a.lang) - LANG_ORDER.indexOf(b.lang) ||
        a.set_key.localeCompare(b.set_key) ||
        FINISH_ORDER.indexOf(a.finish) - FINISH_ORDER.indexOf(b.finish) ||
        (a.stamp || '').localeCompare(b.stamp || ''),
    );
    const lead = ps.find(p => p.lang === 'EN') || ps[0]!;
    const date =
      ps
        .map(p => p.design_date || p.release)
        .filter(Boolean)
        .sort()[0] || '';
    return {
      id,
      date,
      title: `${lead.set_name || lead.set_key} · #${lead.number}`,
      subtitle: [lead.artist, date.slice(0, 4)].filter(Boolean).join(' · '),
      printings: ps,
      fallback: (
        pic => () =>
          pic
      )(designPicture(ps, sources)),
    };
  });
  return shelves.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));
}

export const copiesByCode = (copies: Copy[]) => {
  const m = new Map<string, Copy[]>();
  for (const c of copies) m.set(c.code, [...(m.get(c.code) || []), c]);
  return m;
};

// ---------- by expansion (vitrina-por-expansion) ----------
export type Order = 'design' | 'set';
const WEST = new Set(['EN', 'ES', 'ES-MX', 'FR', 'DE', 'IT', 'PT', 'PT-BR']);
export const REGION: Record<string, string> = {
  JA: 'Japón',
  'ZH-CN': 'China simplificado',
  'ZH-TW': 'China tradicional',
  KO: 'Corea',
  TH: 'Tailandia',
  ID: 'Indonesia',
};
export const regionOf = (lang: string) => (WEST.has(lang) ? 'Internacional' : REGION[lang] || lang);
const REGION_ORDER = ['Japón', 'Internacional', 'China simplificado', 'China tradicional', 'Corea', 'Tailandia', 'Indonesia'];

/** the expansion a printing belongs to: Western languages share the international set; the Chinese, Thai, Indonesian
 *  or Korean printings of a Japanese set are an expansion of their own */
export const expansionOf = (p: Pick<Printing, 'set_key' | 'lang'>) =>
  p.set_key.startsWith('ja-') && p.lang !== 'JA' ? `${p.set_key}|${p.lang}` : p.set_key;

const day = (d: string | null | undefined) => (d ? d.slice(0, 10) : null);
const byNumber = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

/** one shelf per expansion, on a single timeline of release dates across regions; undated ones last */
export function shelvesBySet(printings: Printing[], sources: Map<string, Source>): Shelf[] {
  const designPic = new Map<string, Picture | null>();
  for (const s of shelvesOf(printings, sources)) for (const p of s.printings) designPic.set(p.code, s.fallback(p));
  const by = new Map<string, Printing[]>();
  for (const p of printings) by.set(expansionOf(p), [...(by.get(expansionOf(p)) || []), p]);
  const own = (ps: Printing[]) =>
    ps
      .map(p => day(p.release))
      .filter(Boolean)
      .sort()[0] || null;
  // the Japanese set's date, for the translated ones with none of their own
  const japanese = new Map<string, string | null>();
  for (const [k, ps] of by) if (ps[0]!.lang === 'JA') japanese.set(k, own(ps));
  const shelves = [...by.entries()].map(([id, ps]) => {
    const lead = ps[0]!;
    const region = regionOf(lead.lang);
    const date = own(ps) || (id.includes('|') ? japanese.get(lead.set_key) : null) || day(lead.set_release) || null;
    const local = lead.set_name_local || lead.set_name || lead.set_key;
    const title =
      region === 'Internacional'
        ? lead.set_name || local
        : region === 'Japón' && lead.set_name && lead.set_name !== local
          ? `${local} · ${lead.set_name}`
          : local;
    ps.sort(
      (a, b) =>
        byNumber(normNumber(a.number), normNumber(b.number)) ||
        LANG_ORDER.indexOf(a.lang) - LANG_ORDER.indexOf(b.lang) ||
        FINISH_ORDER.indexOf(a.finish) - FINISH_ORDER.indexOf(b.finish) ||
        (a.stamp || '').localeCompare(b.stamp || ''),
    );
    return {
      id,
      date,
      region,
      title,
      subtitle: `${region} · ${date ? date.slice(0, 7) : 'Fecha por confirmar'}`,
      printings: ps,
      fallback: (p: Printing) => designPic.get(p.code) ?? null,
    };
  });
  return shelves.sort(
    (a, b) =>
      (a.date || '9999').localeCompare(b.date || '9999') ||
      REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region) ||
      a.title.localeCompare(b.title),
  );
}
