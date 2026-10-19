# Design

## Decisiones

- **El servidor manda las fotos de las variantes con sello.** Las rutas de Cargar (`/api/sets/:id/cards`) y de Mi inventario (`/api/inventory`) suman, por carta, `variant_photos: { [variante del inventario]: { [idioma]: { src, source, local } } }`.
  - Salen de `arma.printings` con `stamp IS NOT NULL` y de sus hechos `image`, con la misma exclusión que `PRINTED_PHOTOS`: se descartan las fotos marcadas como de otra variante (`photo_marks.shows` distinto del sello).
  - La variante se nombra con `inventoryVariant(finish, stamp)`, el mismo nombre que usan las fichas de Cargar y las copias.
  - Las fotos de fuentes `permission = 'local'` solo entran con `localPhotosOn()`. Si hay varias para una variante e idioma, gana la que no es solo local.
- **El cliente elige.** `variantPhoto(card, variante, idioma)`: primero el idioma pedido; si no hay, `EN` cuando la carta no es japonesa. `CardPicture` recibe `variant` (`{ src, local, source }`) y lo pone entre `own` y `ownCard` en `pictureOf`; si es solo local, va con la marca violeta.
- **Cargar** usa la variante marcada y el idioma de la sesión. **Inventario** usa la variante y el idioma de cada copia.
- Se descartó elegir en el servidor: el idioma de la sesión de Cargar cambia sin volver a pedir las cartas.

## Riesgos

- Que la respuesta de Mi inventario crezca: solo trae fotos de las variantes con sello de las cartas que la cuenta tiene, que son pocas.
