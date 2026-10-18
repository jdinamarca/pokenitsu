## MODIFIED Requirements

### Requirement: Importar el Full desde las fuentes
El sistema SHALL armar el Full de cada Pokémon de la familia Eevee (Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon y Sylveon) con las mismas fuentes:
- TCGdex en todos sus idiomas (cartas y `variants_detailed`);
- el catálogo actual (cartas de pokemontcg.io y variantes de TCGplayer de `card_prices`);
- el master set del Pokémon en PokeCottage (solo texto: expansión, número, nombre, variante, región e ilustrador);
- la lista de cartas de Bulbapedia (página "<Pokémon> (TCG)").

Los nombres del Pokémon en otros idiomas SHALL compararse sin acentos ni mayúsculas. Una impresión que varias fuentes describen SHALL existir una sola vez, con todas sus fuentes. Reimportar MUST NOT duplicar impresiones. Un fallo en una fuente MUST NOT borrar lo que ya se había importado de ella.

#### Scenario: Una impresión en tres fuentes
- **WHEN** la Eevee de Jungle #51 1st Edition aparece en TCGdex, en PokeCottage y en las variantes de TCGplayer
- **THEN** el Full tiene una sola impresión con esas tres fuentes

#### Scenario: Fuente caída
- **WHEN** se reimporta y Bulbapedia no responde
- **THEN** las demás fuentes se actualizan, lo que venía de Bulbapedia se conserva y el resultado avisa que esa fuente falló

#### Scenario: Nombre con acento
- **WHEN** se importa Vaporeon y TCGdex en francés lo llama "Aquali"
- **THEN** sus cartas francesas entran al Full, igual que las de Eevee con "Évoli" o "Evoli"
