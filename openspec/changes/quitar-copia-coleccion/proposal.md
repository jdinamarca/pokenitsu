# Proposal

## Why

En una colección, cada espacio tiene "＋1" para sumar una copia, pero no hay forma de quitarla desde ahí. El 15-10-2026 el usuario tocó "＋1" por error en la Eevee de Jungle #51 y la única salida era ir a Cargar y usar Deshacer o escribir `-51` con la expansión elegida.

## What Changes

- Cada espacio con copias muestra **"−1"** junto a "＋1". Quita una copia de esa carta en esa variante: la que agregaste más recientemente entre las que llenan el espacio (con las reglas de idioma de la colección).
- Un aviso dice qué copia se quitó (variante, idioma, estado y ubicación). Se puede deshacer como cualquier carga, con Deshacer en Cargar o ⌘Z.

**Fuera del alcance:**
- Elegir cuál copia quitar cuando hay varias: se quita la más reciente. Para elegir una en particular sigue estando Mi colección → Tabla.
- Pedir confirmación: es reversible con Deshacer.
- Cambios en la API: usa la misma ruta de inventario que "＋1".

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `colecciones`: "Edición de la colección" suma quitar una copia (−1) desde un espacio.

## Impact

- `apps/web/public/index.html`: botón "−1" en `colTile` y su manejo en la grilla.
- `README.md`.
