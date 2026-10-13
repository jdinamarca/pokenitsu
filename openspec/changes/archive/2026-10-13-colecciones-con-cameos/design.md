# Design

## Context

- La base de RotomAmiti es un Google Sheets público con una pestaña por generación (columnas Ndex, Cameo Pokémon, Card name, Set, #, Notes; el Ndex y el nombre solo en la primera fila de cada Pokémon) más pestañas de bienvenida y de entrenadores. Se descarga como CSV con `/export?format=csv&gid=<id>`.
- Un análisis previo cruzó 2.254 de 3.339 cameos con el catálogo usando alias de expansiones, prefijos de promos (XY, SM, SWSH, BW, DP, HGSS) y subcolecciones (GG, TG, SV).
- Mis colecciones ya tiene `collection_cards.role = 'cameo'` (cameos de la checklist o agregados a mano) y toda la lógica de slots, valor, precios y checklist en el front.

## Decisions

### 1. Tabla `cameo_refs`, reemplazada completa en cada importación
`(id, dex, species, card_name, set_name, number, note, card_id → cards ON DELETE SET NULL, imported_at)`. La importación descarga todas las pestañas primero y solo si todas responden reemplaza la tabla en una transacción (si una falla, queda la anterior). Las pestañas se identifican por su gid (lista fija en `cameos.js`, actualizable).

### 2. Cruce en el servidor (`apps/api/src/cameos.js`)
Expansión por nombre exacto de las expansiones internacionales, más una tabla de alias; número normalizado (sin ceros a la izquierda), luego con prefijo de promo, luego subcolección (`<set>gg`, `<set>tg`, Shiny Vault). Lo que no cruza queda con `card_id` nulo.

### 3. Cómo aparece (categorías)
Se derivan de la nota: vacía → Personaje; silhouette → Silueta; costume/disguise → Disfraz; picture/drawing/mural/photo/poster/sign → Dibujo o imagen; plushie/toy/doll/figure/balloon → Peluche o juguete; statue → Estatua; partially → Parcial; Jumbo → Jumbo; el resto → Otro (con la nota original como texto).

### 4. Qué cuenta como tenido
Un cameo con carta se tiene si hay copias de esa carta (cualquier variante) en el idioma de la colección para internacionales, igual que las cartas de la colección. Los cameos propios de la colección (`role = 'cameo'`) se suman sin duplicar los que ya vienen de la base (misma carta).

### 5. Presentación
- Lista: grilla de tarjetas `.colcard` con portada (hasta 5 cartas tenidas, si no las de referencia en blanco y negro), dos barras (Cartas, Cameos) y valor; el formulario de nueva colección se abre en el mismo lugar.
- Detalle: encabezado fijo (como Expansiones), pestañas, menú "⋯" (`<details>` con botones). La pestaña Cartas reutiliza `colGrid`/`colTile`; los filtros secundarios van en un panel Filtros.
- Buscador: input con la lista de nombres de Pokémon (`dexNames`); abre la pestaña Cameos de un Pokémon sin colección.

## Risks / Trade-offs

- [El autor cambia la estructura de la planilla] → la importación valida los encabezados y no reemplaza la base si no coinciden.
- [Nuevas pestañas o gid distintos] → la lista de gid está en un solo lugar; la pestaña de bienvenida y la de entrenadores se ignoran.
- [Cameos de cartas nuevas que el catálogo aún no tiene] → quedan como referencia y se enlazan en la siguiente importación.
