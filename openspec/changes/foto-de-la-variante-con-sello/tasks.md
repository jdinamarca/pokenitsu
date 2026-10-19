## 1. Servidor

- [x] 1.1 Consulta de fotos de variantes con sello por carta (excluye las marcadas como de otra variante; las solo locales solo con el interruptor) y `variant_photos` en las cartas de Cargar y en las filas de Mi inventario
- [x] 1.2 Prueba de la elección (gana la no local, sin interruptor no hay locales)

## 2. Cliente

- [x] 2.1 `pictureOf` y `CardPicture` con la foto de la variante entre la de la cuenta y la de la carta; `variantPhoto` con el idioma pedido y el inglés de respaldo
- [x] 2.2 Cargar: la ficha usa la variante marcada (la lista muestra la automática, que no tiene sello) y el idioma de la sesión; Inventario: la de cada copia
- [x] 2.3 Pruebas de `pictureOf` y `variantPhoto`

## 3. Verificación

- [x] 3.1 En la copia `pokemon_fotos`, en Chrome a 1440 y 390 px: Ultra Prism #104 en Cargar muestra el 26 al marcar la ficha del kit y la del catálogo al marcar Normal; Mi inventario muestra la copia del kit con el 26; un mazo de Battle Academy con foto, igual
- [x] 3.2 `pnpm -r test`, `typecheck`, `lint`, `format`; la huella de la base real no cambia
