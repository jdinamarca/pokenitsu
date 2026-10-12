// Price of a card + variant + condition in CLP. Shared by the page (<script src>) and the server (import for the CSV).
// p: { usd: {TCGplayer printing: USD}, eur: {trend, avg30, reverse, holo} } as stored in card_prices
// cfg: { source: 'tcgplayer' | 'cardmarket', cond: {NM: 1, LP: 0.85…} }, fx: { usd: CLP per USD, eur: CLP per EUR }
(function () {
  // TCGplayer printings that match each variant, best first
  const USD_KEYS = {
    normal: ['normal', 'unlimited', 'unlimitedNormal'],
    holo: ['holofoil', 'unlimitedHolofoil', 'unlimited'],
    reverse: ['reverseHolofoil'],
    firstedition: ['1stEditionHolofoil', '1stEdition', '1stEditionNormal'],
  };
  // when the exact printing has no price (stamps, Poké Ball…): the base card, marked as approximate
  const USD_ANY = ['normal', 'holofoil', 'unlimited', 'unlimitedHolofoil', 'reverseHolofoil', '1stEditionHolofoil', '1stEdition'];
  const EUR_KEYS = { reverse: ['reverse'], holo: ['holo', 'trend'], normal: ['trend', 'avg30'] };

  function fromUsd(p, v) {
    const u = p && p.usd; if (!u) return null;
    const k = (USD_KEYS[v] || []).find(k => u[k]);
    if (k) return { amount: u[k], approx: false };
    const keys = Object.keys(u);
    // a card printed only one way (Wizards promo Eevee: only "holofoil") is that print, whatever the variant is called (Normal, Cosmos Holo…)
    if (keys.length === 1 && v !== 'reverse') return { amount: u[keys[0]], approx: false };
    const any = USD_ANY.find(k => u[k]) || keys[0];
    return any ? { amount: u[any], approx: true } : null;
  }
  function fromEur(p, v) {
    const e = p && p.eur; if (!e) return null;
    const k = (EUR_KEYS[v] || []).find(k => e[k]);
    if (k) return { amount: e[k], approx: false };
    const any = e.trend || e.avg30 || e.holo || e.reverse;
    return any ? { amount: any, approx: true } : null;
  }

  // → { clp, nm, src, approx } or null; own: my own CLP price for this card + variant (NM)
  function pick(p, v, cond, cfg, fx, own) {
    const mult = (cfg && cfg.cond && cfg.cond[cond || 'NM']) ?? 1;
    if (own != null) return { clp: Math.round(own * mult), nm: own, src: 'propio', approx: false };
    if (!fx) return null;
    const order = cfg && cfg.source === 'cardmarket' ? ['eur', 'usd'] : ['usd', 'eur'];
    // an exact match from either source beats an approximate one
    const found = order.map(s => [s, s === 'usd' ? fromUsd(p, v) : fromEur(p, v)]).filter(x => x[1]);
    const best = found.find(x => !x[1].approx) || found[0];
    if (!best) return null;
    const [s, r] = best;
    const nm = Math.round(r.amount * (s === 'usd' ? fx.usd : fx.eur));
    return { clp: Math.round(nm * mult), nm, src: s === 'usd' ? 'TCGplayer' : 'Cardmarket', approx: r.approx, raw: (s === 'usd' ? 'US$ ' : '€ ') + r.amount };
  }

  globalThis.Pricing = { pick };
})();
