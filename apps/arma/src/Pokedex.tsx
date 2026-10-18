import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { REGIONS, regionOf, type Owned, type Region } from '@pokenitsu/core';
import { api, type DexItem, type Scope } from './api.ts';
import { CardPicture } from './components/CardPicture.tsx';
import { Link, Notice, OwnedFilter, ScopeRail, scopeFrom, Shelves, useLoad, withScope } from './components/Gallery.tsx';
import { Shell } from './components/Shell.tsx';
import { navigate, useHref } from './router.ts';

// Pokédex (ilustradores-y-pokedex-en-arma): the species by region, and each Pokémon's cards by expansion

const n = (x: number) => x.toLocaleString('es-CL');
const pad = (d: number) => '#' + String(d).padStart(3, '0');

export function Pokedex() {
  const href = useHref();
  const [path, search = ''] = href.split('?');
  const scope = scopeFrom('?' + search);
  const rest = path!.replace(/^\/pokedex\/?/, '');
  const dex = /^\d+$/.test(rest) ? Number(rest) : null;
  const region = (dex ? regionOf(dex) : REGIONS.find(r => r.id === rest)) || REGIONS[0]!;
  return (
    <Shell path="/pokedex" label="Navegación y cartas" wide rail={<ScopeRail scope={scope} path={path!} />}>
      <main className="main gal-main">
        {dex && dex <= 1025 ? <Pokemon dex={dex} region={region} scope={scope} /> : <Regions region={region} scope={scope} />}
      </main>
    </Shell>
  );
}

function Regions({ region, scope }: { region: Region; scope: Scope }) {
  const [load, retry] = useLoad('pokedex:' + scope, () => api.pokedex(scope));
  const byDex = useMemo(() => new Map((load.state === 'ready' ? load.data : []).map(d => [d.dex, d])), [load]);
  // the entrance plays once per region shown, not while the data refreshes
  const [settled, setSettled] = useState<string | null>(null);
  useEffect(() => {
    if (load.state !== 'ready') return;
    const t = setTimeout(() => setSettled(region.id), 900);
    return () => clearTimeout(t);
  }, [load.state, region.id]);
  if (load.state === 'loading') return <Notice title="Abriendo la Pokédex…" />;
  if (load.state === 'error') return <Notice title="No pude abrir la Pokédex" text={load.message} retry={retry} />;
  const have = (r: Region) => {
    let k = 0;
    for (let d = r.from; d <= r.to; d++) if ((byDex.get(d)?.mine || 0) > 0) k++;
    return k;
  };
  const size = (r: Region) => r.to - r.from + 1;
  const species = Array.from({ length: size(region) }, (_, i) => region.from + i);
  return (
    <>
      <header className="top gal-top">
        <p className="count" aria-live="polite">
          <span className="n">{n(have(region))}</span>
          <span className="of">
            {' '}
            de {n(size(region))} Pokémon de {region.name}
          </span>
        </p>
      </header>
      <div className="dex-tabs" role="tablist" aria-label="Regiones">
        {REGIONS.map(r => {
          const h = have(r);
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === region.id}
              className={'dex-tab' + (r.id === region.id ? ' on' : '')}
              onClick={() => navigate(withScope(`/pokedex/${r.id}`, scope))}
            >
              <span className="dex-tab-name">{r.name}</span>
              <span className="dex-tab-n">
                {n(h)}/{n(size(r))}
              </span>
              <span className="dex-tab-bar" aria-hidden="true">
                <span style={{ inlineSize: `${(h / size(r)) * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="case dex-case" role="tabpanel" aria-label={`Pokémon de ${region.name}`}>
        <ul className={'dex-grid' + (settled === region.id ? ' settled' : '')} key={region.id}>
          {species.map((d, i) => (
            <Window key={d} dex={d} item={byDex.get(d)} i={i} scope={scope} />
          ))}
        </ul>
      </div>
    </>
  );
}

/** one Pokémon's window: its number, its names, its progress and its art (yours in colour, else one in black and white) */
function Window({ dex, item, i, scope }: { dex: number; item: DexItem | undefined; i: number; scope: Scope }) {
  const mine = item?.mine || 0;
  const total = item?.total || 0;
  const name = item?.name || pad(dex);
  return (
    <li className={'dexwin' + (mine ? ' has' : ' miss')} style={{ ['--i' as string]: Math.min(i, 24) }}>
      <Link to={withScope(`/pokedex/${dex}`, scope)} label={`${pad(dex)} ${name}: tienes ${n(mine)} de ${n(total)} cartas`}>
        <span className="dexwin-art">
          {item?.pic ? (
            <CardPicture ownCard={item.pic.own_card} img={item.pic.img} local={item.pic.local} reference={item.pic.ref} name={name} />
          ) : (
            <span className="blank">Sin cartas</span>
          )}
          <span className="dexwin-no">{pad(dex)}</span>
        </span>
        <span className="dexwin-tag">
          <span className="dexwin-name">{name}</span>
          {item?.ja && (
            <span className="dexwin-ja" lang="ja">
              {item.ja}
            </span>
          )}
          <span className="dexwin-n">
            {n(mine)} / {n(total)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Pokemon({ dex, region, scope }: { dex: number; region: Region; scope: Scope }) {
  const [load, retry] = useLoad(`pokemon:${dex}:${scope}`, () => api.pokemonCards(dex, scope));
  const [owned, setOwned] = useState<Owned>('all');
  if (load.state === 'loading') return <Notice title={`Abriendo ${pad(dex)}…`} />;
  if (load.state === 'error') return <Notice title={`No pude abrir ${pad(dex)}`} text={load.message} retry={retry} />;
  const { name, ja, cards } = load.data;
  const mine = cards.filter(c => c.qty > 0).length;
  return (
    <>
      <header className="gal-head">
        <Link to={withScope(`/pokedex/${region.id}`, scope)} className="gal-back">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          {region.name}
        </Link>
        <div className="gal-title dex-title">
          <span className="dex-no">{pad(dex)}</span>
          <div>
            <h1 className="dex-name">
              {name}
              {ja && (
                <span className="dex-ja" lang="ja">
                  {ja}
                </span>
              )}
            </h1>
            <p className="gal-sub">
              <span className="count">
                <span className="n">{n(mine)}</span>
                <span className="of"> de {n(cards.length)} cartas</span>
              </span>
            </p>
          </div>
        </div>
        <OwnedFilter owned={owned} onOwned={setOwned} mine={mine} total={cards.length} />
      </header>
      <Shelves cards={cards} owned={owned} label={`Cartas de ${name}`} />
    </>
  );
}
