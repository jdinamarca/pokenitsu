# Design

## Context

- **Catálogo.** `public.cards` tiene `artist`, `rarity`, `dex int[]`, `supertype`, `variants` y `details_at`. Las japonesas vienen de TCGdex (`sets.source = 'tcgdex-ja'`, ids `ja-<SET>-<NUM>`). El catálogo es compartido entre cuentas y no tiene RLS por usuario.
- **Nitsu** (`apps/api/src/details.js`) completa en segundo plano, al arrancar, las cartas con `artist` vacío y `details_at` nulo: una request a `TCGdex /ja/cards/<id>` por carta, de a 3. Rellena con `coalesce`, toma el `dexId` solo si `dex` está vacío y marca `details_at`. Si TCGdex no trae `dexId` (las ex de Escarlata y Púrpura), la carta queda sin Pokédex para siempre, porque ya tiene ilustrador.
- **Arma** (`apps/arma/server`) ya tiene:
  - `sources/http.ts`: `fetchJson` y `fetchText`, con cache en `arma.source_cache`, un límite de requests por host y `SourceBusy`, que respeta los 429 y 503 con su `Retry-After`;
  - `sources/bulbapedia.ts`: `bulbapediaLinks(cat, speciesEn)`, que devuelve pares `{a: inglesa, b: japonesa}` desde la lista de cartas de una especie. En los sets antiguos la página no trae el número japonés (`b.number = ''`);
  - `sources/catalog.ts`: `loadCatalog`, con `jaByName` y `cardIds`;
  - `catalogPhotos.ts`: el modelo de trabajo del administrador (`CatalogJob`, pasos, `current`, avance, `POLITE`), con sus rutas en `index.ts` y su sección en `Reemplazar.tsx`, que consulta el avance cada 2 s;
  - `inventory.ts`: `refImages` busca la imagen de referencia por `dex`.
- **PokéAPI** publica `data/v2/csv/pokemon_species_names.csv`: 12.300 filas con id, idioma y nombre. El idioma 1 es japonés en kana, el 11 japonés y el 9 inglés. Cubre las 1.025 especies.

## Goals / Non-Goals

**Goals:**
- Que las japonesas de Arma tengan Pokédex e ilustrador sin depender de que Nitsu arranque.
- Pocas requests y bien espaciadas, todas en cache; nunca dos trabajos a la vez.
- No pisar nunca un dato que ya está.

**Non-Goals:**
- Cambiar el trabajo de Nitsu o su contrato.
- Ilustradores de Entrenadores y Energías antiguos.
- Corregir datos que TCGdex trae mal (por ejemplo, la errata "レイカザ").

## Decisions

1. **`dexFromJaName(name, species)` en `packages/core`, pura y con pruebas.** `species` es un `Map<nombre NFKC, dex>` hecho con `parseSpeciesCsv(csv)`, que lee los idiomas 1 y 11 del CSV.
   - El nombre se normaliza con NFKC y se parte en `&` o `＆` (TAG TEAM).
   - En cada parte se buscan los nombres de especie, del más largo al más corto. Cada nombre encontrado se tapa, para que ミュウ no calce dentro de ミュウツー.
   - Si una parte calza con exactamente una especie, ese es su número. Si alguna parte calza con cero o con más de una, el resultado es `[]` y no se escribe nada.
   - Así se cubren los adornos (ex, GX, V, VMAX, メガ, ロケット団の, かがやく, パルデア, la máscara de Ogerpon) sin tener que listar cada uno.

   En la muestra real calzan 203 de 223, y los 203 están bien. *Alternativa:* usar solo los nombres que ya tienen Pokédex en el catálogo. Calzan 161, y no cubre especies nuevas.

