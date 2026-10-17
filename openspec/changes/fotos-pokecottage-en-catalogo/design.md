# Design

## Context

- **Fotos solo locales del catálogo hoy (`apps/arma/server/catalogPhotos.ts`):** `ensureLocalCardPhotos(setId)` baja de Limitless TCG las fotos de las cartas japonesas sin foto, de a 2 con 250 ms de pausa. Lo registra en `arma.card_photos (card_id, source_id, src, ref)`.
  - `startCatalogPhotos()` recorre todas las expansiones japonesas. Es el botón de la galería "Por reemplazar", y su avance queda en memoria (`CatalogJob`).
- **PokeCottage hoy:** el importador del Full (`sources/pokecottage.ts`) y las fotos de las impresiones (`localPhotos.ts`) leen el álbum de un Pokémon: `https://pokecottagecdn.com/mastersets/data/{dex}-{nameKey(nombre en inglés)}.json`.
  - El nombre en inglés sale de PokéAPI (`speciesNames`).
  - Cada entrada trae `cardNumber`, `set {id: 'jpn_b02', name: 'Pokémon Jungle'}`, `variantType` (`default` para la estándar), `pokemonNumber` e `imageUrl`.
  - Las expansiones japonesas se cruzan con el catálogo por nombre en inglés (`loadCatalog().jaByName`).
  - Las fotos ya bajadas viven en `data/imagenes-locales/pokecottage-fotos/` con el nombre del archivo de PokeCottage. La fuente `pokecottage-fotos` (permiso `local`) ya existe.
- **Cliente HTTP (`sources/http.ts`):**
  - `withSlot` permite 2 peticiones a la vez por host (4 a TCGdex).
  - `fetchJson` guarda las respuestas en `arma.source_cache` por un día y reintenta 3 veces con 0,8 s y 1,6 s de espera. No distingue un 429.
  - `downloadOnce` no pide un archivo que ya existe, y da `missing` con 404/403.
- **Orden de las fotos (`inventory.ts`, `cardPhotos`):** propia de la carta o de su impresión, después catálogo y después solo local. Desde el #75, la foto solo local de la impresión del Full gana sobre la de `arma.card_photos`.
- **Medido:**
  - 3.548 japonesas sin foto: 2.644 de un solo Pokémon, de 849 Pokémon distintos; el resto son unas 900 entre Entrenadores, Energías y cartas sin Pokédex.
  - Muestra de 45 Pokémon: 136 de 145 en PokeCottage. Las 9 que no cruzaron: 6 por el nombre "Strength Expansion Pack Sun & Moon", 1 promo y 2 que no están.

## Goals / Non-Goals

**Goals:**
- Ver con foto, en local, las japonesas que Limitless no tiene, sobre todo las de 1997–2005.
- Tratar a PokeCottage con cuidado: una petición a la vez, con pausa, sin repetir nada y deteniéndose si da señales de carga.

**Non-Goals:**
- Entrenadores y Energías: los álbumes son por Pokémon.
- Bajar de PokeCottage al abrir Cargar.
- Cambiar la fuente de Limitless o su ritmo.

## Decisions

### 1. Un paso más en la descarga del catálogo, después de Limitless
`startCatalogPhotos()` pasa a tener dos pasos.

**Paso `limitless`:** el de hoy.

**Paso `pokecottage`:**
- Toma las cartas japonesas con Pokédex que siguen sin foto: sin `image_small`, sin fila en `arma.card_photos` y sin foto de su impresión del Full (`PRINTED_PHOTOS`).
- Las agrupa por Pokémon y recorre los Pokémon en orden.
- Por cada Pokémon: pide su álbum, cruza las entradas y baja las fotos que calzan.

Al ir después de Limitless, solo se le pide a PokeCottage lo que de verdad falta. Con eso, cerca de la mitad de las 2.480 posibles quedan sin pedir, porque Limitless ya las tiene.

