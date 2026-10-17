import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  autoVariant,
  CONDS,
  expandRange,
  indexNumbers,
  langCode,
  LANGS,
  resolveEntry,
  searchSetsLang,
  type Cond,
  type Entry,
  type Lang,
} from '@pokenitsu/core';
import { Plus, RefreshCw, Search, Undo2 } from 'lucide-react';
import { api, ApiError, type CardSet, type InvLocation, type SetCard, type SetCards } from './api.ts';
import { toLogin } from './auth.ts';
import { CardPicture } from './components/CardPicture.tsx';
import { Shell } from './components/Shell.tsx';
import {
  cardQty,
  COND_LABEL,
  setVariantLabels,
  LANG_LABEL,
  litCount,
  planRow,
  setLine,
  variantName,
  withRow,
  type LoadRow,
  type Session,
} from './load.ts';

// the load session and the recent expansions, remembered in this browser (a convenience: without storage, the defaults)
type Recent = { id: string; lang: Lang };
interface Saved {
  session: Session;
  recents: Recent[];
}
const KEY = 'arma.cargar';
const DEFAULTS: Saved = { session: { lang: 'ES', cond: 'NM', personal: false, dest: 'auto' }, recents: [] };
function readSaved(): Saved {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Saved> | null;
    if (j?.session) return { session: { ...DEFAULTS.session, ...j.session }, recents: (j.recents || []).slice(0, 8) };
  } catch {
    /* private window or old data: the defaults */
  }
  return DEFAULTS;
}
function writeSaved(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* only for this visit */
  }
}
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const copies = (n: number) => `${n.toLocaleString('es-CL')} ${Math.abs(n) === 1 ? 'copia' : 'copias'}`;
type Tone = '' | 'warn' | 'err';
type EntryLike = Pick<Entry, 'v' | 'cond' | 'sign' | 'qty'>;
const ONE: EntryLike = { v: null, cond: null, sign: 1, qty: 1 };
// what the session block counts: each load (a card or a whole range)
type Loaded = { copies: number; fresh: number; last: string };

