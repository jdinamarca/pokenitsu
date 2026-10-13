# Design

## Context

`commitEntry()` interpretaba la entrada (idioma, estado, rango, número) y cargaba en el mismo paso. `renderPreview(key)` muestra la última carta cargada y guarda `previewKey`, que otras partes vuelven a pintar. Las cartas de la expansión activa ya están en memoria (`cards[setId].raw`: número → metadatos con el nombre).

## Decisions

### 1. `resolveEntry(raw)`: una sola interpretación para vista previa y Enter
Devuelve qué haría la entrada sin hacerlo (`lang`, `cond`, `noset`, `loading`, `bad`, `range`, `card`, `missing`, `name`, `noname`). `doCommitEntry()` la usa y ejecuta; `renderEntryPreview()` la usa y muestra. Así la vista previa no puede diferir de lo que carga Enter. Para `card` la vista previa calcula la misma clave que `loadOne` (variante automática, estado, ubicación automática o elegida) con `keyFor()`.

### 2. Cuándo es un nombre
Es nombre si no tiene dígitos y no es un número real de la expansión (Unown `A`), o si tiene dígitos pero no existe como número y tiene al menos 3 letras seguidas (`Porygon2`). Los comandos exactos de idioma/estado (`es`, `lp`) se resuelven antes, como hoy; con una letra más (`esp`) ya es búsqueda por nombre.

### 3. Lista de nombres
Coincidencia por "contiene" sin mayúsculas ni tildes; orden: empieza con lo escrito, luego empieza una palabra, luego el resto, y por número. Máximo 8 visibles con el total. Enter sobre un nombre pone el número de la elegida y vuelve a resolver, así la carga es idéntica a escribir el número.

### 4. Vista previa pendiente
`renderPreview(key, pending)` no cambia `previewKey` cuando es pendiente (guarda `pendingKey`), agrega un encabezado y borde punteado. Al vaciar el campo o cargar, vuelve a la última cargada. El clic en la imagen pendiente llama a `commitEntry()`.

### 5. Teclado y accesibilidad
El campo es un `combobox` con `aria-expanded`/`aria-controls`; la lista usa `role="listbox"`/`option`. ↑/↓ y Tab solo actúan con la lista abierta; `Esc` borra el texto si hay, si no abre la búsqueda de expansión. La lista se cierra al salir del campo y vuelve al entrar.

### 6. Nombres en inglés e imagen de referencia (tras probar con expansiones japonesas)
Las cartas japonesas solo traen su nombre en japonés y ~80 % no tiene imagen en TCGdex. Se reutiliza `dexRef` (`/api/dex`: una carta internacional representativa por número de Pokédex, ya usada por el álbum de Pokédex): `speciesOf(m)` da los nombres en inglés de los números de Pokédex de la carta, que `nameMatches` también compara, y `refImg(m)` la imagen de referencia (solo si la carta es de un único Pokémon). `dexRef` se carga al elegir expansión.

## Risks / Trade-offs

- [La imagen de referencia se confunde con la carta] → atenuada en gris, y en la vista previa con la etiqueta "Imagen de referencia · esta carta no tiene foto".

- [Escribir letras que antes daban "no existe"] → ahora muestran la búsqueda o "Ninguna carta se llama así"; ninguna entrada con número cambia de comportamiento.
- [Vista previa en cada tecla] → se recalcula 80 ms después de la última tecla.
