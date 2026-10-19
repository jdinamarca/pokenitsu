## ADDED Requirements

### Requirement: Expansiones internacionales que solo tiene TCGdex
El catálogo SHALL incluir las expansiones internacionales de TCGdex que no cruzan con una de pokemontcg.io, ni por nombre ni por identificador, salvo las de Pokémon TCG Pocket y las que TCGdex tiene sin cartas. SHALL guardarlas con `source = 'tcgdex-en'`, id `td-<id de TCGdex>`, nombre, serie, código, fecha y totales. Sus cartas SHALL descargarse de TCGdex la primera vez que se necesitan, con nombre, número, Pokédex, rareza, ilustrador, tipo e imagen cuando TCGdex la tiene.

#### Scenario: XY Trainer Kit de Sylveon en Cargar
- **WHEN** el usuario busca "Sylveon" en el selector de expansiones de Cargar
- **THEN** aparece "XY trainer Kit (Sylveon)" (TK6S, 2014), y al abrirla muestra sus 30 cartas, entre ellas Eevee #13 y #21 y Sylveon #15 y #30

#### Scenario: Cargar una carta del kit
- **WHEN** el usuario carga Eevee #13 del kit
- **THEN** la copia queda en el inventario con la carta `td-tk-xy-sy-13`, y se ve igual en Nitsu

#### Scenario: Pokémon TCG Pocket
- **WHEN** se sincronizan las expansiones
- **THEN** no se agrega ninguna de la serie `tcgp` (Genetic Apex, Mythical Island…)
