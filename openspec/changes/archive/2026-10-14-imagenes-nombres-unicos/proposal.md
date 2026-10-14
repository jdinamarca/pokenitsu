# Proposal

## Why

La descarga de imágenes dejó a la Unown **`ex10-?`** con error: `duplicate key value violates unique constraint "card_images_path_idx"`. El nombre del archivo cambiaba cada signo que no sirve en un archivo por `_`, así que `ex10-?` y `ex10-!` quedaban las dos en `cards/ex10/ex10-_-small.webp`. La `!` se copió primero y la `?` quedó sin foto, pero antes de fallar la `?` alcanzó a sobrescribir el archivo chico de la `!`, así que la `!` muestra la foto de la `?` en las listas.

## What Changes

- El nombre del archivo cambia cada signo que no sirve por `_` y su código hexadecimal (`?` → `_3f`, `!` → `_21`), así cada carta tiene un nombre distinto.
- `--reintentar` también rehace las cartas copiadas con el nombre antiguo (hoy solo `ex10-!`), para reparar la foto pisada.

**Fuera del alcance:** borrar los archivos con el nombre antiguo que quedan sin uso (`ex10-_-small.webp` y `-large.webp`).

## Impact

- `apps/api/src/imagenes.js` (`safe`).
- Sin migraciones ni cambios en el front.
