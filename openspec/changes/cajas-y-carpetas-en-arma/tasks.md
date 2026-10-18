# Tasks

## 1. Reglas puras en core

- [x] 1.1 Agregar a `packages/core/src/locations.ts`: `ruleChips`, `describeRule`, `locationShadows`, `autoAssignPlan` y `suggestedLocations`, que reproducen a Nitsu. Pruebas en `packages/core/test/cajas.test.ts`: chips de cada parte, caja general, aviso de dos cajas con la misma serie, sin aviso cuando la otra es solo de especiales o de challa, plan con filas personales y filas que ninguna regla acepta, y las 8 sugeridas con el precio de alerta. Verificar con `pnpm --filter @pokenitsu/core test`.

## 2. Operaciones de ubicaciones en el paquete

- [x] 2.1 Mover a `@pokenitsu/inventory` desde `apps/api/src/index.js`, tal cual: `checkLocation` y `createLocations` (`create`, `update`, `reorder`, `remove`, `moveMany`), en `locations.ts`. Pruebas en `packages/inventory/test/locations.test.ts`: nombre vacío o repetido, borrar deja las copias en 0, move-locs ignora destinos que no son de la cuenta. Verificar con `pnpm --filter @pokenitsu/inventory test`.
- [x] 2.2 Hacer que las rutas de Nitsu (`/api/locations*` y `/api/inventory/move-locs`) llamen al paquete con el mismo contrato. Verificar con `pnpm test` y probando en Chrome que la pestaña Ubicaciones de Nitsu, contra la copia de la base, crea, edita, ordena y borra.
- [x] 2.3 Escribir el ADR 0024, "Arma gestiona las ubicaciones con las operaciones del paquete", y agregarlo al índice `docs/adr/README.md`.

## 3. Rutas en Arma

- [x] 3.1 Agregar en `apps/arma/server/` las rutas `POST /api/locations`, `PUT /api/locations/:id`, `PUT /api/locations-order`, `DELETE /api/locations/:id` y `POST /api/inventory/move-locs`, dentro de `asViewer`. Agregar `series` y `lang` del set a cada fila de `GET /api/inventory`. Verificar con curl contra la API de prueba (puerto 3015, copia `pokemon_fotos`), incluido que una ubicación de otra cuenta no se pueda editar ni recibir copias.

## 4. Pantalla Cajas y carpetas

- [x] 4.1 Hacer `Cajas.tsx` con la ruta `/cajas`, el enlace en el riel y el paso por `/entrar` sin sesión. Incluye:
  - el contador;
  - el estante con las repisas "Con cartas" y "Vacías por ahora", colores y animación (hover, elegida, entrada escalonada, movimiento reducido);
  - la ficha con estadísticas, miniaturas, chips, avisos, nota y acciones;
  - el aviso de copias sin ubicación;
  - el desplegable "¿Cómo decide dónde va cada carta?".

  Estilos en `styles.css` con los tokens de `DESIGN.md`. Verificar en Chrome contra la copia de la base, en escritorio y en el ancho de un teléfono.
- [x] 4.2 Hacer `LocationForm.tsx` en un `<dialog>`, con crear, editar y validaciones (nombre, código desconocido, especiales sin rareza ni precio). Agregar ↑/↓, borrar con confirmación, asignación automática con el detalle por caja y serie, y "Crear el orden sugerido". Verificar en Chrome con la copia de la base: crear "Carpeta IR", editarla, subirla, borrar una caja con copias, asignar las copias sin ubicación y crear el orden sugerido en una cuenta vacía.
- [x] 4.3 Leer `?ubicacion=` en Mi inventario y conectarlo con "Ver las N cartas". Cambiar el texto del riel sin ubicaciones por un enlace a Cajas y carpetas. Verificar en Chrome que "Ver las 19 cartas" abre Mi inventario con esa caja elegida.

## 5. Cierre

- [x] 5.1 Actualizar `README.md` y `apps/arma/DESIGN.md`, este con el estante y la ficha. Correr `pnpm test`, `pnpm typecheck` y `pnpm lint` sin errores.
- [x] 5.2 Verificar que la base real no cambió: huella de `locations` e `inventory` antes y después. Borrar la copia `pokemon_fotos`.

## Workflow follow-up

- PR contra `main`; mergear solo cuando el usuario lo pida.
- Después del merge: actualizar la carpeta del usuario, compilar `packages/*` y archivar el cambio en OpenSpec.
