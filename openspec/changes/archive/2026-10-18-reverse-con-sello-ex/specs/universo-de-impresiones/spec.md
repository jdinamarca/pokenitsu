## ADDED Requirements

### Requirement: Reverse con el sello de la expansión en la era EX
Al fusionar las fuentes de una carta de una expansión EX, si PokeCottage tiene su sello de la expansión, no tiene una reverse sin sello y otra fuente sí la tiene, el sello de la expansión, como sea que cada fuente lo anote (normal, reverse u holo), SHALL unirse a esa Reverse, que conserva su código. La vitrina SHALL llamarla "Reverse · Sello de la expansión".

#### Scenario: Eevee δ de Delta Species
- **WHEN** se trae el Full de Eevee
- **THEN** la #68 de EX Delta Species en inglés tiene una sola impresión `EEV·EX11·68·EN·R`, "Reverse · Sello de la expansión", con TCGplayer, pokemontcg, TCGdex y PokeCottage detrás, y no existe `EEV·EX11·68·EN·N~SET-LOGO`

#### Scenario: TCGdex lo anota como holo
- **WHEN** TCGdex anota el sello de Vaporeon #18 de Delta Species como holo con sello, y PokeCottage solo tiene la holo y el sello
- **THEN** queda la Holo y una sola Reverse, sin impresiones con sello

#### Scenario: Una copia reverse que ya tenías
- **WHEN** el usuario tiene una copia "reverse" de la #68 y vuelve a traer el Full
- **THEN** esa copia sigue contando en esa impresión

#### Scenario: Fuera de la era EX
- **WHEN** PokeCottage tiene el sello de la expansión de Espeon de Obsidian Flames y también una reverse aparte
- **THEN** las dos siguen siendo impresiones distintas
