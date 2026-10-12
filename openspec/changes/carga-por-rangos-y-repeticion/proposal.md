# Proposal

## Why

Al cargar challa es común tener tramos completos de una expansión (de la 1 a la 30) o varias copias seguidas de la misma carta. Hoy hay que escribir cada número y repetir la entrada a mano. Rangos y repetición reducen esas cargas a una sola entrada, sin cambiar la forma de cargar que ya funciona.

## What Changes

- **Rangos**: `1-30` carga una copia de cada carta del 1 al 30 de la expansión activa. Se combinan con lo que ya existe:
  - `1-30r` → todas en reverse
  - `1-30*2` → dos copias de cada una
  - `1-30 lp` → todas en LP
  - `-1-30` → quita una copia de cada una
- Los números que no existen en la expansión se saltan y se informan. Un rango de más de 50 cartas pide confirmación.
- La confirmación resume el rango: "+30 cartas (1–30) · 2 saltadas: 13a, 17 no existen".
- **Repetir**: Enter con la entrada vacía repite la última entrada exacta (carta, variante, cantidad y estado), en la misma expansión.
- **Deshacer un rango**: `⌘Z` deshace el rango completo de una vez, no carta por carta.

**Fuera del alcance:** rangos con prefijo (`TG1-TG30`), listas pegadas (`1,5,9`), escáner con cámara (cambio aparte) y rangos en lotes de compra.

**Datos del usuario:** no se modifican. Se agrega una columna al historial de cargas para agrupar los rangos; las cargas anteriores quedan como cargas individuales.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `carga-de-cartas`: la entrada acepta rangos, Enter vacío repite la última carga y deshacer revierte un rango completo.

## Impact

- **packages/core:** el parser de entradas reconoce rangos (con pruebas).
- **Front:** `commitEntry` procesa rangos y repetición; confirmación y deshacer.
- **API:** `/api/inventory/add` acepta un identificador de grupo; `/api/inventory/undo` deshace el último grupo.
- **Base de datos:** migración que agrega `inventory_log.batch`.