*Alternativas descartadas:*
- **Bajar de PokeCottage al abrir una expansión en Cargar:** un álbum es por Pokémon, no por expansión. Abrir una expansión de 100 cartas pediría hasta 100 álbumes, que es justo lo que el usuario no quiere.
- **PokeCottage primero:** sus fotos son mejores en las antiguas, pero duplicaría lo que Limitless ya tiene y le pediría más a PokeCottage.

### 2. Ritmo: una cola propia, de a una, con pausa
- `LIMIT['pokecottagecdn.com'] = 1` en `http.ts`. Así, ni el importador del Full ni las fotos de impresiones ni este paso pueden tener dos peticiones a la vez a PokeCottage.
- El paso es secuencial: espera **1,5 s** después de cada álbum y **0,75 s** después de cada foto pedida. Una foto que ya existe (`existing`) o un álbum guardado no esperan, porque no hubo petición.
- Estimación: unos 850 álbumes y unas 1.300 fotos nuevas tardan en torno a 40 minutos, y la máxima carga es menos de 1,5 peticiones por segundo.

### 3. 429/503: esperar lo que pide, y detenerse si sigue fallando
*Al implementar:* una falla que no es "esperar" (un 500, un archivo que no es imagen) no se repite. Se cuenta como fallida, se espera una pausa de 5 s y se sigue con la siguiente; así, una sola foto rota no traba todas las descargas. Las fallas seguidas se cuentan igual, y con 3 se detiene.

- `http.ts` agrega `class SourceBusy extends Error { retryAfterMs }`. `fetchJson` y `downloadOnce` la lanzan con 429 o 503, **sin** su reintento rápido.
- El valor sale de `Retry-After` en segundos o como fecha. Si no viene, son 60 s, con un tope de 10 minutos.
- El paso de PokeCottage atrapa `SourceBusy`, espera ese tiempo, dejando `waitingUntil` en el avance, y reintenta **la misma** petición.
- Cualquier falla (`SourceBusy` o una respuesta no esperada) suma a un contador de fallas seguidas, que vuelve a 0 con cada éxito. Con **3 seguidas**, el paso se detiene con `stopped: 'PokeCottage respondió con errores 3 veces seguidas'`.
- Retomar es pedir la descarga otra vez: lo ya bajado está en `arma.card_photos` y los álbumes, en caché.

### 4. El álbum se guarda 30 días, con lo justo
`pokecottageAlbum(dex, nombre)` llama a `fetchJson(url, { ttl: 30 días, tries: 1, cacheKey: url + '#fotos-v2', transform })`. Con `tries: 1`, quien llama decide cuándo volver a preguntar, así que nunca hay un reintento rápido a PokeCottage. El `transform` se queda solo con lo que se usa de cada entrada: `id`, URL de la foto, `pokemonNumber`, `cardNumber`, `variantType`, `set.id` y `set.name`.

`localPhotos.ts` (las fotos del Full) usa la misma función, así que un álbum se pide una sola vez para las dos cosas.

*Cambio al implementar:* la clave es `#fotos-v2` y no `#fotos`. La entrada `#fotos` guardada tenía la forma vieja (solo `id` y URL), y con 30 días de vida habría pasado por buena sin los campos nuevos. Cuesta pedir de nuevo una sola vez el álbum de Eevee.

El nombre en inglés de cada Pokémon sale de `speciesNames(dex)`, como en el importador. Un 404 del álbum (un nombre que PokeCottage escribe distinto) se cuenta como "PokeCottage no tiene ese Pokémon" y no detiene nada.

### 5. El cruce: una función pura con pruebas
`matchPokecottage(entries, cards, jaByName)` va en `sources/pokecottage.ts`. Para cada carta, devuelve la URL de la foto o nada.

Una entrada corresponde a una carta si cumple todo esto:
- `set.id` empieza con `jpn_`;
- el set, por `nameKey(set.name)` o por un alias, da la misma expansión de la carta;
- `cardNumber` sin ceros a la izquierda es igual al número de la carta sin ceros;
- `pokemonNumber` está en el Pokédex de la carta.

Entre varias entradas de una carta, gana la de `variantType = 'default'`, y si no hay, la primera.

