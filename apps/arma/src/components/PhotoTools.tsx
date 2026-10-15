// The sheet's photo tools (fotos-por-variante): what variant the shown photo shows, and your own photo of the printing
import { useState } from 'react';
import type { Printing } from '../api.ts';
import { variantName, type Picture } from '../model.ts';

interface Props {
  p: Printing;
  /** the printing's own picture (null when the case shows the design's) */
  picture: Picture | null;
  /** the same card's printings (same set, number and language): the variants a photo can show */
  siblings: Printing[];
  mark: string | undefined;
  onMark: (src: string, shows: string | null) => Promise<void>;
  onUpload: (code: string, file: File) => Promise<void>;
  onRemove: (code: string) => Promise<void>;
}

export function PhotoTools({ p, picture, siblings, mark, onMark, onUpload, onRemove }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await f();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  // one option per variant of the card, named like its tag ("1st Edition", "Normal")
  const variants = [...new Map(siblings.map(s => [s.stamp || '', s.stamp ? variantName(s) : 'Sin sello'])).entries()];
  const uploaded = (p.facts.image || []).some(f => f.source === 'own');
  const src = picture?.src;
  return (
    <div className="photo-tools">
      {src && variants.length > 1 && (
        <label className="field">
          <span>Esta foto muestra</span>
          <select
            value={mark ?? 'auto'}
            disabled={busy}
            onChange={e => void run(() => onMark(src, e.target.value === 'auto' ? null : e.target.value))}
          >
            <option value="auto">Automático ({picture.other ? picture.other.replace(/^la /, '') : 'esta impresión'})</option>
            {variants.map(([stamp, label]) => (
              <option key={stamp} value={stamp}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="photo-actions">
        <label className={'view upload' + (busy ? ' busy' : '')}>
          {uploaded ? 'Cambiar tu foto' : 'Subir tu foto'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={e => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void run(() => onUpload(p.code, file));
            }}
          />
        </label>
        {uploaded && (
          <button type="button" className="view" disabled={busy} onClick={() => void run(() => onRemove(p.code))}>
            Quitar tu foto
          </button>
        )}
      </div>
      {error && (
        <p className="photo-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
