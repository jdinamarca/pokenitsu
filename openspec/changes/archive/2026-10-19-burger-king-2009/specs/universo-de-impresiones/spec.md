## ADDED Requirements

### Requirement: Promos de Burger King 2009
Una carta de la promoción de Burger King de 2009 SHALL ser una sola impresión: la carta original en inglés, Reverse, con el sello `burger-king-2009`, llamada "Reverse · Burger King 2009 (sello Platinum)". Las fuentes que la nombran con el sello `platinum` o con `burger-king` / `burger-king09` SHALL respaldar esa misma impresión.

#### Scenario: Eevee de Majestic Dawn
- **WHEN** TCGdex y Bulbapedia traen Majestic Dawn #62 Reverse con el sello `platinum` y PokeCottage la trae como "Burger King (Reverse Holo)" sin acabado
- **THEN** el Full de Eevee tiene una sola impresión `EEV·DP5·62·EN·R~BURGER-KING-2009`, "Reverse · Burger King 2009 (sello Platinum)", respaldada por las tres fuentes, y no existen `EEV·DP5·62·EN·R~PLATINUM` ni `EEV·DP5·62·EN·N~BURGER-KING`

#### Scenario: Glaceon y Leafeon
- **WHEN** PokeCottage trae Glaceon #20 y Leafeon #24 de Majestic Dawn como "Burger King Collection 2009"
- **THEN** cada uno tiene una sola impresión Reverse con el sello `burger-king-2009`

#### Scenario: Cargarla
- **WHEN** el usuario abre Majestic Dawn en Cargar, en inglés, y elige la #62
- **THEN** entre las fichas está "Reverse · Burger King 2009 (sello Platinum)"

### Requirement: La foto de TCGdex no va en una variante con sello
La foto de una carta que trae TCGdex SHALL respaldar solo sus variantes sin sello, porque muestra la carta sin sello. Una impresión con sello SHALL mostrar la foto de otra fuente que la tenga o, si no hay ninguna, la del diseño atenuada.

#### Scenario: La Eevee de Burger King
- **WHEN** TCGdex trae Majestic Dawn #62 con su foto y con las variantes Normal, Reverse y Reverse con el sello de Burger King, y PokeCottage trae su foto de la de Burger King
- **THEN** la impresión de Burger King muestra la foto de PokeCottage, y la de TCGdex queda en la Normal y la Reverse
