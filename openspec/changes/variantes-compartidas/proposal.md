# Proposal

## Why

El usuario quiere su master set de Eevee con **todas las variantes**: reverse, Poké Ball, Master Ball, cosmos, 1st Edition, sellos (prerelease, staff, Pokémon Center, Play! Pokémon…) y las cartas de los mazos de Battle Academy, que traen el mazo y un número extra de otro color. Investigamos las 92 Eevee en inglés:

- TCGdex y TCGplayer juntos dan al menos 150 variantes, pero cada fuente tiene vacíos. TCGdex no tiene las reverse de la era BW–Sun & Moon, TCGplayer no tiene sellos, y ninguna tiene completos los sellos ni Battle Academy.
- Hay que revisar carta por carta, y esa revisión le sirve a todos los coleccionistas.

Hoy una colección solo puede tener variantes por carta en `collection_cards.vlist`, que venía de los checklists de PokeCottage. Desde la migración 030 está vacío y no hay cómo editarlo desde la app. El usuario eligió la maqueta **AD · En la grilla de la colección** del canvas, y que las variantes sean **compartidas y las edite el dueño**, como los artes conectados.

## What Changes

- **Lista de variantes de cada carta, compartida:** cada variante es un acabado (normal, holo, reverse, reverse Poké Ball, reverse Master Ball, holo cosmos, reverse cosmos…), más un sello o producto opcional (1st Edition, prerelease, staff, Pokémon Center, Play! Pokémon, liga, Battle Academy u otro), con mazo y número si es de Battle Academy, y una nota. Todas las cuentas ven la misma lista.
- **Sugerencias iniciales:** salen de TCGdex (`variants_detailed`: acabado, foil y sellos) y de las variantes de TCGplayer que ya guardamos con los precios. Cada sugerencia muestra su fuente, y si una impresión aparece en las dos fuentes con distinto nombre, cuenta una vez.
- **Botón "Variantes" en cada carta de la grilla de una colección:** abre una ventanita con la lista, donde el dueño quita o agrega variantes. Las demás cuentas ven la lista sin poder editarla.
- **Cada variante es un espacio de la colección:** en color si el usuario tiene una copia de esa variante, en gris si no. "+1" en un espacio suma una copia de esa variante.
- **Variantes con identificador propio:** una variante con sello o de Battle Academy tiene su propio identificador y su etiqueta, así que las copias quedan diferenciadas en el inventario, Mi colección y los precios propios.
- Se reemplaza el `vlist` por colección, vacío desde que se quitó PokeCottage, por la lista compartida.

**Fuera del alcance:**
- Usar Bulbapedia (su licencia es CC BY-NC-SA, hay que revisarla antes) o cualquier dato de PokeCottage.
- Las cartas de Asia (cambio `cartas-asiaticas`).
- Elegir una variante especial desde Cargar. Por ahora esas copias se suman con "+1" en el espacio de la colección; en Cargar siguen las variantes de siempre.
- Que otra cuenta que no sea la del dueño edite variantes o proponga cambios.
- No se modifican copias del inventario de nadie.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `catalogo`: lista compartida de variantes por carta, con sugerencias de TCGdex y TCGplayer, que solo edita el dueño.
- `colecciones`: los espacios salen de la lista compartida de variantes, y cada carta tiene un botón "Variantes" en la grilla.

## Impact

- Migración nueva: tabla compartida `card_variants_list`, sin `user_id` ni RLS. Se borra `collection_cards.vlist`.
- `apps/api/src/index.js`: consulta de las cartas de una colección y su resumen; rutas para leer y, solo el dueño, editar la lista de una carta.
- `apps/api/src/details.js`: sugerencias desde TCGdex `variants_detailed`.
- `packages/core`: regla para combinar las sugerencias de las dos fuentes y armar el identificador y la etiqueta de cada variante, con pruebas.
- `apps/web/public/index.html`: botón y ventanita "Variantes" en la grilla de la colección.
- `docs/adr/`: un ADR nuevo, porque es la segunda curaduría compartida.
- `README.md`.
