# Spec Delta

## MODIFIED Requirements

### Requirement: Expansiones de varias fuentes
El sistema SHALL guardar expansiones de pokemontcg.io (internacionales, `source = 'ptcg'`), de TCGdex en japonés (`source = 'tcgdex-ja'`, ids `ja-*`), exclusivas de Asia de TCGdex en chino tradicional, tailandés o indonesio (`source = 'tcgdex-asia'`, ids `asia-*`) y creadas a mano (ids `x-<idioma>-*`), con nombre, serie, código impreso, fecha de salida, total de cartas y símbolo. El catálogo MUST NOT tener datos copiados de PokeCottage.

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

### Requirement: Traducciones asiáticas de cartas japonesas
Una carta de TCGdex en chino tradicional, tailandés o indonesio que tenga el mismo código de expansión y número que una expansión japonesa de TCGdex SHALL tratarse como esa carta japonesa, y MUST NOT crear una carta aparte. Si la carta japonesa no está en el catálogo porque TCGdex en japonés tiene la expansión sin cartas, el sistema SHALL crearla en la expansión japonesa con los datos de la traducción: número, ilustrador, rareza y tipo. MUST NOT usar la foto de la traducción, que mostraría texto en otro idioma: la carta queda sin foto hasta tener una japonesa o una aportada. Su nombre SHALL quedar en japonés cuando se puede deducir, reemplazando el nombre de la especie por su nombre japonés, y si no, en el idioma de la traducción. Las promos (expansiones cuyo código termina en `-P`) MUST NOT fusionarse con las japonesas.

#### Scenario: Eevee Heroes vacía en japonés
- **WHEN** se buscan las cartas de Asia de Eevee y TCGdex en japonés tiene S6a sin cartas
- **THEN** el catálogo queda con la carta `ja-S6a-058` "イーブイ" de Atsushi Furusawa en la expansión japonesa Eevee Heroes

#### Scenario: Traducción de una carta que ya existe
- **WHEN** TCGdex en chino tiene SV8a #125 y el catálogo ya tiene `ja-SV8a-125`
- **THEN** no se crea ninguna carta nueva

#### Scenario: Promo asiática
- **WHEN** TCGdex en chino tiene la promo SV-P #037
- **THEN** queda en una expansión `asia-*` propia de las promos chinas, aparte de las promos japonesas SV-P

### Requirement: Expansiones exclusivas de Asia
Una expansión de TCGdex en chino tradicional, tailandés o indonesio cuyo código no existe en TCGdex en japonés SHALL guardarse como expansión exclusiva de Asia, con sus propios números y fotos. Sus cartas SHALL ser cartas propias aunque reimpriman la ilustración de una japonesa, porque cambia la expansión o el número, no solo el idioma. Un mismo código en varios de esos idiomas SHALL ser una sola expansión con un solo juego de cartas.

#### Scenario: SV7s en tailandés e indonesio
- **WHEN** se buscan las cartas de Asia de Eevee
- **THEN** el catálogo tiene una sola expansión `asia-SV7s` con la Eevee #125, aunque TCGdex la tenga en tailandés y en indonesio

#### Scenario: Reimpresión con otro número
- **WHEN** se buscan las cartas de Asia de Eevee y TCGdex en indonesio tiene SV3s #141, con la misma ilustración que la japonesa SV3 #091
- **THEN** el catálogo tiene las dos: `ja-SV3-091` y `asia-SV3s-141`

#### Scenario: Expansión china exclusiva
- **WHEN** se buscan las cartas de Asia de Eevee
- **THEN** el catálogo tiene las Eevee #106, #107 y #108 de la expansión china Challenge (SCB)

### Requirement: Número de Pokédex de las cartas de Asia
Como TCGdex no trae el número de Pokédex en chino tradicional, tailandés ni indonesio, el sistema SHALL deducirlo del nombre: SHALL considerarse que la carta es de la especie si su nombre empieza con el nombre de la especie en chino tradicional (en chino) o en inglés (en indonesio), seguido solo de un sufijo de mecánica (V, VMAX, VSTAR, ex, GX, EX) o nada; o si su nombre es el de la especie precedido de "光輝" o "Radiant". En tailandés SHALL usar el de la carta del mismo código y número en indonesio o japonés. Una carta cuyo número no se puede deducir SHALL guardarse sin número de Pokédex.

#### Scenario: Leafeon no es Eevee
- **WHEN** se buscan las cartas de Asia de Eevee y TCGdex en chino tiene "葉伊布ex"
- **THEN** esa carta no queda con el número 133

#### Scenario: Radiant Eevee en chino
- **WHEN** se buscan las cartas de Asia de Eevee y TCGdex en chino tiene "光輝伊布" (S10b #055)
- **THEN** la carta queda con el número 133
