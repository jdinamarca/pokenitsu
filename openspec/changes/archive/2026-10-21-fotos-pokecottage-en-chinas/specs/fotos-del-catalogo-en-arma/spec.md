## ADDED Requirements

### Requirement: Fotos solo locales de las cartas chinas
Con el interruptor encendido, el paso de PokeCottage de la descarga del catálogo SHALL incluir las cartas en chino simplificado sin foto del catálogo, propia ni de su impresión del Full, con las mismas reglas que las japonesas. Una entrada china SHALL corresponder a una carta solo si coinciden el código de la expansión, el número (sin ceros a la izquierda ni "/total") y el Pokédex; entre varias, la estándar. Las cartas en chino tradicional MUST NOT buscarse en PokeCottage.

#### Scenario: Carta china sin foto
- **WHEN** el administrador baja las fotos del catálogo y la Eevee 25 del mazo 30th Celebration Premium Deck Set en chino simplificado no tiene foto
- **THEN** queda con la foto de PokeCottage de `scn_30thd` #25, con la marca violeta, y aparece en "Por reemplazar" con la fuente PokeCottage

#### Scenario: Número con total
- **WHEN** PokeCottage escribe el número de una carta de 30th Celebration como "75/103"
- **THEN** corresponde a la carta 75 de esa expansión china

#### Scenario: Otro Pokémon en el mismo número
- **WHEN** una entrada china tiene la expansión y el número de una carta, pero otro Pokédex
- **THEN** esa carta no toma la foto
