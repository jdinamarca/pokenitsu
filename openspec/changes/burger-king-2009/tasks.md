## 1. Core y fuentes

- [x] 1.1 `STAMP_ALIAS`: `platinum`, `burger-king`, `burger-king09` → `burger-king-2009`; `STAMP_LABEL['burger-king-2009']`
- [x] 1.2 PokeCottage: para ese sello, la etiqueta es nuestro nombre
- [x] 1.3 TCGdex: su foto solo en las variantes sin sello, con su prueba
- [x] 1.4 Pruebas: Eevee #62 de TCGdex (Reverse `platinum`), Bulbapedia y PokeCottage (`burgerKing09` sin acabado) → una sola impresión Reverse `burger-king-2009` con las tres fuentes y su nombre

## 2. Verificación

- [x] 2.1 En la copia `pokemon_fotos`: "Volver a traer" en Eevee, Glaceon y Leafeon; una impresión de Burger King cada uno, con su foto local, y ninguna `PLATINUM` ni `BURGER-KING`/`BURGER-KING09`
- [x] 2.2 En Chrome: la vitrina la nombra; en Cargar, Majestic Dawn #62 ofrece la ficha con su nombre y su foto; 1440 y 390 px
- [x] 2.3 `pnpm -r test`, `typecheck`, `lint`, `format`; la huella de la base real no cambia
