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
}
export type Facts = Partial<Record<'exists' | 'name' | 'number' | 'artist' | 'image' | 'price' | 'equivalence' | 'variant', FactValue[]>>;
export interface Printing {
  code: string;
  set_key: string;
  set_name: string | null;
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
};
