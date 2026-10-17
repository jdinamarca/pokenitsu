// The app's own API (server/index.ts), through Vite's proxy
import type { ArmaFinish, ArmaRules, CardPrices, LocationRule } from '@pokenitsu/core';

export type Permission = 'ok' | 'text_only' | 'review' | 'none' | 'own' | 'local';
export interface Source {
  id: string;
  name: string;
  url: string | null;
  permission: Permission;
  images: boolean;
  note: string | null;
}
export interface FactValue {
  source: string;
  value: string | null;
  ref: string | null;
  /** photos only: the variant it shows (a stamp key, '' for none), set by withPhotoShows */
  shows?: string;
}
export type Facts = Partial<Record<'exists' | 'name' | 'number' | 'artist' | 'image' | 'price' | 'equivalence' | 'variant', FactValue[]>>;
export interface Printing {
  code: string;
  set_key: string;
  set_name: string | null;
  /** the printing's own name for its set (local script for Asian ones) */
  set_name_local: string | null;
  /** the catalog's release date of the set */
  set_release: string | null;
  number: string;
  lang: string;
  finish: ArmaFinish;
  stamp: string | null;
  name: string | null;
  artist: string | null;
  release: string | null;
  design_id: string | null;
  design_date: string | null;
  card_id: string | null;
  equiv_id: string | null;
  facts: Facts;
}
export interface Full {
  dex: number;
  printings: Printing[];
  sources: Source[];
  lastImport: { summary: { printings: number }; started_at: string } | null;
  /** ARMA_FOTOS_LOCALES=1: photos for local use only come in the Full */
  localPhotos: boolean;
  /** the classification check: the doubtful printings and why (corregir-clasificacion-de-cartas) */
  audit: Record<string, { kind: string; text: string }[]>;
  /** what variant a photo shows, marked by hand: { src: stamp key, or '' for the printing with no stamp } */
  photoMarks: Record<string, string>;
}
export interface Copy {
  code: string;
  qty: number;
  personal: number;
  lang: string;
  cond: string;
  loc: string | null;
}
export interface SavedView {
  id: number | 'full';
  name: string;
  rules: ArmaRules;
  builtIn?: boolean;
}

