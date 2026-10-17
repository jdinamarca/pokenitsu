import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONDS, LANGS, pickPrice, type PickedPrice } from '@pokenitsu/core';
import { RefreshCw } from 'lucide-react';
import { api, ApiError, type Inventory as InvData, type InvRow } from './api.ts';
import { toLogin } from './auth.ts';
import { Gate } from './Cargar.tsx';
import { CardPicture } from './components/CardPicture.tsx';
import { Shell } from './components/Shell.tsx';
import { navigate } from './router.ts';
import { clp, LANG_LABEL, setVariantLabels, rowFor, rowMatches, shelvesOf, VARIANT_LABEL, variantName, type ForFilter } from './load.ts';

const keyOf = (r: InvRow) => `${r.card_id}|${r.variant}|${r.lang}|${r.cond}|${r.loc}`;
const rowBody = (r: InvRow) => ({ sid: r.sid, num: r.num, variant: r.variant, lang: r.lang, cond: r.cond, loc: r.loc });
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const copies = (n: number) => `${n.toLocaleString('es-CL')} ${n === 1 ? 'copia' : 'copias'}`;
type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: InvData };

/** Mi inventario (canvas AR): one shelf per real box or binder, in the order they are kept */
export function Inventario() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  // a location already chosen when coming from Cajas y carpetas (?ubicacion=3, 0 = without one)
  const [loc, setLoc] = useState<'all' | number>(() => {
    const u = new URLSearchParams(location.search).get('ubicacion');
    return u != null && /^\d+$/.test(u) ? Number(u) : 'all';
  });
  const [q, setQ] = useState('');
  const [para, setPara] = useState<ForFilter>('all');
  const [sel, setSel] = useState<string | null>(null);

  const fetchInv = useCallback(
    () =>
      api.inventory().then(
        data => {
          setVariantLabels(data.labels);
          setLoad({ state: 'ready', data });
        },
        e => {
          if (e instanceof ApiError && e.status === 401) toLogin();
          else setLoad({ state: 'error', message: message(e) });
        },
      ),
    [],
  );
  useEffect(() => {
    void fetchInv();
  }, [fetchInv]);

  const data = load.state === 'ready' ? load.data : null;
  const priceOf = useCallback(
    (r: InvRow): PickedPrice | null =>
      data
        ? pickPrice(
            { usd: r.price_usd, eur: r.price_eur },
            r.variant,
            r.cond,
            data.cfg,
            data.fx,
            data.own[`${r.card_id}|${r.variant}`] ?? null,
          )
        : null,
    [data],
  );
  // the value for sale of some rows: the copies that aren't personal, at their price
  const valueOf = useCallback((rows: InvRow[]) => rows.reduce((n, r) => n + (priceOf(r)?.clp || 0) * (r.qty - r.personal), 0), [priceOf]);
  const all = useMemo(() => (data ? shelvesOf(data.rows, data.locations) : []), [data]);
  const filtering = !!q.trim() || para !== 'all';
  // a location that isn't the account's (or has no shelf) opens "Todas"
  const at = loc !== 'all' && all.some(s => s.id === loc) ? loc : 'all';
  const shelves = useMemo(
    () =>
      all
        .filter(s => at === 'all' || s.id === at)
        .map(s => ({ ...s, rows: s.rows.filter(r => rowMatches(r, q) && rowFor(r, para)) }))
        // with a filter on, the shelves left empty hide; without one, an empty location still shows its shelf
        .filter(s => s.rows.length || (!filtering && at !== 'all') || (!filtering && s.id !== 0)),
    [all, at, q, para, filtering],
  );
  const visible = useMemo(() => shelves.flatMap(s => s.rows), [shelves]);
  const selRow = (sel && visible.find(r => keyOf(r) === sel)) || visible[0] || null;

  if (load.state === 'loading') return <Gate title="Abriendo tu inventario…" />;
  if (load.state === 'error')
    return (
      <Gate title="No pude abrir tu inventario" text={load.message}>
        <button type="button" className="primary" onClick={() => void fetchInv()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );
  const d = load.data;
  const n = visible.reduce((a, r) => a + r.qty, 0);
  const cur = at === 'all' ? null : all.find(s => s.id === at) || null;
  const locName = (id: number) => d.locations.find(l => l.id === id)?.name || 'Sin ubicación';

  // after a change: the next card of the same shelf when this one leaves it
  const refresh = async (keepNext?: InvRow) => {
    const before = visible;
    await fetchInv();
    if (keepNext) {
      const i = before.findIndex(r => keyOf(r) === keyOf(keepNext));
      const next = before[i + 1] || before[i - 1];
      setSel(next ? keyOf(next) : null);
    }
  };

  return (
    <Shell
      path="/inventario"
      label="Navegación y ubicaciones"
      rail={
        <section aria-labelledby="locs-h">
          <h2 id="locs-h" className="rail-h">
            Dónde están
          </h2>
          <ul className="picks">
            {[{ id: 'all' as const, name: 'Todas', sub: 'Cada repisa es una caja o carpeta real', rows: d.rows }, ...all].map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  className={'pick' + (at === s.id ? ' on' : '')}
                  aria-pressed={at === s.id}
                  onClick={() => setLoc(s.id)}
                >
                  <span>{s.name}</span>
                  <em>{s.rows.reduce((a, r) => a + r.qty, 0).toLocaleString('es-CL')}</em>
                  <small>{s.sub}</small>
                </button>
              </li>
            ))}
          </ul>
          {!d.locations.length && (
            <p className="rail-empty">
              Tus cajas y carpetas se crean en{' '}
              <a
                href="/cajas"
                onClick={e => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navigate('/cajas');
                }}
              >
                Cajas y carpetas
              </a>
              .
            </p>
          )}
        </section>
      }
    >
      <main className="main">
        <header className="top load-top">
          <p className="count" aria-live="polite">
            <span className="n">{n.toLocaleString('es-CL')}</span>
            <span className="of"> {n === 1 ? 'copia' : 'copias'}</span>
          </p>
          <p className="note">
            {visible.length.toLocaleString('es-CL')} {visible.length === 1 ? 'carta distinta' : 'cartas distintas'} ·{' '}
            {clp(valueOf(visible))} para vender.{' '}
            {cur ? `${cur.sub}.` : 'Cada repisa es una caja o carpeta real, en el orden en que las tienes guardadas.'}
          </p>
          <div className="inv-tools">
            <input
              className="search"
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar: nombre, expansión, número…"
              aria-label="Buscar en el inventario"
            />
            <label className="chip-select">
              Para
              <select value={para} onChange={e => setPara(e.target.value as ForFilter)}>
                <option value="all">Todas</option>
                <option value="sale">Para vender</option>
                <option value="personal">Personales</option>
              </select>
            </label>
          </div>
        </header>
        <div className="case" role="region" aria-label="Estantería">
          {!shelves.length ? (
            <div className="case-msg">
              <h2>{filtering ? 'Nada calza con la búsqueda' : 'Todavía no tienes cartas'}</h2>
              <p>
                {filtering
                  ? 'Prueba con otro nombre o quita el filtro «Para».'
                  : 'Cárgalas en Cargar y aparecen aquí, en su caja o carpeta.'}
              </p>
            </div>
          ) : (
            shelves.map(s => (
              <section key={s.id} className="shelf" aria-label={s.name}>
                <header className="shelf-h">
                  <h3>{s.name}</h3>
                  <span>{s.sub}</span>
                  <span className="val">
                    {copies(s.rows.reduce((a, r) => a + r.qty, 0))} · {clp(valueOf(s.rows))}
                  </span>
                </header>
                {s.rows.length ? (
                  <ul className="row">
                    {s.rows.map(r => {
                      const k = keyOf(r);
                      const on = selRow && keyOf(selRow) === k;
                      return (
                        <li key={k}>
                          <button
                            type="button"
                            className={'print' + (on ? ' sel' : '')}
                            aria-pressed={!!on}
                            title={`${r.set_code || r.sid} ${r.num}`}
                            aria-label={`${r.name} · ${r.set_name} #${r.num} · ${LANG_LABEL[r.lang] || r.lang || 'sin idioma'} · ${variantName(r.variant)} · ${r.cond} · ${copies(r.qty)}`}
                            onClick={() => setSel(k)}
                          >
                            <span className="art">
                              <CardPicture
                                own={r.own_img}
                                ownCard={r.own_card}
                                img={r.img}
                                local={r.local}
                                reference={r.ref}
                                name={r.name}
                              />
                              {r.qty > 1 && <span className="owned">×{r.qty}</span>}
                            </span>
                            <span className="tag">
                              <span className="tag-text">
                                {r.lang || '—'} · {variantName(r.variant)}
                              </span>
                              <span>{r.cond}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rail-empty">Vacía.</p>
                )}
              </section>
            ))
          )}
        </div>
      </main>
      <aside className="detail" aria-label="Ficha de la copia">
        {selRow ? (
          <Sheet key={keyOf(selRow)} r={selRow} price={priceOf(selRow)} locations={d.locations} locName={locName} onChanged={refresh} />
        ) : (
          <p className="empty-detail">Elige una carta de una repisa para ver y editar sus copias.</p>
        )}
      </aside>
    </Shell>
  );
}

type Mode = null | 'move' | 'personal' | 'price';
function Sheet({
  r,
  price,
  locations,
  locName,
  onChanged,
}: {
  r: InvRow;
  price: PickedPrice | null;
  locations: InvData['locations'];
  locName: (id: number) => string;
  onChanged: (leaving?: InvRow) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [to, setTo] = useState({ loc: r.loc, variant: r.variant, lang: r.lang, cond: r.cond });
  const [n, setN] = useState(r.qty);
  const [pers, setPers] = useState(r.personal);
  const [usd, setUsd] = useState('');

  const run = async (fn: () => Promise<unknown>, leaving = false) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setMode(null);
      await onChanged(leaving ? r : undefined);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) toLogin();
      else setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const step = (delta: number) => run(() => api.add({ ...rowBody(r), delta }), r.qty + delta <= 0);
  const variants = [...new Set([...Object.keys(VARIANT_LABEL), r.variant])];

  return (
    <>
      <p className="code">
        {(r.set_code || r.sid).toUpperCase()} · {r.num} · {r.set_name}
      </p>
      <div className="big sheet-big">
        <CardPicture own={r.own_img} ownCard={r.own_card} img={r.img} local={r.local} reference={r.ref} name={r.name} big />
      </div>
      <h2 className="card-name">{r.name}</h2>
      <div className="own">
        <strong>{copies(r.qty)}</strong>
        {r.personal
          ? r.personal === r.qty
            ? 'Todas personales'
            : `${r.personal} personal${r.personal > 1 ? 'es' : ''} · ${r.qty - r.personal} para vender`
          : 'Para vender'}
      </div>
      <dl className="dl">
        <dt>Guardada en</dt>
        <dd>{locName(r.loc)}</dd>
        <dt>Variante</dt>
        <dd>{variantName(r.variant)}</dd>
        <dt>Idioma · estado</dt>
        <dd>
          {LANG_LABEL[r.lang] || r.lang || 'Sin idioma'} · {r.cond}
        </dd>
        <dt>Precio</dt>
        <dd>
          {price
            ? `${clp(price.clp)} · ${price.src === 'propio' ? 'tu precio' : price.src}${price.approx ? ' (aprox.)' : ''}`
            : 'Sin precio guardado'}
        </dd>
      </dl>
      <div className="buttons">
        <button type="button" className="ghost small" disabled={busy} onClick={() => void step(-1)} aria-label="Quitar una copia">
          −1
        </button>
        <button type="button" className="ghost small" disabled={busy} onClick={() => void step(1)} aria-label="Sumar una copia">
          +1
        </button>
        <button
          type="button"
          className="ghost small"
          aria-expanded={mode === 'move'}
          onClick={() => setMode(m => (m === 'move' ? null : 'move'))}
        >
          Mover…
        </button>
        <button
          type="button"
          className="ghost small"
          aria-expanded={mode === 'personal'}
          onClick={() => setMode(m => (m === 'personal' ? null : 'personal'))}
        >
          Personales
        </button>
        <button
          type="button"
          className="ghost small"
          aria-expanded={mode === 'price'}
          onClick={() => setMode(m => (m === 'price' ? null : 'price'))}
        >
          Mi precio
        </button>
      </div>
      {mode === 'move' && (
        <form
          className="sheet-form"
          onSubmit={e => {
            e.preventDefault();
            void run(() => api.move({ ...rowBody(r), to, n }), n >= r.qty);
          }}
        >
          <label>
            Ubicación
            <select value={to.loc} onChange={e => setTo({ ...to, loc: Number(e.target.value) })}>
              <option value={0}>Sin ubicación</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Variante
            <select value={to.variant} onChange={e => setTo({ ...to, variant: e.target.value })}>
              {variants.map(v => (
                <option key={v} value={v}>
                  {variantName(v)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Idioma
            <select value={to.lang} onChange={e => setTo({ ...to, lang: e.target.value })}>
              {!r.lang && <option value="">Sin idioma</option>}
              {LANGS.map(l => (
                <option key={l} value={l}>
                  {LANG_LABEL[l] || l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={to.cond} onChange={e => setTo({ ...to, cond: e.target.value })}>
              {CONDS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            ¿Cuántas de las {r.qty} copias?
            <input
              type="number"
              min={1}
              max={r.qty}
              value={n}
              onChange={e => setN(Math.max(1, Math.min(r.qty, Number(e.target.value) || 1)))}
            />
          </label>
          <div className="buttons">
            <button
              type="submit"
              className="primary"
              disabled={busy || (to.loc === r.loc && to.variant === r.variant && to.lang === r.lang && to.cond === r.cond)}
            >
              Mover {copies(n)}
            </button>
          </div>
        </form>
      )}
      {mode === 'personal' && (
        <form
          className="sheet-form"
          onSubmit={e => {
            e.preventDefault();
            void run(() => api.personal({ ...rowBody(r), personal: pers }));
          }}
        >
          <label>
            ¿Cuántas de las {r.qty} son de tu colección personal?
            <input
              type="number"
              min={0}
              max={r.qty}
              value={pers}
              onChange={e => setPers(Math.max(0, Math.min(r.qty, Number(e.target.value) || 0)))}
            />
          </label>
          <div className="buttons">
            <button type="submit" className="primary" disabled={busy || pers === r.personal}>
              Guardar
            </button>
          </div>
        </form>
      )}
      {mode === 'price' && (
        <form
          className="sheet-form"
          onSubmit={e => {
            e.preventDefault();
            void run(() => api.ownPrice({ sid: r.sid, num: r.num, variant: r.variant, usd: usd.trim() === '' ? '' : Number(usd) }));
          }}
        >
          <label>
            Tu precio en NM (US$)
            <input type="number" min={0} step="0.01" value={usd} onChange={e => setUsd(e.target.value)} placeholder="vacío = mercado" />
          </label>
          <p className="preview muted">Se guarda en pesos con el tipo de cambio del día. Vacío vuelve al precio de mercado.</p>
          <div className="buttons">
            <button type="submit" className="primary" disabled={busy || (usd.trim() !== '' && !(Number(usd) >= 0))}>
              {usd.trim() === '' ? 'Volver al precio de mercado' : 'Guardar mi precio'}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="notice err" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
