# Spec Delta

## ADDED Requirements

### Requirement: Idiomas de cada expansión según Bulbapedia
El sistema SHALL leer de Bulbapedia en qué idiomas (neerlandés, francés, alemán, italiano, portugués de Brasil, español) salió cada expansión internacional, con su nombre en ese idioma, y en cuáles no salió. De la página de cada expansión SHALL leer en qué idiomas hubo 1st Edition y en cuáles reverse. Estos datos SHALL guardarse con la fuente "Bulbapedia (idiomas)", con permiso "por revisar".

#### Scenario: Jungle
- **WHEN** Bulbapedia dice que Jungle salió en español (Jungla) y portugués (Selva) "in both 1st and unlimited edition"
- **THEN** Jungle #51 existe en español y en portugués, sin sello y con 1st Edition, respaldadas por "Bulbapedia (idiomas)"

#### Scenario: Team Rocket
- **WHEN** la tabla dice "—" para Team Rocket en neerlandés, portugués y español
- **THEN** no se crea ninguna impresión de Team Rocket en esos idiomas

### Requirement: Variantes confirmadas por expansión
Por cada carta internacional del Full y cada idioma donde salió su expansión, el sistema SHALL crear el acabado base si falta; la 1st Edition solo si la carta la tiene en inglés y Bulbapedia nombra ese idioma con 1st Edition; y el reverse solo si la carta lo tiene en inglés y Bulbapedia dice que en ese idioma hubo reverse. MUST NOT crear otros sellos ni impresiones de promos.

#### Scenario: Reverse de EX Unseen Forces
- **WHEN** EX Unseen Forces #55 tiene reverse en inglés y Bulbapedia dice que en español y portugués hubo "Reverse Holofoils"
- **THEN** existen sus reverse en español y portugués

### Requirement: La deducción solo como respaldo
La deducción por la lista de expansiones de TCGdex SHALL usarse solo para expansiones que Bulbapedia no lista en sus tablas, y MUST NOT crear impresiones en un idioma donde Bulbapedia dice que la expansión no salió.

#### Scenario: Majestic Dawn
- **WHEN** Bulbapedia lista Majestic Dawn en italiano
- **THEN** Majestic Dawn #62 en italiano queda confirmada por "Bulbapedia (idiomas)", no deducida

### Requirement: Neerlandés
El neerlandés (`NL`) SHALL ser un idioma del Full, de la región Internacional, incluido en la regla de idiomas occidentales.

#### Scenario: Jungle en neerlandés
- **WHEN** Bulbapedia dice que Jungle salió en neerlandés en 1st y unlimited edition
- **THEN** Jungle #51 existe en neerlandés, sin sello y con 1st Edition
