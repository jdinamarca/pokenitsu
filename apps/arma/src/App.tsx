import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyRules, MEMBER_NAMES, memberFromPath, type ArmaRules, type RuleId } from '@pokenitsu/core';
import { CircleHelp, RefreshCw } from 'lucide-react';
import { toLogin } from './auth.ts';
import { api, ApiError, type Copy, type Full, type MasterSets, type SavedView, type Source } from './api.ts';
import {
  copiesByCode,
  keepFor,
  ownership,
  REDUCES,
  RULES,
  shelvesBySet,
  shelvesOf,
  STICKER,
  withPhotoShows,
  cardOf,
  type Order,
  type Seeing,
  importLines,
} from './model.ts';
import { Rail } from './components/Rail.tsx';
import { Shell } from './components/Shell.tsx';
import { Showcase } from './components/Showcase.tsx';
import { Detail } from './components/Detail.tsx';
import { FamilyFan } from './components/FamilyFan.tsx';
import { Link } from './components/Gallery.tsx';
import { useHref } from './router.ts';

const MASTER_EN: ArmaRules = { onlyEnglish: true, asiaAsJapanese: true, stampsAndDecks: true, wcd: true, jumbo: false };

type Load = { state: 'loading' } | { state: 'signedOut' } | { state: 'error'; message: string } | { state: 'ready' };

type Loaded =
  | { kind: 'ready'; dex: number; full: Full; copies: Copy[]; views: SavedView[] }
  | { kind: 'signedOut' }
  | { kind: 'error'; message: string };
