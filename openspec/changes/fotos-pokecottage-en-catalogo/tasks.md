# Tasks

## 1. Cliente HTTP sin saturar a PokeCottage

- [ ] 1.1 `sources/http.ts`:
  - `LIMIT['pokecottagecdn.com'] = 1`;
  - `class SourceBusy extends Error { retryAfterMs }`, que `fetchJson` y `downloadOnce` lanzan con 429 o 503 sin su reintento rápido;
  - `Retry-After` en segundos o como fecha (si no viene, 60 s; tope 10 min).

  Pruebas con un `fetch` simulado:
  - un 429 con `Retry-After: 60` da `SourceBusy` de 60.000 ms tras **una** sola petición;
  - un 503 sin la cabecera da 60.000 ms;
  - dos llamadas paralelas a `pokecottagecdn.com` nunca están en curso a la vez.

  Verificar con `pnpm --filter @pokenitsu/arma test`.

## 2. El cruce con los álbumes

- [ ] 2.1 `matchPokecottage(entries, cards, jaByName)` en `sources/pokecottage.ts`:
  - solo entradas `jpn_`;
  - expansión por `nameKey(set.name)` o `PC_SET_ALIASES`;
  - número sin ceros a la izquierda;
  - `pokemonNumber` en el Pokédex de la carta;
  - gana `variantType = 'default'`.

  Pruebas:
  - Jungle #037 con `cardNumber '37'` y la carta `037` calza;
  - una entrada de otro Pokédex con la misma expansión y número no calza;
  - una `scn_` no calza;
  - entre `Standard` y `No Rarity Symbol` gana la estándar.
- [ ] 2.2 Alias de expansiones:
  - Con un guion de una sola vez, en el scratchpad, que lea solo los álbumes ya guardados en `arma.source_cache` o los 45 de la muestra (sin pedir nada nuevo), listar los nombres de expansión japonesa de PokeCottage que no calzan y que tienen cartas sin foto.
  - Verificar cada uno contra TCGdex y Bulbapedia (nombre japonés, fecha y total) y agregar a `PC_SET_ALIASES` solo los confirmados, con un comentario de la fuente.
  - Empezar por "Strength Expansion Pack Sun & Moon".

## 3. El paso de PokeCottage

- [ ] 3.1 Álbum guardado 30 días:
  - `pokecottageAlbum(dex)` usa `fetchJson` con `ttl` de 30 días, `cacheKey` `url#fotos` y un `transform` con solo `pokemonNumber`, `cardNumber`, `variantType`, `set.id`, `set.name` e `imageUrl` de las entradas japonesas;
  - 404 → `null`;
  - `localPhotos.ts` pasa a usar la misma función, para que la clave guarde siempre lo mismo.

  Verificar que la foto local de Eevee sigue cruzando con la nueva forma: correr la descarga de fotos de Eevee en la copia de la base y comprobar que no cambia ninguna fila.
- [ ] 3.2 `catalogPhotos.ts`:
  - `startCatalogPhotos({ dex? })` con dos pasos: `limitless` (el de hoy) y `pokecottage`;
  - en el paso `pokecottage`:
    - cartas japonesas con Pokédex sin `image_small`, sin fila en `arma.card_photos` y sin `PRINTED_PHOTOS`, agrupadas por Pokémon;
    - de a uno: álbum, cruce y fotos con `downloadOnce` a `LOCAL_IMAGE_DIR/pokecottage-fotos/<archivo de PokeCottage>`;
    - pausas de 1,5 s después de cada álbum pedido y 0,75 s después de cada foto pedida;
    - `SourceBusy` → espera `retryAfterMs` (con `waitingUntil`) y reintenta;
    - 3 fallas seguidas → `stopped`;
    - lo encontrado va a `arma.card_photos` (`pokecottage-fotos`, `src`, `ref`).
  - `CatalogJob` con `phase`, `pokemon`, `pokemonDone`, `waitingUntil`, `stopped` y los conteos por fuente.
  - `POST /api/local-photos/catalog` acepta `{ dex }`, solo para el administrador.

  Verificar en la copia de la base con `dex` = Eevee, Pikachu, Bulbasaur y Meowth:
  - las cartas de Jungle, Rocket Gang y Leaders' Stadium quedan con foto de PokeCottage;
  - una segunda pasada no hace ninguna petición a PokeCottage (contar con `stats` y `downloads`).
- [ ] 3.3 Prueba de ritmo, con un servidor local falso que hace de PokeCottage (URL base configurable solo en pruebas):
  - nunca hay dos peticiones a la vez;
  - entre peticiones pasa al menos la pausa;
  - un 429 con `Retry-After: 2` hace esperar 2 s y reintentar;
  - tres 500 seguidos detienen el paso con `stopped`.

## 4. Orden de las fotos y galería

- [ ] 4.1 `cardPhotos` en `inventory.ts`: la foto solo local se elige en este orden: impresión del Full, `limitless` y `pokecottage-fotos`. Prueba de la función de orden.
- [ ] 4.2 `Reemplazar.tsx`:
  - avance por paso ("Limitless: N de M expansiones…" / "PokeCottage: N de M Pokémon…");
  - "Esperando a PokeCottage hasta las HH:MM";
  - "Se detuvo: … Pídela otra vez para seguir".

  Verificar typecheck y lint.
- [ ] 4.3 En Chrome sin interfaz, contra una copia de la base, con el interruptor encendido y `dex` limitado a 4 Pokémon:
  - el botón muestra los dos pasos y su avance;
  - al terminar, la galería muestra fotos de PokeCottage con su filtro;
  - Cargar muestra Rocket Gang con las fotos y la marca violeta;
  - abrir una expansión en Cargar no hace ninguna petición a PokeCottage;
  - sin errores de JS.

  Comprobar que no se escribió nada fuera de `LOCAL_IMAGE_DIR` y que la base real no cambió.

## 5. Documentación y cierre

- [ ] 5.1 README: PokeCottage como segunda fuente de fotos solo locales del catálogo japonés, cómo se cruza, el ritmo (de a una, pausas, 30 días, `Retry-After`, se detiene sola) y cómo retomar. Verificar leyendo la sección.
- [ ] 5.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- PR contra `main`; merge solo a pedido; después, archivar este cambio.
- Cuando quieras, correr "Bajar fotos locales del catálogo japonés" en tu base real (unos 40 minutos, en segundo plano).