El Pokédex es la segunda verificación que pide la regla de veracidad. Así, un nombre de expansión mal cruzado no puede darle a una carta la foto de otro Pokémon.

**Alias:** se agrega `PC_SET_ALIASES: Record<id de expansión de PokeCottage, id de la nuestra>` en el mismo archivo. Va por id y no por nombre, porque PokeCottage repite nombres ("Sun & Moon"). Se arma así:
1. Correr el cruce sobre todos los álbumes ya guardados y listar los nombres de expansión japonesa de PokeCottage que no calzan y que tienen cartas sin foto en el catálogo.
2. Verificar cada alias contra TCGdex y Bulbapedia (fecha, total y nombre japonés) antes de agregarlo.

Resultado al implementar: de las 23 expansiones con japonesas sin foto, solo dos necesitaron alias:
- `jpn_sm1+` "Sun & Moon" → `ja-SM1p` (サン＆ムーン, 51 cartas, 2017-01-27). Coincide en el catálogo, PokeCottage y Bulbapedia ("Enhanced Expansion Pack Sun & Moon").
- `jpn_neop2` → `pc-jpn_neop2`, una expansión que el catálogo tomó de PokeCottage con su mismo id.

### 6. Registro y orden entre fotos solo locales
Lo encontrado se guarda en `arma.card_photos` con `source_id = 'pokecottage-fotos'`, `src = /img-local/pokecottage-fotos/<archivo>` y `ref` = la URL de PokeCottage. El nombre de archivo es el mismo que usa `localPhotos.ts`, así que una foto que ya bajó el Full no se vuelve a pedir.

En `cardPhotos`, la foto solo local se elige en este orden: la de la impresión del Full, la de `limitless` y la de `pokecottage-fotos`. Hoy, entre dos filas de `card_photos`, gana la que llega primero. Esto lo vuelve explícito.

### 7. Avance
`CatalogJob` agrega estos campos:
- `phase: 'limitless' | 'pokecottage'`;
- `pokemon` (total) y `pokemonDone`;
- `waitingUntil?: string`;
- `stopped?: string`.

`fetched`, `missing` y `failed` se separan por fuente (`bySource`). La galería muestra, por ejemplo:
- "PokeCottage: 312 de 849 Pokémon · 540 fotos nuevas · 41 que no tiene";
- "Esperando a PokeCottage hasta las 14:32";
- "Se detuvo: … Pídela otra vez para seguir".

### 8. Probar sin bajar todo dos veces
`POST /api/local-photos/catalog` acepta `{ dex: number[] }` (solo el administrador), que limita el paso de PokeCottage a esos Pokémon. Así se prueba en la copia de la base con 3 o 4 Pokémon, y no con los 850. Sin `dex`, recorre todo, como pide la galería.

## Risks / Trade-offs

- **[PokeCottage se molesta por la carga]** → Una petición a la vez con pausa, caché de 30 días, nada repetido y respeto de `Retry-After`. Además, se detiene sola y solo corre a mano. Lo autorizó para uso local.
- **[Una foto en la carta equivocada]** → El cruce exige expansión, número y Pokédex. Los alias se verifican uno por uno con dos fuentes. Además, todas quedan en "Por reemplazar" con su fuente, a la vista.
- **[Nombres de Pokémon que PokeCottage escribe distinto (Nidoran♀, Mr. Mime, Farfetch'd…)]** → Dan 404, se cuentan como "no tiene" y no detienen nada. Si son muchos, se agrega un alias de nombre como corrección aparte.
- **[Tarda]** → Unos 40 minutos, en segundo plano y con avance. Se puede cerrar la galería y volver.

## Migration Plan

- Sin migraciones. Las filas nuevas de `arma.card_photos` usan una fuente que ya existe.
- Para volver atrás: `DELETE FROM arma.card_photos WHERE source_id = 'pokecottage-fotos'` y revertir el PR. Los archivos de `data/imagenes-locales/pokecottage-fotos/` se pueden dejar, porque el Full también los usa.
