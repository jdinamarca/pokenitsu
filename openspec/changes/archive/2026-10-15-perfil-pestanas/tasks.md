# Tasks

## 1. Cabecera y pestañas

- [x] 1.1 Crear la rama desde `perfil-scroll` (o desde `main` si el #50 ya está mergeado) y confirmar con `git log` que incluye el `max-height` de `.profilepop`
- [x] 1.2 Llevar "Cerrar sesión" a la cabecera de `renderProfile` (avatar, nombre, etiquetas y botón `.out` a la derecha; solo ícono con `aria-label` bajo 380 px). Verificar en Chrome sin interfaz a 1280×700 y 390×700 que el botón queda dentro de la pantalla sin scroll
- [x] 1.3 Agregar `profileTab` con las pestañas Colección / Aportes / Cuenta (`role="tablist"`/`tab`/`tabpanel`, `aria-selected`, flechas izquierda/derecha), dibujar solo el panel activo y limpiar `profileView` al cambiar. Verificar que al tocar cada pestaña se ve solo su contenido y que las flechas mueven el foco
- [x] 1.4 Recordar la pestaña en `localStorage` (`nitsu.profileTab`, con try/catch), volver a Colección si no hay aportes y ocultar la pestaña Aportes cuando la API no responde. Verificar los escenarios "Recordar la pestaña" y "Aportes no disponibles" con un stub de `api`
- [x] 1.5 Fundido de 150 ms al cambiar de pestaña, sin animación con `prefers-reduced-motion`. Verificar emulando reduce motion por CDP
- [x] 1.6 Actualizar la descripción de Mi perfil en `README.md` y verificar que menciona las pestañas y Cerrar sesión en la cabecera

## 2. Verificación integral

- [x] 2.1 Comprobar en Chrome sin interfaz, con `api` stub y escrituras a `/api/*` bloqueadas, que las cifras siguen abriendo su sección, que cambiar nombre, contraseña y avatar funciona desde Cuenta y que Cerrar sesión llama a `sign-out`. Confirmar después que el inventario sigue en 32/33
- [x] 2.2 Correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test` sin errores

## Workflow follow-up

- Commit con `Co-Authored-By`, PR contra `main` con 🤖 al final y CI verde
- Mergear solo cuando el usuario lo pida y luego archivar el cambio de OpenSpec
