# Proposal

## Why

En "Arma tu colección", las Eevee **unlimited** de la era WotC muestran una foto con el sello **1st Edition**: Jungle #51, Team Rocket #55, Gym Challenge #51 y Neo Discovery #38. Lo revisamos el 15-10-2026:
- pokemontcg.io, TCGdex y PokeCottage tienen **una sola foto por carta**, que es la de la 1st Edition, y la app la usa para las dos variantes.
- Bulbapedia sí tiene la **unlimited** de Jungle #51 y Neo Discovery #38, pero de Team Rocket #55 y Gym Challenge #51 solo tiene la 1st Edition, igual que pkmncards. PriceCharting bloquea las descargas.

Para un coleccionista, la foto **es** la variante: una unlimited con sello 1st Edition es un dato falso.

## What Changes

- **Cada foto sabe qué variante muestra.** Hay dos maneras de saberlo:
  - **Automática:** si una foto es compartida por la impresión sin sello y la 1st Edition de la misma carta, se entiende que muestra la 1st Edition.
  - **A mano:** en la ficha, el usuario puede marcar qué variante muestra una foto. La marca es un dato propio y gana sobre la automática.
- **La foto elegida debe calzar con la variante.** Cada impresión usa, en este orden:
  1. tu foto subida;
  2. una foto con permiso que muestre su variante;
  3. una foto solo local que muestre su variante.

  Si ninguna calza, muestra la foto de la variante hermana con la nota "Foto de la 1st Edition · falta la unlimited" (en general, "Foto de \<variante\> · falta esta variante"), con el mismo estilo atenuado de las fotos de referencia.
- **Fotos solo locales para la variante correcta:** el importador de fotos locales también busca fotos para las impresiones cuya foto no calza con su variante. Así Bulbapedia aporta la unlimited de Jungle #51 y de Neo Discovery #38.
- **Subir tu foto:** en la ficha, "Subir tu foto" guarda una foto de esa impresión. Es un dato propio (sticker azul) y siempre gana. También se puede quitar.

**Fuera del alcance:**
- Detectar el sello automáticamente en la imagen.
- Otras fuentes de fotos (PriceCharting, eBay, tiendas).
- Recortar o editar las fotos subidas.
- Los sellos distintos de la 1st Edition en la regla automática; esos se marcan a mano.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `universo-de-impresiones`: marcas de "qué variante muestra esta foto", fotos propias subidas y la búsqueda de fotos locales para impresiones con una foto que no calza.
- `armado-de-coleccion`: la Vitrina y la ficha eligen la foto que calza con la variante, avisan cuando no hay ninguna y permiten marcar y subir fotos.

## Impact

- `apps/arma/server`:
  - Migración 003 con `arma.photo_marks`.
  - Rutas `POST/DELETE /api/photo-marks`, `POST/DELETE /api/photos/:code`, y `/api/full` con `photoMarks`.
  - `localPhotos.ts` busca fotos también para las impresiones con una foto que no calza.
- **Fotos subidas:** se guardan en `IMAGE_DIR/arma/` (`data/imagenes/arma/`), el almacenamiento propio, que se sirve en `/img/arma/...`.
- `apps/arma/src`: `pictureOf` (que calce la variante), la ficha (marcar y subir) y `packages/core` (`photoShows`, la regla automática, con pruebas).
- README y `apps/arma/DESIGN.md`.
