# Proposal

## Why

En Arma las ubicaciones solo se pueden mirar. Mi inventario tiene una repisa por caja o carpeta, pero para crear, editar o reordenar las cajas hay que volver a Nitsu, a la pestaña Ubicaciones. Arma reemplaza a Nitsu por etapas ([ADR 0021](../../../docs/adr/0021-arma-tu-coleccion-reemplaza-a-nitsu.md)), y al usuario le gustó cómo se veía esa pestaña: un estante con carpetas de pie y cajas con tapa. Esta es la etapa que la trae a Arma.

## What Changes

- Arma tiene una pantalla nueva, **Cajas y carpetas** (`/cajas`), con su enlace en el riel. Muestra las ubicaciones de la cuenta como en Nitsu, sobre repisas de madera:
  - las carpetas, como lomos de pie;
  - las cajas, con tapa y una etiqueta que dice el nombre, las cartas y el valor;
  - primero las que tienen cartas y después las vacías, apagadas.
- Con mouse, al pasar sobre una carpeta esta se inclina, y en una caja se levanta la tapa. En los dos casos asoman las 3 cartas más valiosas. Con "reducir movimiento" no hay movimiento.
- A la derecha va la **ficha** de la ubicación elegida. Muestra:
  - el tipo y la posición en la lista;
  - las cartas, las expansiones y el valor;
  - miniaturas de sus cartas;
  - lo que recibe, en chips con lenguaje de coleccionista;
  - los avisos ⚠️ de reglas que chocan;
  - la nota.

  Sus acciones son "Ver las N cartas", Editar, ↑, ↓ y Borrar.
- **Ver cartas** abre Mi inventario con esa ubicación elegida en el riel (`/inventario?ubicacion=<id>`).
- **Crear, editar y borrar.** El riel tiene "+ Nueva caja o carpeta". El formulario pide:
  - nombre;
  - tipo: caja, carpeta u otra;
  - si la app la asigna sola o solo a mano;
  - qué copias recibe: para vender, personales o ambas;
  - región;
  - series, o expansiones por código;
  - tipo de cartas: todas, solo challa, o solo especiales (por rareza o desde un precio);
  - nota.

  Al borrar una ubicación, sus copias quedan sin ubicación; no se pierden.
- **Asignar automáticamente.** Si hay copias sin ubicación, un aviso dice cuántas son y cuántas pueden ubicar tus reglas. Antes de confirmar se ve el detalle por caja y por serie. El traslado se hace en una sola transacción.
- **Orden sugerido.** Una cuenta sin ubicaciones ve la explicación abierta y un botón para crear 2 carpetas y 6 cajas por serie, igual que en Nitsu.
- La explicación "¿Cómo decide dónde va cada carta?" va plegada cuando ya hay ubicaciones.
- Mi inventario deja de decir "Tus cajas y carpetas se crean en Nitsu". Sin ubicaciones, su riel lleva a Cajas y carpetas.
- **Las operaciones de ubicaciones pasan a `@pokenitsu/inventory`:** crear, editar, ordenar, borrar y mover varias filas a la vez. El SQL se mueve tal cual desde la API de Nitsu, que pasa a usar el paquete. Así las dos apps guardan lo mismo, como ya ocurre con el inventario ([ADR 0023](../../../docs/adr/0023-arma-escribe-el-inventario-compartido.md)).
- **Las reglas puras pasan a `@pokenitsu/core`, con pruebas:**
  - qué recibe una ubicación, en chips y en frase;
  - qué otra ubicación le quita cartas (los avisos ⚠️);
  - el plan de asignación automática;
  - el orden sugerido.

**Fuera del alcance:**
- arrastrar para reordenar (se usan ↑ y ↓);
- mover copias desde la ficha de la caja (eso ya está en Mi inventario);
- cambiar la ubicación que Cargar sugiere: sigue usando `pickLocation`, sin cambios;
- cambiar la pestaña Ubicaciones de Nitsu: se ve y funciona igual, solo cambia por dentro;
- lotes de venta y su "dónde sacarlas".

## Capabilities

### New Capabilities
- `ubicaciones-en-arma`: la pantalla Cajas y carpetas de Arma, que cubre:
  - el estante y su animación;
  - la ficha de la ubicación elegida;
  - crear, editar, ordenar y borrar;
  - los avisos de reglas que chocan;
  - la asignación automática;
  - el orden sugerido;
  - el enlace a Mi inventario.

### Modified Capabilities
- `inventario-por-ubicacion`: hoy dice que las ubicaciones son de solo lectura en Arma y se editan en Nitsu. Con este cambio se editan en Cajas y carpetas, y Mi inventario puede abrirse con una ubicación ya elegida.

## Impact

- **Datos del usuario:** no hay migración ni cambio de esquema. Se usan las tablas `locations` e `inventory` actuales, con RLS y siempre dentro de `asViewer`. Hoy la cuenta del usuario tiene 8 ubicaciones y 32 filas. Las pruebas corren contra una copia de la base (`pokemon_fotos`), y al final se compara la huella de la base real para confirmar que no cambió.
- **Código:**
  - `packages/core/src/locations.ts`: chips, frase, avisos, plan y orden sugerido, con pruebas.
  - `packages/inventory`: operaciones de ubicaciones, con pruebas.
  - `apps/api/src/index.js`: las rutas `/api/locations*` y `/api/inventory/move-locs` pasan a llamar al paquete, con el mismo contrato.
  - `apps/arma/server/`: rutas nuevas con el mismo contrato que Nitsu. Las estadísticas salen de `GET /api/inventory`, que ya existe.
  - `apps/arma/src/`: pantalla `Cajas.tsx`, su formulario, el enlace en el riel (`Shell.tsx`), la ruta, y `?ubicacion=` en `Inventario.tsx`.
- **Documentación:** ADR 0024 (Arma gestiona las ubicaciones con las operaciones del paquete; reemplaza ese punto de 0023), README y `apps/arma/DESIGN.md`.
- Al mergear cambia `packages/*`, así que hay que recompilar los paquetes en la carpeta del usuario.
