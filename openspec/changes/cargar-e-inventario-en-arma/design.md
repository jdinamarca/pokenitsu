# Design

## Context

- **Arma por dentro:** `apps/arma/server` es Fastify en TypeScript. Usa un `pg.Pool` propio con el mismo `DATABASE_URL` (usuario `pokemon`) y hoy solo escribe en el esquema `arma`. El inventario lo lee en solo lectura, con `set_config('app.user_id', …, true)` dentro de una transacción `READ ONLY` (`ownedCopies` en `session.ts`). La sesión se verifica con `@pokenitsu/auth` (#67).
- **Arma por fuera:** el front (Vite + React) elige pantalla según `location.pathname`: `/entrar` muestra el Login y todo lo demás, la Vitrina de Eevee. No hay router.
- **Cómo carga Nitsu** (`apps/api/src/index.js`):
  - `POST /api/inventory/add`, `/undo`, `/move` y `/personal` usan `rowOf`, `lockRow`, `writeRow` y `moveRow`. Bloquean la fila (`FOR UPDATE`), hacen upsert o borran en `inventory` y escriben en `inventory_log` (con `batch` en los rangos). La RLS (migración 027) separa las cuentas por `app.user_id`, y `user_id` toma su valor por defecto de esa misma configuración.
  - `PUT /api/prices/own` guarda tu precio en `price_overrides`, convertido con `getFx`.
  - Las cartas de una expansión se bajan a pedido con `ensureSetCards` (`catalog.js`): de pokemontcg.io o, para las japonesas, de TCGdex. Hoy 210 de 343 expansiones tienen sus cartas.
- **La parte del navegador en Nitsu:** el front resuelve la entrada con `parseEntry`, busca el número en la expansión cargada, elige la variante (sufijo o `autoVariant`) y la ubicación (`pickLocation`, con el precio de la carta), y recién entonces llama a `add`. Todas esas funciones ya están en `packages/core` con pruebas.
- **Datos reales del usuario:** hoy 32 filas de inventario y 8 ubicaciones. Las cifras de las maquetas son de ejemplo.

## Goals / Non-Goals

**Goals:**
- Una sola implementación de cada operación del inventario, usada por las dos apps, para que nunca den resultados distintos.
- Que arma pueda cargar en cualquier expansión, aunque Nitsu nunca la haya abierto.
- Pantallas fieles a AO y AR, dentro del sistema visual de arma (DESIGN.md).

**Non-Goals:**
- Gestionar ubicaciones, lotes, exportar e importar, precios de mercado y tipo de cambio (fuera del alcance de la propuesta).
- Reescribir la API de Nitsu en TypeScript o cambiar sus rutas.
- Un router general ni TanStack Query en arma. Eso queda para cuando haya más pantallas.

## Decisions

### 1. Paquete `@pokenitsu/inventory`, como `@pokenitsu/auth`
`packages/inventory` (TypeScript, tsup, Vitest) exporta funciones que reciben un cliente `pg` ya dentro de una transacción con `app.user_id` puesto:
- `addCopies(c, {sid, num, variant, lang, cond, loc, delta, personal, batch})`
- `undoLast(c)`
- `moveCopies(c, from, to, n)`
- `setPersonal(c, row, n)`
- `setOwnPrice(c, {sid, num, variant, usd})`
- `resolveCard(c, sid, num)`
- `ensureSetCards(pool, setId, force)`, con sus dos fuentes, y `getFx(pool)`.

El SQL y las validaciones se mueven tal cual desde `index.js`, `catalog.js` y `prices.js`. Esos archivos de Nitsu pasan a ser adaptadores delgados que llaman al paquete. La cuenta de copias (cuántas quedan, cuántas son personales, qué copias se mueven primero) va a `packages/core` como funciones puras con pruebas, porque es regla de negocio.

*Alternativas descartadas:*
- Que arma llame por HTTP a la API de Nitsu: vuelve la dependencia que el #67 sacó.
- Copiar el SQL en arma: dos implementaciones que se separan con el tiempo.

### 2. Arma escribe en `public` siempre con un helper `asViewer`
`apps/arma/server/viewerTx.ts` abre una transacción, pone `set_config('app.user_id', viewer.id, true)` y le pasa el cliente a la operación. Nunca se escribe en `public` sin ese helper, así que la RLS forzada protege cada consulta. Una consulta fuera del helper no ve filas: la política exige `app.user_id`. Se registra en el **ADR 0023** ("Arma escribe el inventario compartido"), que amplía el ADR 0021: arma ya no escribe solo en el esquema `arma`.

### 3. Rutas nuevas de arma
- `GET /api/sets?q=`: expansiones (código, nombre, serie, idioma, total impreso, si tiene cartas).
- `GET /api/sets/:id/cards`: llama a `ensureSetCards` y devuelve las cartas con su rareza, foto, variantes y precio elegido (`pickPrice` con la configuración de precios y el tipo de cambio guardados; si falta un precio, no se baja). Agrega las copias de la cuenta por número.
- `GET /api/inventory`: filas de la cuenta unidas a la carta, la expansión y la ubicación, más las ubicaciones con su orden y regla. Alimenta Mi inventario y el "Guardar en".
- `POST /api/inventory/add` | `/undo` | `/move` | `/personal` y `PUT /api/prices/own`: el mismo contrato de Nitsu, para que el front reutilice la misma lógica.

Las fotos siguen usando la ruta `/img/*` que arma ya tiene.

### 4. Navegación sin librería
`main.tsx` agrega `/cargar` y `/inventario` con el mismo patrón por `pathname`. El riel pasa a ser un componente compartido (`Shell`): marca, navegación con lucide (`Layers`, `Plus`, `Archive`), una zona propia de cada pantalla y "Cerrar sesión" al pie. Los enlaces usan `history.pushState` y un estado de ruta, sin recargar la página.

### 5. Cargar resuelve en el navegador, como Nitsu
La pantalla carga una vez las cartas de la expansión y el inventario. Con eso arma un índice por número y resuelve cada entrada con `parseEntry`, `autoVariant` y `pickLocation`, igual que Nitsu. Los rangos se expanden con una función nueva de core (`expandRange(index, entry)`), que se salta los números inexistentes y marca si hace falta confirmar (más de 50). La vitrina se actualiza al tiro con la respuesta de cada `add`, sin recargar todo. La sesión (idioma, estado, Para, Guardar en, recientes, última expansión) se guarda en `localStorage`, envuelta en try/catch.

### 6. La vitrina se enciende con la penumbra de siempre
Se reutiliza el componente de carta de la Vitrina (112px, etiqueta de cartulina) con el estado `off` de las reglas (`grayscale(1) brightness(.32)`, 450ms, instantáneo con "reducir movimiento"). La carta marcada lleva el contorno de luz. Una expansión grande (más de 250 cartas) se pinta con `content-visibility: auto` para que no se trabe.

### 7. Inventario: una repisa por ubicación
Las filas se agrupan por `loc` en el orden de `locations.pos`, con "Sin ubicación" al final. Las repisas envuelven sus cartas en varias filas (no hay scroll horizontal oculto). Buscar y "Para" filtran en el navegador. La ficha usa los mismos endpoints de mover, personal y precio; "Mover" es un formulario en línea con selects y "¿Cuántas de las N copias?", sin ventanas emergentes (DESIGN.md).

## Risks / Trade-offs

- **[Romper Nitsu al mover el SQL al paquete]** → Se mueve sin cambiar consultas ni respuestas. Antes de abrir el PR se prueban a mano en Nitsu (contra la copia de la base) cargar, deshacer un rango, mover y poner un precio, y se comparan las filas resultantes.
- **[Escribir datos reales]** → Toda la verificación se hace contra `pokemon_arma`, una copia de la base. La base real se compara por huella antes y después.
- **[Dos apps escribiendo la misma fila a la vez]** → El `FOR UPDATE` de siempre serializa las escrituras. "Deshacer" sigue siendo "la última carga de la cuenta", venga de la app que venga, igual que hoy entre pestañas.
- **[Bajar las cartas de una expansión tarda o falla]** → Se muestra "Cargando cartas…" y un botón para reintentar. Una misma expansión no se baja dos veces a la vez (la deduplicación de `ensureSetCards` vive en el paquete, por proceso).
- **[Precios faltantes]** → Arma no baja precios. Con "Automático", una carta sin precio guardado se ubica sin las reglas de precio, igual que en Nitsu antes de que llegue el precio. Queda anotado para cuando los precios pasen a arma.
- **[Tamaño del cambio]** → Son dos pantallas y un paquete. Las tareas van por capas (paquete → Nitsu sobre el paquete → rutas de arma → pantallas), y cada capa se verifica antes de pasar a la siguiente.
