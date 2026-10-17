import { describe, expect, it } from 'vitest';
import { pickCardPhotos, type PhotoRow } from './photoOrder.ts';

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
  it('solo PokeCottage', () => expect(pick([row('pokecottage-fotos')])?.local?.source).toBe('pokecottage-fotos'));
  it('sin el interruptor, ninguna', () => expect(pick([row('limitless'), row('pokecottage-fotos')], false)?.local).toBeNull());
  it('la propia de la carta gana sobre la de su impresión', () =>
    expect(pick([row('own', { printed: true, src: '/img/impresion.webp' }), row('own', { src: '/img/carta.webp' })])?.own_card).toBe(
      '/img/carta.webp',
    ));
});
