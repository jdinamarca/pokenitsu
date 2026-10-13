# Design

## Context

- `data.groups`: `{ id, name, cols, image, cards: [{ sid, num }] }` (las cartas en el orden de la imagen). Se guardan con `POST/PUT /api/groups`.
- Hoy cada grupo se dibuja como panel con la grilla de piezas separadas (`.pano`) y la imagen unida a la derecha.
- Los precios solo se descargan para cartas del inventario, de colecciones y de lotes (`WANTED` en `prices.js`): las piezas que faltan no tienen precio.

## Decisions

### 1. Panorama sin espacios
Un `div` en grid con `grid-template-columns: repeat(cols, 1fr)`, `gap: 0`, bordes redondeados solo en el contenedor y `overflow: hidden`; cada pieza es la carta completa (proporción 245/342). Las que faltan con `grayscale(1)` y menos opacidad. El mismo componente sirve para la tarjeta (pequeño), el detalle (grande) y la vista previa.

### 2. Precio de una pieza
El precio NM de la variante automática de la carta (`autoVariant`), igual que el costo de completar en Expansiones. Para que exista, `art_group_cards` se agrega a `WANTED` (precios en segundo plano) y a la lista de `/api/prices`.

### 3. Kit = una copia por pieza
Para cada pieza se elige una fila del inventario con copias para vender (respetando el filtro de idioma): primero NM, luego más copias. El lote se llama "Kit <grupo>". Solo se ofrece si todas las piezas tienen al menos una copia para vender.

### 4. Ventana de edición
`<dialog>` con nombre, columnas, textarea e imagen; la vista previa se recalcula 300 ms después de escribir con el mismo parser que guarda (`parseGroupCards`), mostrando el panorama y los errores. Borrar está dentro de la ventana de edición, con confirmación.

### 5. Estado de la vista
Filtros en `data.grp` (vista, orden, idioma, serie), recordados por dispositivo; el detalle abierto en `grpSel`. Todo se pinta con `paint()`.

## Risks / Trade-offs

- [Grupos con piezas de distinta altura o formato] → todas las cartas tienen la misma proporción; si una imagen falta, la celda conserva su espacio.
- [Agregar las piezas de los grupos a los precios aumenta las descargas] → son decenas de cartas; se descargan por expansión.
