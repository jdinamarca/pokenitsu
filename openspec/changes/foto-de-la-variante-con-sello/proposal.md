# Proposal

## Why

El usuario cargó la Eevee del Trainer Kit Sun & Moon (Ultra Prism #104 con el círculo celeste 26) y dijo: "pero veo que la imagen no tiene el numero 26 celeste". La foto con el círculo existe: es la de PokeCottage de esa impresión del Full, y la vitrina del Master Set la muestra. Pero Cargar y Mi inventario eligen la foto por carta, no por variante. Muestran la del catálogo, que es la Ultra Prism #104 sin sello. Lo mismo pasa con cualquier variante con sello que tenga foto en el Full: Battle Academy, sellos de prerelease, de campeonato, etc.

## What Changes

- **Una variante con sello muestra la foto de su impresión del Full**, si la tiene, antes que la de la carta.
  - En Cargar, la variante es la marcada en la ficha.
  - En Mi inventario, es la de la copia.
- **Orden de las fotos en Cargar y Mi inventario:**
  1. la foto que la cuenta puso a esa variante;
  2. **nuevo:** la foto de la impresión del Full de esa variante con sello. Primero la del idioma de la copia (o de la sesión de Cargar); si no hay, la de inglés en las expansiones internacionales;
  3. lo de antes: la foto propia de la carta, la del catálogo, la solo local y la de referencia.
- **Las fotos solo locales** (PokeCottage, Limitless, Bulbapedia) siguen con la marca violeta y solo se entregan con `ARMA_FOTOS_LOCALES=1`. Sin el interruptor, la variante muestra la foto de la carta, como hoy.
- **Una foto marcada como de otra variante** (Por reemplazar) no se usa.
- **Las variantes sin sello** (Normal, Holo, Reverse) no cambian.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fotos-del-catalogo-en-arma`: qué foto muestra una carta con sello en Cargar y Mi inventario.

## Impact

- `apps/arma/server/inventory.ts`: Cargar (cartas de una expansión) y Mi inventario reciben las fotos de las variantes con sello de cada carta, por idioma.
- `apps/arma/src`: `pictureOf` / `CardPicture` aceptan la foto de la variante; Cargar la busca con la variante marcada e Inventario con la de la copia.
- Sin migraciones y sin cambios en los datos.
