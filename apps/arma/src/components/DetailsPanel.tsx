import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { api, type DetailsJob, type DetailsPending, type DetailsStep } from '../api.ts';

const n = (x: number) => x.toLocaleString('es-CL');
const STEPS = [
  { key: 'tcgdex', title: 'TCGdex', unit: 'cartas', source: 'TCGdex' },
  { key: 'pokedex', title: 'Pokédex por el nombre', unit: 'Pokémon', source: 'el nombre' },
  { key: 'ilustrador', title: 'Ilustrador desde la carta inglesa', unit: 'especies', source: 'Bulbapedia' },
] as const;
const counts = (s: DetailsStep, source: string) =>
  `${n(s.filled)} completados · ${n(s.missing)} sin dato en ${source}${s.failed ? ` · ${n(s.failed)} fallaron` : ''}`;

/**
 * "Detalles de las japonesas" (detalles-de-japonesas-en-arma): what the catalog's Japanese cards still lack, and the
 * job that fills it (TCGdex, the Pokédex from the name, the illustrator from the same card in English), followed every 2 s.
 */
export function DetailsPanel() {
  const [pending, setPending] = useState<DetailsPending | null>(null);
  const [job, setJob] = useState<DetailsJob | null>(null);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const polling = useRef(false);

  const refresh = useCallback(async () => {
    const r = await api.catalogDetails();
    if (!alive.current) return r;
    setPending(r.pending);
    setJob(r.job);
    return r;
  }, []);
  useEffect(() => {
    alive.current = true;
    refresh().catch(e => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  // a job running (started here or before opening the page) is followed until it ends, and then the counts again
  useEffect(() => {
    if (!job?.running || polling.current) return;
    polling.current = true;
    void (async () => {
      for (;;) {
        await new Promise(r => setTimeout(r, 2000));
        if (!alive.current) break;
        const r = await refresh().catch(() => null);
        if (!r?.job?.running) break;
      }
    })().finally(() => (polling.current = false));
  }, [job?.running, refresh]);

  const start = async () => {
    setError('');
    try {
      setJob(await api.startCatalogDetails());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const step = job ? STEPS.findIndex(s => s.key === job.phase) : -1;
  const now = job?.running ? job.steps[job.phase] : null;
  const wait = job?.running && job.waitingUntil ? new Date(job.waitingUntil) : null;
  const nothing = pending && !pending.tcgdex && !pending.pokedex && !pending.ilustrador;
  return (
    <section className="details-panel" aria-labelledby="details-h">
      <div className="details-head">
        <div>
          <h2 id="details-h">Detalles de las japonesas</h2>
          <p className="details-counts">
            {pending ? (
              <>
                <span>
                  <b>{n(pending.tcgdex)}</b> sin consultar en TCGdex
                </span>
                <span>
                  <b>{n(pending.pokedex)}</b> Pokémon sin Pokédex
                </span>
                <span>
                  <b>{n(pending.ilustrador)}</b> Pokémon sin ilustrador
                </span>
              </>
            ) : (
              'Contando…'
            )}
          </p>
        </div>
        <button type="button" className="ghost small" disabled={!pending || !!job?.running || !!nothing} onClick={() => void start()}>
          <ListChecks size={15} strokeWidth={2} aria-hidden="true" />
          {job?.running ? 'Completando…' : 'Completar detalles'}
        </button>
      </div>
      {job && (
        <div className="details-job" role="status" aria-live="polite">
          {job.running && now && (
            <>
              <p>
                Paso {step + 1} de 3 · {STEPS[step]!.title}
                {job.current ? ` · ${job.current}` : ''}
              </p>
              <progress max={Math.max(1, now.total)} value={now.done} aria-label={`Avance de ${STEPS[step]!.title}`} />
            </>
          )}
          {STEPS.map((s, i) =>
            !job.running || i <= step ? (
              <p key={s.key} className="details-line">
                {job.running ? '' : i === 0 ? 'Última vez · ' : ''}
                {s.title}:{' '}
                {job.steps[s.key].total
                  ? `${n(job.steps[s.key].done)} de ${n(job.steps[s.key].total)} ${s.unit} · ${counts(job.steps[s.key], s.source)}`
                  : 'nada pendiente'}
              </p>
            ) : null,
          )}
          {wait && (
            <p>
              La fuente pidió esperar hasta las{' '}
              {wait.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.
            </p>
          )}
          {job.stopped && (
            <p className="details-err" role="alert">
              Se detuvo: {job.stopped}. Pídelo otra vez para seguir con lo que falta.
            </p>
          )}
          {job.error && (
            <p className="details-err" role="alert">
              Error: {job.error}
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="details-err" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
