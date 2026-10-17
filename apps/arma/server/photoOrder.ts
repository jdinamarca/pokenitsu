// Which photo a catalog card shows (fotos-del-catalogo-en-arma): its own, and its photo for local use only
/** a catalog card's own photo (anyone's, production-ready) and its photo for local use only (only with the switch on) */
export type CardPhotos = { own_card: string | null; local: { src: string; source: string } | null };
/** a photo of the card (arma.card_photos) or of its printing in the Full (printed) */
export type PhotoRow = { card_id: string; source_id: string; src: string; name: string; permission: string; printed: boolean };
// among the photos for local use only: its printing's (the exact one, from the Full), then Limitless, then PokeCottage
const localRank = (r: PhotoRow) => (r.printed ? 0 : r.source_id === 'limitless' ? 1 : r.source_id === 'pokecottage-fotos' ? 2 : 3);
/** each card's own photo (the card's wins over its printing's) and its photo for local use only (only with the switch) */
export function pickCardPhotos(rows: PhotoRow[], localOn: boolean): Map<string, CardPhotos> {
  const out = new Map<string, CardPhotos & { rank?: number }>();
  for (const r of [...rows].sort((a, b) => Number(a.printed) - Number(b.printed))) {
    const cur = out.get(r.card_id) || { own_card: null, local: null };
    if (r.source_id === 'own') cur.own_card ||= r.src;
    else if (r.permission === 'local' && localOn && (cur.rank === undefined || localRank(r) < cur.rank)) {
      cur.local = { src: r.src, source: r.name };
      cur.rank = localRank(r);
    }
    out.set(r.card_id, cur);
  }
  return new Map([...out].map(([id, { own_card, local }]) => [id, { own_card, local }]));
}
