## ADDED Requirements

### Requirement: Fecha de una repisa por diseño
En el orden "Por diseño", cada repisa SHALL tomar la fecha más antigua de sus impresiones, sin contar la fecha genérica de una serie de promos: la de una impresión cuya expansión tiene "Promo" en el nombre y cuya fecha es la misma que la del catálogo para esa expansión. Si no queda ninguna fecha, SHALL usar la fecha genérica y, si tampoco hay, la del diseño. "Por expansión" MUST NOT cambiar.

#### Scenario: Radiant Eevee
- **WHEN** la repisa SWSH230 tiene la impresión en inglés con la fecha de SWSH Black Star Promos (2019-11-15), la japonesa de Pokémon GO (2022-06-17) y el jumbo (2022-06-30)
- **THEN** la repisa tiene fecha 2022-06-17, dice "2022" y queda junto a "Pokémon GO #54"

#### Scenario: Promo sin otra fecha
- **WHEN** la repisa SWSH042 solo tiene impresiones con la fecha de SWSH Black Star Promos
- **THEN** la repisa sigue con fecha 2019-11-15

#### Scenario: Por expansión
- **WHEN** el usuario elige "Por expansión"
- **THEN** la repisa de SWSH Black Star Promos sigue en 2019
