# Tasks

## 1. Pokédex por nombre en core

- [x] 1.1 Agregar `parseSpeciesCsv(csv)` y `dexFromJaName(name, species)` a `packages/core`, con pruebas en `packages/core/test/dex-por-nombre.test.ts`:
  - ex, GX, V, VMAX y VSTAR;
  - メガ…ex y Mega X;
  - ロケット団の y otros "…の";
  - かがやく;
  - パルデア;
  - las máscaras de Ogerpon;
  - TAG TEAM con `&` y `＆`;
  - ミュウツー frente a ミュウ;
  - un nombre de Entrenador, que da `[]`;
  - un caso ambiguo, que da `[]`.

  Verificar con `pnpm --filter @pokenitsu/core test`.

## 2. Servidor de Arma

- [x] 2.1 Hacer `apps/arma/server/details.ts` con `fillJaDetails(cardIds)`: TCGdex para `details_at` nulo, con el mismo SQL de relleno de Nitsu, y después el Pokédex por nombre. La lista de PokéAPI se baja con `fetchText`, con cache de 30 días, y se guarda transformada. Agregar pruebas de la parte pura, como armar los pares y elegir la única carta de la especie.
- [x] 2.2 Agregar a `details.ts` el trabajo `startJaDetails({sets?})` y `jaDetailsJob()`, con los pasos `tcgdex`, `pokedex` e `ilustrador`. El de ilustrador usa `bulbapediaLinks` con `ttl` de 30 días, una pausa entre especies, `SourceBusy` y un tope de 3 fallas. Poner el límite de `bulbapedia.bulbagarden.net` en 1 en `http.ts`.
- [x] 2.3 Agregar las rutas `GET /api/catalog-details` (pendientes y trabajo) y `POST /api/catalog-details` (con `sets` opcional), las dos con `requireOwner`. Desde `/api/inventory/add`, llamar a `fillJaDetails` con las cartas cargadas, sin esperar el resultado. Verificar con curl contra la API de prueba (3015, copia `pokemon_fotos`):
  - `sets: ["ja-M2", "ja-SV8a", "ja-PCG4"]` completa M2, pone los Pokédex de SV8a y los ilustradores de PCG4 que tienen pareja;
  - la segunda cuenta recibe 403;
  - pedirlo dos veces devuelve el mismo trabajo;
  - una carta que ya tenía ilustrador lo conserva.

## 3. Interfaz

- [x] 3.1 Agregar a `Reemplazar.tsx` la sección "Detalles de las japonesas": las tres cifras, el botón, el avance por paso, la espera o detención y el resumen final; consulta el avance cada 2 s mientras corre. Agregar a `api.ts` las rutas y los estilos con los tokens de `DESIGN.md`. Verificar en Chrome contra la copia, en escritorio y en el ancho de un teléfono, y comprobar que al cargar una carta de M2 sin detalles aparece después su imagen de referencia en Mi inventario.

## 4. Cierre

- [x] 4.1 Escribir el ADR 0025, "Arma completa los detalles del catálogo japonés", y agregarlo al índice. Actualizar `README.md` y `apps/arma/DESIGN.md`. Correr `pnpm test`, `pnpm typecheck` y `pnpm lint` sin errores.
- [x] 4.2 Verificar que las tablas del usuario no cambiaron en la base real (huella de `inventory`, `inventory_log` y `locations`), y que el catálogo real no se tocó durante las pruebas. Borrar la copia `pokemon_fotos`.

## Workflow follow-up

- PR contra `main`; mergear solo cuando el usuario lo pida.
- Después del merge: actualizar la carpeta del usuario, compilar `packages/*`, avisar que use "Completar detalles" en Por reemplazar, y archivar el cambio en OpenSpec.
