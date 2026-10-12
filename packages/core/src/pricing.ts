// Price of a card + variant + condition in CLP. Shared by the web app and the API (CSV export).

/** Market prices of a card as stored in card_prices. usd: TCGplayer printing → USD; eur: Cardmarket {trend, avg30, reverse, holo} */
export interface CardPrices {
  usd?: Record<string, number | null | undefined> | null;
  eur?: Record<string, number | null | undefined> | null;
}
export interface PriceConfig {
  source?: 'tcgplayer' | 'cardmarket' | string;
  /** multiplier per condition: { NM: 1, LP: 0.85… } */
  cond?: Record<string, number>;
}
/** CLP per USD and per EUR */
export interface Fx {
  usd: number;
  eur: number;
}
export interface PickedPrice {
  /** CLP for this condition */
  clp: number;
  /** CLP in NM */
  nm: number;
  src: 'TCGplayer' | 'Cardmarket' | 'propio';
  /** true when there was no price for this exact variant and the base card's was used */
  approx: boolean;
  /** the raw market price, e.g. "US$ 1.23" (not for own prices) */
  raw?: string;
}

// TCGplayer printings that match each variant, best first
const USD_KEYS: Record<string, string[]> = {
  normal: ['normal', 'unlimited', 'unlimitedNormal'],
  holo: ['holofoil', 'unlimitedHolofoil', 'unlimited'],
  reverse: ['reverseHolofoil'],
  firstedition: ['1stEditionHolofoil', '1stEdition', '1stEditionNormal'],
};
// when the exact printing has no price (stamps, Poké Ball…): the base card, marked as approximate
const USD_ANY = ['normal', 'holofoil', 'unlimited', 'unlimitedHolofoil', 'reverseHolofoil', '1stEditionHolofoil', '1stEdition'];
const EUR_KEYS: Record<string, string[]> = { reverse: ['reverse'], holo: ['holo', 'trend'], normal: ['trend', 'avg30'] };

interface Found {
  amount: number;
  approx: boolean;
}

function fromUsd(p: CardPrices | null | undefined, v: string): Found | null {
  const u = p && p.usd;
  if (!u) return null;
  const k = (USD_KEYS[v] || []).find(k => u[k]);
  if (k) return { amount: u[k]!, approx: false };
  const keys = Object.keys(u);
  // a card printed only one way (Wizards promo Eevee: only "holofoil") is that print, whatever the variant is called (Normal, Cosmos Holo…)
  if (keys.length === 1 && v !== 'reverse') return { amount: u[keys[0]!]!, approx: false };
  const any = USD_ANY.find(k => u[k]) || keys[0];
  return any ? { amount: u[any]!, approx: true } : null;
}
function fromEur(p: CardPrices | null | undefined, v: string): Found | null {
  const e = p && p.eur;
  if (!e) return null;
  const k = (EUR_KEYS[v] || []).find(k => e[k]);
  if (k) return { amount: e[k]!, approx: false };
  const any = e.trend || e.avg30 || e.holo || e.reverse;
  return any ? { amount: any, approx: true } : null;
}

/**
 * Price of one copy in CLP, or null when there is none.
 * own: my own price for this card + variant in CLP (NM); it wins over the market price.
 */
export function pickPrice(
  p: CardPrices | null | undefined,
  v: string,
  cond: string | null | undefined,
  cfg: PriceConfig | null | undefined,
  fx: Fx | null | undefined,
  own?: number | null,
): PickedPrice | null {
  const mult = (cfg && cfg.cond && cfg.cond[cond || 'NM']) ?? 1;
  if (own != null) return { clp: Math.round(own * mult), nm: own, src: 'propio', approx: false };
  if (!fx) return null;
  const order = cfg && cfg.source === 'cardmarket' ? (['eur', 'usd'] as const) : (['usd', 'eur'] as const);
  // an exact match from either source beats an approximate one
  const found = order
    .map(s => [s, s === 'usd' ? fromUsd(p, v) : fromEur(p, v)] as const)
    .filter((x): x is readonly ['usd' | 'eur', Found] => !!x[1]);
  const best = found.find(x => !x[1].approx) || found[0];
  if (!best) return null;
  const [s, r] = best;
  const nm = Math.round(r.amount * (s === 'usd' ? fx.usd : fx.eur));
  return {
    clp: Math.round(nm * mult),
    nm,
    src: s === 'usd' ? 'TCGplayer' : 'Cardmarket',
    approx: r.approx,
    raw: (s === 'usd' ? 'US$ ' : '€ ') + r.amount,
  };
}

/** My own price typed in USD → CLP with today's rate */
export const usdToClp = (usd: number, fx: Fx): number => Math.round(usd * fx.usd);

/**
 * A price typed by the user in USD: "349,99" / "349.99" / "1.234,56" / "1,234.56" → number.
 * The last , or . followed by 1-2 digits is the decimal mark. Empty → null; unreadable → NaN.
 */
export function parseUsd(a: string): number | null {
  a = a.replace(/[^\d.,]/g, '');
  if (!a) return null;
  const m = a.match(/^(.*)[.,](\d{1,2})$/);
  const n = m ? Number(m[1]!.replace(/[.,]/g, '') + '.' + m[2]) : Number(a.replace(/[.,]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
