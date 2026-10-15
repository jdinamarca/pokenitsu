import { useState } from 'react';
import { Bookmark, Plus, X } from 'lucide-react';
import type { ArmaRules, RuleId } from '@pokenitsu/core';
import type { SavedView } from '../api.ts';
import { RULES } from '../model.ts';

interface Props {
  species: string;
  dex: number;
  total: number;
  rules: ArmaRules;
  active: RuleId | null;
  onToggle: (id: RuleId) => void;
  views: SavedView[];
  viewId: SavedView['id'] | null;
  onView: (v: SavedView) => void;
  onSave: (name: string) => Promise<void>;
  onDelete: (id: number) => void;
}

export function Rail({ species, dex, total, rules, active, onToggle, views, viewId, onView, onSave, onDelete }: Props) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(name.trim());
      setNaming(false);
      setName('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  return (
    <nav className="rail" aria-label="Reglas y vistas">
      <p className="brand">Nitsu · Arma tu colección</p>
      <div className="species">
        <strong>{species}</strong>
        <span>
          #{dex} · {total.toLocaleString('es-CL')} impresiones en el Full
        </span>
      </div>
      <section aria-labelledby="rules-h">
        <h2 id="rules-h" className="rail-h">
          Reglas
        </h2>
        <ul className="rules">
          {RULES.map(r => (
            <li key={r.id}>
              <button
                type="button"
                role="switch"
                aria-checked={rules[r.id]}
                className={'rule' + (rules[r.id] ? ' on' : '') + (active === r.id ? ' active' : '')}
                onClick={() => onToggle(r.id)}
              >
                <span className="switch" aria-hidden="true" />
                <span className="rule-text">
                  {r.label}
                  <small>{r.hint}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="views-h">
        <h2 id="views-h" className="rail-h">
          Vistas guardadas
        </h2>
        <ul className="views">
          {views.map(v => (
            <li key={v.id}>
              <button
                type="button"
                className={'view' + (viewId === v.id ? ' sel' : '')}
                aria-pressed={viewId === v.id}
                onClick={() => onView(v)}
              >
                {v.name}
              </button>
              {!v.builtIn && typeof v.id === 'number' && (
                <button type="button" className="view-x" aria-label={`Borrar la vista ${v.name}`} onClick={() => onDelete(v.id as number)}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {naming ? (
          <form className="save" onSubmit={save}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre de la vista"
              aria-label="Nombre de la vista"
              maxLength={60}
            />
            <button type="submit" disabled={!name.trim()}>
              <Bookmark size={14} strokeWidth={2} />
              Guardar
            </button>
            {error && (
              <p className="save-error" role="alert">
                {error}
              </p>
            )}
          </form>
        ) : (
          <button type="button" className="save-open" onClick={() => setNaming(true)}>
            <Plus size={14} strokeWidth={2.25} />
            Guardar estas reglas como vista
          </button>
        )}
      </section>
    </nav>
  );
}
