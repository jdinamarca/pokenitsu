import { useCallback, useEffect, useMemo, useState } from 'react';
import { applyRules, type ArmaRules, type RuleId } from '@pokenitsu/core';
import { LogIn, RefreshCw } from 'lucide-react';
import { api, ApiError, type Copy, type Full, type SavedView, type Source } from './api.ts';
import { copiesByCode, REDUCES, RULES, shelvesOf, STICKER } from './model.ts';
import { Rail } from './components/Rail.tsx';
import { Showcase } from './components/Showcase.tsx';
import { Detail } from './components/Detail.tsx';

const DEX = 133;
const SPECIES = 'Eevee';
const NITSU = 'http://localhost:3000/entrar';
const MASTER_EN: ArmaRules = { onlyEnglish: true, asiaAsJapanese: true, stampsAndDecks: true, wcd: true, jumbo: false };

type Load = { state: 'loading' } | { state: 'signedOut' } | { state: 'error'; message: string } | { state: 'ready' };

type Loaded =
  { kind: 'ready'; full: Full; copies: Copy[]; views: SavedView[] } | { kind: 'signedOut' } | { kind: 'error'; message: string };
async function fetchAll(): Promise<Loaded> {
  try {
    const me = await api.me();
    if (!me.viewer) return { kind: 'signedOut' };
    const [full, o, v] = await Promise.all([api.full(DEX), api.owned(DEX), api.views()]);
    return { kind: 'ready', full, copies: o.copies, views: v.views };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { kind: 'signedOut' };
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

export function App() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [full, setFull] = useState<Full | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [rules, setRules] = useState<ArmaRules>(MASTER_EN);
  const [viewId, setViewId] = useState<SavedView['id'] | null>(null);
  const [active, setActive] = useState<RuleId | null>('onlyEnglish');
  const [selected, setSelected] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // fetching never touches state; applying the result does, once it arrives
  const apply = useCallback((r: Loaded) => {
    if (r.kind === 'ready') {
      setFull(r.full);
      setCopies(r.copies);
      setViews(r.views);
    }
    setLoad(
      r.kind === 'ready' ? { state: 'ready' } : r.kind === 'signedOut' ? { state: 'signedOut' } : { state: 'error', message: r.message },
    );
  }, []);
  const refresh = useCallback(() => fetchAll().then(apply), [apply]);
  useEffect(() => {
    let alive = true;
    void fetchAll().then(r => alive && apply(r));
    return () => {
      alive = false;
    };
  }, [apply]);

  const sources = useMemo(() => new Map<string, Source>((full?.sources || []).map(s => [s.id, s])), [full]);
  const printings = useMemo(() => full?.printings || [], [full]);
  const result = useMemo(
    () =>
      applyRules(
        printings.map(p => ({ key: p.code, lang: p.lang, stamp: p.stamp, equivId: p.equiv_id })),
        rules,
      ),
    [printings, rules],
  );
  const shelves = useMemo(() => shelvesOf(printings, sources), [printings, sources]);
  const owned = useMemo(() => copiesByCode(copies), [copies]);
  const lit = useMemo(() => [...result.values()].filter(r => r.in).length, [result]);
  const missing = useMemo(() => printings.filter(p => result.get(p.code)?.in && !owned.has(p.code)).length, [printings, result, owned]);
  const outBy = useMemo(() => (active ? [...result.values()].filter(r => r.by === active).length : 0), [result, active]);

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
  const runImport = async () => {
    setImporting(true);
    try {
      await api.importDex(DEX);
      await refresh();
    } catch (e) {
      setLoad({ state: 'error', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setImporting(false);
    }
  };

  if (load.state === 'loading') return <Gate title="Abriendo la vitrina…" />;
  if (load.state === 'signedOut')
    return (
      <Gate
        title="Entra en Nitsu para armar tu colección"
        text="Arma tu colección usa tu cuenta de Nitsu para saber qué cartas tienes. No cambia nada de tu inventario."
      >
        <a className="primary" href={NITSU}>
          <LogIn size={16} strokeWidth={2} />
          Entrar en Nitsu
        </a>
      </Gate>
    );
  if (load.state === 'error')
    return (
      <Gate title="No pude abrir la vitrina" text={load.message}>
        <button type="button" className="primary" onClick={() => void refresh()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );
  if (!printings.length)
    return (
      <Gate
        title={`El Full de ${SPECIES} todavía está vacío`}
        text="Tráelo desde TCGdex, el catálogo de Nitsu, PokeCottage (solo texto) y Bulbapedia. Cada dato queda marcado con su fuente."
      >
        <button type="button" className="primary" disabled={importing} onClick={() => void runImport()}>
          <RefreshCw size={16} strokeWidth={2} className={importing ? 'spin' : ''} />
          {importing ? 'Trayendo el Full…' : `Traer el Full de ${SPECIES}`}
        </button>
      </Gate>
    );

  const sel = printings.find(p => p.code === selected) || null;
  const activeRule = RULES.find(r => r.id === active);
  const shelfPicture = sel ? (shelves.find(s => s.printings.includes(sel))?.picture ?? null) : null;
  return (
    <div className="app">
      <Rail
        species={SPECIES}
        dex={DEX}
        total={printings.length}
        rules={rules}
        active={active}
        onToggle={toggle}
        views={views}
        viewId={viewId}
        onView={pickView}
        onSave={saveView}
        onDelete={id => void deleteView(id)}
      />
      <main className="main">
        <header className="top">
          <p className="count" aria-live="polite">
            <span className="n">{lit.toLocaleString('es-CL')}</span>
            <span className="of"> / {printings.length.toLocaleString('es-CL')} bajo luz</span>
          </p>
          <p className="note">
            {activeRule ? (
              REDUCES(activeRule.id, rules) ? (
                <>
                  «{activeRule.label}» apagó {outBy.toLocaleString('es-CL')}. Siguen en la vitrina, fuera de tu colección.
                </>
              ) : (
                <>«{activeRule.label}» está desactivada: sus impresiones vuelven a la luz.</>
              )
            ) : (
              <>{viewId === 'full' ? 'El Full completo: todo bajo luz.' : 'Vista guardada aplicada.'}</>
            )}{' '}
            Te faltan {missing.toLocaleString('es-CL')}.
          </p>
          <ul className="legend" aria-label="Permiso de las fuentes">
            {(['ok', 'review', 'none', 'own'] as const).map(k => (
              <li key={k}>
                <span className={'sticker ' + STICKER[k].tone} aria-hidden="true" />
                {k === 'ok' ? 'Con permiso' : STICKER[k].label}
              </li>
            ))}
          </ul>
        </header>
        <Showcase shelves={shelves} result={result} sources={sources} copies={owned} selected={selected} onSelect={setSelected} />
      </main>
      <Detail
        p={sel}
        fallback={shelfPicture}
        result={sel ? result.get(sel.code) : undefined}
        copies={sel ? owned.get(sel.code) || [] : []}
        sources={sources}
      />
    </div>
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
