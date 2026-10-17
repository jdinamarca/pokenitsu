// Limitless TCG's file for a Japanese card (fotos-solo-local-en-catalogo): its set code, with the promos under their own
// code (SV-P → SVP), and the number without leading zeros (S8b_1, not S8b_001), as its CDN names them
import { normNumber } from '@pokenitsu/core';

const PROMO: Record<string, string> = { 'SV-P': 'SVP', 'M-P': 'MP', 'SM-P': 'SMP', 'S-P': 'SP', 'XY-P': 'XYP', 'BW-P': 'BWP' };

/** set + number → { code, n } for a Japanese set (ja-…) and a number of digits only; null otherwise */
export function limitlessFile(setKey: string, number: string): { code: string; n: string } | null {
  if (!setKey.startsWith('ja-')) return null;
  const n = normNumber(number);
  if (!/^\d+$/.test(n)) return null;
  const set = setKey.slice(3);
  // a set code only ever has letters, digits and dashes: it becomes a folder and a file name
  if (!/^[A-Za-z0-9-]+$/.test(set)) return null;
  return { code: PROMO[set] || set, n };
}
export const limitlessUrl = (f: { code: string; n: string }) =>
  `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/${f.code}/${f.code}_${f.n}_R_JP_LG.png`;
