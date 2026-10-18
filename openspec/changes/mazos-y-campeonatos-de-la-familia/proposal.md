# Proposal

## Why

El usuario preguntó si los Full de la familia Eevee incluyen los mazos de campeonato y los mazos con sello. Pidió revisar tres casos:

- las cartas de campeonato, que traen la firma del jugador;
- los mazos que ponen su sello en la carta (por ejemplo, Eevee con el sello de Mewtwo o de Charizard);
- los mazos que además imprimen un número.

La revisión se hizo contra las listas de Bulbapedia: los 80 World Championships Decks de 2004 a 2025 y Battle Academy 2020, 2022 y 2024. Se comparó con la base del usuario, que ya tiene los 9 Full importados.

**World Championships Decks.** Bulbapedia confirma los 16 que hay en la base y no aparece ninguno nuevo para la familia:

- 2006 Eeveelutions (Jimmy Ballard): Eevee, Vaporeon, Jolteon, Flareon, Espeon y Umbreon;
- 2007 Flyvees (Jun Hasebe): Eevee δ, Vaporeon y Jolteon;
- 2007 Legendary Ascent (Tom Roos): Eevee, Vaporeon, Jolteon, Jolteon ☆ y Espeon;
- 2008 Psychic Lock (Jason Klaczynski): Jolteon ☆;
- 2017 Samurai Sniper (Kabu Fukase): Espeon-EX;
- 2019 Perfection (Henry Brand): Espeon & Deoxys-GX.

Hay un error: PokeCottage nombra el mazo de Ballard de Eevee con otro identificador (`worldchampionshipsdeck2006eeveelutionsbyjimmyballard`). Por eso esa carta no cuenta como mazo de campeonato: la regla "Incluir World Championship Decks" no la apaga.

**Battle Academy.** Bulbapedia trae 7 cartas de la familia, y en la base están mal:

| Mazo | Carta original | Número del mazo | En la base hoy |
|---|---|---|---|
| 2020 Charizard | Eevee, Hidden Fates #49 | #26 y #36 | una sola impresión ("Battle Academy 2020: Charizard Deck" #49) |
| 2020 Charizard | Flareon, SM Promo SM186 | #27 y #44 | cuatro impresiones: dos como expansión propia (#27 y #44) y dos como promo con sello |
| 2020 Mewtwo (sin números) | Eevee, Hidden Fates #49 | — | como expansión propia |
| 2020 Mewtwo (sin números) | Espeon, Lost Thunder #89 | — | **falta** |
| 2022 Eevee (sin números) | Eevee V, SWSH Promo SWSH065 | — | como expansión propia |

PokeCottage lista la misma carta de dos maneras: como una "expansión" del mazo (`ba20c`, con el número del mazo o el de la carta original según el caso) y como la carta original con un sello. Ninguna dice la carta original y el número del mazo juntos.

## What Changes

- **Cartas de Battle Academy con la forma de la carta física:** la carta original (expansión y número), más el sello del mazo, más el número del mazo cuando lo trae. El sello es `ba-<mazo>-<número>` (`ba-charizard-26`) o `ba-<mazo>` en los mazos sin números (`ba-mewtwo`). Es la misma forma que ya usa el inventario de Nitsu (`normal~ba-charizard-12`), así que una copia registrada allí se reconoce. El nombre visible es, por ejemplo, "Battle Academy 2020 · Mazo Charizard #26".
- **Fuente nueva: las listas de Battle Academy de Bulbapedia** (solo local, como el resto de Bulbapedia). Se piden 3 páginas, con cache, y sirven para dos cosas:
  - convertir lo que dice PokeCottage a la carta original con su sello;
  - agregar las cartas de la familia que PokeCottage no trae, como la Espeon del mazo Mewtwo. Esas quedan "Por verificar" porque solo las respalda una fuente.
- **Mazos de campeonato:** el identificador de Ballard de Eevee se une al de las demás. Además, la regla reconoce un mazo de campeonato aunque la fuente escriba el nombre sin guiones.
- Al reimportar, las impresiones con la forma vieja desaparecen porque ninguna fuente las respalda, y aparecen las nuevas. El usuario reimporta Eevee, Flareon y Espeon con su botón ("Volver a traer").

**Fuera del alcance:**
- los mazos japoneses y chinos (Battle Academy japonés, Start Deck 100, medios mazos), que ya son expansiones propias con su número;
- los sellos de campeonatos regionales, estatales y nacionales, que no se revisaron en este cambio;
- revisar las demás "Por verificar".

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: se agrega un requisito para los mazos con sello (Battle Academy) y los de campeonato, con su forma única y sus fuentes.

## Impact

- **Datos:** sin migración. Solo cambia lo que escribe el importador en `arma.printings` y `arma.facts`, y solo cuando el usuario reimporta. El inventario del usuario no tiene ninguna copia con sello de Battle Academy ni de campeonato, así que no se pierde ninguna. Las pruebas se hacen en la copia `pokemon_fotos`, y al final se compara la huella de la base real.
- **Fuentes:** 3 páginas más de Bulbapedia por importación (`Battle Academy 2020`, `2022` y `2024`), con la cache de un día.
- **Código:**
  - `packages/core/src/arma.ts`: el sello de Battle Academy, la conversión de lo que dice PokeCottage, el alias del mazo de Ballard y la regla de campeonato sin guiones, con pruebas;
  - `apps/arma/server/sources/battleAcademy.ts`: lee las listas de Bulbapedia;
  - `importer.ts`: agrega esa fuente y aplica la conversión.
