import { Info } from 'lucide-react';
import { pictureOf, REF_NOTE } from '../load.ts';

/**
 * A card's picture in Cargar and Mi inventario: your own photo of the variant, the catalog's, or (without one) a
 * reference of the same Pokémon, dimmed like the Eevee case's; the sheet's big one says so.
 */
export function CardPicture({
  own,
  img,
  reference,
  name,
  big = false,
}: {
  own?: string | null;
  img: string | null;
  reference: string | null;
  name: string;
  big?: boolean;
}) {
  const p = pictureOf(own, img, reference);
  if (!p.src) return <span className="blank">{big ? `${name} · sin foto` : name}</span>;
  return (
    <>
      <img
        src={p.src}
        alt=""
        loading={big ? undefined : 'lazy'}
        decoding="async"
        className={p.isRef ? 'ref' : ''}
        title={p.isRef ? REF_NOTE : undefined}
      />
      {big && p.isRef && (
        <span className="ref-note">
          <Info size={13} aria-hidden="true" />
          {REF_NOTE}
        </span>
      )}
    </>
  );
}
