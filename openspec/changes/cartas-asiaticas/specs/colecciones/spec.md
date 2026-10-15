# Spec Delta

## MODIFIED Requirements

### Requirement: Colección por Pokémon
El sistema SHALL permitir crear una colección por número de Pokédex con un idioma en que cuentan las internacionales (o cualquiera). Una carta es una expansión + número; las internacionales son la misma carta en cualquier idioma. Las japonesas, las exclusivas de Asia y las escritas a mano tienen expansiones propias y cuentan en cualquier idioma, así que una copia china, tailandesa o indonesia de una carta japonesa cuenta como esa carta japonesa.

#### Scenario: Colección de Eevee en inglés
- **WHEN** la colección cuenta solo en inglés y el usuario tiene una copia en español
- **THEN** esa copia no cuenta para la colección

#### Scenario: Traducción china de una japonesa
- **WHEN** el usuario carga la Eevee de Terastal Festival (SV8a #125) en chino
- **THEN** en la colección Eevee ese espacio aparece como tenido, igual que con la copia japonesa, y no aparece un espacio aparte para la china

### Requirement: Acciones de una colección
Las acciones de una colección (editar, agregar carta a mano, agregar cameo, buscar cartas de Asia, borrar) SHALL estar en un menú "⋯" del encabezado, y borrar SHALL pedir confirmación.

#### Scenario: Borrar cancelado
- **WHEN** el usuario elige Borrar y cancela la confirmación
- **THEN** la colección no se borra

## ADDED Requirements

### Requirement: Buscar cartas de Asia
La acción "🌏 Buscar cartas de Asia" de una colección SHALL buscar en TCGdex las cartas japonesas de su Pokémon (como hacía "Buscar japonesas") y además las de chino tradicional, tailandés e indonesio, aplicando las reglas del catálogo, y SHALL avisar cuántas cartas nuevas sumó. La vista "Por región" SHALL mostrar las expansiones exclusivas de Asia en chino en "🇨🇳 Chinas" y las tailandesas o indonesias en "🌏 Otras de Asia".

#### Scenario: Completar la colección Eevee
- **WHEN** el usuario toca "🌏 Buscar cartas de Asia" en su colección Eevee
- **THEN** aparecen, entre otras, la Eevee de Eevee Heroes (S6a #058), la Radiant Eevee de Pokémon GO (S10b #055) y la Eevee #125 de SV7s, y un aviso dice cuántas se sumaron

#### Scenario: TCGdex no responde
- **WHEN** el usuario busca las cartas de Asia y TCGdex no responde
- **THEN** ve "No pude buscar en TCGdex" y la colección queda como estaba
