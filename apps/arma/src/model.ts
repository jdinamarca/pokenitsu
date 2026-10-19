// What the screen derives from the Full: labels, the permission sticker of each printing, shelves and pictures
import { normNumber, photoShows, STAMP_LABEL, variantLabel, type ArmaRules, type RuleId, type RuleResult } from '@pokenitsu/core';
import type { Copy, FactValue, ImportSummary, Permission, Printing, Source } from './api.ts';

export const LANG_NAME: Record<string, string> = {
  EN: 'Inglés',
  NL: 'Neerlandés',
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
const LANG_ORDER = ['EN', 'NL', 'ES', 'ES-MX', 'FR', 'DE', 'IT', 'PT', 'PT-BR', 'JA', 'ZH-TW', 'ZH-CN', 'KO', 'TH', 'ID'];
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

/** the same card: set, number (074 = 74) and language; its printings are its variants */
export const cardOf = (p: Pick<Printing, 'set_key' | 'number' | 'lang'>) => `${p.set_key}|${normNumber(p.number)}|${p.lang}`;

export interface Picture {
  src: string;
  /** a photo for local use only (fotos-solo-local): shown with the violet mark */
  local: boolean;
  source: string;
  /** the photo shows another variant of the card (fotos-por-variante): "la 1st Edition", "la versión sin sello" */
  other?: string;
}

/** each photo of the Full with the variant it shows (photoShows: a mark by hand, or the automatic rule) */
export function withPhotoShows(printings: Printing[], marks: Record<string, string>): Printing[] {
  const card = cardOf;
  const holders = new Map<string, Printing[]>();
  for (const p of printings)
    for (const src of new Set((p.facts.image || []).map(f => f.value).filter(Boolean)))
      holders.set(`${card(p)}|${src}`, [...(holders.get(`${card(p)}|${src}`) || []), p]);
  return printings.map(p =>
    p.facts.image
      ? {
          ...p,
          facts: {
            ...p.facts,
            image: p.facts.image.map(f =>
              f.value ? { ...f, shows: photoShows(p, holders.get(`${card(p)}|${f.value}`) || [p], marks[f.value]) } : f,
            ),
          },
        }
      : p,
  );
}

/** "la 1st Edition", "la versión sin sello", "la Pokémon Center": the variant a photo shows, for the sheet's note */
export const showsLabel = (shows: string) => (shows ? `la ${STAMP_LABEL[shows] || shows}` : 'la versión sin sello');

/** a picture that shows the printing's own variant: your upload first, then our copy, TCGdex and the other allowed
 *  sources, and a photo for local use only after those; when none fits, another variant's photo of the same card
 *  (marked with `other`, never shown as the printing's own) */
export function pictureOf(p: Printing, sources: Map<string, Source>): Picture | null {
  const imgs = (p.facts.image || []).filter(f => f.value && sources.get(f.source)?.images);
  const perm = (f: FactValue) => sources.get(f.source)?.permission;
  const rank = (f: FactValue) => (f.source === 'own' ? 0 : f.value!.startsWith('/img/') ? 1 : perm(f) !== 'local' ? 2 : 3);
  const own = p.stamp || '';
  const best = (fs: FactValue[]) => [...fs].sort((a, b) => rank(a) - rank(b))[0];
  const f = best(imgs.filter(f => (f.shows ?? own) === own)) || best(imgs);
  if (!f) return null;
  const shows = f.shows ?? own;
  return {
    src: f.value!,
    local: perm(f) === 'local',
    source: sources.get(f.source)?.name || f.source,
    ...(shows !== own ? { other: showsLabel(shows) } : {}),
  };
}

// the design's picture: one that fits its printing and may be shown if any has it; a local-only one otherwise
function designPicture(ps: Printing[], sources: Map<string, Source>): Picture | null {
  const pics = ps.map(p => pictureOf(p, sources)).filter((x): x is Picture => !!x);
  return pics.find(x => !x.local && !x.other) || pics.find(x => !x.other) || pics[0] || null;
}

export const variantName = (p: Printing): string => {
  // a Battle Academy card only Bulbapedia's lists bring is named by them: "Battle Academy 2020 · Mazo Mewtwo"
  const named = (src: string) => p.facts.variant?.find(f => f.source === src)?.value;
  const pc = named('pokecottage') ?? named('bulbapedia-mazos');
  if (p.stamp && pc && !/^(standard|holo|reverse holo)$/i.test(pc)) return pc;
  // the EX era's reverse holo, which a source calls by its expansion's logo (reverse-con-sello-ex)
  const logo =
    !p.stamp && p.finish === 'reverse' && p.facts.variant?.some(f => /^(expansion stamp|sello de la expansión)$/i.test(f.value || ''));
  return logo ? variantLabel({ finish: 'reverse', stamp: 'set-logo' }) : variantLabel({ finish: p.finish, stamp: p.stamp });
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
    // a promo series' opening date is not the card's (Radiant Eevee SWSH230 has swshp's 2019): the other printings' date
    // first, then that one, then the design's (fecha-real-de-las-promos)
    const dates = ps.map(p => day(p.release)).filter((d): d is string => !!d);
    const real = ps
      .filter(p => p.release && !(/promo/i.test(p.set_name || '') && day(p.release) === day(p.set_release)))
      .map(p => day(p.release)!);
    const date =
      real.sort()[0] ||
      dates.sort()[0] ||
      day(
        ps
          .map(p => p.design_date)
          .filter(Boolean)
          .sort()[0],
      ) ||
      '';
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
const WEST = new Set(['EN', 'NL', 'ES', 'ES-MX', 'FR', 'DE', 'IT', 'PT', 'PT-BR']);
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

// ---------- what you have and what you miss (eevee-lo-que-tienes) ----------
export type Ownership = {
  /** the printings the rules leave visible, and how many of them you have */
  visible: { total: number; have: number };
  /** per rule, the printings it leaves out, and how many of those you have */
  hidden: Partial<Record<RuleId, { total: number; have: number }>>;
};
/** Counts by exact printing: a copy in another language of the same equivalence never counts for this one */
export function ownership(printings: Pick<Printing, 'code'>[], result: Map<string, RuleResult>, owned: Map<string, Copy[]>): Ownership {
  const out: Ownership = { visible: { total: 0, have: 0 }, hidden: {} };
  for (const p of printings) {
    const r = result.get(p.code);
    const have = (owned.get(p.code) || []).some(c => c.qty > 0) ? 1 : 0;
    if (!r || r.in) {
      out.visible.total++;
      out.visible.have += have;
    } else if (r.by) {
      const h = (out.hidden[r.by] ||= { total: 0, have: 0 });
      h.total++;
      h.have += have;
    }
  }
  return out;
}
export type Seeing = 'all' | 'have' | 'miss';
/** "Todas · Las que tengo · Me faltan" */
export const keepFor = (seeing: Seeing, have: boolean) => seeing === 'all' || (seeing === 'have' ? have : !have);

/** the rail's note after bringing a Full again (volver-a-traer-el-full): what changed, and the sources that didn't answer */
export function importLines(species: string, r: ImportSummary, sources: Map<string, Source>): string[] {
  const n = (x: number) => x.toLocaleString('es-CL');
  const lines = [
    `Full de ${species} actualizado: ${n(r.printings)} ${r.printings === 1 ? 'impresión' : 'impresiones'} · +${n(r.added || 0)} ${
      r.added === 1 ? 'nueva' : 'nuevas'
    } · −${n(r.removed || 0)} ${r.removed === 1 ? 'quitada' : 'quitadas'}`,
  ];
  if (r.carried) lines.push(`${n(r.carried)} ${r.carried === 1 ? 'foto local traspasada' : 'fotos locales traspasadas'}`);
  for (const [id, s] of Object.entries(r.sources || {}))
    if (!s.ok) lines.push(`${sources.get(id)?.name || id} no respondió: quedó lo de la última vez`);
  return lines;
}
/** "18 oct, 10:42" */
export const importedAt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
