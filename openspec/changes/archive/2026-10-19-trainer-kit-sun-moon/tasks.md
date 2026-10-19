## 1. Core

- [x] 1.1 `BattleAcademyCard` con `kit?`, `finish?` y `langs?`; `deckStamp` / `deckLabel` para `tk-sm-<mazo>-<n>` y "Trainer Kit Sun & Moon · Mazo <mazo> #<n>"; `variantLabel` reconoce `tk-sm-…`
- [x] 1.2 `battleAcademyClaims`: convertir `pc:tk11*` por número del mazo y especie; las impresiones agregadas usan el acabado y los idiomas de la lista
- [x] 1.3 `searchSets`: puntaje 5 por palabras en nombre, serie, era y nombre japonés
- [x] 1.4 Pruebas: Eevee `pc:tk11a` #26 → Ultra Prism 104 `tk-sm-alolan-ninetales-26`; SM128 #17 normal y #30 holo; seis idiomas; "sun & moon trainer kit" encuentra los kits SM sin mover a "Sun & Moon"

## 2. Arma

- [x] 2.1 `battleAcademy.ts`: leer la página del kit ("Half Deck", nota del acabado, frase de idiomas) y sumarla a la lista
- [x] 2.2 Migración 012: nota de `bulbapedia-mazos`
- [x] 2.3 Pruebas del parseo con un extracto de la página
- [x] 2.4 Cargar e Inventario reciben el nombre de los sellos de mazo que el catálogo no nombra (antes mostraban `tksmalolanninetales26`, y `bacharizard26` en Battle Academy)

## 3. Verificación

- [x] 3.1 En la copia `pokemon_fotos`: "Volver a traer" Eevee; el Full tiene `EEV·SM5·104·EN·N~TK-SM-ALOLAN-NINETALES-26` y ya no `PC:TK11A`
- [x] 3.2 En Chrome: la vitrina de Eevee la muestra con su nombre; en Cargar, Ultra Prism #104 ofrece la ficha y la carga; el buscador encuentra los kits con "sun & moon trainer kit"; 1440 y 390 px, sin errores
- [x] 3.3 `pnpm -r test`, `typecheck`, `lint`, `format`; la huella de la base real no cambia
