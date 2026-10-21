# Proposal

## Why

De las 1.887 cartas chinas del catálogo (pestaña Chinas de Cargar), 1.727 no tienen foto: TCGdex trae la lista pero no las imágenes. En chino simplificado faltan 422, de ellas 379 Pokémon. Los álbumes de PokeCottage que el sistema ya tiene guardados (322, de la descarga del catálogo japonés) traen también las cartas en chino simplificado (expansiones `scn_…`) y cubren las 379, por expansión, número y Pokédex. Hoy el paso de PokeCottage solo mira las entradas japonesas (`jpn_…`).

En chino tradicional faltan 1.305, pero PokeCottage no tiene chino tradicional y el sitio oficial de Pokémon Asia está en mantención: quedan fuera de este cambio.

## What Changes

- El paso de PokeCottage de la descarga de fotos locales del catálogo SHALL incluir las cartas en chino simplificado sin foto, además de las japonesas.
- El cruce de una entrada china de PokeCottage SHALL usar el código de la expansión (`scn_cbb4` → la expansión china CBB4C, con el mismo cruce de códigos de las expansiones chinas), el número sin ceros a la izquierda y sin la parte "/total" (75/103 → 75) y el Pokédex de la carta.
- El botón de la galería Por reemplazar pasa a decir "Bajar fotos locales del catálogo japonés y chino".
- Mismas reglas de PokeCottage: solo con `ARMA_FOTOS_LOCALES=1`, solo a pedido, de a una petición con pausa, álbumes guardados 30 días, sin repetir lo ya bajado, respetando 429/503 y `Retry-After`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fotos-del-catalogo-en-arma`: suma las fotos solo locales de PokeCottage para las cartas en chino simplificado.
- `fotos-por-reemplazar`: la descarga del catálogo cubre también el chino simplificado.

## Impact

- `apps/arma/server/sources/pokecottage.ts` (`matchPokecottage`): acepta entradas `scn_` y las cruza con las expansiones chinas.
- `apps/arma/server/catalogPhotos.ts`: el paso de PokeCottage incluye las cartas ZH-CN sin foto; Limitless y Bill's Archive siguen solo con japonesas.
- `apps/arma/src` (Por reemplazar): texto del botón.
- Peticiones a PokeCottage: ninguna nueva de álbumes para estas 379 (ya están guardados); unas 379 fotos, de a una con pausa.
- Sin migraciones.
