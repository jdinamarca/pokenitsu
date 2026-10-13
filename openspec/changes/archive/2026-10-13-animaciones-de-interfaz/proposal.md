# Proposal

## Why

Los diálogos (ficha de carta, foto, precio, grupos, colecciones) aparecen de golpe y los toasts desaparecen sin transición, lo que se siente brusco justo en las superficies de detalle más usadas. Además la app no respeta `prefers-reduced-motion`: el brillo holo se anima en loop infinito y los efectos de hover se quedan "pegados" en celulares. Antes de la alfa con testers externos conviene pulir esto con un criterio claro (la filosofía de animación de Emil Kowalski: animar poco, rápido y con propósito).

## What Changes

- Los diálogos (`dialog.dlg`) entran con un fade + escala sutil (desde 96 %) en 250 ms y su fondo oscuro entra con fade. La salida usa la misma animación donde el navegador lo soporte; donde no, cierra al instante como hoy.
- Los toasts entran desde abajo y salen por el mismo borde con una transición interrumpible (no keyframes); el elemento se elimina cuando termina la salida.
- Con `prefers-reduced-motion: reduce`: se detiene el brillo holo y se quitan los desplazamientos (subir la carta al pasar el mouse, escalas, deslizamientos); se mantienen solo fades cortos.
- El efecto de levantar cartas/celdas/slots al pasar el mouse solo se aplica en dispositivos con mouse real (`hover: hover` y `pointer: fine`).
- Se eliminan reglas CSS muertas (`.tile.new` / `@keyframes pop`, que ninguna parte del código usa).

**Fuera del alcance:**
- Menús desplegables, detalle de expansión/ilustrador y el `:active` de botones (quedan para una segunda pasada si este cambio convence).
- Dropdown de búsqueda, ingreso de cartas por código y grillas: se dejan sin animación a propósito (se usan cientos de veces al día).
- `landing.html` (ya maneja `prefers-reduced-motion`).
- Backend, API, `packages/core` y datos del usuario: no se tocan. No hay migración; el inventario no cambia.

## Capabilities

### New Capabilities
- `movimiento-de-interfaz`: cómo y cuándo se anima la interfaz de la app (diálogos, avisos, hover) y cómo se respeta la preferencia de movimiento reducido.

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capacidades existentes. -->

## Impact

- Código: solo `apps/web/public/index.html` (bloque `<style>` y la función `toast()`).
- Sin dependencias nuevas, sin cambios de API ni de base de datos.
- Navegadores sin `@starting-style` / `transition-behavior: allow-discrete` muestran diálogos y toasts sin animación (igual que hoy).
- README.md: nota breve sobre el criterio de animación y movimiento reducido.
