import { useEffect, useMemo, useRef, useState } from 'react';
import { groupSets, searchSetsLang, type Lang } from '@pokenitsu/core';
import { Search, X } from 'lucide-react';
import type { CardSet } from '../api.ts';
import { LANG_LABEL, setLine } from '../load.ts';

type Tab = 'ja' | 'intl';
/** one expansion of the list, with the language it opens in (a recent's, or a search's "MEW ES") */
type Option = { s: CardSet; lang: Lang | null };
type Section = { title: string; options: Option[] };

/**
 * The expansion picker of Cargar (cargar-selector-y-nombre): a search, the recent ones first and every expansion by
 * series in two tabs, with the account's progress on each. Arrows and Enter choose, Esc closes.
 */
export function SetPicker({
  sets,
  recents,
  current,
  sessionLang,
  progress,
  onChoose,
  onClose,
}: {
  sets: CardSet[];
  recents: Option[];
  current: string | null;
  sessionLang: Lang;
  /** distinct cards with copies per expansion; null while it loads */
  progress: Record<string, number> | null;
  onChoose: (s: CardSet, lang: Lang | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>(sessionLang === 'JA' ? 'ja' : 'intl');
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const sections = useMemo((): Section[] => {
    if (q.trim()) {
      const r = searchSetsLang(sets, q, 50);
      return [{ title: r.sets.length ? 'Resultados' : '', options: r.sets.map(s => ({ s, lang: r.lang })) }];
    }
    return [
      ...(recents.length ? [{ title: 'Recientes', options: recents }] : []),
      ...groupSets(sets, tab).map(g => ({ title: g.era, options: g.sets.map(s => ({ s, lang: null })) })),
    ];
  }, [sets, recents, q, tab]);
  const flat = useMemo(() => sections.flatMap(x => x.options), [sections]);

  // the chosen row stays in view while moving with the arrows
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);
  // a click outside closes it
  useEffect(() => {
    const out = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && onClose();
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, [onClose]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(i => (flat.length ? (i + (e.key === 'ArrowDown' ? 1 : flat.length - 1)) % flat.length : 0));
    } else if (e.key === 'Enter' && flat.length) {
      e.preventDefault();
      const o = flat[Math.min(sel, flat.length - 1)]!;
      onChoose(o.s, o.lang);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };
  const have = (s: CardSet) => {
    const n = progress?.[s.id];
    const of = s.printed || s.total;
    return n ? `${n.toLocaleString('es-CL')}${of ? '/' + of.toLocaleString('es-CL') : ''}` : '';
  };

  let i = -1;
  return (
    <div className="set-picker" ref={box} role="dialog" aria-label="Elegir la expansión" onKeyDown={onKey}>
      <div className="set-head">
        <label className="set-search">
          <Search size={16} strokeWidth={2.25} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={e => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Nombre, código o serie (MEW ES)"
            aria-label="Buscar la expansión"
            role="combobox"
            aria-expanded="true"
            aria-controls="set-picker-list"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button type="button" className="ghost small set-close" onClick={onClose} aria-label="Cerrar sin cambiar de expansión">
          <X size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
      {!q.trim() && (
        <div className="seg set-tabs" role="tablist" aria-label="Idioma de las expansiones">
          {(
            [
              ['intl', 'Internacionales'],
              ['ja', 'Japonesas'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={'chip' + (tab === id ? ' sel' : '')}
              onClick={() => {
                setTab(id);
                setSel(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="set-list" id="set-picker-list" role="listbox" aria-label="Expansiones" ref={list}>
        {!flat.length && <p className="set-none">Ninguna expansión coincide con «{q.trim()}».</p>}
        {sections.map(sec => (
          <section key={sec.title} aria-label={sec.title || undefined}>
            {sec.title && <h3 className="rail-h">{sec.title}</h3>}
            {sec.options.map(o => {
              const k = ++i;
              return (
                <button
                  key={(sec.title === 'Recientes' ? 'r:' : '') + o.s.id}
                  type="button"
                  role="option"
                  aria-selected={k === sel}
                  className={'result' + (k === sel ? ' on' : '') + (o.s.id === current ? ' now' : '')}
                  tabIndex={-1}
                  onMouseEnter={() => setSel(k)}
                  onClick={() => onChoose(o.s, o.lang)}
                >
                  <b>
                    {o.s.name}
                    {o.lang ? ` · ${LANG_LABEL[o.lang] || o.lang}` : ''}
                  </b>
                  <em>{have(o.s)}</em>
                  <small>
                    {[setLine(o.s), o.s.name_ja && o.s.name_ja !== o.s.name ? o.s.name_ja : '', o.s.has_cards ? '' : 'se bajan al abrirla']
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
