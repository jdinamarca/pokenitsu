## ADDED Requirements

### Requirement: Acabado de los sellos de PokeCottage
Un sello de PokeCottage sin acabado (sin `foil`) SHALL tomar el acabado del mismo sello en la misma carta según TCGdex, cuando TCGdex lo tiene con un solo acabado, y unirse a esa impresión.

#### Scenario: Eevee ex de Prismatic Evolutions
- **WHEN** TCGdex tiene la #75 con el sello de la expansión como holo y PokeCottage como "Expansion Stamp"
- **THEN** hay una sola impresión `EEV·SV8PT5·75·EN·H~SET-LOGO`, con TCGdex y PokeCottage detrás

#### Scenario: TCGdex con dos acabados
- **WHEN** TCGdex tiene el sello de la expansión de Espeon #86 de Obsidian Flames como holo y como reverse
- **THEN** el sello de PokeCottage no toma ninguno por esta regla

### Requirement: Acabado según las cartas adicionales de Bulbapedia
El sistema SHALL leer, de la página de cada expansión en Bulbapedia, las cartas adicionales con su número, el sello entre comillas y el acabado al comienzo de la nota. Cuando la nota dice el acabado, todas las impresiones de esa carta con ese sello SHALL tomar ese acabado y quedar en una. Un sello con el nombre de la misma expansión SHALL leerse como el sello de la expansión. La fuente SHALL ser "Bulbapedia (cartas adicionales)", solo texto y de uso local.

#### Scenario: Espeon de Obsidian Flames
- **WHEN** Bulbapedia dice `086/197 … Reverse Holo "Obsidian Flames" stamp Best Buy gift with purchase exclusive (USA)`
- **THEN** Espeon #86 tiene una sola impresión con el sello de la expansión, Reverse, con TCGdex, PokeCottage y Bulbapedia (cartas adicionales) detrás

#### Scenario: Umbreon de GameStop
- **WHEN** Bulbapedia dice `130/197 … Reverse Holo "GameStop" stamp` y TCGdex y PokeCottage la tienen como normal
- **THEN** la Umbreon #130 GameStop es Reverse

#### Scenario: Una nota sin acabado
- **WHEN** la nota de la Eevee ex #75 de Prismatic Evolutions dice solo `Surprise Box exclusive with "Prismatic Evolutions" stamp`
- **THEN** esta regla no cambia su acabado

### Requirement: Un sello con su año
Dos nombres de sello de la misma carta y acabado SHALL ser uno cuando uno es el otro con un número al final, y SHALL quedar el más completo.

#### Scenario: Trick or Trade
- **WHEN** TCGdex tiene Umbreon #130 con `trick-or-trade` y PokeCottage con `trick-or-trade24`
- **THEN** hay una sola impresión con `trick-or-trade24`, con las dos fuentes

### Requirement: Expansiones de TCGdex por identificador
Una expansión de TCGdex que no cruza por nombre con el catálogo SHALL cruzar con la del catálogo que tiene su mismo identificador, si ninguna otra quedó con él.

#### Scenario: Undaunted
- **WHEN** TCGdex trae Umbreon #10 de "Undaunted" (`hgss3`) y el catálogo tiene "HS—Undaunted" (`hgss3`)
- **THEN** la impresión queda en `hgss3`, enlazada a la carta `hgss3-10`, junto a las de las otras fuentes, y no existe `UMB·TD:HGSS3·10·EN·N`
