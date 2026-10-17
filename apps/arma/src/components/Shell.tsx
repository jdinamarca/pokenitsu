import { useEffect, useState, type ReactNode } from 'react';
import { Archive, ImageUp, Layers, LogOut, Plus } from 'lucide-react';
import { api } from '../api.ts';
import { signOut } from '../auth.ts';
import { navigate } from '../router.ts';

const LINKS = [
  { path: '/', label: 'Arma · Eevee', Icon: Layers },
  { path: '/cargar', label: 'Cargar', Icon: Plus },
  { path: '/inventario', label: 'Mi inventario', Icon: Archive },
] as const;
// only the administrator's rail has it (fotos-solo-local-en-catalogo)
const OWNER_LINK = { path: '/reemplazar', label: 'Por reemplazar', Icon: ImageUp } as const;

// whether this account is the administrator, asked once per page load
let ownerOnce: Promise<boolean> | null = null;
export const isOwnerAccount = () =>
  (ownerOnce ||= api
    .me()
    .then(m => m.owner)
    .catch(() => false));
function useOwner() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    let alive = true;
    void isOwnerAccount().then(o => alive && setOwner(o));
    return () => {
      alive = false;
    };
  }, []);
  return owner;
}

/** the app's frame: the felt rail (brand, navigation, the screen's own zone, sign out) and the screen beside it */
export function Shell({
  path,
  rail,
  label,
  wide = false,
  children,
}: {
  path: string;
  rail: ReactNode;
  label: string;
  /** no sheet beside the screen: it takes the rest of the width */
  wide?: boolean;
  children: ReactNode;
}) {
  const owner = useOwner();
  return (
    <div className={'app' + (wide ? ' wide' : '')}>
      <nav className="rail" aria-label={label}>
        <p className="brand">Nitsu · Arma tu colección</p>
        <ul className="nav">
          {[...LINKS, ...(owner ? [OWNER_LINK] : [])].map(({ path: to, label, Icon }) => (
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
