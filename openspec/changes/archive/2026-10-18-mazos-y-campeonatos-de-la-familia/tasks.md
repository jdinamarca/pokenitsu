## 1. Core

- [x] 1.1 `arma.ts`: alias del mazo de Ballard, `isWcd` sin guiones, sello y nombre de Battle Academy (`baStamp`, el nombre "Battle Academy 2020 · Mazo Charizard #26") y `battleAcademyClaims` (conversión de PokeCottage y claims de la lista), con pruebas de los cuatro escenarios

## 2. Servidor

- [x] 2.1 `sources/battleAcademy.ts`: leer las listas de Battle Academy 2020, 2022 y 2024 de Bulbapedia (expansión y número como en el catálogo), con pruebas sobre fragmentos reales
- [x] 2.2 Migración `009_bulbapedia_mazos.sql` con la fuente `bulbapedia-mazos`; `importer.ts` pide la lista, aplica la conversión y resume la fuente

## 3. Verificación

- [x] 3.1 En la copia `pokemon_fotos`: reimportar Eevee, Flareon y Espeon y comprobar las 7 cartas de Battle Academy, sin `pc:ba*`, y el mazo de Ballard como campeonato; los otros Pokémon sin cambios en sus totales
- [x] 3.2 `pnpm test`, `typecheck` y `lint`; la vitrina en Chrome muestra los sellos con su nombre; la huella de la base real queda igual
- [x] 3.3 README / `DESIGN.md` si corresponde, y el informe en el PR
