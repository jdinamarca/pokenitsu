# Tasks

## 1. Base

- [x] 1.1 Migración `008` del esquema `arma`: la fuente `billsarchive` (Bill's Archive, `local`, con imágenes y su nota). Verificar en una copia de la base que corre y que una segunda vez no hace nada.
- [x] 1.2 `http.ts`:
  - `fetchText` con la misma caché que `fetchJson`, un solo intento y `SourceBusy`;
  - `LIMIT` de 1 para `billsarchive.com` y para `bills-archive.nyc3.cdn.digitaloceanspaces.com`.

  Pruebas: un 429 da `SourceBusy` tras una sola petición, y nunca hay dos a la vez al mismo host.

## 2. La fuente

- [x] 2.1 `sources/billsarchive.ts`: `billsIndex()` (los slugs de la navegación), `billsPage(slug)` (`{code, count, images}`, 30 días) y `matchBills(page, cards)`. Pruebas con un HTML de muestra:
  - `pmcg5-70_narrow-gym.webp` va a `ja-PMCG5-070`;
  - `e4-10_yanma.webp` va a `ja-E4-010`;
  - una cantidad que no calza da `mismatch`;
  - imágenes repetidas en el HTML no se duplican.

## 3. El paso

- [x] 3.1 Generalizar `pokecottageStep` a `politeStep` sin cambiar su comportamiento: las pruebas de ritmo existentes siguen en verde.
- [x] 3.2 Paso `billsarchive` en `startCatalogPhotos`:
  - las cartas sin ninguna foto, agrupadas por expansión;
  - el slug deducido del nombre en inglés, y si no, el índice;
  - la página, el cruce y las fotos a `billsarchive/`;
  - el registro en `card_photos`;
  - `CatalogJob` con `billsSets`, `billsDone`, `billsSkipped` y `bySource.billsarchive`.

  Verificar en una copia de la base con `dex` vacío limitado a `ja-PMCG2` y `ja-PMCG5`, con un parámetro `sets` solo para pruebas:
  - la Poké Ball #048 de Jungle y los Entrenadores de Leaders' Stadium quedan con foto;
  - una segunda pasada no pide nada.
- [x] 3.3 `photoOrder.ts`: `billsarchive` va después de `pokecottage-fotos`. Con su prueba.

## 4. Pantalla y cierre

- [x] 4.1 `Reemplazar.tsx`: la línea de Bill's Archive en el avance, con las expansiones saltadas. Verificar typecheck y lint.
- [x] 4.2 En Chrome sin interfaz, contra la copia:
  - "Por reemplazar" muestra el filtro "Bill's Archive" con la Poké Ball de Jungle;
  - Cargar muestra Jungle #048 con la foto y la marca violeta;
  - sin errores de JS.

  Comprobar que no se escribió fuera de `LOCAL_IMAGE_DIR` y que la base real no cambió.
- [x] 4.3 README: Bill's Archive como tercera fuente solo local, por qué se descartaron Dittobase y Pokellector, y el ritmo. Verificar leyendo la sección.
- [x] 4.4 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- PR contra `main`; merge solo a pedido; después, archivar este cambio.
- Después del merge, correr "Bajar fotos locales del catálogo japonés" en la base real.
