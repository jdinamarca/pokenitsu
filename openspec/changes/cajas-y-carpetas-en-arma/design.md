# Design

## Context

- **Datos.** Las ubicaciones están en `public.locations`: `user_id`, `name` único por cuenta, `kind` (box, binder u other), `pos`, `note` y `rule` jsonb. Cada fila de `inventory` tiene su `loc`; 0 significa sin ubicación. La RLS forzada ([ADR 0018](../../../docs/adr/0018-rls-forzado-con-usuario-por-conexion.md)) deja a cada cuenta en sus filas.
- **Nitsu.** Las rutas `POST/PUT/DELETE /api/locations`, `PUT /api/locations-order` y `POST /api/inventory/move-locs` están escritas en JS dentro de `apps/api/src/index.js`. La validación vive en `checkLocation`. La pantalla está en `apps/web/public/index.html` e incluye:
  - `locShadows`, para los avisos;
  - `describeRule` y `ruleChips`, para lo que recibe cada una;
  - `autoAssignPlan`, para la asignación automática;
  - `createSuggested`, para el orden sugerido;
  - `locItem` y `locDetail`, para el estante y la ficha.
- **Core.** `packages/core/src/locations.ts` ya tiene `ruleAccepts`, `ruleScore` y `pickLocation`, con pruebas. Arma los usa al cargar (`apps/arma/src/load.ts`).
- **Arma.** `GET /api/inventory` ya devuelve las filas con foto, los precios guardados y `locations` en orden; todo pasa por `asViewer`. Las operaciones de inventario vienen de `@pokenitsu/inventory` ([ADR 0023](../../../docs/adr/0023-arma-escribe-el-inventario-compartido.md)), que dice que Arma "no gestiona ubicaciones todavía".

## Goals / Non-Goals

**Goals:**
- Una sola implementación de las escrituras de ubicaciones, usada por las dos apps.
- Que las reglas de la pantalla, como los avisos, el plan y el texto de las reglas, se puedan probar sin navegador.
- Que el estante se vea como en Nitsu, con los tokens de Arma: fieltro, sala oscura y luz cálida.

**Non-Goals:**
- Cambiar el esquema o el contrato HTTP de Nitsu.
- Reescribir la pantalla Ubicaciones de Nitsu en React.

## Decisions

1. **Las escrituras pasan a `@pokenitsu/inventory`.** El paquete gana estas operaciones:
   - `checkLocation`;
   - `createLocation`, `updateLocation`, `reorderLocations` y `deleteLocation`; esta última deja las copias en 0 con `moveRow` y pone en 0 el `loc` de `inventory_log`;
   - `moveLocations` (el move-locs).

   El SQL se mueve tal cual desde Nitsu, cuyas rutas pasan a llamar al paquete con el mismo cuerpo y la misma respuesta. Arma expone las mismas rutas, dentro de `asViewer`.
   *Alternativa:* copiar el SQL en Arma. Se descarta por la misma razón que en 0023: dos implementaciones terminan separándose.
   Se registra en un **ADR 0024**, que reemplaza el punto "no gestiona ubicaciones" de 0023 sin editarlo.

2. **Las reglas de la pantalla pasan a `packages/core/src/locations.ts`, como funciones puras:**
   - `ruleChips(rule, ctx)` y `describeRule(rule, ctx)`, donde `ctx` trae `setCode(id)`, `eraName(x)` y `clp(n)`, para no depender del catálogo;
   - `locationShadows(locations, l, ctx)`, que incluye `eraOf` del set para cruzar expansiones con series;
   - `autoAssignPlan(rows, locations, copyInfo)`, que devuelve `[{row, to}]`;
   - `suggestedLocations(alert)`, con las 8 ubicaciones de Nitsu.

   Cada una lleva pruebas que reproducen los casos de Nitsu. Nitsu sigue con su copia en `index.html`: el front sin build usa `window.Core`, y regenerarlo queda para otra vez.

3. **Las estadísticas se calculan en el navegador**, desde `GET /api/inventory`: las copias, las expansiones, el valor para vender con `pickPrice` y las cartas más valiosas con foto. *Alternativa:* una ruta de resumen. Se descarta porque duplicaría la lógica de precios que ya corre en Mi inventario, y 33 o 6.000 filas se calculan rápido.

4. **La asignación automática se arma en el navegador y se aplica en el servidor.** El plan usa `pickLocation`, igual que Cargar. El servidor (`moveLocations`) valida que cada destino exista en la cuenta y mueve fila por fila en una transacción. Para el `CopyInfo` hace falta la serie (`eraOf`) y la región de cada expansión. `GET /api/inventory` agrega `series` y `lang` del set a cada fila, igual que hace `/api/sets` para Cargar.

5. **Pantalla.** Se crean `apps/arma/src/Cajas.tsx`, `apps/arma/src/components/LocationForm.tsx` y la ruta `/cajas` en `main.tsx`; el enlace en el riel usa el ícono `Boxes` de lucide. El estante se hace con CSS: las repisas son un `linear-gradient` repetido por fila, como en Nitsu, y los colores salen de los tokens de `DESIGN.md`. Las animaciones se ajustan a las reglas de Emil:
   - `transform` y `opacity`, y nada más;
   - ease-out de unos 350 ms;
   - entrada escalonada de 40 ms;
   - `@media (prefers-reduced-motion: reduce)`, que las anula;
   - `@media (hover:hover) and (pointer:fine)` para el hover.

   El formulario va en un `<dialog>` modal (`showModal`), que trae el foco, Esc y el fondo inerte. La confirmación de borrar y el detalle de la asignación usan el mismo `<dialog>` en vez de `confirm()`.

6. **`?ubicacion=` en Mi inventario.** Se lee al montar desde `location.search`. Si el id no está en la cuenta, se abre en "Todas". `navigate()` ya acepta una ruta con búsqueda.

## Risks / Trade-offs

- [Nitsu pasa a usar el paquete y cambia algo sin querer] → Las rutas conservan el cuerpo y la respuesta. Hay pruebas del paquete con una base de prueba, como las de `inventory.test.ts`, y se prueba en Chrome que la pestaña Ubicaciones de Nitsu sigue creando y borrando.
- [Los avisos ⚠️ de Arma y de Nitsu dejan de coincidir, porque hay dos copias de `locShadows`] → La versión de core reproduce la de Nitsu línea por línea, con pruebas tomadas de sus casos. Unificar el front de Nitsu queda para cuando se regenere `core.js`.
- [Borrar es irreversible] → Hay confirmación con el número de copias afectadas, y las copias no se pierden: quedan sin ubicación.
- [Una prueba podría tocar las ubicaciones reales] → Todo se prueba en la copia `pokemon_fotos`, con la API en el puerto 3015 y la web en el 5183, y al final se compara la huella de `locations` e `inventory` de la base real.

## Migration Plan

No hay migración de datos. Al mergear cambia `packages/*`: en la carpeta del usuario se hace `git pull`, después `pnpm -r --filter "./packages/*" build` y un `touch` a un archivo del servidor de Arma. La API de Nitsu, si está corriendo, toma el paquete nuevo al reiniciarse. Para volver atrás basta revertir el PR, porque no hay cambios de esquema.
