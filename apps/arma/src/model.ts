// What the screen derives from the Full: labels, the permission sticker of each printing, shelves and pictures
import { variantLabel, type ArmaRules, type RuleId } from '@pokenitsu/core';
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
};
const RANK: Permission[] = ['ok', 'text_only', 'own', 'review', 'none'];

/** the best permission among the sources that say a printing exists: what it would take to keep it in production */
export function existsPermission(p: Printing, sources: Map<string, Source>): Permission {
  const ps = (p.facts.exists || []).map(f => sources.get(f.source)?.permission).filter((x): x is Permission => !!x);
  return RANK.find(r => ps.includes(r)) || 'none';
}

/** a picture only from a source allowed to show it: our own copy first, then TCGdex */
export function pictureOf(p: Printing, sources: Map<string, Source>): string | null {
  const imgs = (p.facts.image || []).filter(f => f.value && sources.get(f.source)?.images);
  return (imgs.find(f => f.value!.startsWith('/img/')) || imgs[0])?.value ?? null;
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
  /** a picture of the design, to show the same artwork on printings with none of their own */
  picture: string | null;
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
      picture: ps.map(p => pictureOf(p, sources)).find(Boolean) ?? null,
    };
  });
  return shelves.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title));
}

export const copiesByCode = (copies: Copy[]) => {
  const m = new Map<string, Copy[]>();
  for (const c of copies) m.set(c.code, [...(m.get(c.code) || []), c]);
  return m;
};
