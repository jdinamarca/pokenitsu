# Design

## Context

`renderProfile()` en `apps/web/public/index.html` arma todo el panel como un solo string HTML, con cuatro bloques: cabecera, Tu colección, Mis aportes (solo si `/photo-submissions/mine` responde) y Cuenta. "Cerrar sesión" está al final. Los clics se manejan en `onProfileClick` según `data-act` / `data-go` / `data-av`. Los formularios abiertos (nombre, contraseña, avatar) dependen de `profileView`. El #50 dejó `.profilepop` con `max-height` y `overflow-y:auto`. La maqueta elegida es `AA-perfil-pestanas` del canvas.

## Goals / Non-Goals

**Goals:**
- Que "Cerrar sesión" esté en la cabecera y no dependa del largo del contenido.
- Que el panel sea accesible: pestañas con teclado y roles ARIA.

**Non-Goals:**
- Cambiar las llamadas a la API o las acciones de cuenta.
- Hacer que la cabecera quede fija (sticky) dentro del panel. Con las pestañas, el panel ya es corto.

## Decisions

- **Las pestañas son estado del front: `profileTab` ('col' | 'ap' | 'acc').** `renderProfile` dibuja solo el panel activo; las cifras y los datos se siguen cargando igual que ahora. Alternativa descartada: dibujar las tres pestañas y ocultarlas con CSS. Duplica nodos con ids (`profileMsg`) y complica el foco.
- **La pestaña se recuerda en `localStorage` (`nitsu.profileTab`), envuelto en try/catch.** No va en `data`, que se sincroniza con la cuenta en el servidor: la spec pide recordarla "en ese navegador", y es una preferencia de vista. Si el valor guardado es 'ap' y no hay aportes, se usa 'col'.
- **Al cambiar de pestaña se limpia `profileView`.** Así no queda un formulario abierto oculto. El acceso "Mis aportes y Se buscan" se mantiene con `data-act="aportes"`.
- **Accesibilidad:** `role="tablist"`, cada pestaña es un `<button role="tab" aria-selected aria-controls>` y el panel lleva `role="tabpanel"`. Las flechas izquierda/derecha cambian de pestaña (patrón ARIA de foco gestionado: `tabindex=-1` en las pestañas inactivas).
- **Cerrar sesión en la cabecera**: un botón compacto con borde rojo (`.out`), al lado del nombre. En pantallas angostas (menos de 380 px) el texto se reduce a un ícono 🚪 con `aria-label="Cerrar sesión"`, para que el nombre no se corte.
- **Se mantiene el `max-height` + scroll del #50** como respaldo para la pestaña Cuenta con el selector de 15 entrenadores abierto.
- **Movimiento:** al cambiar de pestaña el contenido aparece con un fundido corto (opacity, 150 ms, `--ease-out`). Con `prefers-reduced-motion` no hay animación. Siguiendo el criterio de Emil, no se desliza: es un cambio frecuente.

## Risks / Trade-offs

- [El #50 sigue abierto y toca la misma regla CSS] → Esta rama sale de `perfil-scroll`, o el #50 se mergea antes. Si el usuario prefiere, se cierra el #50 y su línea entra en este PR.
- [Los aportes y la cuenta ya no se ven de un vistazo: quedan detrás de una pestaña] → Es el costo aceptado de la opción AA. Lo más consultado (la colección) es la pestaña por defecto.
