# 0024. "Arma tu colección" gestiona las ubicaciones con las operaciones del paquete

- Estado: Aceptado
- Fecha: 2026-10-17

## Contexto
[0023](0023-arma-escribe-el-inventario-compartido.md) le dio a Arma la escritura del inventario compartido, pero dejó fuera la gestión de ubicaciones. Con eso, las cajas y carpetas solo se podían crear, editar u ordenar en la pestaña Ubicaciones de Nitsu, y Mi inventario las mostraba en solo lectura. La etapa siguiente trae a Arma la pantalla Cajas y carpetas (cambio `cajas-y-carpetas-en-arma`). Esa pantalla escribe en `public.locations` y reubica copias, igual que Nitsu.

## Decisión
- **Arma escribe en `locations`.** Puede crear, editar, ordenar y borrar ubicaciones, y mover varias filas de inventario a la vez con la asignación automática. Lo hace siempre dentro de `asViewer`, así que la RLS deja a cada cuenta en sus ubicaciones.
- **Las escrituras viven en `@pokenitsu/inventory` (`locations.ts`).** El paquete trae `checkLocation` y las operaciones `create`, `update`, `reorder`, `remove` y `moveMany`. El SQL se movió tal cual desde la API de Nitsu, que ahora también lo usa. Las rutas `/api/locations*` y `/api/inventory/move-locs` reciben y responden lo mismo en las dos apps.
- **Las reglas de la pantalla viven en `@pokenitsu/core`, con pruebas:**
  - qué recibe una ubicación (`ruleChips`, `describeRule`);
  - qué otra le quita cartas (`locationShadows`);
  - el plan de asignación automática (`autoAssignPlan`, que usa `pickLocation` igual que Cargar);
  - el orden sugerido (`suggestedLocations`).

  El front de Nitsu, que es un archivo sin build, conserva su copia hasta que se regenere `core.js`.
- Este ADR reemplaza el punto "lo que arma no hace todavía: gestionar ubicaciones" de 0023. El resto de 0023 sigue vigente.

## Alternativas consideradas
- **Copiar el SQL en Arma:** quedarían dos implementaciones que se separan con el tiempo, y una misma regla se guardaría distinto según la app.
- **Dejar las ubicaciones solo en Nitsu:** obliga a usar las dos apps para algo cotidiano y atrasa el reemplazo por etapas de [0021](0021-arma-tu-coleccion-reemplaza-a-nitsu.md).

## Consecuencias
- Lo que se edita en una app se ve igual en la otra.
- Un cambio en el SQL de ubicaciones se hace una sola vez, en el paquete.
- Mientras Nitsu siga activo, los avisos de reglas que chocan tienen dos copias: la de core y la de `index.html`. Las pruebas de core reproducen los casos de Nitsu.