// ---------- Cargar and Mi inventario (cargar-e-inventario-en-arma): the inventory shared with Nitsu ----------
export interface CardSet {
  id: string;
  name: string;
  name_ja: string;
  series: string | null;
  code: string;
  date: string;
  total: number | null;
  printed: number | null;
  sym: string;
  source: string;
  /** the only language of the expansion (Japanese ones), or null */
  lang: string | null;
  has_cards: boolean;
}
/** one row of a card: variant + language + condition + location */
export interface CopyRow {
  variant: string;
  lang: string;
  cond: string;
  loc: number;
  qty: number;
  personal: number;
}
export interface SetCard {
  id: string;
  sid: string;
  num: string;
  name: string;
  dex: number[] | null;
  artist: string | null;
  rarity: string | null;
  img: string | null;
  supertype: string | null;
  variants: string[] | null;
  vguess: boolean | null;
  prices: CardPrices | null;
  copies: CopyRow[];
  /** the account's own photo of some variants: { variant: img } */
  photos: Record<string, string>;
  /** without a picture: one of the same Pokémon from another expansion, shown as a reference */
  ref: string | null;
  /** the card's own photo (production-ready) and its photo for local use only (fotos-solo-local-en-catalogo) */
  own_card: string | null;
  local: LocalPhoto | null;
}
export interface LocalPhoto {
  src: string;
  /** the source's name: "Limitless TCG" */
  source: string;
}
export interface PriceCfg {
  source: string;
  cond: Record<string, number>;
}
export interface Fx {
  usd: number;
  eur: number;
}
export interface SetCards {
  /** the variants' names: { slug: label } */
  labels: Record<string, string>;
  cfg: PriceCfg;
  fx: Fx | null;
  own: Record<string, number | null>;
  cards: SetCard[];
}
export interface InvLocation {
  id: number;
  name: string;
  kind: string;
  pos: number;
  note: string | null;
  rule: LocationRule | null;
}
export interface InvRow extends CopyRow {
  card_id: string;
  added: string;
  sid: string;
  num: string;
  name: string;
  dex: number[] | null;
  artist: string | null;
  rarity: string | null;
  img: string | null;
  supertype: string | null;
  set_name: string;
  set_code: string;
  price_usd: CardPrices['usd'];
  price_eur: CardPrices['eur'];
  /** the account's own photo of this variant */
  own_img: string | null;
  ref: string | null;
  own_card: string | null;
  local: LocalPhoto | null;
}
export interface Inventory {
  labels: Record<string, string>;
  cfg: PriceCfg;
  fx: Fx | null;
  own: Record<string, number | null>;
  rows: InvRow[];
  locations: InvLocation[];
}
/** what the API answers after a load, a removal or an undo: the row as it ends up */
export interface RowResult {
  sid: string;
  num: string;
  variant: string;
  lang: string;
  cond: string;
  loc: number;
  qty: number;
  personal: number;
}
export interface Undone extends Partial<RowResult> {
  undone: number | null;
  batch?: string | null;
  rows: RowResult[];
}
// ---------- "Por reemplazar" (fotos-solo-local-en-catalogo) ----------
export interface ReplaceCard {
  card_id: string;
  sid: string;
  num: string;
  name: string;
  set_name: string;
  set_code: string;
  source_id: string;
  source: string;
  src: string;
}
export interface ReplaceCards {
  localPhotos: boolean;
  cards: ReplaceCard[];
  /** catalog cards with a photo for local use only, and how many of them have one that can go to production */
  total: number;
  ready: number;
}
export interface SourceCount {
  fetched: number;
  existing: number;
  missing: number;
  failed: number;
}
/** the Japanese catalog's photos for local use only: Limitless per expansion, then PokeCottage per Pokémon */
export interface CatalogJob {
  running: boolean;
  phase: 'limitless' | 'pokecottage';
  sets: number;
  done: number;
  pokemon: number;
  pokemonDone: number;
  current: string | null;
  bySource: { limitless: SourceCount; pokecottage: SourceCount };
  skipped: string[];
  waitingUntil?: string;
  stopped?: string;
  error?: string;
}
type RowKey = Pick<RowResult, 'sid' | 'num' | 'variant' | 'lang' | 'cond' | 'loc'>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch('/api' + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.message || j.error || `HTTP ${r.status}`, r.status);
  return j as T;
}
export const api = {
  // Cargar and Mi inventario
  sets: (q?: string) => call<{ sets: CardSet[]; lang: string | null }>('GET', '/sets' + (q ? '?q=' + encodeURIComponent(q) : '')),
  setCards: (id: string) => call<SetCards>('GET', `/sets/${encodeURIComponent(id)}/cards`),
  inventory: () => call<Inventory>('GET', '/inventory'),
  add: (row: RowKey & { delta: number; personal?: boolean; batch?: string }) =>
    call<RowResult & { real: number; logId: number | null }>('POST', '/inventory/add', row),
  undo: () => call<Undone>('POST', '/inventory/undo', {}),
  move: (row: RowKey & { to: Partial<Pick<RowResult, 'variant' | 'lang' | 'cond' | 'loc'>>; n?: number }) =>
    call<{ moved: number }>('POST', '/inventory/move', row),
  personal: (row: RowKey & { personal: number }) => call<{ personal: number }>('POST', '/inventory/personal', row),
  ownPrice: (b: { sid: string; num: string; variant: string; usd: number | '' }) => call<{ ok: true }>('PUT', '/prices/own', b),
  me: () => call<{ viewer: { id: string; name: string } | null; owner: boolean }>('GET', '/me'),
  full: (dex: number) => call<Full>('GET', `/full/${dex}`),
  owned: (dex: number) => call<{ copies: Copy[] }>('GET', `/owned/${dex}`),
  views: () => call<{ views: SavedView[] }>('GET', '/views'),
  saveView: (name: string, rules: ArmaRules) => call<SavedView>('POST', '/views', { name, rules }),
  deleteView: (id: number) => call<{ removed: number }>('DELETE', `/views/${id}`),
  importDex: (dex: number) => call<{ printings: number }>('POST', `/import/${dex}`),
  // what a photo shows (fotos-por-variante): a stamp key, '' for the printing with no stamp; unmark → automatic
  markPhoto: (src: string, shows: string) => call<{ src: string; shows: string }>('POST', '/photo-marks', { src, shows }),
  unmarkPhoto: (src: string) => call<{ removed: number }>('DELETE', '/photo-marks', { src }),
  // your own photo of a printing (JPEG, PNG or WebP up to 8 MB)
  uploadPhoto: async (code: string, file: File) => {
    const r = await fetch(`/api/photos/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'content-type': file.type },
      body: file,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new ApiError(
        r.status === 413
          ? 'La foto pesa más de 8 MB'
          : r.status === 415
            ? 'La foto debe ser JPEG, PNG o WebP'
            : j.message || `HTTP ${r.status}`,
        r.status,
      );
    return j as { code: string; src: string };
  },
  replaceCards: () => call<ReplaceCards>('GET', '/replace/cards'),
  catalogJob: () => call<{ localPhotos: boolean; job: CatalogJob | null }>('GET', '/local-photos/catalog'),
  startCatalogJob: () => call<CatalogJob>('POST', '/local-photos/catalog', {}),
  // your own photo of a catalog card (the administrator's; JPEG, PNG or WebP up to 8 MB)
  uploadCardPhoto: async (cardId: string, file: File) => {
    const r = await fetch(`/api/card-photos/${encodeURIComponent(cardId)}`, {
      method: 'POST',
      headers: { 'content-type': file.type },
      body: file,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new ApiError(
        r.status === 413
          ? 'La foto pesa más de 8 MB'
          : r.status === 415
            ? 'La foto debe ser JPEG, PNG o WebP'
            : j.message || `HTTP ${r.status}`,
        r.status,
      );
    return j as { cardId: string; src: string };
  },
  removePhoto: (code: string) => call<{ removed: number }>('DELETE', `/photos/${encodeURIComponent(code)}`),
};
