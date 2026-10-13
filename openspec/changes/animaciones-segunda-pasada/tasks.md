# Tasks

## 1. Menús

- [x] 1.1 Fade + `scale(.95)` desde `top right` en `.menu-pop` y `.colmenu .items` (200 ms, WAAPI en el evento `toggle`); verificar en Chrome sin interfaz que al abrir "Datos ▾" el panel se anima con escala desde su botón, que también se anima al reabrirlo y que al cerrar queda oculto de inmediato

## 2. Vistas de detalle

- [x] 2.1 Helper `showView()` con WAAPI y usarlo en los 8 puntos lista/detalle; verificar que entrar a una expansión anima el detalle, que redibujar el detalle abierto no crea una animación nueva, y lo mismo en Artistas, Artes conectados y Mis colecciones

## 3. Botones y detalles

- [x] 3.1 `button:active { transform: scale(.97) }` con transición de 160 ms; verificar que el transform calculado de un botón presionado es `scale(.97)`
- [x] 3.2 Curva `--ease-out` en el fade de pestañas y borrar la transición de ancho de `.bar > i`; verificar con `getComputedStyle` el `animation-timing-function` de `.tab.on` y `transition-property` de la barra

## 4. Movimiento reducido y cierre

- [x] 4.1 En `prefers-reduced-motion: reduce`: menús y detalles solo con fade, botones sin escala; verificar emulándolo
- [x] 4.2 Actualizar la sección "Animaciones" del README; verificar que lo describe
- [x] 4.3 Repetir la verificación de la primera pasada (16 comprobaciones), comprobar inventario 32/33 y `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## Workflow follow-up

- Commit en `animaciones-2` y PR contra `main` (apilado sobre #9); mergear solo cuando el usuario lo pida.
- Archivar después de `animaciones-de-interfaz`.
