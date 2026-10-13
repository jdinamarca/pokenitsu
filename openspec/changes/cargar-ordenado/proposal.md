# Proposal

## Why

La pestaña Cargar está saturada: el paso 1 muestra siempre cinco filas de opciones (9 idiomas, 5 estados, todas las ubicaciones, venta/personal y recientes), la ayuda de 10 atajos está siempre abierta y "Últimas cargas" ocupa 12 filas grandes. El campo del número, lo que más se usa, queda al medio. En el celular la vista previa de la carta queda al final, debajo del historial, y la página se desborda hacia la derecha. El usuario eligió la dirección "A · Barra de sesión" del canvas de rediseño.

## What Changes

- Los ajustes de carga (idioma, estado, ubicación y venta/personal) pasan a ser cuatro botones compactos que muestran el valor actual; sus opciones se abren en un menú al tocarlos. Un estado distinto de NM y el modo colección personal se destacan.
- Con una expansión elegida, la búsqueda se esconde: se ve la expansión con su avance y un botón "Cambiar expansión" (`Esc` sigue funcionando). Las expansiones recientes aparecen al buscar.
- El campo del número queda grande y arriba; la ayuda se reduce a una línea con los atajos más usados y un "Todos los atajos" que abre la lista completa (allí queda también "Sonido al cargar").
- "Últimas cargas" muestra 5 filas y un "Ver las 12".
- En el celular la carta recién cargada aparece justo debajo del campo, en formato horizontal, y se corrige el desborde horizontal.

**Fuera del alcance:**
- Reglas de carga: sintaxis, atajos de teclado, deshacer, rangos, avisos y ubicaciones automáticas no cambian.
- Las otras pestañas y el encabezado de la app.
- Backend, API, `packages/core` y datos del usuario: no se tocan; sin migración, el inventario no cambia. Las preferencias guardadas (idioma, ubicación, modo personal, sonido) se siguen leyendo igual.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `carga-de-cartas`: se agregan requisitos de cómo se presenta la pantalla de carga (ajustes compactos, búsqueda a pedido, ayuda corta, historial corto y vista previa en el celular).

## Impact

- Código: solo `apps/web/public/index.html` (marcado de `#tab-cargar`, sus estilos y las funciones `renderCur`, `renderLangs`, `renderConds`, `renderLocPick`, `renderPersMode`, `renderRecent`, `renderLog` y sus listeners).
- README.md: sección "Cargar cartas".
- Se apila sobre el PR #10.
