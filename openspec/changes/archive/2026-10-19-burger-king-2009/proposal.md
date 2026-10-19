# Proposal

## Why

El usuario tiene una Eevee 62/100 con el sello "Platinum" de 2009 y creía que era de Majestic Dawn en español. Es la promo de Burger King de junio de 2009: una reimpresión Reverse Holo de Majestic Dawn con el sello "Platinum" abajo a la derecha. Venían dos cartas con cada juguete del menú infantil y, según todas las fuentes, solo salió en inglés.

En el Full, cada carta de esa promoción está dos veces porque las fuentes la nombran distinto:
- TCGdex y Bulbapedia dicen Reverse con el sello `platinum` (`EEV·DP5·62·EN·R~PLATINUM`);
- PokeCottage dice `burger-king` o `burger-king09`, sin acabado (`EEV·DP5·62·EN·N~BURGER-KING`).

Pasa con Eevee 62/100, Glaceon 20/100 y Leafeon 24/100. Además, el nombre que se ve ("platinum") no dice que es de Burger King.

## What Changes

- **Una sola impresión por carta: Reverse con el sello `burger-king-2009`.** Los sellos `platinum` (TCGdex, Bulbapedia) y `burger-king` / `burger-king09` (PokeCottage) son el mismo. El acabado es Reverse, como dicen TCGdex y Bulbapedia; PokeCottage no lo da.
- **Su nombre es "Reverse · Burger King 2009 (sello Platinum)"** en la vitrina, en Cargar y en Mi inventario.
- **La foto de TCGdex deja de usarse en las variantes con sello.** TCGdex tiene una sola foto por carta, la de la carta sin sello, y la ponía en todas sus variantes, también en las con sello. Como esa foto le ganaba a la de PokeCottage, que sí muestra el sello, la Eevee de Burger King se veía sin "Platinum". Ahora una variante con sello muestra la foto de PokeCottage o la de otra fuente que la tenga; si no hay ninguna, muestra la del diseño, atenuada, como cualquier impresión sin foto propia. En la base real son 127 impresiones con sello que hoy tienen la foto de TCGdex.
- **Después de "Volver a traer"**, el Full de Eevee, Glaceon y Leafeon tiene una impresión de Burger King cada uno, respaldada por TCGdex, Bulbapedia y PokeCottage. Las impresiones repetidas desaparecen.
- **Los datos del usuario no se tocan.** Hoy tiene Majestic Dawn #62 en inglés cargada como Normal. Si es la de Burger King, la cambia él: quita la Normal y carga la de Burger King.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: las promos de Burger King 2009.

## Impact

- `packages/core`: los alias del sello y su nombre (`STAMP_ALIAS`, `STAMP_LABEL`).
- `apps/arma/server/sources/pokecottage.ts`: ese sello toma nuestro nombre y no el de PokeCottage.
- `apps/arma/server/sources/tcgdex.ts`: su foto solo va en las variantes sin sello.
- Sin migraciones. El Full cambia al usar "Volver a traer" en los Pokémon de la familia.
