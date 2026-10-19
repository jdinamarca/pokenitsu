# Design

## Decisiones

- **Alias del sello en `STAMP_ALIAS` (core):** `platinum`, `burger-king` y `burger-king09` pasan a `burger-king-2009`. `stampKey` ya normaliza los sellos de todas las fuentes con esa tabla, así que la fusión las junta sin cambios.
  - `platinum` se trata como alias global porque, en las 9 especies de la familia, el único sello `platinum` es el de estas tres cartas de Burger King. TCGdex lo usa para esa promoción.
  - Las otras promociones de Burger King, de 1999, no son cartas del TCG: no hay otro sello `burger-king`.
- **Acabado:** PokeCottage no da el acabado de ese sello (`finishUnknown`). Con el mismo sello, toma el único acabado que da TCGdex (Reverse), con la regla de `sellos-y-cruce-de-expansiones`. Además, la nota de cartas adicionales de Bulbapedia dice Reverse.
- **Nombre:** `STAMP_LABEL['burger-king-2009'] = 'Burger King 2009 (sello Platinum)'`, así que `variantLabel` da "Reverse · Burger King 2009 (sello Platinum)".
  - En la vitrina, `variantName` usa primero el nombre de PokeCottage. Para este sello, PokeCottage guarda nuestro nombre como etiqueta (`label`), en lugar de "Burger King (Reverse Holo)" o "Burger King Collection 2009", y así las tres cartas se llaman igual.
  - Se descartó que `STAMP_LABEL` le gane siempre al nombre de PokeCottage: eso cambiaría los nombres de otros sellos ("Expansion Stamp", "JR East Rally 2000") fuera del alcance de este cambio.
- **Cargar e Inventario** ya reciben el nombre de los sellos del Full que el catálogo no nombra (`trainer-kit-sun-moon`), y la foto de la variante con sello (`foto-de-la-variante-con-sello`).

- **La foto de TCGdex** (`tcgdex.ts`) solo va en las variantes sin sello. Con el orden de `pictureOf`, una foto que se puede mostrar le gana a una solo local, así que la foto de TCGdex de la carta sin sello tapaba la de PokeCottage del sello. Afecta a 127 impresiones con sello de la base real, que pasan a mostrar su foto de PokeCottage o la del diseño atenuada.

## Riesgos

- La foto local de PokeCottage (`…__Burger_King_Collection_2009__large.webp`) se pasa a la impresión nueva con el mecanismo que ya existe para mover fotos entre impresiones al reimportar.
