import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Upload } from 'lucide-react';
import { api, ApiError, type CatalogJob, type Full, type ReplaceCards, type Source } from './api.ts';
import { toLogin } from './auth.ts';
import { Gate } from './Cargar.tsx';
import { isOwnerAccount, Shell } from './components/Shell.tsx';
import { LANG_NAME, pictureOf, tagOf, withPhotoShows } from './model.ts';

// the Full shown in the case (the only one imported so far)
const DEX = 133;
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** one photo in use that can't go to production: a catalog card's or a printing of the Full */
interface Item {
  key: string;
  kind: 'card' | 'print';
  name: string;
  line: string;
  source: string;
  src: string;
  upload: (f: File) => Promise<unknown>;
}
type Kind = 'all' | Item['kind'];
type Load =
  | { state: 'loading' }
  | { state: 'notOwner' }
  | { state: 'error'; message: string }
  | { state: 'ready'; cards: ReplaceCards; full: Full | null };

/** "Por reemplazar" (fotos-solo-local-en-catalogo): the administrator's gallery of the photos to replace with their own */
export function Reemplazar() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [source, setSource] = useState<string>('all');
  const [kind, setKind] = useState<Kind>('all');
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [job, setJob] = useState<CatalogJob | null>(null);
  const alive = useRef(true);

  const fetchAll = useCallback(
    () =>
      isOwnerAccount().then(async owner => {
        if (!owner) {
          // without a session the API answers 401: to the way in; with another account, the notice
          const me = await api.me().catch(() => null);
          if (!me?.viewer) return toLogin();
          return setLoad({ state: 'notOwner' });
        }
        try {
          const [cards, full, j] = await Promise.all([api.replaceCards(), api.full(DEX).catch(() => null), api.catalogJob()]);
          setLoad({ state: 'ready', cards, full });
          setJob(j.job);
          setDone(new Set());
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) toLogin();
          else setLoad({ state: 'error', message: message(e) });
        }
      }),
    [],
  );
  useEffect(() => {
    alive.current = true;
    void fetchAll();
    return () => {
      alive.current = false;
    };
  }, [fetchAll]);

  // while the catalog download runs, its progress every 2 s; when it ends, the gallery again
  const poll = useCallback(async () => {
    for (;;) {
      await new Promise(r => setTimeout(r, 2000));
      if (!alive.current) return;
      const j = await api.catalogJob().catch(() => null);
      setJob(j?.job || null);
      if (!j?.job?.running) return void fetchAll();
    }
  }, [fetchAll]);
  // a download running (started here or before opening the page) is followed until it ends
  const polling = useRef(false);
  useEffect(() => {
    if (!job?.running || polling.current) return;
    polling.current = true;
    void poll().finally(() => (polling.current = false));
  }, [job?.running, poll]);
  const startJob = async () => {
    setError('');
    try {
      setJob(await api.startCatalogJob());
    } catch (e) {
      setError(message(e));
    }
  };

  const data = load.state === 'ready' ? load : null;
  const { items, prints } = useMemo(() => {
    if (!data) return { items: [] as Item[], prints: { total: 0, ready: 0 } };
    const cards: Item[] = data.cards.cards.map(c => ({
      key: 'card:' + c.card_id,
      kind: 'card',
      name: c.name,
      line: `${c.set_name} · #${c.num} · ${c.set_code || c.sid}`,
      source: c.source,
      src: c.src,
      upload: f => api.uploadCardPhoto(c.card_id, f),
    }));
    // the Full's printings: the same choice of picture as the case (pictureOf, with the photos' marks)
    const full = data.full;
    const sources = new Map<string, Source>((full?.sources || []).map(s => [s.id, s]));
    const localIds = new Set((full?.sources || []).filter(s => s.permission === 'local').map(s => s.id));
    const printings = withPhotoShows(full?.printings || [], full?.photoMarks || {});
    const withLocal = printings.filter(p => (p.facts.image || []).some(f => localIds.has(f.source)));
    const shown = withLocal.map(p => ({ p, pic: pictureOf(p, sources) }));
    const pending = shown.filter(x => x.pic?.local);
    const printItems: Item[] = pending.map(({ p, pic }) => ({
      key: 'print:' + p.code,
      kind: 'print',
      name: p.name || 'Eevee',
      line: `${p.set_name || p.set_key} · #${p.number} · ${LANG_NAME[p.lang] || p.lang} · ${tagOf(p)}`,
      source: pic!.source,
      src: pic!.src,
      upload: f => api.uploadPhoto(p.code, f),
    }));
    return { items: [...cards, ...printItems], prints: { total: withLocal.length, ready: withLocal.length - pending.length } };
  }, [data]);

  if (load.state === 'loading') return <Gate title="Abriendo Por reemplazar…" />;
  if (load.state === 'notOwner')
    return (
      <Shell path="/reemplazar" label="Navegación" rail={null} wide>
        <main className="main">
          <div className="case-msg" style={{ margin: 28 }}>
            <h2>Esta pantalla es solo para el administrador</h2>
            <p>Aquí se reemplazan las fotos que no pueden ir a producción, y eso lo hace la cuenta administradora.</p>
          </div>
        </main>
      </Shell>
    );
  if (load.state === 'error')
    return (
      <Gate title="No pude abrir Por reemplazar" text={load.message}>
        <button type="button" className="primary" onClick={() => void fetchAll()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );

  const d = load.cards;
  const pending = items.filter(i => !done.has(i.key));
  const total = d.total + prints.total;
  const ready = d.ready + prints.ready + done.size;
  const bySource = new Map<string, number>();
  for (const i of pending) bySource.set(i.source, (bySource.get(i.source) || 0) + 1);
  const ofKind = (k: Kind) => pending.filter(i => k === 'all' || i.kind === k).length;
  const shown = pending.filter(i => (source === 'all' || i.source === source) && (kind === 'all' || i.kind === kind));

  const replace = async (item: Item, file: File | undefined) => {
    if (!file) return;
    setBusy(item.key);
    setError('');
    try {
      await item.upload(file);
      setDone(s => new Set(s).add(item.key));
    } catch (e) {
      setError(`${item.name}: ${message(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Shell
      path="/reemplazar"
      label="Navegación y filtros"
      wide
      rail={
        <>
          <section aria-labelledby="src-h">
            <h2 id="src-h" className="rail-h">
              Fuente
            </h2>
            <ul className="picks">
              {[['all', 'Todas', pending.length] as const, ...[...bySource.entries()].map(([s, n]) => [s, s, n] as const)].map(
                ([id, label, n]) => (
                  <li key={id}>
                    <button
                      type="button"
                      className={'pick' + (source === id ? ' on' : '')}
                      aria-pressed={source === id}
                      onClick={() => setSource(id)}
                    >
                      <span>{label}</span>
                      <em>{n.toLocaleString('es-CL')}</em>
                    </button>
                  </li>
                ),
              )}
            </ul>
          </section>
          <section aria-labelledby="kind-h">
            <h2 id="kind-h" className="rail-h">
              Qué
            </h2>
            <ul className="picks">
              {(
                [
                  ['all', 'Todo'],
                  ['card', 'Cartas del catálogo'],
                  ['print', 'Impresiones del Full'],
                ] as const
              ).map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    className={'pick' + (kind === id ? ' on' : '')}
                    aria-pressed={kind === id}
                    onClick={() => setKind(id)}
                  >
                    <span>{label}</span>
                    <em>{ofKind(id).toLocaleString('es-CL')}</em>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      }
    >
      <main className="main">
        <header className="top load-top">
          <p className="count" aria-live="polite">
            <span className="n">{ready.toLocaleString('es-CL')}</span>
            <span className="of"> de {total.toLocaleString('es-CL')} listas para producción</span>
          </p>
          <p className="note">
            Fotos que hoy se ven pero solo sirven en tu computador. Sube la tuya y la carta queda lista para producción.
          </p>
          <div className="inv-tools">
            {d.localPhotos ? (
              <button type="button" className="ghost small" disabled={!!job?.running} onClick={() => void startJob()}>
                <Download size={15} strokeWidth={2} aria-hidden="true" />
                {job?.running ? 'Bajando…' : 'Bajar fotos locales del catálogo japonés'}
              </button>
            ) : null}
          </div>
        </header>
        {!d.localPhotos && (
          <p className="notice warn" style={{ margin: '14px 28px 0' }}>
            Las fotos solo locales están apagadas. Enciéndelas con <code>ARMA_FOTOS_LOCALES=1</code> en el <code>.env</code> y reinicia{' '}
            <code>pnpm arma</code>.
          </p>
        )}
        {job && (
          <p className="notice" style={{ margin: '14px 28px 0' }} role="status">
            {job.running ? `Bajando: ${job.current || '…'} · ` : 'Última descarga: '}
            {job.done.toLocaleString('es-CL')} de {job.sets.toLocaleString('es-CL')} expansiones · {job.fetched.toLocaleString('es-CL')}{' '}
            fotos nuevas · {job.missing.toLocaleString('es-CL')} que Limitless no tiene
            {job.failed ? ` · ${job.failed.toLocaleString('es-CL')} fallaron` : ''}
            {job.error ? ` · error: ${job.error}` : ''}
          </p>
        )}
        {error && (
          <p className="notice err" style={{ margin: '14px 28px 0' }} role="alert">
            {error}
          </p>
        )}
        <div className="case" role="region" aria-label="Fotos por reemplazar">
          {!shown.length ? (
            <div className="case-msg">
              <h2>{pending.length ? 'Nada con este filtro' : 'No queda nada por reemplazar'}</h2>
              <p>{pending.length ? 'Prueba con otra fuente.' : 'Todas las fotos que se ven pueden ir a producción.'}</p>
            </div>
          ) : (
            <ul className="row" style={{ padding: '16px 0' }}>
              {shown.map(i => (
                <li key={i.key} className="replace-item">
                  <span className="print" title={`${i.name} · ${i.line}`}>
                    <span className="art">
                      <img src={i.src} alt="" loading="lazy" decoding="async" />
                      <span className="local-mark" role="img" aria-label="Foto solo para uso local" />
                    </span>
                    <span className="tag">
                      <span className="tag-text">{i.name}</span>
                    </span>
                  </span>
                  <span className="replace-line">{i.line}</span>
                  <span className="replace-line">{i.source}</span>
                  <label className={'ghost small replace-up' + (busy === i.key ? ' busy' : '')}>
                    <Upload size={14} strokeWidth={2} aria-hidden="true" />
                    {busy === i.key ? 'Subiendo…' : 'Subir la mía'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={!!busy}
                      aria-label={`Subir tu foto de ${i.name} · ${i.line}`}
                      onChange={e => void replace(i, e.target.files?.[0])}
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </Shell>
  );
}
