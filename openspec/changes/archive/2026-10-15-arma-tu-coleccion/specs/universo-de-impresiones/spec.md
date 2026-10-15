# Spec Delta

## Purpose

Mantener el universo completo (el Full) de impresiones de un Pokémon (carta × idioma × variante) importado desde varias fuentes, con la procedencia y el estado de permiso de cada dato, y las equivalencias entre impresiones que solo cambian de idioma o región.

## ADDED Requirements

### Requirement: Impresión
El sistema SHALL representar cada impresión de un Pokémon como carta (expansión + número) × idioma × variante. La variante SHALL tener un acabado (normal, holo, reverse, holo cosmos, reverse cosmos, Poké Ball, Master Ball…) y opcionalmente un sello o producto (1st Edition, prerelease, staff, Pokémon Center, Battle Academy con mazo y número, World Championship Deck, jumbo…). Cada impresión SHALL tener un código de catálogo estable, formado por Pokémon, expansión, número, idioma y variante (por ejemplo `EEV · SV3PT5 · 133 · EN · N`), que no cambia al reimportar.

#### Scenario: Misma carta en dos idiomas
- **WHEN** las fuentes traen la Eevee de 151 (#133) en inglés y en español, normal
- **THEN** el Full tiene dos impresiones distintas, con códigos `EEV · SV3PT5 · 133 · EN · N` y `EEV · SV3PT5 · 133 · ES · N`

### Requirement: Importar el Full desde las fuentes
El sistema SHALL armar el Full de Eevee importando:
- TCGdex en todos sus idiomas (cartas y `variants_detailed`);
- el catálogo actual (cartas de pokemontcg.io y variantes de TCGplayer de `card_prices`);
- el master set de Eevee de PokeCottage (solo texto: expansión, número, nombre, variante, región e ilustrador);
- la lista de cartas de Bulbapedia (página "Eevee (TCG)").

Una impresión que varias fuentes describen SHALL existir una sola vez, con todas sus fuentes. Reimportar MUST NOT duplicar impresiones. Un fallo en una fuente MUST NOT borrar lo que ya se había importado de ella.

#### Scenario: Una impresión en tres fuentes
- **WHEN** la Eevee de Jungle #51 1st Edition aparece en TCGdex, en PokeCottage y en las variantes de TCGplayer
- **THEN** el Full tiene una sola impresión con esas tres fuentes

#### Scenario: Fuente caída
- **WHEN** se reimporta y Bulbapedia no responde
- **THEN** las demás fuentes se actualizan, lo que venía de Bulbapedia se conserva y el resultado avisa que esa fuente falló

### Requirement: Procedencia y permiso de cada dato
Cada dato de una impresión (que exista, su número, su nombre, su foto, su equivalencia y su precio) SHALL guardar de qué fuente salió. Cada fuente SHALL tener un estado de permiso:
- con permiso o licencia abierta: TCGdex, pokemontcg.io, PokéAPI y el texto de PokeCottage;
- licencia a revisar: Bulbapedia;
- sin permiso: TCGplayer y Cardmarket;
- propio.

El sistema MUST NOT guardar ni mostrar fotos de PokeCottage ni de Bulbapedia; las fotos SHALL venir de las copias propias del catálogo o de TCGdex.

#### Scenario: Precio de TCGplayer
- **WHEN** una impresión tiene precio de TCGplayer
- **THEN** el precio se muestra con la marca "sin permiso" y su fuente

#### Scenario: Carta que solo está en PokeCottage
- **WHEN** una impresión solo existe en PokeCottage
- **THEN** aparece en el Full con sus datos de texto y sin foto, marcada "con permiso, solo texto"

### Requirement: Equivalencias automáticas
El sistema SHALL agrupar en una equivalencia las impresiones con el mismo diseño y la misma variante que solo cambian de idioma o región, según lo que dicen las fuentes:
- la misma expansión y el mismo número internacional en distintos idiomas;
- una expansión inglesa y una japonesa que Bulbapedia lista como el mismo diseño;
- los códigos que PokeCottage agrupa como la misma carta.

Cada equivalencia SHALL indicar qué fuentes la respaldan. Impresiones con distinto número, distinta expansión o distinta variante MUST NOT quedar en la misma equivalencia, salvo que una fuente las una explícitamente como el mismo diseño.

#### Scenario: Prismatic en cinco idiomas
- **WHEN** el Full tiene la Eevee de Prismatic Evolutions #74 normal en inglés, español, francés, alemán e italiano
- **THEN** las cinco quedan en una misma equivalencia

#### Scenario: Reverse aparte
- **WHEN** el Full tiene la Eevee de 151 #133 normal y reverse en inglés
- **THEN** quedan en equivalencias distintas
