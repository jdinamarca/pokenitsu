# Proposal

## Why

Al cargar cartas una por una, el usuario solo ve qué carta era después de presionar Enter: si se equivocó de número o de variante, tiene que deshacer. Además, para cargar una carta tiene que saber su número; no puede escribir el nombre del Pokémon. El usuario pidió ver la carta antes de aceptarla y poder buscarla por nombre (maquetas D y E del canvas de Cargar, elegidas juntas, con Enter cargando directo).

## What Changes

- Mientras se escribe en el campo del número, la vista previa muestra la carta que se cargaría (marcada como "Vista previa", con borde punteado) y una línea dice qué hará Enter: "Se cargará: Flareon #3 Holo ES (Jungle) → Caja 5", cuántas cartas tiene un rango, que un número no existe o que Enter cambia el idioma/estado.
- Si se escriben letras, aparece una lista con las cartas de la expansión activa cuyo nombre coincide (miniatura, número, rareza, variante que se cargará, cuántas tienes). ↑/↓ eligen y la vista previa sigue a la elegida; Enter o un clic la cargan; Tab pone su número en el campo para agregarle `r`, `*2`, `lp`…
- Un clic en la carta de la vista previa también la carga.
- En expansiones japonesas (nombres solo en japonés) la búsqueda también usa el nombre en inglés del Pokémon según su número de Pokédex, y se muestra al lado (ヒトカゲ · Charmander).
- Las cartas sin imagen (3.500 de las 4.435 japonesas; TCGdex no la tiene) muestran una imagen de referencia del mismo Pokémon, atenuada y rotulada.
- `Esc` con texto en el campo lo borra; con el campo vacío sigue abriendo la búsqueda de expansión.

**Fuera del alcance:**
- Buscar por nombre en todas las expansiones (solo la activa).
- Cambios en la sintaxis, los atajos existentes, el deshacer o las ubicaciones: Enter carga exactamente lo mismo que antes para cualquier entrada con número.
- Backend y datos: no se tocan; el inventario no cambia.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `carga-de-cartas`: vista previa antes de cargar, búsqueda por nombre en la expansión activa y `Esc` que primero borra el texto.

## Impact

- Solo `apps/web/public/index.html`: `resolveEntry()` (lo que haría una entrada, compartido por la vista previa y Enter), `renderEntryPreview()`, lista de nombres, modo "pendiente" de `renderPreview()` y sus estilos.
- README.md (sección Cargar cartas).
- Se apila sobre el PR #13.
