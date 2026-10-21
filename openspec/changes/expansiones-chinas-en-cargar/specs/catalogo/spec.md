## MODIFIED Requirements

### Requirement: Expansiones de varias fuentes
El sistema SHALL guardar expansiones de pokemontcg.io (internacionales, `source = 'ptcg'`), de TCGdex en japonés (`source = 'tcgdex-ja'`, ids `ja-*`), exclusivas de China (`source = 'asia'`, ids `zh-cn-*` y `zh-tw-*`) y creadas a mano (ids `x-<idioma>-*`), con nombre, serie, código impreso, fecha de salida, total de cartas y símbolo. El catálogo MAY tener texto de PokeCottage, que lo autorizó, y MUST NOT tener sus fotos.

#### Scenario: Primera apertura
- **WHEN** se piden las expansiones y la tabla está vacía
- **THEN** el sistema las descarga de las fuentes y las devuelve ordenadas de la más nueva a la más antigua

#### Scenario: Actualizar expansiones
- **WHEN** el usuario pide actualizar la lista de expansiones
- **THEN** el sistema vuelve a sincronizarlas y conserva las cartas ya descargadas

#### Scenario: Base con datos de PokeCottage
- **WHEN** la API arranca sobre una base que tenía expansiones `pc-*` o fotos de `pokecottagecdn.com`
- **THEN** la migración borra los links y las cartas y expansiones `pc-*` que nada usa, y las que siguen en uso quedan sin foto

## ADDED Requirements

### Requirement: Expansiones exclusivas de China
Cada expansión china del Full (idioma `ZH-CN` o `ZH-TW`, que no es una traducción de una japonesa) SHALL existir en el catálogo como una sola expansión por código e idioma. Su nombre, fecha y total SHALL salir de TCGdex cuando la tiene. Si no, SHALL salir del Full.

#### Scenario: Gem Pack Vol. 4
- **WHEN** el Full de Eevee tiene impresiones de `Gem Pack Vol. 4` (PokeCottage `scn_cbb4`) y TCGdex tiene `CBB4C` en chino simplificado
- **THEN** el catálogo tiene la expansión `zh-cn-CBB4C`, "宝石包 Vol.4", con idioma chino simplificado

#### Scenario: Misma expansión en dos fuentes
- **WHEN** el Full tiene impresiones de `pc:scn_csmPi` y de `td-zh-cn:CSMPiC`
- **THEN** el catálogo tiene una sola expansión `zh-cn-CSMPiC`

### Requirement: Cartas de una expansión china
Las cartas de una expansión china SHALL salir de TCGdex cuando trae su lista. Si viene vacía, SHALL armarse una carta por número a partir de las impresiones del Full, con su nombre, Pokédex e ilustrador y marcadas como "armadas desde el Full". Las impresiones del Full de esa expansión SHALL quedar enlazadas con sus cartas.

#### Scenario: Lista desde el Full
- **WHEN** se abre `zh-cn-CBB4C`, que TCGdex trae sin cartas
- **THEN** tiene las cartas 401 a 407 de Eevee, marcadas como armadas desde el Full, y la impresión `EEV·PC:SCN_CBB4·401·ZH-CN·H` queda enlazada a la 401

#### Scenario: Lista desde TCGdex
- **WHEN** se abre `zh-tw-SCC`, que TCGdex trae con 171 cartas
- **THEN** tiene esas 171 cartas con sus fotos, sin marca
