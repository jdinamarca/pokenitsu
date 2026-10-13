# Tasks

## 1. Base

- [x] 1.1 Agregar `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` en `:root` y borrar `.tile.new` / `@keyframes pop` (sin uso); verificar con `grep` que no quedan referencias y que la app carga sin errores en consola

## 2. Diálogos

- [x] 2.1 Entrada y salida de `dialog.dlg` y su `::backdrop` con `@starting-style` y `allow-discrete` (250 ms entrada, 150 ms salida, `scale(.96)` + opacidad); verificar en Chrome sin interfaz que al abrir la ficha de una carta el diálogo pasa por opacidad intermedia y termina en `opacity:1`, que cambiar de variante con la ficha abierta no reanima, y que "Foto" (cierra ficha → abre foto) deja visible el diálogo de foto

## 3. Toasts

- [x] 3.1 `.toast` con transiciones + `@starting-style` (`translateY(100%)`, 400 ms `ease`) y clase `.out` de salida; en `toast()` eliminar en `transitionend` con respaldo de 500 ms; verificar disparando 3 toasts seguidos que todos entran, salen por abajo y el contenedor `#toasts` queda vacío a los ~4 s

## 4. Accesibilidad de movimiento

- [x] 4.1 Envolver `.tile:hover .img`, `.cell:hover` y `.slot:hover .pic` en `@media (hover: hover) and (pointer: fine)`; verificar emulando un dispositivo táctil que tocar una carta no la deja levantada, y con mouse que sí se levanta
- [x] 4.2 Bloque `@media (prefers-reduced-motion: reduce)`: sin brillo holo, sin `transform` en diálogos/toasts/hover/pestañas, conservando fades; verificar emulando `prefers-reduced-motion: reduce` que `.shine::after` tiene `animation-name: none` y el diálogo entra solo con opacidad

## 5. Cierre

- [x] 5.1 Revisar el diff con la skill `review-animations` y corregir lo que bloquee
- [x] 5.2 Actualizar README.md con una nota corta sobre animaciones y movimiento reducido; verificar que lo describe
- [x] 5.3 Comprobar que el inventario sigue en 32 filas / 33 copias y que `pnpm build && pnpm typecheck && pnpm lint && pnpm test` pasa

## Workflow follow-up

- Commit en la rama `animaciones` y PR contra `main` (apilado sobre #8); mergear solo cuando el usuario lo pida.
- Archivar el cambio OpenSpec después del merge.
