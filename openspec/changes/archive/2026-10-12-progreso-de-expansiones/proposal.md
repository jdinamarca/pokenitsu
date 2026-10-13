# Proposal

## Why

Completar expansiones es una de las metas principales del coleccionista y una guía para el vendedor (saber qué le falta para vender una expansión completa). Hoy la app no muestra el avance de una expansión en ningún lado: al cargar una carta no se sabe si era nueva para esa expansión ni cuánto falta.

## What Changes

- **Avance al cargar**: en Cargar, la expansión activa muestra su avance (ej. "151 · 88/165 · 53%") y se actualiza con cada carta. Cuando la carta es nueva para la expansión aparece "¡Nueva! 89/165"; al llegar al 100% hay una celebración.
- **Vista de expansiones**: una lista de todas las expansiones donde el usuario tiene cartas (o todas, con un filtro), con barra de avance, ordenable por % de avance, por fecha o por cartas faltantes, y filtrable por serie, origen e idioma.
- **Tres modos de completitud**, con un selector:
  - **Base**: números impresos (ej. 165/165).
  - **Con secretas**: también las cartas sobre el número impreso y las subcolecciones (TG, GG…).
  - **Master set**: cada variante estándar de cada carta (normal, reverse, holo, 1st Edition), según el catálogo.
- **Detalle de una expansión**: grilla de todas sus cartas en orden de número, con las que faltan en gris, filtro tengo / me faltan y el costo estimado para completarla en el modo elegido.
- **Qué copias cuentan**: todas, para vender o personales (igual que en la Pokédex). Para expansiones internacionales, filtro de idioma (cualquiera o uno en particular).
- El catálogo guarda las variantes estándar de cada carta (desde TCGdex), necesarias para el master set.

**Fuera del alcance:** variantes no estándar en el master set (sellos, Poké Ball, Master Ball, cosmos: siguen en Mis colecciones con checklist), metas de colección o notificaciones, y comparar el avance con otros usuarios.

**Datos del usuario:** no se modifican. Se agrega una columna al catálogo compartido (variantes por carta), que se llena en segundo plano.

## Capabilities

### New Capabilities

- `progreso-de-expansiones`: avance de completitud por expansión (tres modos, filtros, vista y detalle) y su aviso al cargar cartas.

### Modified Capabilities

- `catalogo`: el catálogo guarda las variantes estándar de cada carta.
- `carga-de-cartas`: la confirmación de una carga muestra el avance de la expansión y avisa si la carta es nueva para ella.

## Impact

- **Base de datos:** migración que agrega `cards.variants` (lista de variantes estándar) y `sets.official_total` si hace falta; sin cambios en tablas del usuario.
- **API:** el completado en segundo plano de TCGdex (`details.js`) también guarda las variantes; nueva ruta para las cartas de una expansión con variantes (o se amplía `/api/sets/:id/cards`).
- **packages/core:** cálculo de avance por modo, con pruebas.
- **Front:** indicador en Cargar, nueva pestaña "Expansiones" y su detalle.
