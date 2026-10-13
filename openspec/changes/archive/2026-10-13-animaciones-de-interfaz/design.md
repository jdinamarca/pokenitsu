# Design

## Context

El front es un único `apps/web/public/index.html` sin build. Hoy:
- Los 5 diálogos usan `<dialog class="dlg">` con `showModal()`/`close()` y no tienen ninguna transición (`index.html` l.155–156).
- `toast()` (l.971) agrega un `div.toast` que entra con `@keyframes tin` (`ease`, 250 ms) y se borra con `t.remove()` a los 3,2 s, sin salida.
- No hay ninguna regla `prefers-reduced-motion` en `index.html`; `.shine::after` corre `@keyframes shine` en loop infinito.
- `.tile:hover`, `.cell:hover` y `.slot:hover` levantan el elemento sin limitar a dispositivos con mouse.
- `.tile.new` / `@keyframes pop` no se usan en ningún lado.

Los valores siguen la guía de animación de Emil Kowalski (skills `animate` y `find-animation-opportunities`): solo `transform` y `opacity`, nunca `scale(0)`, curva fuerte `cubic-bezier(0.23, 1, 0.32, 1)`, UI bajo 300 ms y transiciones (interrumpibles) en vez de keyframes para lo que se dispara seguido.

## Goals / Non-Goals

**Goals:**
- CSS puro con mejora progresiva: si el navegador no soporta algo, se comporta como hoy.
- Una sola variable de curva en `:root` (`--ease-out`) para que la segunda pasada reuse la misma.

**Non-Goals:**
- Librerías de animación (Motion, etc.) o WAAPI.
- Cambiar el JS de apertura/cierre de diálogos.

## Decisions

### 1. Diálogos: `@starting-style` + `transition-behavior: allow-discrete`
`dialog.dlg[open]` en estado final (`opacity:1; transform:scale(1)`); `@starting-style` con `opacity:0; transform:scale(.96)`. Para la salida, el estado sin `[open]` vuelve a `opacity:0; scale(.96)` y se transicionan `display` y `overlay` con `allow-discrete`. Entrada 250 ms `var(--ease-out)`; salida 150 ms (la respuesta del sistema debe ser más rápida que la entrada). `::backdrop` igual pero solo con `opacity`. `transform-origin: center` (los modales no nacen de un botón).
- *Alternativa descartada:* animar con JS envolviendo `showModal`/`close` y escuchando `animationend` → toca ~10 llamadas y agrega estados intermedios.
- Re-render con el diálogo abierto (l.1179) no reanima: `@starting-style` solo aplica cuando el elemento pasa a mostrarse.

### 2. Toasts: transición + clase de salida
`.toast` con `transition: opacity 400ms ease, transform 400ms ease` y `@starting-style { opacity:0; transform:translateY(100%) }` (porcentaje = su propia altura). En `toast()`, a los 3,2 s se agrega `.out` (mismo `translateY(100%)` + `opacity:0`) y se borra en `transitionend`, con un `setTimeout` de respaldo (500 ms) por si la transición no ocurre (pestaña oculta, movimiento reducido). `ease` en vez de la curva fuerte: es el ritmo de Sonner, un aviso no es una respuesta a un clic.
- *Alternativa descartada:* mantener keyframes `tin` → se reinician desde cero si se interrumpen.

### 3. Movimiento reducido: un bloque al final del `<style>`
`@media (prefers-reduced-motion: reduce)`: `.shine::after { animation: none }`; diálogos y toasts sin `transform` en sus estados inicial/salida (quedan solo con fade); `.tile:hover .img`, `.cell:hover`, `.slot:hover .pic` sin `transform`; `.tab` sin el `translateY` de `fade`. Se conservan fades.

### 4. Hover solo con mouse
Envolver las tres reglas de levantar en `@media (hover: hover) and (pointer: fine)`. Los cambios de sombra/opacidad de `.tile.miss:hover` quedan igual (no son movimiento).

## Risks / Trade-offs

- [Safari no soporta `overlay` en `transition`] → la entrada se anima igual; la salida puede cerrar sin animación. Aceptable (degrada a lo de hoy).
- [`ceImg` cierra la ficha y abre la foto en el mismo clic (l.2848)] → durante 150 ms conviven ambos en el top layer; el nuevo queda encima. Verificar visualmente.
- [Al salir un toast, los de abajo/arriba saltan cuando se elimina su altura] → poco notorio con avisos de una línea; ajustar en la segunda pasada si molesta.
- [El gusto no se juzga solo con código] → probar a 2–5× la duración en DevTools y revisar al día siguiente.

## Migration Plan

Solo front. Desplegar = recargar la página (⌘R). Rollback = revertir el commit. No toca datos ni API.
