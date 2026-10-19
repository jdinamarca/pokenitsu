// Which photo a catalog card shows (fotos-del-catalogo-en-arma): its own, and its photo for local use only
/** a catalog card's own photo (anyone's, production-ready) and its photo for local use only (only with the switch on) */
export type CardPhotos = { own_card: string | null; local: { src: string; source: string } | null };
/** a photo of the card (arma.card_photos) or of its printing in the Full (printed) */
export type PhotoRow = { card_id: string; source_id: string; src: string; name: string; permission: string; printed: boolean };
// among the photos for local use only: its printing's (the exact one, from the Full), then Limitless, PokeCottage and
// Bill's Archive
const RANK: Record<string, number> = { limitless: 1, 'pokecottage-fotos': 2, billsarchive: 3 };
const localRank = (r: PhotoRow) => (r.printed ? 0 : (RANK[r.source_id] ?? 4));
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

/** a variant's photo with a stamp (foto-de-la-variante-con-sello): its printing's in the Full, by language */
export type VariantPhoto = { src: string; source: string; local: boolean };
export type VariantPhotoRow = { card_id: string; variant: string; lang: string; src: string; name: string; permission: string };
/** each card's photos of its stamped variants: { variant: { lang: photo } }; one that may be shown wins over a local one */
export function pickVariantPhotos(rows: VariantPhotoRow[], localOn: boolean): Map<string, Record<string, Record<string, VariantPhoto>>> {
  const out = new Map<string, Record<string, Record<string, VariantPhoto>>>();
  for (const r of rows) {
    const local = r.permission === 'local';
    if (local && !localOn) continue;
    const card = out.get(r.card_id) || {};
    const langs = (card[r.variant] ||= {});
    const cur = langs[r.lang];
    if (!cur || (cur.local && !local)) langs[r.lang] = { src: r.src, source: r.name, local };
    out.set(r.card_id, card);
  }
  return out;
}
