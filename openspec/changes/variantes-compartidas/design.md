# Design

## Context

- La consulta `COLL_CARDS` (`apps/api/src/index.js`) arma un espacio por cada elemento de `collection_cards.vlist` (`{slug, type}`), o un solo espacio si la lista está vacía. `collectionList` cuenta los espacios tenidos con la misma lista. La grilla del front (`slotsOf`) también.
- `vlist` está vacío en todas las cuentas desde la migración 030, así que reemplazarlo no pierde nada.
- `variantImages()` usa `vlist` para saber qué variantes tienen foto propia.
- `variant_labels(slug, label)` es una tabla compartida, y el front la recibe en `/api/state` (`VLABEL`). El inventario guarda `variant` como texto libre.
- `details.js` ya pide a TCGdex el detalle de cada carta (`cardVariants`) para las variantes estándar (`cards.variants`). Esa misma respuesta trae `variants_detailed`.
- Las variantes de TCGplayer están en las claves de `card_prices.usd`: `normal`, `holofoil`, `reverseHolofoil`, `1stEdition*` y `unlimited*`.
- El dueño se reconoce con `isOwner(req)` / `ownerOnly(req)`, igual que en los artes conectados (ADR 0019).

## Goals / Non-Goals

**Goals:**
- Una sola lista de variantes por carta, igual para todas las cuentas, y que esa lista sea la que define los espacios de las colecciones.
- Que la revisión del dueño sea definitiva: las sugerencias nunca pisan una carta revisada.

**Non-Goals:**
- Elegir una variante especial desde Cargar.
- Un historial de quién cambió qué.

## Decisions

- **Tablas compartidas (migración 033), sin `user_id` ni RLS:**
  - `card_variants_list(card_id, slug, finish, stamp, deck, deck_no, note, sources text[], pos)`, con PK `(card_id, slug)`.
  - `card_variants_reviewed(card_id PK, reviewed_at)`.
  - Se borra la columna `collection_cards.vlist`.
  - Alternativa descartada: guardar la lista como `jsonb` en `cards`. Las filas permiten un índice por carta y editar una variante sin reescribir toda la lista.
- **Identificador y etiqueta salen de una función pura en `packages/core` (`variantSlug`, `variantLabel`):**
  - Las variantes estándar conservan los identificadores de siempre (`normal`, `holo`, `reverse`, `firstedition`, `pokeballholo`, `masterballholo`, `cosmosholo`), para que las copias ya cargadas sigan contando.
  - Para las nuevas, el identificador es `<acabado>~<sello>` o `<acabado>~ba-<mazo>-<nº>`, en minúsculas y sin tildes. Por ejemplo, `normal~ba-charizard-12` lleva la etiqueta "Normal · Battle Academy · Charizard #12".
  - Al agregar una variante, su etiqueta se guarda en `variant_labels` para que la vea toda la app.
- **Sugerencias:** `suggestVariants(tcgdexDetailed, tcgplayerKeys)` en core, con pruebas para los casos que encontramos al investigar:
  - Dark Explorers #83: la reverse solo la da TCGplayer.
  - SWSH042: el holo de TCGplayer es el holo cosmos de TCGdex.
  - Las promos GX: TCGdex las da como normal y TCGplayer como holo, y son la misma impresión.
  - Jungle: el `unlimited` de TCGplayer es la normal, y el `1stEdition` es la 1st Edition.
- **Cuándo se calculan las sugerencias:**
  - `cardVariants` guarda además `variants_detailed` en `cards.td_variants jsonb` (columna nueva, en la misma migración).
  - `refreshSuggestions(cardIds)` reescribe la lista de las cartas **no revisadas**, combinando `td_variants` con las claves de `card_prices.usd`.
  - Al abrir una colección, la API lanza en segundo plano el trabajo de detalles de sus cartas que no tienen `td_variants`, y después refresca sus sugerencias. El front recarga cuando termina, como ya hace con otros trabajos.
- **Espacios:** `COLL_CARDS` toma `vlist` de `jsonb_agg` sobre `card_variants_list` (ordenado por `pos`) en vez de `collection_cards`. El resto de la consulta, `collectionList` y `slotsOf` siguen iguales. `variantImages()` lee la misma tabla.
- **Edición:** `GET /api/cards/:id/variants` lo puede llamar cualquier cuenta. `POST` y `DELETE /api/cards/:id/variants[/:slug]` pasan por `ownerOnly`, con el mensaje "Solo el administrador edita las variantes: son las mismas para todos". Cualquier cambio marca la carta como revisada.
  - Quitar una variante no toca el inventario. Una copia de una variante quitada sigue en Mi colección, pero no ocupa un espacio en las colecciones.
- **Front (maqueta AD):** botón "Variantes" en cada carta de la grilla y ventanita con la lista y sus fuentes. Si `ME.owner`, tiene botones Quitar y un formulario con Acabado, Sello o producto, Mazo, Nº y Nota. El "+1" de un espacio ya usa `c.v.slug`, así que suma la variante correcta sin cambios.

## Risks / Trade-offs

- [Una colección pasa de un espacio por carta a varios, así que el avance de todas las colecciones baja de golpe] → Es lo que se busca: el master set con variantes. La cabecera ya muestra el avance en variantes y en cartas por separado.
- [Muchas llamadas a TCGdex al abrir una colección grande] → Cuatro a la vez, solo las cartas sin `td_variants`, y una sola vez por carta.
- [El dueño quita por error una variante que tenía copias] → Las copias no se borran. Puede volver a agregarla con el mismo acabado y sello, y entonces se recupera el mismo identificador.
- [Segunda curaduría compartida] → Se registra en un ADR 0020 que extiende el criterio del 0019.

## Migration Plan

La migración 033 crea las tablas, agrega `cards.td_variants` y borra `collection_cards.vlist`, que está vacío. Las listas se llenan solas al abrir cada colección. Para volver atrás bastaría con revertir el código: las tablas nuevas no afectan el inventario.
