import type { RuleResult } from '@pokenitsu/core';
import type { Copy, Facts, Printing, Source } from '../api.ts';
import { LANG_NAME, pictureOf, RULES, STICKER, variantName, type Picture } from '../model.ts';

const FIELDS: { key: keyof Facts; label: string }[] = [
  { key: 'exists', label: 'Existe la impresión' },
  { key: 'variant', label: 'Variante' },
  { key: 'name', label: 'Nombre' },
  { key: 'number', label: 'Número' },
  { key: 'artist', label: 'Ilustrador' },
  { key: 'image', label: 'Foto' },
  { key: 'price', label: 'Precio' },
  { key: 'equivalence', label: 'Equivalencia' },
];

interface Props {
  p: Printing | null;
  fallback: Picture | null;
  result: RuleResult | undefined;
  copies: Copy[];
  sources: Map<string, Source>;
}

/** the selected printing: what it is, whether it counts, my copies and where every fact came from */
export function Detail({ p, fallback, result, copies, sources }: Props) {
  if (!p)
    return (
      <aside className="detail empty-detail" aria-label="Ficha">
        <p>Elige una impresión de la vitrina para ver su ficha.</p>
      </aside>
    );
  const picture = pictureOf(p, sources);
  const img = picture || fallback;
  const out = result && !result.in;
  const rule = out ? RULES.find(r => r.id === result.by) : null;
  const owned = copies.reduce((n, c) => n + c.qty, 0);
  return (
    <aside className="detail" aria-label="Ficha de la impresión">
      <p className="code">{p.code}</p>
      <div className={'big' + (out ? ' off' : '')}>
        {img ? (
          <img src={img.src.replace('/low.webp', '/high.webp')} alt={`${p.name || 'Carta'} de ${p.set_name || p.set_key}`} />
        ) : (
          <span className="blank">Sin foto con permiso</span>
        )}
        {img && (!picture || img.local) && (
          <span className={'ref-note' + (img.local ? ' local' : '')}>
            {img.local && <span className="sticker s-local" aria-hidden="true" />}
            {[!picture && 'Foto de otra impresión del mismo diseño', img.local && `Foto solo para uso local · ${img.source}`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </div>
      <div className="title">
        <h2>{p.name || 'Sin nombre'}</h2>
        <p>
          {p.set_name || p.set_key} · #{p.number} · {LANG_NAME[p.lang] || p.lang} · {variantName(p)}
          {p.artist ? ` · ${p.artist}` : ''}
        </p>
      </div>
      <div className={'status' + (out ? ' out' : '')} role="status">
        {out ? <>Fuera de tu colección por «{rule?.label}»</> : <>Cuenta para tu colección</>}
      </div>
      <div className="own">
        {owned ? (
          <>
            <strong>
              {owned} {owned === 1 ? 'copia' : 'copias'}
            </strong>
            <ul>
              {copies.map((c, i) => (
                <li key={i}>
                  {c.qty} × {c.cond} · {c.loc || 'sin ubicación'}
                  {c.personal ? ` · ${c.personal} personal${c.personal === 1 ? '' : 'es'}` : ''}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <strong className="none">No la tienes</strong>
        )}
      </div>
      <section className="facts" aria-labelledby="facts-h">
        <h3 id="facts-h">De dónde sale cada dato</h3>
        <dl>
          {FIELDS.filter(f => p.facts[f.key]?.length).map(f => (
            <div key={f.key} className="fact">
              <dt>{f.label}</dt>
              <dd>
                {p.facts[f.key]!.map(v => {
                  const s = sources.get(v.source);
                  const st = STICKER[s?.permission || 'none'];
                  return (
                    <span key={v.source} className="src" title={`${s?.name || v.source}: ${st.label}${s?.note ? ` · ${s.note}` : ''}`}>
                      <span className={'sticker ' + st.tone} aria-hidden="true" />
                      {s?.name || v.source}
                      {f.key === 'price' && v.value ? <em>{v.value}</em> : null}
                      <span className="sr-only"> ({st.label})</span>
                    </span>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  );
}
