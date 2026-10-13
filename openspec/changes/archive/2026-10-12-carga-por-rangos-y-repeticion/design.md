# Design

## Context

- `parseEntry(raw)` (en `packages/core` tras `monorepo-typescript-y-pruebas-del-nucleo`) devuelve `{ sign, qty, base, full, v, cond }`.
- `commitEntry` resuelve el número contra el índice de la expansión (`idx.norm`), elige la ubicación y llama a `addQty`, que encola `POST /api/inventory/add`. Cada llamada crea una fila en `inventory_log`; `undo` revierte la última fila.
- Hay números que contienen guion en algunas expansiones (raro, pero posible); `-25` ya significa quitar.

## Decisions

### 1. Sintaxis
`parseEntry` reconoce `^(-)?(\d+)-(\d+)([a-z])?` antes de los demás casos: el primer `-` opcional es "quitar" y el segundo separa el rango. Un número que existe tal cual en la expansión (ej. un número con guion) gana sobre la interpretación como rango, igual que hoy `25a` gana sobre la variante `a`.

### 2. Agrupar en el historial
- Migración: `inventory_log.batch uuid` (null para las cargas anteriores).
- El front genera un `batch` por rango y lo envía en cada `add` del rango.
- `undo` toma la última fila del historial; si tiene `batch`, revierte todas las filas de ese `batch` en una transacción.

*Alternativa:* una ruta nueva `/api/inventory/add-batch` que carga todo el rango en una transacción. Es más eficiente, pero duplica la lógica de ubicación automática y de precio por carta del front. Se deja como mejora si los rangos resultan lentos.

### 3. Repetir
El front guarda la última entrada válida (texto crudo y expansión). Enter vacío la vuelve a procesar con `commitEntry`. Se borra al cambiar de expansión.

### 4. Avisos por carta dentro de un rango
Los avisos de carta valiosa, IR/SIR y primer ilustrador se agrupan en un solo resumen al final ("💰 2 cartas valiosas: …") en vez de 30 avisos seguidos.

## Risks / Trade-offs

- [30 peticiones seguidas al servidor] → ya se encolan en orden; la confirmación aparece al terminar el rango.
- [Repetir por error duplica cartas] → el mensaje "Repetido: …" es visible y `⌘Z` lo deshace.
