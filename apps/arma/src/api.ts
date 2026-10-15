// The app's own API (server/index.ts), through Vite's proxy
import type { ArmaFinish, ArmaRules } from '@pokenitsu/core';

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
  me: () => call<{ viewer: { id: string; name: string } | null }>('GET', '/me'),
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
  removePhoto: (code: string) => call<{ removed: number }>('DELETE', `/photos/${encodeURIComponent(code)}`),
};
