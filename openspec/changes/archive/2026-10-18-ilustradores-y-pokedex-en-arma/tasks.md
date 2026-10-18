# Tasks

## 1. Lógica pura en core

- [x] 1.1 Agregar `packages/core/src/gallery.ts` con `REGIONS`, `regionOf`, `shelvesBySet`, `filterOwned` y `sortArtists`, con pruebas en `packages/core/test/galeria.test.ts`:
  - los límites de cada región (#151 y #152, #905 y #906, #1025);
  - repisas de la más nueva a la más antigua, con `tengo / total`;
  - los filtros Tengo y Me faltan sin repisas vacías;
  - los cuatro órdenes de ilustradores, con su desempate.

  Verificar con `pnpm --filter @pokenitsu/core test`.

## 2. Servidor de Arma

- [x] 2.1 Hacer `apps/arma/server/gallery.ts` con `GET /api/artists`, `/api/artists/cards`, `/api/pokedex` y `/api/pokedex/:dex`, con `scope`, `requireViewer`, `asViewer`, `pickCardPhotos` y la imagen de referencia, y los nombres de `speciesNames()`. Verificar con curl contra la API de prueba (3015, copia `pokemon_fotos`):
  - los totales coinciden con SQL directo (410 ilustradores, 1.025 especies);
  - `scope=ja` deja solo cartas `ja-`;
  - una segunda cuenta ve `mine = 0` y no las copias del usuario;
  - sin sesión, 401;
  - cada ruta responde en menos de 300 ms.

## 3. Interfaz

- [x] 3.1 Hacer `Ilustradores.tsx` (galería de firmas, buscador, orden, portada al hover, miniatura en el teléfono) y el componente compartido de galería por expansión, con Todas · Tengo · Me faltan, color y blanco y negro, y la cantidad de copias. Agregar la tipografía de firma con `@fontsource`, las rutas en `main.tsx`, el enlace en `Shell` y `api.ts`. Aplicar las skills de diseño y animación instaladas.
- [x] 3.2 Hacer `Pokedex.tsx`, con las pestañas por región y su avance, las ventanitas y la galería de un Pokémon. Usar `/pokedex/<región>` y `/pokedex/<n>`, y `?ver=` en las cuatro pantallas.
- [x] 3.3 Verificar en Chrome, contra la copia, en escritorio (1440) y en teléfono (390):
  - Arita en la lista;
  - la portada al hover, pidiéndose una sola imagen;
  - en la galería, una carta tenida a color y una faltante en blanco y negro;
  - Me faltan;
  - Japonesas;
  - Kanto → Johto, y Atrás;
  - Espeon, y volver a Johto;
  - Pikachu con su TAG TEAM;
  - reducir movimiento;
  - sin scroll horizontal;
  - sin sesión, a `/entrar`.

## 4. Cierre

- [x] 4.1 Actualizar `README.md` y `apps/arma/DESIGN.md`. Correr `pnpm test`, `pnpm typecheck` y `pnpm lint` sin errores.
- [x] 4.2 Verificar que la base real no cambió (huella de `inventory`, `inventory_log`, `locations` y `cards`) y borrar la copia `pokemon_fotos`.

## Workflow follow-up

- PR contra `main`; mergear solo cuando el usuario lo pida.
- Después del merge: actualizar la carpeta del usuario, compilar `packages/*`, avisar que reinicie `pnpm arma` (por la tipografía nueva) y archivar el cambio en OpenSpec.
