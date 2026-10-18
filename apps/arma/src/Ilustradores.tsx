import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { matchesName, sortArtists, type ArtistOrder, type Owned } from '@pokenitsu/core';
import { api, type ArtistItem } from './api.ts';
import { CardPicture } from './components/CardPicture.tsx';
import { Link, Notice, OwnedFilter, ScopeRail, scopeFrom, Shelves, useLoad, withScope } from './components/Gallery.tsx';
import { Shell } from './components/Shell.tsx';
import { useHref } from './router.ts';

// Ilustradores (ilustradores-y-pokedex-en-arma): a gallery of signatures, and each illustrator's cards by expansion

const n = (x: number) => x.toLocaleString('es-CL');
const ORDERS: [ArtistOrder, string][] = [
  ['progress', 'Más avance'],
  ['mine', 'Más cartas mías'],
  ['total', 'Más cartas en total'],
  ['name', 'Nombre'],
];
const years = (a: { from: number | null; to: number | null }) =>
  a.from ? (a.to && a.to !== a.from ? `${a.from} – ${a.to}` : String(a.from)) : '';
/** the first entrance only: after it the cards stay still while searching or sorting */
function useSettled(ready: boolean) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!ready || settled) return;
    const t = setTimeout(() => setSettled(true), 900);
    return () => clearTimeout(t);
  }, [ready, settled]);
  return settled;
}
const noHover = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;

export function Ilustradores() {
  const href = useHref();
  const [path, search = ''] = href.split('?');
  const scope = scopeFrom('?' + search);
  const name = path!.startsWith('/ilustradores/') ? decodeURIComponent(path!.slice('/ilustradores/'.length)) : null;
  return (
    <Shell path="/ilustradores" label="Navegación y cartas" wide rail={<ScopeRail scope={scope} path={path!} />}>
      <main className="main gal-main">{name ? <Artist name={name} scope={scope} /> : <Signatures scope={scope} />}</main>
    </Shell>
  );
}

function Signatures({ scope }: { scope: 'all' | 'intl' | 'ja' }) {
  const [load, retry] = useLoad('artists:' + scope, () => api.artists(scope));
  const [q, setQ] = useState('');
  const [order, setOrder] = useState<ArtistOrder>('progress');
  const list = useMemo(
    () =>
      load.state === 'ready'
        ? sortArtists(
            load.data.filter(a => matchesName(a.name, q)),
            order,
          )
        : [],
    [load, q, order],
  );
  const settled = useSettled(load.state === 'ready');
  if (load.state === 'loading') return <Notice title="Abriendo Ilustradores…" />;
  if (load.state === 'error') return <Notice title="No pude abrir Ilustradores" text={load.message} retry={retry} />;
  const all = load.data;
  const withMine = all.filter(a => a.mine > 0).length;
  return (
    <>
      <header className="top gal-top">
        <p className="count" aria-live="polite">
          <span className="n">{n(withMine)}</span>
          <span className="of"> de {n(all.length)} ilustradores con cartas tuyas</span>
        </p>
        <div className="gal-tools">
          <label className="gal-search">
            <Search size={15} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar ilustrador"
              aria-label="Buscar ilustrador"
            />
          </label>
          <label className="gal-order">
            <span className="sr-only">Ordenar por</span>
            <select value={order} onChange={e => setOrder(e.target.value as ArtistOrder)}>
              {ORDERS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="sig-wall">
        {list.length ? (
          <ul className={'sig-grid' + (settled ? ' settled' : '')}>
            {list.map((a, i) => (
              <Placard key={a.name} a={a} i={i} scope={scope} />
            ))}
          </ul>
        ) : (
          <Notice title="Nadie con ese nombre" text="Prueba con el apellido o con menos letras." />
        )}
      </div>
    </>
  );
}

/** the progress ring: the share of their cards you have */
function Ring({ mine, total }: { mine: number; total: number }) {
  const r = 17,
    c = 2 * Math.PI * r;
  const share = total ? mine / total : 0;
  return (
    <span className="ring" role="img" aria-label={`Tienes ${n(mine)} de ${n(total)} cartas`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} className="ring-bg" />
        <circle
          cx="22"
          cy="22"
          r={r}
          className="ring-fg"
          strokeDasharray={`${Math.max(share > 0 ? 2 : 0, share * c)} ${c}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="ring-n">{n(mine)}</span>
    </span>
  );
}

/** one illustrator's placard; their cover comes out from behind it on hover or focus, asked only then */
function Placard({ a, i, scope }: { a: ArtistItem; i: number; scope: 'all' | 'intl' | 'ja' }) {
  const [shown, setShown] = useState(noHover);
  const show = () => setShown(true);
  return (
    <li className="sig-item" style={{ ['--i' as string]: Math.min(i, 18) }} onMouseEnter={show} onFocus={show}>
      <Link to={withScope(`/ilustradores/${encodeURIComponent(a.name)}`, scope)} className={'placard' + (a.mine ? ' has' : '')}>
        <span className="peek" aria-hidden="true">
          {shown && a.cover && (
            <span className={'peek-card' + (a.mine ? '' : ' miss')}>
              <CardPicture ownCard={a.cover.own_card} img={a.cover.img} local={a.cover.local} reference={a.cover.ref} name={a.name} />
            </span>
          )}
        </span>
        <span className="placard-face">
          <span className="sig">{a.name}</span>
          <span className="placard-foot">
            <span className="years">{years(a)}</span>
            <span className="of-total">de {n(a.total)}</span>
          </span>
          <Ring mine={a.mine} total={a.total} />
        </span>
      </Link>
    </li>
  );
}

function Artist({ name, scope }: { name: string; scope: 'all' | 'intl' | 'ja' }) {
  const [load, retry] = useLoad(`artist:${name}:${scope}`, () => api.artistCards(name, scope));
  const [owned, setOwned] = useState<Owned>('all');
  const back = (
    <Link to={withScope('/ilustradores', scope)} className="gal-back">
      <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      Ilustradores
    </Link>
  );
  if (load.state === 'loading') return <Notice title={`Abriendo las cartas de ${name}…`} />;
  if (load.state === 'error') return <Notice title={`No pude abrir las cartas de ${name}`} text={load.message} retry={retry} />;
  const cards = load.data;
  const mine = cards.filter(c => c.qty > 0).length;
  const ys = cards.map(c => Number(c.release.slice(0, 4))).filter(Boolean);
  const span = ys.length ? years({ from: Math.min(...ys), to: Math.max(...ys) }) : '';
  return (
    <>
      <header className="gal-head">
        {back}
        <div className="gal-title">
          <h1 className="sig sig-xl">{name}</h1>
          <p className="gal-sub">
            <span className="count">
              <span className="n">{n(mine)}</span>
              <span className="of"> de {n(cards.length)} cartas</span>
            </span>
            {span && <span className="years">{span}</span>}
          </p>
        </div>
        <OwnedFilter owned={owned} onOwned={setOwned} mine={mine} total={cards.length} />
      </header>
      <Shelves cards={cards} owned={owned} label={`Cartas de ${name}`} />
    </>
  );
}
