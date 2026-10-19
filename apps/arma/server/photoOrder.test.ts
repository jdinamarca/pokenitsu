import { describe, expect, it } from 'vitest';
import { pickCardPhotos, pickVariantPhotos, type PhotoRow, type VariantPhotoRow } from './photoOrder.ts';

const row = (source_id: string, over: Partial<PhotoRow> = {}): PhotoRow => ({
  card_id: 'c',
  source_id,
  src: `/img-local/${source_id}.webp`,
  name: source_id,
  permission: source_id === 'own' ? 'own' : 'local',
  printed: false,
  ...over,
});
const pick = (rows: PhotoRow[], on = true) => pickCardPhotos(rows, on).get('c');

describe('fotos-pokecottage-en-catalogo: qué foto solo local muestra una carta', () => {
  it('Limitless gana sobre PokeCottage, en cualquier orden', () => {
    expect(pick([row('pokecottage-fotos'), row('limitless')])?.local?.source).toBe('limitless');
    expect(pick([row('limitless'), row('pokecottage-fotos')])?.local?.source).toBe('limitless');
  });
  it('la de su impresión del Full gana sobre las dos', () =>
    expect(pick([row('limitless'), row('pokecottage-fotos', { printed: true, src: '/img-local/impresion.webp' })])?.local?.src).toBe(
      '/img-local/impresion.webp',
    ));
  it("Bill's Archive va después de PokeCottage", () => {
    expect(pick([row('billsarchive'), row('pokecottage-fotos')])?.local?.source).toBe('pokecottage-fotos');
    expect(pick([row('billsarchive')])?.local?.source).toBe('billsarchive');
  });
  it('solo PokeCottage', () => expect(pick([row('pokecottage-fotos')])?.local?.source).toBe('pokecottage-fotos'));
  it('sin el interruptor, ninguna', () => expect(pick([row('limitless'), row('pokecottage-fotos')], false)?.local).toBeNull());
  it('la propia de la carta gana sobre la de su impresión', () =>
    expect(pick([row('own', { printed: true, src: '/img/impresion.webp' }), row('own', { src: '/img/carta.webp' })])?.own_card).toBe(
      '/img/carta.webp',
    ));
});

describe('foto-de-la-variante-con-sello: las fotos de las variantes con sello', () => {
  const kit = 'tksmalolanninetales26';
  const row = (o: Partial<VariantPhotoRow>): VariantPhotoRow => ({
    card_id: 'sm5-104',
    variant: kit,
    lang: 'EN',
    src: '/img-local/pokecottage-fotos/tk11a-26.webp',
    name: 'PokeCottage (fotos)',
    permission: 'local',
    ...o,
  });
  it('por variante e idioma, con la marca de solo local', () =>
    expect(pickVariantPhotos([row({})], true).get('sm5-104')).toEqual({
      [kit]: { EN: { src: '/img-local/pokecottage-fotos/tk11a-26.webp', source: 'PokeCottage (fotos)', local: true } },
    }));
  it('sin el interruptor no hay fotos solo locales', () => expect(pickVariantPhotos([row({})], false).get('sm5-104')).toBeUndefined());
  it('una que se puede mostrar gana a una solo local', () =>
    expect(
      pickVariantPhotos([row({}), row({ src: '/img/own.webp', name: 'Propia', permission: 'ok' })], true).get('sm5-104')![kit]!.EN,
    ).toEqual({ src: '/img/own.webp', source: 'Propia', local: false }));
});
