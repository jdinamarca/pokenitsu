// Limitless TCG's file for a Japanese card (fotos-solo-local-en-catalogo): its set code, with the promos under their own
// code (SV-P → SVP), and the number without leading zeros (S8b_1, not S8b_001), as its CDN names them
import { normNumber } from '@pokenitsu/core';

export const PROMO: Record<string, string> = { 'SV-P': 'SVP', 'M-P': 'MP', 'SM-P': 'SMP', 'S-P': 'SP', 'XY-P': 'XYP', 'BW-P': 'BWP' };
/**
 * XY expansions Limitless codes otherwise (expansiones-japonesas-de-limitless), checked card by card: TCGdex's code →
 * Limitless's. XY8b and XY11b are in both, as different expansions (Limitless's XY8b is Blue Shock, TCGdex's XY8a)
 */
export const XY_CODES: Record<string, string> = {
  XY1a: 'XY1x',
  XY1b: 'XY1y',
  XY5a: 'XY5g',
  XY5b: 'XY5t',
  XY8a: 'XY8b',
  XY8b: 'XY8r',
  XY11a: 'XY11b',
  XY11b: 'XY11r',
};

/** set + number → { code, n } for a Japanese set (ja-…) and a number of digits only; null otherwise */
export function limitlessFile(setKey: string, number: string): { code: string; n: string } | null {
  if (!setKey.startsWith('ja-')) return null;
  const n = normNumber(number);
  if (!/^\d+$/.test(n)) return null;
  const set = setKey.slice(3);
  // a set code only ever has letters, digits and dashes: it becomes a folder and a file name
  if (!/^[A-Za-z0-9-]+$/.test(set)) return null;
  return { code: PROMO[set] || XY_CODES[set] || set, n };
}
export const limitlessUrl = (f: { code: string; n: string }) =>
  `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/${f.code}/${f.code}_${f.n}_R_JP_LG.png`;
