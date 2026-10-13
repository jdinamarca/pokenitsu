# Proposal

## Why

La primera pasada (`animaciones-de-interfaz`) dejó diálogos y avisos fluidos, pero los menús y las vistas de detalle siguen apareciendo de golpe, los botones apenas responden al presionarlos y quedan dos detalles de movimiento heredados (pestañas con curva débil y una transición muerta en la barra de progreso).

## What Changes

- Los menús desplegables ("Datos ▾" y el "⋯" de una colección) aparecen desde su botón con un fade y una escala sutil.
- Al entrar al detalle de una expansión, un ilustrador, un grupo de artes conectados o una colección (y al volver a la lista), el contenido aparece con un fade corto en vez de cambiar de golpe.
- Los botones se encogen levemente al presionarlos.
- El fade de las pestañas usa la misma curva que los diálogos.
- Se elimina la transición de ancho de la barra de progreso (nunca se ejecutaba: la barra se dibuja ya con su valor final).
- Todo respeta "reducir movimiento" (solo fades, sin escalas ni desplazamientos).

**Fuera del alcance:**
- Animar la salida de los menús (se cierran al instante, como respuesta inmediata).
- Búsqueda, ingreso de cartas y grillas (se dejan sin animación a propósito).
- Backend, API, `packages/core` y datos del usuario: no se tocan; sin migración, el inventario no cambia.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `movimiento-de-interfaz`: se agregan requisitos para menús, vistas de detalle y respuesta de botones (capacidad creada por `animaciones-de-interfaz`, que se archiva antes que este cambio).

## Impact

- Código: solo `apps/web/public/index.html` (bloque `<style>` y los 8 puntos donde se alterna lista/detalle).
- Sin dependencias nuevas, sin cambios de API ni de base de datos.
- README.md: se amplía la sección "Animaciones".
- Depende del PR #9; este cambio se apila sobre él.
