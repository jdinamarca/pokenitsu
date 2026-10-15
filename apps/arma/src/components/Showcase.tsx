import { memo } from 'react';
import type { RuleResult } from '@pokenitsu/core';
import type { Copy, Printing, Source } from '../api.ts';
import { existsPermission, LANG_NAME, pictureOf, STICKER, tagOf, type Shelf } from '../model.ts';

interface Props {
  shelves: Shelf[];
  result: Map<string, RuleResult>;
  sources: Map<string, Source>;
  copies: Map<string, Copy[]>;
  selected: string | null;
  onSelect: (code: string) => void;
}

/** the case: one shelf per design; what a rule leaves out stays in place, in the dark */
export function Showcase({ shelves, result, sources, copies, selected, onSelect }: Props) {
  return (
    <div className="case" role="region" aria-label="Vitrina">
      {shelves.map(s => (
        <section key={s.id} className="shelf" aria-label={s.title}>
          <header className="shelf-h">
            <h3>{s.title}</h3>
            {s.subtitle && <span>{s.subtitle}</span>}
          </header>
          <ul className="row">
            {s.printings.map(p => (
              <Item
                key={p.code}
                p={p}
                lit={result.get(p.code)?.in ?? true}
                owned={(copies.get(p.code) || []).reduce((n, c) => n + c.qty, 0)}
                picture={pictureOf(p, sources)}
                fallback={s.picture}
                tone={STICKER[existsPermission(p, sources)].tone}
                selected={selected === p.code}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface ItemProps {
  p: Printing;
  lit: boolean;
  owned: number;
  picture: string | null;
  fallback: string | null;
  tone: string;
  selected: boolean;
  onSelect: (code: string) => void;
}
const Item = memo(function Item({ p, lit, owned, picture, fallback, tone, selected, onSelect }: ItemProps) {
  const img = picture || fallback;
  return (
    <li>
      <button
        type="button"
        className={'print' + (lit ? '' : ' off') + (selected ? ' sel' : '')}
        aria-pressed={selected}
        title={p.code}
        aria-label={`${p.name || 'Carta'} · ${p.set_name || p.set_key} #${p.number} · ${LANG_NAME[p.lang] || p.lang} · ${tagOf(p)}${lit ? '' : ' · fuera de tu colección'}${owned ? ` · tienes ${owned}` : ''} · ${p.code}`}
        onClick={() => onSelect(p.code)}
      >
        <span className="art">
          {img ? (
            <img src={img} alt="" loading="lazy" decoding="async" className={picture ? '' : 'ref'} />
          ) : (
            <span className="blank">{p.name || 'Sin foto'}</span>
          )}
          {owned > 0 && <span className="owned">×{owned}</span>}
        </span>
        <span className="tag">
          <span className="tag-text">{tagOf(p)}</span>
          <span className={'sticker ' + tone} aria-hidden="true" />
        </span>
      </button>
    </li>
  );
});
