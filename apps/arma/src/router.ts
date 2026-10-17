// The app's few addresses (/, /cargar, /inventario, /cajas, /entrar) without a router library: history.pushState and popstate
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(f => f());
addEventListener('popstate', notify);

/** goes to another screen without reloading the page */
export function navigate(path: string) {
  if (path === location.pathname + location.search) return;
  history.pushState(null, '', path);
  notify();
}
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
/** the current path; re-renders when it changes */
export const usePath = () => useSyncExternalStore(subscribe, () => location.pathname);