2. **`apps/arma/server/details.ts`** tiene:
   - `fillJaDetails(cardIds)`: TCGdex para las que tienen `details_at` nulo, y después el Pokédex por nombre para las que siguen sin `dex` y no son Entrenador ni Energía. El SQL de escritura es el mismo de Nitsu (`coalesce`, `dex` solo si está vacío, `details_at = now()`). Se llama desde `/api/inventory/add` después de responder, sin `await`. Un error se registra en el log y no afecta la carga.
   - `startJaDetails({sets?})` y `jaDetailsJob()`: el trabajo del administrador, con tres pasos (`tcgdex`, `pokedex`, `ilustrador`) y el mismo modelo que `CatalogJob`: `running`, `phase`, totales, hechos, `current`, `filled`, `missing`, `failed`, `waitingUntil` y `stopped`. El parámetro `sets` sirve para probarlo con pocas expansiones.

3. **La lista de nombres de PokéAPI** se baja con `fetchText` y una cache de 30 días. Se guarda transformada a `{ja: [[nombre, dex]], en: [[dex, nombre]]}`, no el CSV completo. El nombre en inglés de cada especie, que Bulbapedia necesita, sale del mismo archivo, sin pedir `pokemon-species/<dex>` por especie.

4. **El paso del ilustrador:**
   - Se toman los dex de los Pokémon japoneses sin ilustrador y, por cada uno, se llama a `bulbapediaLinks(cat, enName)`, con `ttl` de 30 días y una pausa de 1,5 s entre especies que no venían de la cache. El límite del host `bulbapedia.bulbagarden.net` pasa a 1.
   - Para cada par, si la japonesa está en el catálogo con `artist` vacío y la inglesa tiene `artist`, se copia. Cuando el par no trae número japonés, se usa la única carta de esa especie en ese set japonés; si hay más de una, se salta.
   - Ante `SourceBusy` se espera lo que pidió la fuente. Si falla 3 veces seguidas, el trabajo se detiene con `stopped`, como el de las fotos.
   - *Alternativa:* leer la página de cada carta en Bulbapedia, ≈490 requests. El usuario la descartó en favor de la lista por especie (≈213).

5. **El catálogo es compartido.** Estas escrituras no van en `asViewer` sino con el `pool`, como hoy las hacen el importador de Arma y el catálogo de Nitsu. Las rutas `GET/POST /api/catalog-details` exigen `requireOwner`. El aviso desde `/api/inventory/add` solo recibe los ids de las cartas recién cargadas.

6. **TCGdex va de a 3, como en Nitsu.** El límite del host sigue en 4.

7. **La interfaz.** En `Reemplazar.tsx` se agrega una sección "Detalles de las japonesas", arriba de la galería y separada de la de fotos. Muestra:
   - las cartas pendientes: sin consultar en TCGdex, Pokémon sin Pokédex y Pokémon sin ilustrador;
   - el botón "Completar detalles";
   - mientras corre, el paso, la barra de avance, lo completado, lo que la fuente no tiene, los fallos y si una fuente pidió esperar;
   - el resumen final.

   La sección consulta el avance cada 2 s mientras corre, como la de fotos. No depende de `ARMA_FOTOS_LOCALES`, porque son datos de texto, no fotos.

## Risks / Trade-offs

- **[Bulbapedia es CC BY-NC-SA]** De ella se toma solo qué carta es igual a cuál; el ilustrador sale del catálogo propio. Igual queda como fuente solo local, como hoy en Arma. → Se revisa antes de producción (#40).
- **[Un nombre ambiguo daría un Pokédex equivocado]** Si hay duda, el resultado es vacío. Las pruebas cubren ミュウ y ミュウツー, TAG TEAM, formas regionales, Mega X, "の" y nombres de Entrenador.
- **[Un par de Bulbapedia mal resuelto]** Solo se escribe si la japonesa tiene `artist` vacío y el número calza, o si es la única carta de esa especie en ese set.
- **[El trabajo se interrumpe]** Lo hecho queda escrito, y al pedirlo otra vez sigue con lo que falta, porque los pendientes se calculan desde la base. Las respuestas ya pedidas salen de la cache.
