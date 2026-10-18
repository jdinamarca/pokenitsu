## ADDED Requirements

### Requirement: Cartas de Battle Academy
El sistema SHALL representar una carta de Battle Academy como la carta original (expansión y número) con el sello del mazo: `ba-<mazo>-<número>` si el mazo imprime números y `ba-<mazo>` si no. Cada número del mazo SHALL ser una impresión distinta. Lo que una fuente diga de otra forma SHALL convertirse a esa forma según las listas de Battle Academy de Bulbapedia, que además SHALL respaldar las cartas del Pokémon que traigan.

#### Scenario: Dos números del mismo mazo
- **WHEN** Bulbapedia lista Eevee de Hidden Fates #49 en el mazo Charizard de Battle Academy 2020 con los números 26 y 36, y PokeCottage trae esas dos entradas como la expansión `ba20c`
- **THEN** el Full de Eevee tiene dos impresiones de Hidden Fates #49 en inglés, con los sellos `ba-charizard-26` y `ba-charizard-36`, respaldadas por las dos fuentes, y ninguna con la expansión `pc:ba20c`

#### Scenario: La misma carta dicha de dos formas
- **WHEN** PokeCottage trae a Flareon como `ba20c` #27 y también como SM Promo SM186 con el sello "Battle Academy Charizard Deck #27 Stamp"
- **THEN** el Full de Flareon tiene una sola impresión, SM Promo SM186 con el sello `ba-charizard-27`

#### Scenario: Mazo sin números que una sola fuente trae
- **WHEN** Bulbapedia lista a Espeon de Lost Thunder #89 en el mazo Mewtwo de Battle Academy 2020 y ninguna otra fuente lo trae
- **THEN** el Full de Espeon tiene Lost Thunder #89 en inglés con el sello `ba-mewtwo`, marcada "Por verificar" porque la respalda una sola fuente

### Requirement: Cartas de mazos de campeonato
El sistema SHALL contar una carta de World Championships Deck para la regla "Incluir World Championship Decks" aunque la fuente escriba su nombre sin guiones, y SHALL tratar el mismo mazo con dos nombres como una sola impresión.

#### Scenario: Mazo de campeonato escrito sin guiones
- **WHEN** PokeCottage trae el mazo de Jimmy Ballard 2006 de Eevee como `worldchampionshipsdeck2006eeveelutionsbyjimmyballard`
- **THEN** es la impresión con el sello `world-championships-deck2006-jimmy-ballard`, y la regla "Incluir World Championship Decks" apagada la deja fuera
