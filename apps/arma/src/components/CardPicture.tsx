import { Info } from 'lucide-react';
import type { LocalPhoto, VariantPhoto } from '../api.ts';
import { pictureOf, REF_NOTE } from '../load.ts';

/**
 * A card's picture in Cargar and Mi inventario, in order: your photo of the variant, its stamped variant's photo from the
 * Full (foto-de-la-variante-con-sello), the card's own photo, the
 * catalog's, the one for local use only (violet mark) or a reference of the same Pokémon, dimmed like the Eevee case's;
 * the sheet's big one says which.
 */
export function CardPicture({
  own,
  ownCard,
  img,
  local,
  reference,
  variant,
  name,
  big = false,
}: {
  own?: string | null;
  ownCard?: string | null;
  img: string | null;
  local?: LocalPhoto | null;
  reference: string | null;
  variant?: VariantPhoto | null;
  name: string;
  big?: boolean;
}) {
  const p = pictureOf(own, ownCard, img, local, reference, variant);
  if (!p.src) return <span className="blank">{big ? `${name} · sin foto` : name}</span>;
  const note = p.kind === 'ref' ? REF_NOTE : p.kind === 'local' ? `Foto solo para uso local · ${p.source}` : '';
  return (
    <>
      <img
        src={p.src}
        alt=""
        loading={big ? undefined : 'lazy'}
        decoding="async"
        className={p.kind === 'ref' ? 'ref' : ''}
        title={note || undefined}
      />
      {p.kind === 'local' && !big && <span className="local-mark" role="img" aria-label="Foto solo para uso local" title={note} />}
      {big && note && (
        <span className={'ref-note' + (p.kind === 'local' ? ' local' : '')}>
          {p.kind === 'local' ? <span className="sticker s-local" aria-hidden="true" /> : <Info size={13} aria-hidden="true" />}
          {note}
        </span>
      )}
    </>
  );
}
