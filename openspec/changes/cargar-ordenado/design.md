# Design

## Context

Maqueta elegida: canvas "Rediseño de Cargar", dirección A (https://claude.ai/artifact/KRdLt7froeDaUo8rzLxgv1). Hoy `#tab-cargar` tiene `.load` (grilla de 2 columnas) con una columna de tres paneles (paso 1, paso 2, Últimas cargas) y `#preview` a la derecha; en ≤900 px la grilla pasa a una columna y la vista previa queda al final. Los selectores (`#langPick`, `#condPick`, `#locPick`, `#persMode`, `#recentSets`) se pintan con `render*()` y tienen listeners delegados que hay que conservar.

## Goals / Non-Goals

**Goals:** reordenar sin tocar la lógica de carga; reusar los mismos contenedores e ids para no reescribir listeners; mantener todo usable solo con teclado.

**Non-Goals:** cambiar la sintaxis o los atajos; tocar otras pestañas.

## Decisions

### 1. Grilla con áreas en vez de columna anidada
`.load` pasa a tener como hijos directos los paneles `session`, `entry`, `log` y `#preview`, con `grid-template-areas`: escritorio `"sess prev" "entry prev" "log prev"`; ≤900 px `"sess" "entry" "prev" "log"`. Así la vista previa queda bajo el campo en el celular sin duplicar marcado.
- *Alternativa descartada:* mover la vista previa con JS según el ancho → frágil y duplica estado.

### 2. Ajustes como `<details class="pick">`
Cada ajuste es un `<details>` con un `<summary>` (etiqueta + valor) y un panel `.pick-pop` que contiene el contenedor de opciones existente (`#langPick`, `#condPick`, `#locPick`, y un nuevo `#persPick`). Ventajas: accesible con teclado sin código extra, y la animación de apertura ya existe (listener `toggle` de la segunda pasada; se agrega `.pick` a su selector, con origen arriba a la izquierda). Se cierran al elegir (en los listeners existentes), al tocar fuera (se extiende el listener global que ya cierra "Datos ▾") y al abrir otro.
- Si el panel se sale por la derecha de la pantalla, se corre a la izquierda al abrirse.
- `render*()` actualizan también el valor del `<summary>`. Estado ≠ NM: clase `warn`; personal: clase `pers` (mismos colores que hoy).

### 3. Búsqueda a pedido con clase `picking`
El panel de sesión tiene la fila de la expansión (`#curSet` + "Cambiar expansión") y el área de búsqueda (`.setpick` + `#recentSets`). La clase `picking` en el panel muestra la búsqueda; sin expansión activa siempre está activa. `selectSet` la quita; `Esc` en el campo y el botón la ponen; `Esc` o perder el foco en la búsqueda la quitan si hay expansión. Los botones de recientes usan `mousedown` + `preventDefault` (como los resultados) para que el blur no los esconda antes del clic.

### 4. Atajos y sonido en un `<details class="keyhelp">`
Una línea fija con `25r`, `25*4`, `1-30`, `-25`, `⌘Z`; el `<details>` "Todos los atajos" contiene la lista `.keys` completa y el `#soundToggle`.

### 5. Historial de 5 con "Ver las 12"
Variable `logAll` (no se persiste); `renderLog` corta en 5 o 12 y pinta el enlace.

### 6. Vista previa horizontal en el celular
En ≤900 px `#preview` deja de ser `sticky` y usa una grilla de 2 columnas: la imagen (120 px) a la izquierda ocupando todas las filas y el resto a la derecha, alineado a la izquierda.

## Risks / Trade-offs

- [Un menú de opciones dentro de un contenedor con `overflow` se recortaría] → la fila de ajustes usa `flex-wrap`, no desplazamiento horizontal.
- [Las 10 ubicaciones en un menú largo] → `max-height` con desplazamiento interno.
- [Quien usaba los botones de idioma con el mouse ahora necesita un toque más] → los cambios desde el teclado (`es`, `lp`…) siguen igual y se reflejan en los botones.

## Migration Plan

Solo front; recargar con ⌘R. Las preferencias en `localStorage` no cambian de formato. Rollback = revertir el commit.
