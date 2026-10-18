import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { describeRule, eraOf, locationShadows, pickPrice, ruleChips, ruleScore, suggestedLocations } from '@pokenitsu/core';
import { Plus, RefreshCw, Wand2 } from 'lucide-react';
import { api, ApiError, type CardSet, type Inventory as InvData, type InvLocation, type InvRow } from './api.ts';
import { toLogin } from './auth.ts';
import { Gate } from './Cargar.tsx';
import { LocationForm } from './components/LocationForm.tsx';
import { Modal } from './components/Modal.tsx';
import { Shell } from './components/Shell.tsx';
import { asFull, KIND, kindOf, locColor, locationStats, NO_STATS, planFor, sorted, textCtx, type LocStats } from './cajas.ts';
import { clp } from './load.ts';
import { navigate } from './router.ts';

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const fmt = (n: number) => n.toLocaleString('es-CL');
const copiesWord = (n: number) => `${fmt(n)} ${n === 1 ? 'copia' : 'copias'}`;
const cardsWord = (n: number) => `${fmt(n)} ${n === 1 ? 'carta' : 'cartas'}`;
type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: InvData; sets: CardSet[] };
type Dialog = null | { kind: 'form'; loc: InvLocation | null } | { kind: 'delete'; loc: InvLocation } | { kind: 'assign' };

