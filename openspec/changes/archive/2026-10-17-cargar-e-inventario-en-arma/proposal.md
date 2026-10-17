# Proposal

## Why

"Arma tu colección" ya tiene sus propias cuentas (#67), pero para cargar cartas o ver el inventario todavía hay que abrir Nitsu. Este es el paso 2 de la transición del ADR 0021: traer a arma las dos pantallas que más se usan, Cargar y Mi inventario, con el diseño que el usuario eligió en el canvas (AO "La expansión se enciende" y AR "Estantería por ubicación").

## What Changes

- **Cargar en arma** (diseño AO):
  - La expansión elegida se ve entera en la vitrina, con lo que tienes encendido y lo que te falta en penumbra.
  - La entrada acepta la misma sintaxis de Nitsu: `25`, sufijos `r/h/n/e/p/m`, `*N`, `-25`, rangos `1-30`, `es`/`en`…, `nm`/`lp`…, y Enter con la caja vacía repite.
  - Al escribir un número, la carta se marca con luz; con Enter se carga y se enciende.
  - El contador grande muestra "encendidas / total".
  - La sesión guarda el idioma, el estado, si las cartas son para vender o personales, y dónde guardarlas (automático o una ubicación fija).
  - La búsqueda de expansión tiene recientes, y hay "Deshacer".
- **Mi inventario en arma** (diseño AR):
  - Cada caja o carpeta real del usuario es una repisa, en el orden en que están guardadas, con sus cartas y su "×N". "Sin ubicación" es una repisa más.
  - En el riel van las ubicaciones con sus conteos; al elegir una se ve solo esa.
  - La ficha lateral permite −1/+1, mover copias a otra ubicación, idioma, estado o variante, poner tu precio y marcar copias como personales.
- **El mismo inventario que Nitsu**: arma lee y escribe las tablas de `public` (`inventory`, `inventory_log`, `locations`, `price_overrides`) con la RLS de cada cuenta, así que lo que cargas en una app aparece en la otra.
- **Paquetes compartidos**:
  - `@pokenitsu/inventory` reúne las operaciones del inventario (sumar o restar copias, deshacer, mover y marcar personales) y la bajada de las cartas de una expansión. Las dos apps lo usan, como pasó con `@pokenitsu/auth` en el ADR 0022.
  - La API de Nitsu pasa a usar esas mismas funciones, sin cambiar sus rutas.
- **Navegación de arma**: el riel suma "Cargar" y "Mi inventario" junto a "Arma · Eevee".
- Un ADR nuevo: arma escribe en el inventario de `public` a través del paquete compartido.

**Fuera del alcance:**
- Crear, editar, reordenar o borrar ubicaciones. Se siguen gestionando en Nitsu; arma solo las lee y las usa.
- Lotes, exportar e importar, respaldo y "Vaciar inventario".
- El diálogo de precios y tipo de cambio, y bajar precios que falten (arma usa los que ya están guardados).
- Colecciones, Pokédex, artistas, artes conectados y aportes de fotos.
- Cambiar o tomar la foto de una carta desde Cargar.
- Los avisos especiales de Nitsu (carta valiosa, ilustrador favorito, expansión completa) y el sonido. Solo queda el aviso de carta nueva.
- Retirar las pantallas de Nitsu: siguen funcionando igual.

**Datos del usuario:** no hay migración de esquema. Arma escribe en las mismas filas y con las mismas reglas que Nitsu: las mismas restricciones, la misma RLS y el mismo log para deshacer. La verificación se hace contra una copia de la base, y las pruebas del paquete cubren las operaciones antes de que toquen datos reales.

## Capabilities

### New Capabilities
- `carga-en-la-vitrina`: cargar cartas al inventario desde arma, con la expansión entera en la vitrina, la sintaxis de teclado, la sesión de carga y "Deshacer".
- `inventario-por-ubicacion`: ver y editar el inventario en arma como una estantería, con una repisa por ubicación real y una ficha para editar las copias.

### Modified Capabilities
<!-- ninguna: las pantallas de Nitsu (carga-de-cartas, inventario, ubicaciones) no cambian de comportamiento -->

## Impact

- **Nuevo** `packages/inventory` (TypeScript, con Vitest): operaciones del inventario sobre un cliente `pg` y `ensureSetCards` (pokemontcg.io y TCGdex para las japonesas).
- **`apps/api`**: `index.js` y `catalog.js` delegan en el paquete; las rutas y respuestas no cambian.
- **`apps/arma/server`**: rutas nuevas de catálogo (expansiones, cartas de una expansión), inventario (estado, sumar, deshacer, mover, personales, mi precio) y ubicaciones (solo lectura), siempre con `set_config('app.user_id')`.
- **`apps/arma/src`**: navegación en el riel, pantallas `Cargar` y `Inventario` y sus componentes.
- **`packages/core`**: reutiliza `parseEntry`, `autoVariant`, `pickLocation`, `pickPrice` y `setProgress`. Se agrega con pruebas lo que falte, como expandir un rango.
- Script raíz `arma`: compila también `@pokenitsu/inventory`.
- Documentación: `docs/adr/0023-…`, README y DESIGN.md de arma.
