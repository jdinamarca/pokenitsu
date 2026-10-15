# Tasks

## 1. Reglas en core

- [x] 1.1 Agregar `variantSlug` y `variantLabel` a `packages/core`: los identificadores estándar no cambian, más `normal~prerelease` y `normal~ba-charizard-12` → "Normal · Battle Academy · Charizard #12". Con pruebas en Vitest
- [x] 1.2 Agregar `suggestVariants(tcgdexDetailed, tcgplayerKeys)` con pruebas para Dark Explorers #83, SWSH042 (cosmos), una promo GX (normal/holo), Jungle (unlimited y 1st Edition), Prismatic #74 (Poké Ball, Master Ball y cosmos) y 151 #133 (sellos)

## 2. Base y API

- [x] 2.1 Escribir la migración 033: `card_variants_list` y `card_variants_reviewed` compartidas, `cards.td_variants` y borrar `collection_cards.vlist`. Probarla en una copia de la base (verificar que `DATABASE_URL` apunta a la copia) y confirmar que el inventario y las colecciones no cambian
- [x] 2.2 Guardar `variants_detailed` en `cardVariants` y agregar `refreshSuggestions(cardIds)`, que solo toca cartas no revisadas. Verificar en la copia que la Eevee de Dark Explorers #83 queda con Normal y Reverse, y la SWSH042 con un solo Holo cosmos
- [x] 2.3 Cambiar `COLL_CARDS`, `collectionList` y `variantImages` para que lean `card_variants_list`, y lanzar el trabajo de sugerencias al abrir una colección. Verificar con `curl` en el servidor de prueba (:3001) que la colección Eevee devuelve un espacio por variante y que su resumen cuenta variantes y cartas
- [x] 2.4 Agregar `GET`/`POST`/`DELETE /api/cards/:id/variants` (escritura solo para el dueño, guarda la etiqueta en `variant_labels` y marca la carta revisada). Verificar con dos cuentas en la copia que el tester recibe 403, que una carta revisada no cambia al refrescar sugerencias y que quitar una variante no toca el inventario
- [x] 2.5 Escribir el ADR 0020 (variantes compartidas editadas por el dueño, extiende el 0019), agregarlo al índice y verificar que el link del índice funciona

## 3. Front

- [x] 3.1 Agregar el botón "Variantes" en cada carta de la grilla de la colección y la ventanita con la lista y sus fuentes (TCGdex, TCGplayer, dueño), según la maqueta AD. Verificar en Chrome sin interfaz, con la API simulada, que se abre y se cierra con Esc y al tocar fuera
- [x] 3.2 Edición para el dueño: Quitar, y el formulario Acabado, Sello o producto, Mazo y Nº (solo si es Battle Academy) y Nota. Verificar que agregar "Normal · Battle Academy · Charizard #12" muestra el espacio nuevo, que "+1" en ese espacio suma la copia con ese identificador, y que una cuenta que no es el dueño no ve controles de edición
- [x] 3.3 Actualizar el README (variantes por carta, fuentes de las sugerencias, quién edita) y verificar que no menciona PokeCottage como fuente

## 4. Verificación integral

- [x] 4.1 Confirmar que la base real no cambió (inventario 32/33, colecciones, ubicaciones), borrar la copia, las cuentas y los archivos de prueba, y correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test` sin errores

## Workflow follow-up

- Commit con `Co-Authored-By`, PR contra `main` con 🤖 al final y CI verde
- Después del merge, el dueño revisa las 92 Eevee en inglés desde su colección (la revisión no la hace la app sola)
- Archivar el cambio de OpenSpec después del merge
