## ADDED Requirements

### Requirement: Lista de Limitless para expansiones japonesas sin cartas
Si TCGdex responde una expansión japonesa sin ninguna carta y el modo local está encendido (`ARMA_FOTOS_LOCALES=1`), el servidor SHALL agregar al catálogo la lista que tiene Limitless de esa expansión, con el número, el nombre japonés, el tipo y la rareza de cada carta, y el Pokédex deducido del nombre. Sin el modo local, MUST NOT pedirse nada a Limitless. Una expansión que TCGdex trae con cartas MUST NOT recibir cartas de Limitless.

#### Scenario: Abrir Time Gazer en Cargar
- **WHEN** el usuario abre S10D en Cargar, que TCGdex trae sin cartas, con el modo local encendido
- **THEN** la expansión muestra sus 88 cartas y la 052 es イーブイ, con el Pokédex 133, lista para cargar

#### Scenario: Sin modo local
- **WHEN** el servidor corre sin `ARMA_FOTOS_LOCALES=1` y el usuario abre S10D
- **THEN** la expansión sigue sin cartas y no se pide nada a Limitless

#### Scenario: Una expansión que TCGdex tiene
- **WHEN** el usuario abre S10a, que TCGdex trae con 99 cartas
- **THEN** las cartas son las de TCGdex, sin marca de Limitless

### Requirement: Cortesía con Limitless
Cada lista de Limitless SHALL pedirse una sola vez, de a una expansión, y guardarse un día en cache. Si Limitless responde 429 o 503, SHALL esperar lo que indique `Retry-After`.

#### Scenario: Abrir dos veces la misma expansión
- **WHEN** el usuario abre una expansión japonesa vacía dos veces seguidas en Cargar
- **THEN** Limitless recibe una sola request por su lista

### Requirement: Marca de las cartas de Limitless
Cada carta agregada desde Limitless SHALL quedar marcada con Limitless como fuente de su lista y SHALL tener el id que le daría TCGdex, para no duplicarla si TCGdex la agrega después. La ficha de Cargar SHALL decir de dónde viene.

#### Scenario: La ficha dice de dónde viene
- **WHEN** el usuario elige la S10D 052 en Cargar
- **THEN** la ficha dice "Dato de Limitless · solo uso local"

### Requirement: Llenar las expansiones vacías desde Por reemplazar
La descarga de fotos de Por reemplazar SHALL empezar recorriendo, de a una, todas las expansiones japonesas sin cartas. A una que nunca se abrió SHALL pedirle primero su lista a TCGdex; si TCGdex la trae vacía, SHALL usar la de Limitless. SHALL mostrar cuántas van, cuántas llenó TCGdex, cuántas cartas vinieron de Limitless y las expansiones que ninguna tiene. Después SHALL bajar las fotos de esas cartas como las de las demás.

#### Scenario: Descargar fotos
- **WHEN** el administrador toca la descarga de fotos en Por reemplazar
- **THEN** primero ve "Listas: N de M expansiones japonesas sin cartas · T de TCGdex · K cartas de Limitless" y después el avance de las fotos, que incluye las cartas recién agregadas

#### Scenario: Una expansión que Limitless no tiene
- **WHEN** ni TCGdex ni Limitless tienen la lista de una expansión vacía
- **THEN** la expansión queda sin cartas y su código aparece en "sin lista"

#### Scenario: El Master Set cuenta la carta
- **WHEN** el Full de Eevee ya tenía la S10D 52 japonesa sin carta del catálogo, y la lista de Limitless agrega la S10D 052
- **THEN** esa impresión queda enlazada a la carta, y cargarla en Cargar la enciende en el Master Set de Eevee
