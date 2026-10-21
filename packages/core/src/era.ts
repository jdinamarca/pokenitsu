// The series (era) of an expansion, always in English: "Scarlet & Violet", "Sword & Shield"…
// International sets bring it; Japanese and Chinese ones have it in Japanese, or not at all (deduced from the printed code).

export interface SetLike {
  id: string;
  source: string;
  series?: string | null;
  code?: string | null;
}

export const ERA_ALIAS: Record<string, string> = {
  MEGA: 'Mega Evolution',
  'ポケモンカードゲーム MEGA': 'Mega Evolution',
  'ポケモンカードゲーム スカーレット&バイオレット': 'Scarlet & Violet',
  剣と盾: 'Sword & Shield',
  // the Chinese expansions' (expansiones-chinas-en-cargar), with & or ＆
  '朱&紫': 'Scarlet & Violet',
  '朱＆紫': 'Scarlet & Violet',
  '剑&盾': 'Sword & Shield',
  '劍&盾': 'Sword & Shield',
  '劍＆盾': 'Sword & Shield',
  '太阳&月亮': 'Sun & Moon',
  '太陽&月亮': 'Sun & Moon',
  'サン＆ムーン': 'Sun & Moon',
  'XY BREAK': 'XY',
  'Diamond, Pearl and Platinum (DPt)': 'Diamond & Pearl',
  'Black & White Promos': 'Black & White',
  LEGEND: 'HeartGold & SoulSilver',
  ADV: 'EX',
  'Advanced (ADV)': 'EX',
  PCG: 'EX',
  'Pokémon Card Game (PCG)': 'EX',
  ポケモンカードe: 'E-Card',
  'ポケモンカード★neo': 'Neo',
  ポケットモンスターカードゲーム: 'Base',
};
export const ERA_CODE: ReadonlyArray<readonly [RegExp, string]> = [
  [/^CSV|^CBB/i, 'Scarlet & Violet'],
  [/^CSM/i, 'Sun & Moon'],
  [/^CS\d/i, 'Sword & Shield'],
  [/^SV/i, 'Scarlet & Violet'],
  [/^SM/i, 'Sun & Moon'],
  [/^S\d|^S[A-Z]?\d/i, 'Sword & Shield'],
  [/^(XY|CP)/i, 'XY'],
  [/^BW/i, 'Black & White'],
  [/^M\d|^MC|^MBG|^MBD/i, 'Mega Evolution'],
  [/^L/i, 'HeartGold & SoulSilver'],
  [/^(DP|Pt)/i, 'Diamond & Pearl'],
  [/^(PCG|ADV)/i, 'EX'],
  [/^(E\d|VS|web)/i, 'E-Card'],
  [/^neo/i, 'Neo'],
  [/^PMCG/i, 'Base'],
];

export function eraOf(s: SetLike | null | undefined): string {
  if (!s) return '';
  if (s.source === 'ptcg') return s.series || '';
  if (s.series && (ERA_ALIAS[s.series] || /^[\x00-\x7F]+$/.test(s.series))) return ERA_ALIAS[s.series] || s.series;
  const c = s.code || String(s.id).replace(/^(ja|pc)-(jpn_|scn_)?/, '');
  const hit = ERA_CODE.find(([re]) => re.test(c));
  return hit ? hit[1] : s.series || '';
}