/** Cajas y carpetas (cajas-y-carpetas-en-arma): the account's boxes and binders on shelves, as Nitsu's Ubicaciones */
export function Cajas() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [sel, setSel] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  // "¿Cómo decide…?": open while there are none, until the user folds or unfolds it (null = still automatic)
  const [how, setHow] = useState<boolean | null>(null);
  const detail = useRef<HTMLElement>(null);

  const fetchAll = useCallback(
    () =>
      Promise.all([api.inventory(), api.sets()]).then(
        ([data, s]) => setLoad({ state: 'ready', data, sets: s.sets }),
        e => {
          if (e instanceof ApiError && e.status === 401) toLogin();
          else setLoad({ state: 'error', message: message(e) });
        },
      ),
    [],
  );
  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const data = load.state === 'ready' ? load.data : null;
  const sets = useMemo(() => (load.state === 'ready' ? load.sets : []), [load]);
  const price = useCallback(
    (r: InvRow) =>
      data
        ? (pickPrice(
            { usd: r.price_usd, eur: r.price_eur },
            r.variant,
            r.cond,
            data.cfg,
            data.fx,
            data.own[`${r.card_id}|${r.variant}`] ?? null,
          )?.clp ?? null)
        : null,
    [data],
  );
  const locs = useMemo(() => (data ? sorted(data.locations) : []), [data]);
  const full = useMemo(() => locs.map(asFull), [locs]);
  const stats = useMemo(
    () => (data ? locationStats(data.rows, locs, r => price(r) || 0) : new Map<number, LocStats>()),
    [data, locs, price],
  );
  const plan = useMemo(() => (data ? planFor(data.rows, locs, price) : []), [data, locs, price]);
  const ctx = useMemo(() => textCtx(sets), [sets]);
  const S = (id: number) => stats.get(id) || NO_STATS;
  const chosen = locs.find(l => l.id === sel) || locs.find(l => S(l.id).qty) || locs[0] || null;

  if (load.state === 'loading') return <Gate title="Abriendo tus cajas…" />;
  if (load.state === 'error')
    return (
      <Gate title="No pude abrir tus cajas" text={load.message}>
        <button type="button" className="primary" onClick={() => void fetchAll()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );

  const total = load.data.rows.reduce((a, r) => a + r.qty, 0);
  const value = [...stats.values()].reduce((a, s) => a + s.value, 0);
  const none = S(0).qty;
  const placeable = plan.reduce((a, p) => a + p.row.qty, 0);
  const withCards = locs.filter(l => S(l.id).qty);
  const empty = locs.filter(l => !S(l.id).qty);

  const choose = (id: number) => {
    setSel(id);
    setError('');
    // on a phone the sheet sits below the shelves: bring it into view
    if (matchMedia('(max-width: 900px)').matches)
      requestAnimationFrame(() =>
        detail.current?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        }),
      );
  };
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await fetchAll();
      if (done) setToast(done);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) toLogin();
      else setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const moveBy = (l: InvLocation, d: -1 | 1) => {
    const ids = locs.map(x => x.id);
    const i = ids.indexOf(l.id);
    [ids[i], ids[i + d]] = [ids[i + d]!, ids[i]!];
    void run(() => api.orderLocations(ids));
  };
  const seed = () =>
    run(async () => {
      let first: number | null = null;
      for (const l of suggestedLocations(load.data.cfg.alert || 5000, clp)) {
        const { id } = await api.createLocation(l);
        first ??= id;
      }
      setSel(first);
    }, 'Listo. Ajusta los nombres y las reglas a tus cajas reales.');

  return (
    <Shell
      path="/cajas"
      label="Navegación y cajas"
      rail={
        <section aria-labelledby="cajas-h" className="cajas-rail">
          <h2 id="cajas-h" className="rail-h">
            Tus cajas y carpetas
          </h2>
          <button type="button" className="primary new-loc" onClick={() => setDialog({ kind: 'form', loc: null })}>
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            Nueva caja o carpeta
          </button>
          <p className="rail-empty">
            Al cargar, cada carta va a la caja o carpeta más específica que la acepte. Lo que cambies aquí también se ve en Nitsu.
          </p>
        </section>
      }
    >
      <main className="main">
        <header className="top">
          <p className="count" aria-live="polite">
            <span className="n">{fmt(locs.length)}</span>
            <span className="of"> {locs.length === 1 ? 'ubicación' : 'ubicaciones'}</span>
          </p>
          <p className="note">
            {copiesWord(total)}
            {value ? ` · ${clp(value)}` : ''}. Toca una caja o carpeta para ver qué guarda y editarla.
          </p>
        </header>
        <div className="cajas-body">
          {none > 0 && (
            <div className="banner" role="status">
              <p>
                <b>{copiesWord(none)} sin ubicación.</b>{' '}
                {placeable ? `Tus reglas pueden ubicar ${fmt(placeable)}.` : 'Ninguna calza con tus reglas.'}
              </p>
              <div className="banner-acts">
                {placeable > 0 && (
                  <button type="button" className="primary" disabled={busy} onClick={() => setDialog({ kind: 'assign' })}>
                    <Wand2 size={16} strokeWidth={2} aria-hidden="true" />
                    Asignar automáticamente
                  </button>
                )}
                <button type="button" className="ghost" onClick={() => navigate('/inventario?ubicacion=0')}>
                  Ver cuáles son
                </button>
              </div>
            </div>
          )}
          <details
            className="how"
            open={how ?? !locs.length} // only the user's own folding sticks: React opening or closing it on its own fires toggle too
            onToggle={e => {
              const open = e.currentTarget.open;
              if (open !== (how ?? !locs.length)) setHow(open);
            }}
          >
            <summary>¿Cómo decide dónde va cada carta?</summary>
            <ul>
              <li>
                Entre las cajas y carpetas cuya regla acepta la carta, gana la más específica: colección personal, después especiales o
                precio, expansión nombrada, serie, solo challa, región y, al final, la caja general. El orden de la lista solo desempata.
              </li>
              <li>
                Orden recomendado: lo personal y lo valioso en carpetas; la challa en cajas, una por serie, con un separador por expansión.
              </li>
              <li>Dentro de cada caja o carpeta, por expansión en orden de salida y, dentro, por número.</li>
              <li>Una ubicación «solo a mano» nunca recibe cartas sola: las pones tú desde Mi inventario o al cargar.</li>
            </ul>
          </details>
          {!locs.length ? (
            <div className="case-msg cajas-empty">
              <h2>Aún no tienes cajas ni carpetas</h2>
              <p>Empieza con el orden sugerido: 2 carpetas y 6 cajas por serie. Después cambias los nombres y las reglas.</p>
              <button type="button" className="primary" disabled={busy} onClick={() => void seed()}>
                {busy ? 'Creando…' : 'Crear el orden sugerido'}
              </button>
            </div>
          ) : (
            <div className="stand" role="region" aria-label="Estante de cajas y carpetas">
              {[
                { list: withCards, label: 'Con cartas', low: false },
                { list: empty, label: 'Vacías por ahora', low: true },
              ]
                .filter(s => s.list.length)
                .map(s => (
                  <div key={s.label}>
                    <div className={'boards' + (s.low ? ' low' : '')}>
                      {s.list.map(l => (
                        <LocItem
                          key={l.id}
                          l={l}
                          s={S(l.id)}
                          color={locColor(l, locs.indexOf(l))}
                          i={locs.indexOf(l)}
                          on={chosen?.id === l.id}
                          onClick={() => choose(l.id)}
                        />
                      ))}
                    </div>
                    <p className="boards-label">{s.label}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
        {toast && (
          <p className="toast" role="status">
            {toast}
          </p>
        )}
      </main>
      <aside className="detail loc-detail" aria-label="Ficha de la ubicación" ref={detail}>
        {chosen ? (
          <LocSheet
            key={chosen.id}
            l={chosen}
            index={locs.indexOf(chosen)}
            count={locs.length}
            s={S(chosen.id)}
            chips={ruleChips(chosen.rule, ctx)}
            rule={describeRule(chosen.rule, ctx)}
            shadows={locationShadows(full, full[locs.indexOf(chosen)]!, ctx).map(x => ({
              ...x,
              pos: full.indexOf(x.by) + 1,
              tie: ruleScore(x.by.rule) === ruleScore(chosen.rule),
            }))}
            busy={busy}
            error={error}
            onEdit={() => setDialog({ kind: 'form', loc: chosen })}
            onMove={d => moveBy(chosen, d)}
            onDelete={() => setDialog({ kind: 'delete', loc: chosen })}
          />
        ) : (
          <p className="empty-detail">Cuando crees tus cajas y carpetas, aquí ves qué guarda cada una.</p>
        )}
      </aside>
      {dialog?.kind === 'form' && (
        <LocationForm
          loc={dialog.loc}
          sets={sets}
          onClose={() => setDialog(null)}
          onSaved={id => {
            setDialog(null);
            setSel(id);
            void fetchAll();
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Modal title={`¿Borrar «${dialog.loc.name}»?`} onClose={() => setDialog(null)}>
          <p className="modal-text">
            {S(dialog.loc.id).qty
              ? `Sus ${copiesWord(S(dialog.loc.id).qty)} quedan sin ubicación; no se pierden. Después puedes asignarlas a otra caja.`
              : 'Está vacía: no mueve ninguna carta.'}
          </p>
          <div className="modal-acts">
            <button type="button" className="ghost" onClick={() => setDialog(null)} autoFocus>
              Cancelar
            </button>
            <button
              type="button"
              className="primary danger"
              disabled={busy}
              onClick={async () => {
                const l = dialog.loc;
                setDialog(null);
                setSel(null);
                await run(() => api.deleteLocation(l.id), `Borraste «${l.name}»`);
              }}
            >
              Borrar
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'assign' && (
        <Modal title={`Asignar ubicación a ${copiesWord(placeable)}`} onClose={() => setDialog(null)}>
          <ul className="assign-list">
            {assignSummary(plan, locs, sets).map(x => (
              <li key={x.loc.id}>
                <b>
                  {KIND[kindOf(x.loc.kind)].icon} {x.loc.name}
                </b>
                <span>{copiesWord(x.n)}</span>
                <small>{x.eras.map(([era, n]) => `${era} ${fmt(n)}`).join(' · ')}</small>
              </li>
            ))}
          </ul>
          <p className="modal-text">
            Esto solo lo anota en la app: después guarda las cartas físicamente ahí. En Mi inventario cada caja te muestra cuáles son.
          </p>
          <div className="modal-acts">
            <button type="button" className="ghost" onClick={() => setDialog(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              autoFocus
              onClick={async () => {
                setDialog(null);
                await run(
                  () =>
                    api.moveLocs(
                      plan.map(p => ({
                        sid: p.row.sid,
                        num: p.row.num,
                        variant: p.row.variant,
                        lang: p.row.lang,
                        cond: p.row.cond,
                        loc: p.row.loc,
                        to: p.to,
                      })),
                    ),
                  `${copiesWord(placeable)} con ubicación`,
                );
              }}
            >
              Asignar
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  );
}

/** how many copies go to each location, by series, in list order */
function assignSummary(plan: { row: InvRow; to: number }[], locs: InvLocation[], sets: CardSet[]) {
  const byId = new Map(sets.map(s => [s.id, s]));
  const per = new Map<number, { n: number; eras: Map<string, number> }>();
  for (const p of plan) {
    const e = per.get(p.to) || { n: 0, eras: new Map<string, number>() };
    const era =
      eraOf(byId.get(p.row.sid) || { id: p.row.sid, source: p.row.set_source, series: p.row.set_series, code: p.row.set_code }) ||
      'sin serie';
    e.n += p.row.qty;
    e.eras.set(era, (e.eras.get(era) || 0) + p.row.qty);
    per.set(p.to, e);
  }
  return locs.filter(l => per.has(l.id)).map(l => ({ loc: l, n: per.get(l.id)!.n, eras: [...per.get(l.id)!.eras] }));
}

/** a binder standing on the shelf, or a box with its lid and label */
function LocItem({
  l,
  s,
  color,
  i,
  on,
  onClick,
}: {
  l: InvLocation;
  s: LocStats;
  color: string;
  i: number;
  on: boolean;
  onClick: () => void;
}) {
  const kind = kindOf(l.kind);
  const peek = s.cards.length ? (
    <span className="peek" aria-hidden="true">
      {s.cards.slice(0, 3).map(src => (
        <img key={src} src={src} alt="" loading="lazy" decoding="async" />
      ))}
    </span>
  ) : null;
  return (
    <button
      type="button"
      className={`lb ${kind === 'binder' ? 'bnd' : 'bx'}${s.qty ? '' : ' empty'}${on ? ' sel' : ''}`}
      style={{ '--c': color, '--i': i } as React.CSSProperties}
      aria-pressed={on}
      aria-label={`${KIND[kind].name} ${l.name}: ${cardsWord(s.qty)}`}
      title={l.name}
      onClick={onClick}
    >
      {kind === 'binder' ? (
        <span className="binder">
          {peek}
          <span className="sp">
            <span>{l.name.replace(/^carpeta\s+/i, '')}</span>
            <span>{fmt(s.qty)}</span>
          </span>
        </span>
      ) : (
        <span className="box">
          {peek}
          <span className="lid" />
          <span className="bd" />
          <span className="tg">
            {l.name}
            <small>
              {cardsWord(s.qty)}
              {s.value ? ` · ${clp(s.value)}` : ''}
            </small>
          </span>
        </span>
      )}
    </button>
  );
}

function LocSheet({
  l,
  index,
  count,
  s,
  chips,
  rule,
  shadows,
  busy,
  error,
  onEdit,
  onMove,
  onDelete,
}: {
  l: InvLocation;
  index: number;
  count: number;
  s: LocStats;
  chips: string[];
  rule: string;
  shadows: { by: { name: string }; what: string; pos: number; tie: boolean }[];
  busy: boolean;
  error: string;
  onEdit: () => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const kind = KIND[kindOf(l.kind)];
  return (
    <div className="loc-sheet">
      <p className="code">
        {kind.icon} {kind.name} · #{index + 1} en la lista
      </p>
      <h2 className="card-name">{l.name}</h2>
      <div className="loc-big">
        <div>
          <b>{fmt(s.qty)}</b>
          <span>{s.qty === 1 ? 'carta' : 'cartas'}</span>
        </div>
        <div>
          <b>{fmt(s.sets)}</b>
          <span>{s.sets === 1 ? 'expansión' : 'expansiones'}</span>
        </div>
        {s.value > 0 && (
          <div>
            <b>{clp(s.value)}</b>
            <span>valor</span>
          </div>
        )}
      </div>
      {s.cards.length > 0 && (
        <div className="loc-thumbs">
          {s.cards.slice(0, 6).map(src => (
            <img key={src} src={src} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
      )}
      <div>
        <p className="rail-h loc-k">Recibe</p>
        <ul className="loc-chips" title={rule} aria-label={rule}>
          {chips.map(c => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="loc-rule">{rule}</p>
      </div>
      {shadows.map(x => (
        <p key={x.by.name + x.what} className="loc-warn" role="note">
          ⚠️ {x.what}: no llegan aquí, antes las toma “{x.by.name}” (#{x.pos}). Quítalas de esa regla{x.tie ? ' o sube esta con ↑' : ''}.
        </p>
      ))}
      {l.note && <p className="loc-note">{l.note}</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="loc-acts">
        <button type="button" className="primary" onClick={() => navigate(`/inventario?ubicacion=${l.id}`)}>
          {s.qty ? `Ver ${s.qty === 1 ? 'la carta' : `las ${fmt(s.qty)} cartas`}` : 'Ver cartas'}
        </button>
        <button type="button" className="ghost" onClick={onEdit}>
          Editar
        </button>
        <button
          type="button"
          className="ghost"
          disabled={busy || index === 0}
          onClick={() => onMove(-1)}
          aria-label="Subir"
          title="Subir (solo importa si empata con otra)"
        >
          ↑
        </button>
        <button
          type="button"
          className="ghost"
          disabled={busy || index === count - 1}
          onClick={() => onMove(1)}
          aria-label="Bajar"
          title="Bajar (solo importa si empata con otra)"
        >
          ↓
        </button>
        <button type="button" className="ghost danger" disabled={busy} onClick={onDelete}>
          Borrar
        </button>
      </div>
    </div>
  );
}
