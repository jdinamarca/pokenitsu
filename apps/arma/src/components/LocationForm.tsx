import { useState } from 'react';
import { RGROUPS, type LocationRule, type NewLocation } from '@pokenitsu/core';
import { api, type CardSet, type InvLocation } from '../api.ts';
import { kindOf, KIND, seriesList, setsFromCodes } from '../cajas.ts';
import { Modal } from './Modal.tsx';

const REGIONS = [
  ['INT', 'Internacionales'],
  ['JA', 'Japonesas'],
  ['ZH', 'Chinas'],
  ['KO', 'Coreanas'],
] as const;
type Copies = '' | 'sale' | 'pers';
type Kind = '' | 'bulk' | 'special';

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** a new location or the edit of one, as Nitsu's form: name, kind, whether it is assigned alone, and its rule */
export function LocationForm({
  loc,
  sets,
  onSaved,
  onClose,
}: {
  loc: InvLocation | null;
  sets: CardSet[];
  onSaved: (id: number) => void;
  onClose: () => void;
}) {
  const r: LocationRule = loc?.rule || {};
  const [name, setName] = useState(loc?.name || '');
  const [kind, setKind] = useState(kindOf(loc?.kind || 'box'));
  const [auto, setAuto] = useState(r.auto !== false);
  const [copies, setCopies] = useState<Copies>(r.personal === true ? 'pers' : r.personal === false ? 'sale' : '');
  const [origin, setOrigin] = useState<string[]>(r.origin || []);
  const [series, setSeries] = useState<string[]>(r.series || []);
  const [codes, setCodes] = useState(() => {
    const byId = new Map(sets.map(s => [s.id, s.code || s.id]));
    return (r.sets || []).map(id => byId.get(id) || id).join(', ');
  });
  const [type, setType] = useState<Kind>(r.bulk ? 'bulk' : r.special?.length || r.minPrice ? 'special' : '');
  const [special, setSpecial] = useState<string[]>(r.special || []);
  const [min, setMin] = useState(r.minPrice ? String(r.minPrice) : '');
  const [note, setNote] = useState(loc?.note || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // the series this rule already has stay listed even if the catalog doesn't bring them
  const allSeries = [...new Set([...seriesList(sets), ...series])];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Ponle un nombre a la ubicación');
    const found = setsFromCodes(codes, sets);
    if (found.unknown.length) return setError('No encontré: ' + found.unknown.join(', '));
    if (type === 'special' && !special.length && !(Number(min) > 0)) return setError('Marca alguna rareza o pon un precio mínimo');
    const rule: LocationRule = {
      series,
      sets: found.ids,
      origin,
      ...(type === 'special' ? { special, minPrice: Number(min) || 0 } : {}),
      ...(type === 'bulk' ? { bulk: true } : {}),
      ...(copies ? { personal: copies === 'pers' } : {}),
      ...(auto ? {} : { auto: false }),
    };
    const body: NewLocation = { name, kind, note, rule };
    setBusy(true);
    setError('');
    try {
      const id = loc ? (await api.updateLocation(loc.id, body), loc.id) : (await api.createLocation(body)).id;
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={loc ? 'Editar ubicación' : 'Nueva caja o carpeta'} onClose={onClose} wide>
      <form className="loc-form" onSubmit={save} noValidate>
        <label>
          Nombre
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Caja 1 · Scarlet & Violet, Carpeta IR…"
            autoFocus
            maxLength={80}
          />
        </label>
        <label>
          Tipo
          <select value={kind} onChange={e => setKind(kindOf(e.target.value))}>
            {(Object.keys(KIND) as (keyof typeof KIND)[]).map(k => (
              <option key={k} value={k}>
                {KIND[k].icon} {KIND[k].name}
              </option>
            ))}
          </select>
        </label>
        <label className="full check">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />
          Al cargar, poner aquí las cartas que calcen con estas reglas
        </label>
        <label>
          Copias
          <select value={copies} onChange={e => setCopies(e.target.value as Copies)}>
            <option value="">Para vender y personales</option>
            <option value="sale">Solo para vender</option>
            <option value="pers">Solo de mi colección personal</option>
          </select>
        </label>
        <fieldset>
          <legend>Región de la expansión</legend>
          <div className="checks">
            {REGIONS.map(([v, label]) => (
              <label key={v}>
                <input type="checkbox" checked={origin.includes(v)} onChange={() => setOrigin(o => toggle(o, v))} /> {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="full">
          <legend>Series (vacío = todas)</legend>
          <div className="checks">
            {allSeries.map(x => (
              <label key={x}>
                <input type="checkbox" checked={series.includes(x)} onChange={() => setSeries(s => toggle(s, x))} /> {x}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="full">
          …o estas expansiones (códigos o ids, separados por coma)
          <input value={codes} onChange={e => setCodes(e.target.value)} placeholder="MEW, PAF, sv8" />
        </label>
        <label className="full">
          Cartas
          <select value={type} onChange={e => setType(e.target.value as Kind)}>
            <option value="">Todas</option>
            <option value="bulk">Solo challa: común, poco común, rara y rara holo, sin ex/GX/V…, en normal, holo o reverse</option>
            <option value="special">Solo especiales: las rarezas que marques o las que valgan desde cierto precio</option>
          </select>
        </label>
        {type === 'special' && (
          <>
            <fieldset className="full">
              <legend>Rarezas especiales</legend>
              <div className="checks">
                {RGROUPS.filter(g => g[0] !== 'base').map(([g, label]) => (
                  <label key={g}>
                    <input type="checkbox" checked={special.includes(g)} onChange={() => setSpecial(s => toggle(s, g))} /> {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              …o que valgan desde (CLP)
              <input type="number" min={0} step={500} value={min} onChange={e => setMin(e.target.value)} placeholder="ej. 5000" />
            </label>
          </>
        )}
        <label className="full">
          Nota
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Cómo está ordenada, dónde está la caja…"
            maxLength={2000}
          />
        </label>
        {error && (
          <p className="form-error full" role="alert">
            {error}
          </p>
        )}
        <div className="modal-acts full">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
