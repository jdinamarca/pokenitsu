import { useEffect, useState } from 'react';
import { Bookmark, Plus, RefreshCw, X } from 'lucide-react';
import type { ArmaRules, RuleId } from '@pokenitsu/core';
import type { SavedView } from '../api.ts';
import { importedAt, RULES } from '../model.ts';

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
  /** bringing the Full again (volver-a-traer-el-full): only for a member whose Full is here */
  refresh?: Refresh;
}
interface Refresh {
  /** when it was last brought */
  at: string | null;
  importing: boolean;
  note: { lines: string[]; error?: boolean } | null;
  onImport: () => void;
  onDismiss: () => void;
}

/** the Eevee screen's zone of the rail: the species, the rules and the saved views */
export function Rail({ species, dex, total, rules, active, onToggle, views, viewId, onView, onSave, onDelete, refresh }: Props) {
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
    <>
      <div className="species">
        <strong>{species}</strong>
        <span>
          #{dex} · {total.toLocaleString('es-CL')} impresiones en el Full
        </span>
        {refresh && <BringAgain species={species} {...refresh} />}
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
    </>
  );
}

/** when the Full was brought, the button to bring it again and, afterwards, what changed (gone after 10 s unless an error) */
function BringAgain({ species, at, importing, note, onImport, onDismiss }: Refresh & { species: string }) {
  useEffect(() => {
    if (!note || note.error) return;
    const t = setTimeout(onDismiss, 10000);
    return () => clearTimeout(t);
  }, [note, onDismiss]);
  return (
    <div className="again">
      {at && <span className="again-at">Traído el {importedAt(at)}</span>}
      <button
        type="button"
        className="again-btn"
        disabled={importing}
        onClick={onImport}
        aria-label={importing ? undefined : `Volver a traer el Full de ${species}`}
      >
        <RefreshCw size={13} strokeWidth={2.25} className={importing ? 'spin' : ''} aria-hidden="true" />
        {importing ? 'Trayendo…' : 'Volver a traer'}
      </button>
      {note && (
        <div className={'again-note' + (note.error ? ' bad' : '')} role={note.error ? 'alert' : 'status'}>
          {note.lines.map(l => (
            <p key={l}>{l}</p>
          ))}
          <button type="button" className="again-x" aria-label="Cerrar el resumen" onClick={onDismiss}>
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
