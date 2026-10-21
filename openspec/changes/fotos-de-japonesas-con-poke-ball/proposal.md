## Why

El usuario cargó su Eevee de Terastal Festival (SV8a #125) como Normal, pero la foto muestra la versión con Poké Ball. Encontramos dos causas:

- **La foto de TCGdex.** En las expansiones japonesas con versión Poké Ball (SV2a 151 y SV8a Terastal Festival), la única foto que TCGdex tiene de cada carta con esa versión es la de la **Poké Ball**. El Full se la ponía a la Normal, a la Reverse y a la Master Ball, y el catálogo de Cargar también la usa como foto de la carta.
- **La foto de Limitless.** Siempre muestra la carta simple, pero se le asignaba a cualquier impresión japonesa sin foto. En SV8a #125 terminó en la de Poké Ball, justamente la única que no la tenía.

## What Changes

- **Full:** en una carta japonesa que tiene impresión Poké Ball, la foto de TCGdex queda solo en la impresión Poké Ball.
- **Fotos de Limitless** (solo locales): van únicamente a la impresión simple (Normal, Holo o Cosmos, sin sello), nunca a Reverse, Poké Ball, Master Ball ni a una con sello.
- **Fotos de PokeCottage** (solo locales): cuando PokeCottage usa la misma foto para dos acabados de una carta (su Master Ball reutiliza la foto de la Normal), la foto queda solo en la impresión simple.
- **Cargar y Mi inventario:** en esas cartas, cada variante muestra la foto de su propia impresión del Full. Así la Normal muestra la de Limitless y la Poké Ball la de TCGdex o PokeCottage, en vez de la foto del catálogo, que es la Poké Ball.
- **Para corregir el Full de Eevee** hay que volver a importarlo y volver a bajar sus fotos locales.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fotos-de-variantes`: la foto de TCGdex y la de Limitless de las japonesas con Poké Ball, cada una en su impresión.

## Impact

- `packages/core/src/arma.ts` (`mirrorPhotos`, `plainPhotoFits`), `apps/arma/server/importer.ts`, `localPhotos.ts` e `inventory.ts` (`variantPhotos`).
- Sin migración. Nitsu en producción no cambia.
