import { useEffect, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { shelvesBySet, type Owned } from '@pokenitsu/core';
import { ApiError, type GalleryItem, type Scope } from '../api.ts';
import { toLogin } from '../auth.ts';
import { navigate } from '../router.ts';
import { CardPicture } from './CardPicture.tsx';

// What Ilustradores and Pokédex share (ilustradores-y-pokedex-en-arma): which cards they count (?ver=), what a gallery
// shows (Todas · Tengo · Me faltan) and the gallery itself, one shelf per expansion in the felt case.

const n = (x: number) => x.toLocaleString('es-CL');
export const SCOPES: [Scope, string][] = [
  ['all', 'Todas'],
  ['intl', 'Internacionales'],
  ['ja', 'Japonesas'],
];
/** ?ver=intl|ja in the address (no parameter: all), so Back comes back to the same view */
export function scopeFrom(search: string): Scope {
  const v = new URLSearchParams(search).get('ver');
  return v === 'intl' || v === 'ja' ? v : 'all';
}
export const withScope = (path: string, scope: Scope) => (scope === 'all' ? path : `${path}?ver=${scope}`);

/** the rail's "Cartas" choice; it replaces the address' ?ver= */
export function ScopeRail({ scope, path }: { scope: Scope; path: string }) {
  return (
    <section aria-labelledby="ver-h">
      <h2 id="ver-h" className="rail-h">
        Cartas
      </h2>
      <ul className="picks">
        {SCOPES.map(([id, label]) => (
          <li key={id}>
            <button
              type="button"
              className={'pick' + (scope === id ? ' on' : '')}
              aria-pressed={scope === id}
              onClick={() => navigate(withScope(path, id))}
            >
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Todas · Tengo · Me faltan, with how many of each */
export function OwnedFilter({ owned, onOwned, mine, total }: { owned: Owned; onOwned: (o: Owned) => void; mine: number; total: number }) {
  const opts: [Owned, string, number][] = [
    ['all', 'Todas', total],
    ['mine', 'Tengo', mine],
    ['missing', 'Me faltan', total - mine],
  ];
  return (
    <div className="gal-seg" role="group" aria-label="Qué cartas mostrar">
      {opts.map(([id, label, k]) => (
        <button key={id} type="button" className={owned === id ? 'on' : ''} aria-pressed={owned === id} onClick={() => onOwned(id)}>
          {label}
          <em>{n(k)}</em>
        </button>
      ))}
    </div>
  );
}

/** one shelf per expansion, newest first: what you have in colour with its copies, what you miss in black and white */
export function Shelves({ cards, owned, label }: { cards: GalleryItem[]; owned: Owned; label: string }) {
  const shelves = shelvesBySet(cards, owned);
  if (!shelves.length)
    return (
      <div className="case" role="region" aria-label={label}>
        <div className="case-msg">
          <h2>{owned === 'mine' ? 'Todavía no tienes ninguna' : owned === 'missing' ? 'Las tienes todas' : 'No hay cartas'}</h2>
          <p>{owned === 'all' ? 'Prueba con otras cartas en el riel.' : 'Prueba con "Todas".'}</p>
        </div>
      </div>
    );
  return (
    <div className="case gal-case" role="region" aria-label={label}>
      <div className="gal-flow">
        {shelves.map((s, i) => (
          <section key={s.set_id} className="shelf gal-shelf" aria-label={s.set_name} style={{ ['--i' as string]: Math.min(i, 6) }}>
            <div className="shelf-h">
              <h3>{s.set_name}</h3>
              <span>
                {[s.set_code, s.release.slice(0, 4)].filter(Boolean).join(' · ')}
                <b className="gal-prog">
                  {n(s.mine)} / {n(s.total)}
                </b>
              </span>
            </div>
            <ul className="row">
              {s.cards.map(c => (
                <li key={c.id} className={'print gal-card' + (c.qty > 0 ? '' : ' miss')} title={`${c.name} · ${s.set_name} #${c.number}`}>
                  <span className="art">
                    <CardPicture ownCard={c.own_card} img={c.img} local={c.local} reference={c.ref} name={c.name} />
                    {c.qty > 0 && <span className="owned">×{c.qty}</span>}
                  </span>
                  <span className="tag">
                    <span className="tag-text">{c.name}</span>
                    <span className="gal-num">{c.number}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

type Loaded<T> = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: T };
/** loads with the API, to the way in on 401; reloads when the key changes */
export function useLoad<T>(key: string, fetcher: () => Promise<T>): [Loaded<T>, () => void] {
  // the answer is kept with the key it is for: another key (or a retry) reads as loading until its own arrives
  const [tick, setTick] = useState(0);
  const want = `${key}#${tick}`;
  const [got, setGot] = useState<{ for: string; load: Loaded<T> } | null>(null);
  useEffect(() => {
    let alive = true;
    fetcher().then(
      data => alive && setGot({ for: want, load: { state: 'ready', data } }),
      e => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) return toLogin();
        setGot({ for: want, load: { state: 'error', message: e instanceof Error ? e.message : String(e) } });
      },
    );
    return () => {
      alive = false;
    };
    // the key says what to load; the fetcher is a new function each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want]);
  return [got?.for === want ? got.load : { state: 'loading' }, () => setTick(t => t + 1)];
}

/** a message in place of the screen (loading, failed) */
export function Notice({ title, text, retry }: { title: string; text?: string; retry?: () => void }): ReactNode {
  return (
    <div className="case-msg gal-msg">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {retry && (
        <button type="button" className="primary" onClick={retry}>
          <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}

/** a link inside the app: navigates without reloading, but keeps ⌘-click for a new tab */
export function Link({ to, className, children, label }: { to: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <a
      href={to}
      className={className}
      aria-label={label}
      onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