// one member's Full, its copies and the saved views (master-set-familia-eevee: any member of the family)
async function fetchAll(dex: number): Promise<Loaded> {
  try {
    const me = await api.me();
    if (!me.viewer) return { kind: 'signedOut' };
    const [full, o, v] = await Promise.all([api.full(dex), api.owned(dex), api.views()]);
    return { kind: 'ready', dex, full, copies: o.copies, views: v.views };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { kind: 'signedOut' };
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

export function App() {
  // the member comes from the address: / is Eevee, /master-set/umbreon is Umbreon (master-set-familia-eevee)
  const path = useHref().split('?')[0]!;
  const dex = memberFromPath(path);
  const species = dex ? MEMBER_NAMES[dex] || `#${dex}` : '';
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  // the member whose Full is loaded; while another one arrives, the case says so
  const [loadedDex, setLoadedDex] = useState<number | null>(null);
  const [family, setFamily] = useState<MasterSets | null>(null);
  const loadFamily = useCallback(() => api.masterSets().then(setFamily, () => {}), []);
  const [full, setFull] = useState<Full | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [rules, setRules] = useState<ArmaRules>(MASTER_EN);
  const [viewId, setViewId] = useState<SavedView['id'] | null>(null);
  const [active, setActive] = useState<RuleId | null>('onlyEnglish');
  const [selected, setSelected] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  // the note of the last import, for the member it was about
  const [imported, setImported] = useState<{ dex: number; lines: string[]; error?: boolean } | null>(null);
  const dismissImport = useCallback(() => setImported(null), []);
  const dexNow = useRef(dex);
  useEffect(() => {
    dexNow.current = dex;
  }, [dex]);
  // what variant each photo shows, marked by hand (fotos-por-variante); changed from the sheet without reloading
  const [marks, setMarks] = useState<Record<string, string>>({});
  // the case's order, remembered in this browser (a convenience: without storage it is "by design")
  const [order, setOrder] = useState<Order>(() => {
    try {
      return localStorage.getItem('arma.orden') === 'set' ? 'set' : 'design';
    } catch {
      return 'design';
    }
  });
  // "Todas · Las que tengo · Me faltan", remembered like the order
  const [seeing, setSeeing] = useState<Seeing>(() => {
    try {
      const v = localStorage.getItem('arma.ver');
      return v === 'have' || v === 'miss' ? v : 'all';
    } catch {
      return 'all';
    }
  });
  const chooseSeeing = (v: Seeing) => {
    setSeeing(v);
    try {
      localStorage.setItem('arma.ver', v);
    } catch {
      /* private window: only for this visit */
    }
  };
  const chooseOrder = (o: Order) => {
    setOrder(o);
    try {
      localStorage.setItem('arma.orden', o);
    } catch {
      /* private window: only for this visit */
    }
  };

  // fetching never touches state; applying the result does, once it arrives
  const apply = useCallback((r: Loaded) => {
    if (r.kind === 'ready') {
      setLoadedDex(r.dex);
      setSelected(null);
      setFull(r.full);
      setMarks(r.full.photoMarks || {});
      setCopies(r.copies);
      setViews(r.views);
    }
    setLoad(
      r.kind === 'ready' ? { state: 'ready' } : r.kind === 'signedOut' ? { state: 'signedOut' } : { state: 'error', message: r.message },
    );
  }, []);
  const refresh = useCallback(() => (dex ? fetchAll(dex).then(apply) : Promise.resolve()), [apply, dex]);
  // the sheet's photo tools: a mark changes the case right away; an upload brings the Full again
  const markPhoto = useCallback(async (src: string, shows: string | null) => {
    if (shows === null) await api.unmarkPhoto(src);
    else await api.markPhoto(src, shows);
    setMarks(m => {
      const next = { ...m };
      if (shows === null) delete next[src];
      else next[src] = shows;
      return next;
    });
  }, []);
  const uploadPhoto = useCallback(
    async (code: string, file: File) => {
      await api.uploadPhoto(code, file);
      await refresh();
    },
    [refresh],
  );
  const removePhoto = useCallback(
    async (code: string) => {
      await api.removePhoto(code);
      await refresh();
    },
    [refresh],
  );
  useEffect(() => {
    if (!dex) return;
    let alive = true;
    void fetchAll(dex).then(r => alive && apply(r));
    return () => {
      alive = false;
    };
  }, [apply, dex]);
  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  const sources = useMemo(() => new Map<string, Source>((full?.sources || []).map(s => [s.id, s])), [full]);
  const printings = useMemo(() => withPhotoShows(full?.printings || [], marks), [full, marks]);
  const result = useMemo(
    () =>
      applyRules(
        printings.map(p => ({ key: p.code, lang: p.lang, stamp: p.stamp, equivId: p.equiv_id })),
        rules,
      ),
    [printings, rules],
  );
  const audit = useMemo(() => full?.audit || {}, [full]);
  const owned = useMemo(() => copiesByCode(copies), [copies]);
  const has = useCallback((code: string) => (owned.get(code) || []).some(c => c.qty > 0), [owned]);
  const visible = useCallback((code: string) => result.get(code)?.in ?? true, [result]);
  const doubtful = useMemo(() => printings.filter(p => audit[p.code] && visible(p.code)).length, [printings, audit, visible]);
  // "Por verificar": only the doubtful printings, to go through them one by one (a view filter: the count stays)
  const [onlyDoubtful, setOnlyDoubtful] = useState(false);
  // shelves are built with every printing (each keeps its design's picture), then what a rule leaves out, the doubtful
  // filter and "tengo · me faltan" take printings off; a shelf left empty goes away (eevee-lo-que-tienes)
  const shelves = useMemo(() => {
    const all = order === 'set' ? shelvesBySet(printings, sources) : shelvesOf(printings, sources);
    return all
      .map(s => ({
        ...s,
        printings: s.printings.filter(p => visible(p.code) && (!onlyDoubtful || audit[p.code]) && keepFor(seeing, has(p.code))),
      }))
      .filter(s => s.printings.length);
  }, [order, printings, sources, onlyDoubtful, audit, seeing, visible, has]);
  const own = useMemo(() => ownership(printings, result, owned), [printings, result, owned]);
  const hidden = useMemo(
    () => Object.values(own.hidden).reduce((a, h) => ({ total: a.total + h.total, have: a.have + h.have }), { total: 0, have: 0 }),
    [own],
  );

  const toggle = (id: RuleId) => {
    setRules(r => ({ ...r, [id]: !r[id] }));
    setActive(id);
    setViewId(null);
  };
  const pickView = (v: SavedView) => {
    setRules(v.rules);
    setViewId(v.id);
    setActive(null);
  };
  const saveView = async (name: string) => {
    const v = await api.saveView(name, rules);
    setViews(vs => [...vs.filter(x => x.id !== v.id && x.name !== v.name), v]);
    setViewId(v.id);
  };
  const deleteView = async (id: number) => {
    await api.deleteView(id);
    setViews(vs => vs.filter(v => v.id !== id));
    if (viewId === id) setViewId(null);
  };
  // bringing a Full (again, volver-a-traer-el-full): the case stays while it runs; afterwards what changed, in the rail.
  // Another member opened meanwhile is left alone: only the family's progress is brought again.
  const runImport = async () => {
    const which = dex!;
    const had = printings.length > 0;
    setImporting(true);
    setImported(null);
    try {
      const r = await api.importDex(which);
      await loadFamily();
      if (dexNow.current !== which) return;
      await refresh();
      setImported({ dex: which, lines: importLines(species, r, sources) });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (dexNow.current !== which) return;
      if (had) setImported({ dex: which, lines: [`No pude traer el Full de ${species}: ${message}`], error: true });
      else setLoad({ state: 'error', message });
    } finally {
      setImporting(false);
    }
  };

  if (load.state === 'loading' && dex) return <Gate title="Abriendo la vitrina…" />;
  // without a session, to this app's own way in, coming back here after entering (login-en-arma)
  if (load.state === 'signedOut') {
    toLogin();
    return null;
  }
  if (load.state === 'error')
    return (
      <Gate title="No pude abrir la vitrina" text={load.message}>
        <button type="button" className="primary" onClick={() => void refresh()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );
  const fan = family && dex ? <FamilyFan members={family.members} dex={dex} rules={rules} /> : null;
  const railFor = (total: number) => (
    <Rail
      species={species || 'Arma tu Master Set'}
      dex={dex || 0}
      total={total}
      rules={rules}
      active={active}
      onToggle={toggle}
      views={views}
      viewId={viewId}
      onView={pickView}
      onSave={saveView}
      onDelete={id => void deleteView(id)}
      {...(total && loadedDex === dex
        ? {
            refresh: {
              at: full?.lastImport?.started_at ?? null,
              importing,
              note: imported?.dex === dex ? imported : null,
              onImport: () => void runImport(),
              onDismiss: dismissImport,
            },
          }
        : {})}
    />
  );
  // no member at this address, its Full still arriving, or not brought yet: the fan stays, the case says what's up
  const message = (title: string, text?: string, action?: React.ReactNode) => (
    <Shell path="/" label="Navegación, reglas y vistas" rail={railFor(0)}>
      <main className="main">
        {fan}
        <div className="case" role="region" aria-label="Vitrina">
          <div className="case-msg">
            <h2>{title}</h2>
            {text && <p>{text}</p>}
            {action}
          </div>
        </div>
      </main>
      <Detail
        p={null}
        fallback={null}
        copies={[]}
        sources={sources}
        siblings={[]}
        marks={marks}
        onMark={markPhoto}
        onUpload={uploadPhoto}
        onRemovePhoto={removePhoto}
        reasons={[]}
      />
    </Shell>
  );
  if (!dex)
    return message(
      'Ese Pokémon no está en Arma tu Master Set',
      'Por ahora la vitrina tiene a Eevee y sus evoluciones.',
      <Link to="/" className="primary">
        Ir a Eevee
      </Link>,
    );
  if (loadedDex !== dex) return message(`Abriendo el Full de ${species}…`);
  if (!printings.length)
    return message(
      `El Full de ${species} todavía está vacío`,
      'Tráelo desde TCGdex, el catálogo de Nitsu, PokeCottage (solo texto), Bulbapedia y WikiDex, con los mismos criterios que Eevee. Cada dato queda marcado con su fuente.',
      <button type="button" className="primary" disabled={importing} onClick={() => void runImport()}>
        <RefreshCw size={16} strokeWidth={2} className={importing ? 'spin' : ''} />
        {importing ? `Trayendo el Full de ${species}…` : `Traer el Full de ${species}`}
      </button>,
    );

  // what a rule or a filter takes off the case can't stay chosen
  const sel = shelves.flatMap(s => s.printings).find(p => p.code === selected) || null;
  const outOf = (n: { total: number; have: number }) =>
    `${n.total.toLocaleString('es-CL')} ${n.total === 1 ? 'impresión' : 'impresiones'}; ${
      n.have ? `${n.have.toLocaleString('es-CL')} de ellas las tienes` : 'no tienes ninguna de ellas'
    }.`;
  const activeRule = RULES.find(r => r.id === active);
  const shelfPicture = sel ? (shelves.find(s => s.printings.includes(sel))?.fallback(sel) ?? null) : null;
  return (
    <Shell path="/" label="Navegación, reglas y vistas" rail={railFor(printings.length)}>
      <main className="main">
        {fan}
        <header className="top">
          <p className="count" aria-live="polite">
            <span className="n">{own.visible.have.toLocaleString('es-CL')}</span>
            <span className="of"> / {own.visible.total.toLocaleString('es-CL')} tienes</span>
          </p>
          <p className="note">
            {activeRule ? (
              REDUCES(activeRule.id, rules) ? (
                <>
                  «{activeRule.label}» dejó fuera {outOf(own.hidden[activeRule.id] || { total: 0, have: 0 })}
                </>
              ) : (
                <>«{activeRule.label}» está desactivada: sus impresiones vuelven a la vitrina.</>
              )
            ) : hidden.total ? (
              <>Esta vista deja fuera {outOf(hidden)}</>
            ) : (
              <>El Full completo: no queda nada fuera.</>
            )}{' '}
            Te faltan {(own.visible.total - own.visible.have).toLocaleString('es-CL')}.
          </p>
          <ul className="legend" aria-label="Permiso de las fuentes">
            {(['ok', 'review', 'none', 'own', ...(full?.localPhotos ? (['local'] as const) : [])] as const).map(k => (
              <li key={k}>
                <span className={'sticker ' + STICKER[k].tone} aria-hidden="true" />
                {k === 'ok' ? 'Con permiso' : STICKER[k].label}
              </li>
            ))}
          </ul>
          <div className="order" role="group" aria-label="Ordenar la vitrina">
            <span>Ordenar</span>
            {(
              [
                ['design', 'Por diseño'],
                ['set', 'Por expansión'],
              ] as const
            ).map(([o, label]) => (
              <button
                key={o}
                type="button"
                className={'view' + (order === o ? ' sel' : '')}
                aria-pressed={order === o}
                onClick={() => chooseOrder(o)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="order seeing" role="group" aria-label="Ver">
            <span>Ver</span>
            {(
              [
                ['all', 'Todas', own.visible.total],
                ['have', 'Las que tengo', own.visible.have],
                ['miss', 'Me faltan', own.visible.total - own.visible.have],
              ] as const
            ).map(([v, label, n]) => (
              <button
                key={v}
                type="button"
                className={'view' + (seeing === v ? ' sel' : '')}
                aria-pressed={seeing === v}
                onClick={() => chooseSeeing(v)}
              >
                {label} <em>{n.toLocaleString('es-CL')}</em>
              </button>
            ))}
            {doubtful > 0 && (
              <span className="audit-filter">
                <button
                  type="button"
                  className={'chip' + (onlyDoubtful ? ' sel' : '')}
                  aria-pressed={onlyDoubtful}
                  onClick={() => setOnlyDoubtful(v => !v)}
                >
                  <CircleHelp size={13} aria-hidden="true" />
                  Por verificar ({doubtful.toLocaleString('es-CL')})
                </button>
              </span>
            )}
          </div>
        </header>
        <Showcase shelves={shelves} sources={sources} copies={owned} audit={audit} selected={selected} onSelect={setSelected} />
      </main>
      <Detail
        p={sel}
        fallback={shelfPicture}
        copies={sel ? owned.get(sel.code) || [] : []}
        sources={sources}
        siblings={sel ? printings.filter(x => cardOf(x) === cardOf(sel)) : []}
        marks={marks}
        onMark={markPhoto}
        onUpload={uploadPhoto}
        onRemovePhoto={removePhoto}
        reasons={sel ? audit[sel.code] || [] : []}
      />
    </Shell>
  );
}

function Gate({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <main className="gate">
      <p className="brand gate-brand">Nitsu · Arma tu colección</p>
      <div className="gate-box">
        <h1>{title}</h1>
        {text && <p className="gate-text">{text}</p>}
        {children}
      </div>
    </main>
  );
}