/** Cargar (canvas AO): the chosen expansion whole in the case, what you have lit and what you miss in the dark */
export function Cargar() {
  const [sets, setSets] = useState<CardSet[] | null>(null);
  const [locations, setLocations] = useState<InvLocation[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [saved, setSaved] = useState(readSaved);
  const session = saved.session;
  const [setId, setSetId] = useState<string | null>(() => readSaved().recents[0]?.id ?? null);
  const [data, setData] = useState<SetCards | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>(() => (readSaved().recents.length ? 'loading' : 'idle'));
  const [loadError, setLoadError] = useState('');
  const [picking, setPicking] = useState(() => !readSaved().recents.length);
  const [query, setQuery] = useState('');
  const [resSel, setResSel] = useState(0);
  const [text, setText] = useState('');
  const [lastNum, setLastNum] = useState<string | null>(null);
  const [freshNum, setFreshNum] = useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: Tone } | null>(null);
  const [pending, setPending] = useState<{ entry: Entry; nums: string[]; skipped: number[]; raw: string } | null>(null);
  const [loaded, setLoaded] = useState<Loaded[]>([]);
  // read by the queued writes, which run after the render that queued them
  const dataRef = useRef<SetCards | null>(null);
  const setIdRef = useRef<string | null>(setId);
  const lastEntry = useRef<{ raw: string; set: string } | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const entryRef = useRef<HTMLInputElement>(null);

  const say = (text: string, tone: Tone = '') => setNotice({ text, tone });
  const authOr = useCallback((e: unknown, other: (m: string) => void) => {
    if (e instanceof ApiError && e.status === 401) toLogin();
    else other(message(e));
  }, []);
  const putData = (d: SetCards | null) => {
    if (d) setVariantLabels(d.labels);
    dataRef.current = d;
    setData(d);
  };
  const updateCard = (num: string, fn: (c: SetCard) => SetCard) => {
    const d = dataRef.current;
    if (d) putData({ ...d, cards: d.cards.map(c => (c.num === num ? fn(c) : c)) });
  };
  const updateSaved = (fn: (s: Saved) => Saved) =>
    setSaved(s => {
      const next = fn(s);
      writeSaved(next);
      return next;
    });
  const setSession = (patch: Partial<Session>) => updateSaved(s => ({ ...s, session: { ...s.session, ...patch } }));

  const openSet = useCallback(
    (id: string) => {
      setIdRef.current = id;
      setSetId(id);
      setStatus('loading');
      setLoadError('');
      putData(null);
      api.setCards(id).then(
        d => {
          if (setIdRef.current !== id) return;
          putData(d);
          setStatus('idle');
        },
        e =>
          authOr(e, m => {
            if (setIdRef.current !== id) return;
            setLoadError(m);
            setStatus('error');
          }),
      );
    },
    [authOr],
  );

  useEffect(() => {
    let alive = true;
    Promise.all([api.sets(), api.inventory()]).then(
      ([s, inv]) => {
        if (!alive) return;
        setSets(s.sets);
        setLocations([...inv.locations].sort((a, b) => a.pos - b.pos || a.id - b.id));
        const last = readSaved().recents[0];
        if (last && s.sets.some(x => x.id === last.id)) openSet(last.id);
        else {
          setStatus('idle');
          setPicking(true);
        }
      },
      e => alive && authOr(e, setFatal),
    );
    return () => {
      alive = false;
    };
  }, [openSet, authOr]);

  const set = useMemo(() => sets?.find(s => s.id === setId) || null, [sets, setId]);
  const cards = useMemo(() => data?.cards || [], [data]);
  const index = useMemo(() => indexNumbers(cards.map(c => c.num)), [cards]);
  const byNum = useMemo(() => new Map(cards.map(c => [c.num, c])), [cards]);
  const ctx = useMemo(() => (set && data ? { set, locations, cfg: data.cfg, fx: data.fx, own: data.own } : null), [set, data, locations]);
  const resolved = useMemo(() => (data ? resolveEntry(text, index) : null), [data, text, index]);
  const focusNum = resolved?.kind === 'card' ? resolved.num : lastNum;
  const focus = focusNum ? byNum.get(focusNum) || null : null;
  const results = useMemo(() => (sets && picking ? searchSetsLang(sets, query) : { sets: [], lang: null }), [sets, picking, query]);
  const count = useMemo(() => (set ? litCount(set, cards) : { have: 0, total: 0 }), [set, cards]);
  const shown = useMemo(() => (onlyMissing ? cards.filter(c => !cardQty(c) || c.num === focusNum) : cards), [cards, onlyMissing, focusNum]);

  // the marked card comes into view while typing
  useEffect(() => {
    if (focusNum) document.querySelector(`[data-num="${CSS.escape(focusNum)}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [focusNum]);

  const locName = (id: number) => locations.find(l => l.id === id)?.name || 'sin ubicación';
  const describe = (card: SetCard, r: LoadRow) =>
    `${card.name} #${card.num} ${variantName(r.variant)} · ${r.lang} · ${r.cond} → ${locName(r.loc)}`;

  // every write goes in order, one after the other, as in Nitsu
  const enqueue = (fn: () => Promise<void>) => {
    queue.current = queue.current.then(fn).catch(e => authOr(e, m => say(m, 'err')));
  };
  async function loadOne(num: string, e: EntryLike, batch?: string) {
    const card = dataRef.current?.cards.find(c => c.num === num);
    if (!card || !ctx) return null;
    const row = planRow(card, e, session, ctx);
    const wasNew = cardQty(card) === 0;
    const r = await api.add({ ...row, delta: e.sign * e.qty, personal: session.personal, ...(batch ? { batch } : {}) });
    if (setIdRef.current === card.sid) updateCard(num, c => withRow(c, r));
    return { real: r.real, fresh: wasNew && r.real > 0, row, card };
  }
  function runOne(num: string, e: EntryLike, raw: string, repeated: boolean) {
    const sid = setIdRef.current!;
    enqueue(async () => {
      const r = await loadOne(num, e);
      if (!r) return;
      if (!r.real) return say('No había copias de esa carta para quitar.', 'warn');
      lastEntry.current = { raw, set: sid };
      setLoaded(l => [...l, { copies: r.real, fresh: r.fresh ? 1 : 0, last: `${r.card.name} #${r.card.num}` }]);
      setLastNum(num);
      setFreshNum(r.fresh ? num : null);
      say(`${repeated ? `Repetido: ${raw.trim()} · ` : ''}${r.real > 0 ? '+' : ''}${r.real} · ${describe(r.card, r.row)}`);
    });
  }
  function runRange(entry: Entry, nums: string[], skipped: number[], raw: string) {
    const sid = setIdRef.current!;
    const batch = crypto.randomUUID();
    enqueue(async () => {
      let total = 0,
        fresh = 0,
        none = 0,
        last: string | null = null;
      for (const num of nums) {
        const r = await loadOne(num, entry, batch);
        if (!r?.real) {
          none++;
          continue;
        }
        total += r.real;
        if (r.fresh) fresh++;
        last = num;
      }
      if (!last) return say('No había copias de esas cartas para quitar.', 'warn');
      lastEntry.current = { raw, set: sid };
      const lastCard = dataRef.current?.cards.find(c => c.num === last);
      setLoaded(l => [...l, { copies: total, fresh, last: `${lastCard?.name || ''} #${last}` }]);
      setLastNum(last);
      setFreshNum(null);
      const extra = [
        skipped.length ? `${skipped.length} saltadas (no existen)` : '',
        none ? `${none} sin copias para quitar` : '',
        fresh ? `${fresh} ${fresh === 1 ? 'nueva' : 'nuevas'}` : '',
      ].filter(Boolean);
      say(
        `${total > 0 ? '+' : ''}${copies(total)} de ${nums.length - none} cartas (${entry.range!.from}–${entry.range!.to})${extra.length ? ' · ' + extra.join(' · ') : ''}`,
        skipped.length || none ? 'warn' : '',
      );
    });
  }
  function undo() {
    const sid = setIdRef.current;
    enqueue(async () => {
      const u = await api.undo();
      if (!u.undone) return say('No hay nada que deshacer.', 'warn');
      for (const r of u.rows) if (r.sid === sid) updateCard(r.num, c => withRow(c, r));
      setLoaded(l => l.slice(0, -1));
      setFreshNum(null);
      if (u.rows[0]?.sid === sid) setLastNum(u.rows[u.rows.length - 1]!.num);
      say(u.rows.length > 1 ? `Deshecho el rango: ${u.rows.length} cartas.` : `Deshecho: ${u.rows[0]?.sid} #${u.rows[0]?.num}.`);
    });
  }

  function commit() {
    if (!set || !data) return;
    let raw = text,
      repeated = false;
    if (!raw.trim()) {
      // Enter on an empty box repeats the last entry (same expansion only)
      const l = lastEntry.current;
      if (!l || l.set !== set.id) return;
      raw = l.raw;
      repeated = true;
    }
    const r = resolveEntry(raw, index);
    if (r.kind === 'empty') return;
    if (r.kind === 'lang') {
      setSession({ lang: r.lang });
      setText('');
      return say(`Idioma: ${LANG_LABEL[r.lang] || r.lang}`);
    }
    if (r.kind === 'cond') {
      setSession({ cond: r.cond });
      setText('');
      return say(`Estado: ${COND_LABEL[r.cond]} (${r.cond})`, r.cond === 'NM' ? '' : 'warn');
    }
    if (r.kind === 'bad') return say('No entendí la entrada.', 'err');
    if (r.kind === 'missing') return say(`La carta «${r.entry.full}» no existe en ${set.name}. ¿Expansión equivocada?`, 'err');
    setText('');
    if (r.kind === 'range') {
      const x = expandRange(index, r.entry.range!);
      if (!x.nums.length) return say(`Ningún número del ${r.entry.range!.from} al ${r.entry.range!.to} existe en ${set.name}.`, 'err');
      if (x.confirm) return setPending({ entry: r.entry, nums: x.nums, skipped: x.skipped, raw });
      return runRange(r.entry, x.nums, x.skipped, raw);
    }
    runOne(r.num, r.entry, raw, repeated);
  }

  function chooseSet(s: CardSet, suffixLang: Lang | null) {
    // a language suffix ("MEW ES") changes the session's; a single-language expansion sets its own
    const lang = suffixLang || langCode(s.lang) || session.lang;
    updateSaved(sv => ({
      session: { ...sv.session, lang },
      recents: [{ id: s.id, lang }, ...sv.recents.filter(r => r.id !== s.id)].slice(0, 8),
    }));
    setPicking(false);
    setQuery('');
    setResSel(0);
    setText('');
    setLastNum(null);
    setFreshNum(null);
    setPending(null);
    setNotice(null);
    lastEntry.current = null;
    if (s.id !== setId || status === 'error' || !data) openSet(s.id);
    requestAnimationFrame(() => entryRef.current?.focus());
  }
  const openPicker = () => {
    setPicking(true);
    requestAnimationFrame(() => entryRef.current?.focus());
  };
  const pickCard = (card: SetCard) => {
    // the first click marks it, like typing its number; the second loads one copy
    if (focusNum === card.num) {
      setText('');
      runOne(card.num, ONE, card.num, false);
    } else setText(card.num);
    entryRef.current?.focus();
  };

  const onEntryKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (picking) {
      const list = results.sets;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setResSel(i => (list.length ? (i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length : 0));
      } else if (e.key === 'Enter' && list.length) chooseSet(list[Math.min(resSel, list.length - 1)]!, results.lang as Lang | null);
      else if (e.key === 'Escape' && set) {
        setPicking(false);
        setQuery('');
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      if (text) setText('');
      else openPicker();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !text) {
      e.preventDefault();
      undo();
    }
  };

  // what Enter would do, without doing it
  const preview = useMemo((): { text: string; muted?: boolean } | null => {
    if (!resolved || !ctx || !set) return null;
    switch (resolved.kind) {
      case 'lang':
        return { text: `Enter cambia el idioma a ${LANG_LABEL[resolved.lang] || resolved.lang}`, muted: true };
      case 'cond':
        return { text: `Enter cambia el estado a ${COND_LABEL[resolved.cond]} (${resolved.cond})`, muted: true };
      case 'bad':
        return { text: 'No entiendo esa entrada', muted: true };
      case 'missing':
        return {
          text: `No existe la ${resolved.entry.full} en ${set.name}${set.printed ? ` (tiene ${set.printed})` : ''}. ¿Expansión equivocada?`,
        };
      case 'range': {
        const x = expandRange(index, resolved.entry.range!);
        const { from, to } = resolved.entry.range!;
        if (!x.nums.length) return { text: `Ningún número del ${from} al ${to} existe en ${set.name}` };
        const q = resolved.entry.qty;
        return {
          text: `${resolved.entry.sign < 0 ? 'Se quitará una copia de' : `Se cargará${q > 1 ? `n ${q} copias de` : ''}`} ${x.nums.length} cartas (del ${from} al ${to}${resolved.entry.v ? ' · ' + variantName(resolved.entry.v) : ''})${x.skipped.length ? ` · se saltan ${x.skipped.length}` : ''}${x.confirm ? ' · te pediré confirmar' : ''}`,
        };
      }
      case 'card': {
        const card = byNum.get(resolved.num);
        if (!card) return null;
        const q = resolved.entry.qty;
        return {
          text: `${resolved.entry.sign < 0 ? 'Se quitará' : 'Se cargará'}${q > 1 ? ` ${q}×` : ''}: ${describe(card, planRow(card, resolved.entry, session, ctx))}`,
        };
      }
      default:
        return focus ? { text: `Cargar una: ${describe(focus, planRow(focus, ONE, session, ctx))}`, muted: true } : null;
    }
    // describe and locName only read the locations, already in ctx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, ctx, set, index, byNum, session, focus]);

  const totals = loaded.reduce((a, l) => ({ copies: a.copies + l.copies, fresh: a.fresh + l.fresh }), { copies: 0, fresh: 0 });
  const recents = saved.recents.map(r => ({ r, s: sets?.find(x => x.id === r.id) })).filter(x => x.s);

  if (fatal)
    return (
      <Gate title="No pude abrir Cargar" text={fatal}>
        <button type="button" className="primary" onClick={() => location.reload()}>
          <RefreshCw size={16} strokeWidth={2} />
          Reintentar
        </button>
      </Gate>
    );
  if (!sets) return <Gate title="Abriendo Cargar…" />;

  return (
    <Shell
      path="/cargar"
      label="Navegación y expansiones recientes"
      rail={
        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="rail-h">
            Expansiones recientes
          </h2>
          {recents.length ? (
            <ul className="picks">
              {recents.map(({ r, s }) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={'pick' + (r.id === setId ? ' on' : '')}
                    aria-pressed={r.id === setId}
                    onClick={() => chooseSet(s!, r.lang)}
                  >
                    <span>
                      {s!.name} · {r.lang}
                    </span>
                    <em>{s!.code || s!.id}</em>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rail-empty">Las expansiones que abras quedan aquí para volver con un clic.</p>
          )}
          <button type="button" className="save-open" onClick={openPicker}>
            <Search size={14} strokeWidth={2.25} aria-hidden="true" />
            Buscar otra expansión
          </button>
        </section>
      }
    >
      <main className="main">
        <header className="top load-top">
          <p className="count" aria-live="polite">
            <span className="n">{count.have.toLocaleString('es-CL')}</span>
            <span className="of"> / {count.total.toLocaleString('es-CL')} encendidas</span>
          </p>
          <div className="setname">
            {set ? (
              <>
                <b>
                  {set.name} · {LANG_LABEL[session.lang] || session.lang}
                </b>
                <span>{setLine(set)}</span>
              </>
            ) : (
              <b>Elige una expansión</b>
            )}
          </div>
          <div className="entry">
            <input
              ref={entryRef}
              autoFocus
              value={picking ? query : text}
              onChange={e => {
                if (picking) {
                  setQuery(e.target.value);
                  setResSel(0);
                } else {
                  setText(e.target.value);
                  setPending(null);
                }
              }}
              onKeyDown={onEntryKey}
              placeholder={picking ? 'Expansión: código, nombre o serie' : '25, 25r*2, -25, 1-30…'}
              aria-label={picking ? 'Buscar la expansión' : 'Número de la carta'}
              role={picking ? 'combobox' : undefined}
              aria-expanded={picking ? results.sets.length > 0 : undefined}
              aria-controls={picking ? 'set-results' : undefined}
              autoComplete="off"
              spellCheck={false}
              disabled={!picking && status !== 'idle'}
            />
            <span className="kbd">{picking ? 'Enter elige' : 'Enter carga'}</span>
            {picking && results.sets.length > 0 && (
              <ul className="results" id="set-results" role="listbox" aria-label="Expansiones">
                {results.sets.map((s, i) => (
                  <li key={s.id} role="option" aria-selected={i === resSel}>
                    <button
                      type="button"
                      className={'result' + (i === resSel ? ' on' : '')}
                      tabIndex={-1}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => chooseSet(s, results.lang as Lang | null)}
                    >
                      <b>
                        {s.name}
                        {results.lang ? ` · ${results.lang}` : ''}
                      </b>
                      <em>{s.code || s.id}</em>
                      <small>
                        {[setLine(s), s.printed ? `${s.printed} cartas` : '', s.has_cards ? '' : 'se bajan al abrirla']
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>
        <div className="chips" role="group" aria-label="Sesión de carga">
          <label className="chip-select">
            Idioma
            <select value={session.lang} onChange={e => setSession({ lang: e.target.value as Lang })}>
              {LANGS.map(l => (
                <option key={l} value={l}>
                  {LANG_LABEL[l] || l}
                </option>
              ))}
            </select>
          </label>
          <label className="chip-select">
            Estado
            <select value={session.cond} onChange={e => setSession({ cond: e.target.value as Cond })}>
              {CONDS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="chip-select">
            Para
            <select value={session.personal ? 'personal' : 'sale'} onChange={e => setSession({ personal: e.target.value === 'personal' })}>
              <option value="sale">vender</option>
              <option value="personal">mi colección personal</option>
            </select>
          </label>
          <label className="chip-select">
            Guardar en
            <select
              value={String(session.dest)}
              disabled={!locations.length}
              onChange={e => setSession({ dest: e.target.value === 'auto' ? 'auto' : Number(e.target.value) })}
            >
              <option value="auto">{locations.length ? 'Automático' : 'Sin ubicaciones'}</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <div className="seg spacer" role="group" aria-label="Ver">
            {(
              [
                [false, 'Todas'],
                [true, 'Solo las que faltan'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={label}
                type="button"
                className={'chip' + (onlyMissing === v ? ' sel' : '')}
                aria-pressed={onlyMissing === v}
                onClick={() => setOnlyMissing(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={'case load' + (cards.length > 250 ? ' big-set' : '')} role="region" aria-label="Vitrina de la expansión">
          {!set ? (
            <div className="case-msg">
              <h2>Elige una expansión</h2>
              <p>Busca por código (con idioma, como «MEW ES»), nombre o serie. Sus cartas se ven enteras en la vitrina.</p>
            </div>
          ) : status === 'loading' ? (
            <div className="case-msg" aria-live="polite">
              <h2>Cargando cartas…</h2>
              <p>{set.has_cards ? 'Un momento.' : 'Es la primera vez que se abre esta expansión: estoy bajando sus cartas.'}</p>
            </div>
          ) : status === 'error' ? (
            <div className="case-msg" role="alert">
              <h2>No pude bajar las cartas de {set.name}</h2>
              <p>{loadError}</p>
              <button type="button" className="primary" onClick={() => openSet(set.id)}>
                <RefreshCw size={16} strokeWidth={2} />
                Reintentar
              </button>
            </div>
          ) : !cards.length ? (
            <div className="case-msg">
              <h2>{set.name} no tiene cartas en el catálogo</h2>
              <p>Ni pokemontcg.io ni TCGdex traen sus cartas todavía.</p>
            </div>
          ) : (
            <ul className="row" style={{ padding: '16px 0' }}>
              {shown.map(c => (
                <LoadItem key={c.id} card={c} qty={cardQty(c)} marked={c.num === focusNum} onPick={pickCard} />
              ))}
            </ul>
          )}
        </div>
        <p className="hint">
          Lo que tienes está encendido; lo que te falta, en penumbra. Al escribir un número la carta se marca con luz; <b>Enter</b> la
          carga. Clic en una carta la marca; otro clic carga una copia.
        </p>
      </main>
      <aside className="detail" aria-label="Ficha de la carta">
        {focus && set ? (
          <>
            <p className="code">
              {set.code || set.id} · {focus.num}
              {set.printed ? `/${set.printed}` : ''} · {variantName(autoVariant(focus.rarity))}
            </p>
            <div className="big sheet-big">
              <CardPicture
                own={focus.photos[autoVariant(focus.rarity)]}
                ownCard={focus.own_card}
                img={focus.img}
                local={focus.local}
                reference={focus.ref}
                name={focus.name}
                big
              />
            </div>
            <h2 className="card-name">
              {focus.name}
              {freshNum === focus.num && <span className="fresh">Nueva</span>}
            </h2>
            <p className={'status' + (cardQty(focus) ? '' : ' out')}>
              {cardQty(focus) ? `Tienes ${copies(cardQty(focus))} · encendida` : 'Te falta · está en penumbra'}
            </p>
          </>
        ) : (
          <p className="rail-empty" style={{ color: 'var(--ink-mute)' }}>
            Escribe un número o haz clic en una carta para ver qué se va a cargar.
          </p>
        )}
        {preview && <p className={'preview' + (preview.muted ? ' muted' : '')}>{preview.text}</p>}
        <div className="buttons">
          <button
            type="button"
            className="primary"
            disabled={!focus || status !== 'idle'}
            onClick={() => focus && runOne(focus.num, ONE, focus.num, false)}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Cargar una
          </button>
          <button type="button" className="ghost" onClick={undo} title="⌘/Ctrl+Z con la entrada vacía">
            <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
            Deshacer
          </button>
        </div>
        {pending && (
          <div className="notice warn" role="alert">
            ¿{pending.entry.sign < 0 ? 'Quitar' : 'Cargar'} {pending.nums.length} cartas ({pending.entry.range!.from}–
            {pending.entry.range!.to}) de {set?.name}?
            <div className="buttons">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  runRange(pending.entry, pending.nums, pending.skipped, pending.raw);
                  setPending(null);
                  entryRef.current?.focus();
                }}
              >
                {pending.entry.sign < 0 ? 'Quitar' : 'Cargar'} {pending.nums.length}
              </button>
              <button
                type="button"
                className="ghost small"
                onClick={() => {
                  setPending(null);
                  say('Rango cancelado: no se cargó nada.', 'warn');
                  entryRef.current?.focus();
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        {notice && (
          <p className={'notice' + (notice.tone ? ' ' + notice.tone : '')} role="status">
            {notice.text}
          </p>
        )}
        <div className="session">
          <h3 className="rail-h" style={{ margin: '4px 0 0' }}>
            En esta sesión
          </h3>
          <div>
            Cargadas <em>{(totals.copies > 0 ? '+' : '') + totals.copies.toLocaleString('es-CL')}</em>
          </div>
          <div>
            Nuevas en la expansión <em>{totals.fresh.toLocaleString('es-CL')}</em>
          </div>
          <div>
            Última <em>{loaded.length ? loaded[loaded.length - 1]!.last : '—'}</em>
          </div>
        </div>
      </aside>
    </Shell>
  );
}

const LoadItem = memo(function LoadItem({
  card,
  qty,
  marked,
  onPick,
}: {
  card: SetCard;
  qty: number;
  marked: boolean;
  onPick: (c: SetCard) => void;
}) {
  const v = variantName(autoVariant(card.rarity));
  return (
    <li>
      <button
        type="button"
        data-num={card.num}
        className={'print' + (qty ? '' : ' off') + (marked ? ' mark' : '')}
        aria-pressed={marked}
        aria-label={`${card.name} #${card.num}${qty ? ` · tienes ${qty}` : ' · te falta'}`}
        onClick={() => onPick(card)}
      >
        <span className="art">
          <CardPicture
            own={card.photos[autoVariant(card.rarity)]}
            ownCard={card.own_card}
            img={card.img}
            local={card.local}
            reference={card.ref}
            name={card.name}
          />
          {qty > 1 && <span className="owned">×{qty}</span>}
        </span>
        <span className="tag">
          <span className="tag-text">#{card.num}</span>
          <span className="tag-text">{v}</span>
        </span>
      </button>
    </li>
  );
});

export function Gate({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
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
