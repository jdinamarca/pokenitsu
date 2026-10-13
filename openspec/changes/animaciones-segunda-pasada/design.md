# Design

## Context

Continúa `animaciones-de-interfaz` (mismo criterio y la variable `--ease-out` ya definida en `:root`). Estado actual en `apps/web/public/index.html`:
- Menús: `<details class="menu">` con `.menu-pop` y `<details class="colmenu">` con `.items`, ambos anclados con `right:0` bajo su botón; sin transición.
- Vistas lista/detalle: 4 pares (`expListView`/`expDetail`, `artListView`/`artView`, `grpListView`/`grpView`, `colListView`/`colView`) que se alternan con `hidden` en sus funciones de render, que también se llaman en cada redibujo.
- `button:active` usa `translateY(1px)` con 50 ms.
- `.tab` usa `animation: fade .2s ease`.
- `.bar > i` tiene `transition: width .6s`, pero la barra siempre se genera como HTML nuevo con su ancho final, así que la transición nunca corre.

## Goals / Non-Goals

**Goals:** mismas reglas que la primera pasada (solo `transform`/`opacity`, curva `--ease-out`, UI ≤ 250 ms, movimiento reducido incluido).

**Non-Goals:** salida animada de menús; tocar la estructura de las vistas.

## Decisions

### 1. Menús: WAAPI en el evento `toggle`
Al abrirse un `<details class="menu|colmenu">`, un listener de `toggle` (en captura, sobre `document`) anima el panel con `el.animate()`: opacidad 0→1 y `scale(.95)`→1, 200 ms, `cubic-bezier(.23,1,.32,1)`, con `transform-origin: top right` en CSS. Cerrar es instantáneo (respuesta del sistema).
- *Descartado tras probarlo:* `@starting-style` y keyframes activados por `[open]` → solo animan la primera apertura: el contenido de un `<details>` cerrado queda con `content-visibility: hidden` y Chrome no recalcula su estilo, así que al reabrir no hay cambio que CSS pueda detectar (verificado: animaciones por apertura `[1,0,0]`).
- *Descartado:* animar también el cierre con `::details-content` → solo Chrome reciente y sin beneficio claro para un menú.

### 2. Vistas de detalle: helper `showView(el)` con WAAPI
Un helper pone `el.hidden = false` y, solo si estaba oculto, ejecuta `el.animate()` (opacidad 0→1 y `translateY(6px)`→0, 200 ms, `cubic-bezier(.23,1,.32,1)`; solo opacidad si hay movimiento reducido). Se usa en los 8 puntos donde se muestra una lista o un detalle.
- *Alternativa descartada:* `@starting-style` en CSS → también se dispararía al cambiar de pestaña (el ancestro `.tab` pasa de `display:none` a visible), sumándose al fade de la pestaña.
- WAAPI corre en el compositor y no necesita librería.

### 3. Botones: `scale(.97)` al presionar
`button` transiciona `transform 160ms var(--ease-out)`; `button:active { transform: scale(.97) }`. Sin gating de hover (`:active` es un toque real también en táctil).

### 4. Pestañas: curva fuerte
`.tab { animation: fade .2s var(--ease-out) }`. Sigue siendo keyframe (entra una vez al mostrarse; no se interrumpe).

### 5. Barra de progreso: borrar la transición
Primer paso de la jerarquía de revisión: si no aporta, se borra. Pasarla a `transform`/`clip-path` no tiene sentido mientras nunca se ejecute.

## Risks / Trade-offs

- [El `:active` global afecta a todos los botones, incluidas las filas de menú y las pestañas] → la escala es sutil (97 %); revisar visualmente.
- [Algún botón que use `transform` propio quedaría pisado por `:active`] → hoy no hay ninguno (verificado con `grep`).

## Migration Plan

Solo front; recargar con ⌘R. Rollback = revertir el commit.
