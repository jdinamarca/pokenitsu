# Design

## Context

- **La identidad de una impresión** es `expansión|número|idioma|acabado|sello` (`printingKey`). El código de catálogo sale de esa identidad y no se reescribe. Al reimportar, una impresión que ninguna fuente respalda se borra junto con sus datos.
- **PokeCottage** trae las cartas de Battle Academy de dos formas:
  - como expansión propia (`ba20c`, `ba20m`, `ba22e`, que se guardan como `pc:ba20c`…), con un número que a veces es el del mazo (Flareon: 27 y 44) y a veces el de la carta original (Eevee: 49 en las dos);
  - como la carta original con un sello que nombra el mazo y el número (`battleAcademyCharizard27`).

  En los dos casos, el tercer segmento de su `id` (`136-ba20c-27-normal`, `133-ba20c-26-normal`) es el número del mazo. En los mazos sin números es solo una posición.
- **Bulbapedia** lista cada mazo en la página de su Battle Academy:
  - 2020: `{{halfdecklist/nmentry|<número del mazo o expansión>|{{TCG ID|<expansión>|<nombre>|<número>}}…|cantidad}}`;
  - 2022 y 2024: `{{halfdecklist/entry|<número del mazo o expansión>|<letra>|<carta>…}}`, con la carta como `{{TCG ID|…}}` o como `[[Eevee V (SWSH Promo 65)|Eevee]]{{TCGV}}`.

  El encabezado `halfdecklist/(nm)header|title=Charizard Deck` abre cada mazo. Un mazo con números los lleva del 1 al 60 en el primer campo; uno sin números pone ahí el número de la expansión (`89/214`, `SWSH065`).

## Goals / Non-Goals

**Goals:**
- Cada carta física de Battle Academy de la familia queda como una sola impresión: la carta original más el sello del mazo, con el número del mazo si lo trae.
- Lo que PokeCottage ya trae se conserva como fuente de esas impresiones, sin duplicados.
- Los mazos de campeonato se reconocen siempre como tales.

**Non-Goals:**
- Los mazos japoneses y chinos, que ya son expansiones propias.
- Llenar las columnas `deck` y `deck_no` de `arma.printings`: el sello ya lleva el mazo y el número, y la vitrina no las usa.

## Decisions

1. **El sello es `ba-<mazo>-<número>` o `ba-<mazo>`.**
   - Coincide con el inventario de Nitsu (`normal~ba-charizard-12`), que `variantFromInventory` ya lee como sello `ba-charizard-12`.
   - El año no va en el sello: la carta original ya separa los mazos con el mismo nombre (Pikachu 2020, 2022 y 2024 tienen cartas distintas). El año va en el nombre visible ("Battle Academy 2020 · Mazo Charizard #26").
   - Se descartó guardar el número en `deck_no` en vez del sello, porque la identidad no lo incluye y #26 y #36 se fundirían en una.
2. **Las listas de Bulbapedia son la referencia de la conversión.** `sources/battleAcademy.ts` pide las 3 páginas con `fetchJson` (cache de un día) y entrega cada carta como `{ year, deck, deckNo, name, setKey, number }`.
   - La expansión se busca con `intlSetByName`. "SM Promo", "SWSH Promo", "XY Promo" y "BW Promo" pasan a "… Black Star Promos", y "SVP Promo" a la de Scarlet & Violet.
   - El número de una promo se pone como en el catálogo (`SM186`, `SWSH065`): se prueba con y sin el prefijo de la serie hasta encontrar la carta.
3. **La conversión es una función pura en core** (`battleAcademyClaims`), que recibe los claims y la lista:
   - un claim de una expansión `pc:baAAx` busca su mazo por año y letra (`ba20c` → 2020, el mazo que empieza con "c"). En un mazo con números, toma la carta con ese número del mazo (el del `ref`). En uno sin números, toma la carta del mismo Pokémon por nombre.
   - un claim con el sello `battle-academy-<mazo><número>` pasa a `ba-<mazo>-<número>`.
   - si no hay lista (Bulbapedia no respondió) o nada coincide, el claim queda como estaba. No se pierde, y se ve como una expansión aparte.
   - además, cada carta de la lista cuyo nombre es el del Pokémon (o empieza con él seguido de un espacio: "Eevee V") se agrega como claim de `bulbapedia`. El acabado es el que dice PokeCottage para esa carta y sello. Si PokeCottage no la trae, es holo cuando el nombre termina en V, VMAX, VSTAR, ex, EX o GX, y normal en los demás casos.
4. **Mazos de campeonato:**
   - `STAMP_ALIAS` une `worldchampionshipsdeck2006eeveelutionsbyjimmyballard` con `world-championships-deck2006-jimmy-ballard`;
   - `isWcd` compara sin guiones (`worldchampionship`), para que otro nombre pegado de una fuente no se escape de la regla aunque todavía no tenga alias.
5. **La fuente se registra** como `bulbapedia-mazos` en `arma.sources` (migración de datos de referencia, como las demás fuentes), con la misma licencia que Bulbapedia, para que su insignia diga de dónde viene.

## Risks / Trade-offs

- **Bulbapedia puede cambiar el formato de sus listas.** Si eso pasa, la lista sale vacía y los claims de PokeCottage quedan como antes (una expansión aparte). El resumen de la importación muestra cuántas cartas trajo la fuente.
- **El acabado deducido** (holo por el sufijo del nombre) puede equivocarse con una impresión exclusiva no holo. Solo pasa con las cartas que trae Bulbapedia y no PokeCottage, y esas quedan "Por verificar".
- **Las impresiones viejas se borran al reimportar.** Ninguna copia del inventario apunta a ellas: el inventario guarda la carta y la variante, no el código.
