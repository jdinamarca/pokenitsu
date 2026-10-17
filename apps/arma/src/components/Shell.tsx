import type { ReactNode } from 'react';
import { Archive, Layers, LogOut, Plus } from 'lucide-react';
import { signOut } from '../auth.ts';
import { navigate } from '../router.ts';

const LINKS = [
  { path: '/', label: 'Arma · Eevee', Icon: Layers },
  { path: '/cargar', label: 'Cargar', Icon: Plus },
  { path: '/inventario', label: 'Mi inventario', Icon: Archive },
] as const;

/** the app's frame: the felt rail (brand, navigation, the screen's own zone, sign out) and the screen beside it */
export function Shell({ path, rail, label, children }: { path: string; rail: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="app">
      <nav className="rail" aria-label={label}>
        <p className="brand">Nitsu · Arma tu colección</p>
        <ul className="nav">
          {LINKS.map(({ path: to, label, Icon }) => (
            <li key={to}>
              <a
                href={to}
                className={path === to ? 'on' : ''}
                aria-current={path === to ? 'page' : undefined}
                onClick={e => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navigate(to);
                }}
              >
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
        {rail}
        {/* the way out (login-en-arma): the session ends in Nitsu too, it is the same one */}
        <button type="button" className="sign-out" onClick={() => void signOut()}>
          <LogOut size={14} strokeWidth={2.25} aria-hidden="true" />
          Cerrar sesión
        </button>
      </nav>
      {children}
    </div>
  );
}
