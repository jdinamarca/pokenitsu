# universo-de-impresiones Specification

## Purpose
Mantener el universo completo (el Full) de impresiones de un Pokémon (carta × idioma × variante) importado desde varias fuentes, con la procedencia y el estado de permiso de cada dato, y las equivalencias entre impresiones que solo cambian de idioma o región.

## Requirements

### Requirement: Impresión
El sistema SHALL representar cada impresión de un Pokémon como carta (expansión + número) × idioma × variante. La variante SHALL tener un acabado (normal, holo, reverse, holo cosmos, reverse cosmos, Poké Ball, Master Ball…) y opcionalmente un sello o producto (1st Edition, prerelease, staff, Pokémon Center, Battle Academy con mazo y número, World Championship Deck, jumbo…). Cada impresión SHALL tener un código de catálogo estable, formado por Pokémon, expansión, número, idioma y variante (por ejemplo `EEV · SV3PT5 · 133 · EN · N`), que no cambia al reimportar.

#### Scenario: Misma carta en dos idiomas
- **WHEN** las fuentes traen la Eevee de 151 (#133) en inglés y en español, normal
- **THEN** el Full tiene dos impresiones distintas, con códigos `EEV · SV3PT5 · 133 · EN · N` y `EEV · SV3PT5 · 133 · ES · N`

### Requirement: Importar el Full desde las fuentes
El sistema SHALL armar el Full de Eevee importando:
- TCGdex en todos sus idiomas (cartas y `variants_detailed`);
- el catálogo actual (cartas de pokemontcg.io y variantes de TCGplayer de `card_prices`);
- el master set de Eevee de PokeCottage (solo texto: expansión, número, nombre, variante, región e ilustrador);
- la lista de cartas de Bulbapedia (página "Eevee (TCG)").

Una impresión que varias fuentes describen SHALL existir una sola vez, con todas sus fuentes. Reimportar MUST NOT duplicar impresiones. Un fallo en una fuente MUST NOT borrar lo que ya se había importado de ella.

#### Scenario: Una impresión en tres fuentes
- **WHEN** la Eevee de Jungle #51 1st Edition aparece en TCGdex, en PokeCottage y en las variantes de TCGplayer
- **THEN** el Full tiene una sola impresión con esas tres fuentes

#### Scenario: Fuente caída
- **WHEN** se reimporta y Bulbapedia no responde
- **THEN** las demás fuentes se actualizan, lo que venía de Bulbapedia se conserva y el resultado avisa que esa fuente falló

### Requirement: Procedencia y permiso de cada dato
Cada dato de una impresión (que exista, su número, su nombre, su foto, su equivalencia y su precio) SHALL guardar de qué fuente salió. Cada fuente SHALL tener un estado de permiso:
- con permiso o licencia abierta: TCGdex, pokemontcg.io, PokéAPI y el texto de PokeCottage;
- licencia a revisar: Bulbapedia;
- sin permiso: TCGplayer y Cardmarket;
- propio.

El sistema MUST NOT guardar ni mostrar fotos de PokeCottage ni de Bulbapedia; las fotos SHALL venir de las copias propias del catálogo o de TCGdex.

#### Scenario: Precio de TCGplayer
- **WHEN** una impresión tiene precio de TCGplayer
- **THEN** el precio se muestra con la marca "sin permiso" y su fuente

#### Scenario: Carta que solo está en PokeCottage
- **WHEN** una impresión solo existe en PokeCottage
- **THEN** aparece en el Full con sus datos de texto y sin foto, marcada "con permiso, solo texto"

### Requirement: Equivalencias automáticas
El sistema SHALL agrupar en una equivalencia las impresiones con el mismo diseño y la misma variante que solo cambian de idioma o región, según lo que dicen las fuentes:
- la misma expansión y el mismo número internacional en distintos idiomas;
- una expansión inglesa y una japonesa que Bulbapedia lista como el mismo diseño;
- los códigos que PokeCottage agrupa como la misma carta.

Cada equivalencia SHALL indicar qué fuentes la respaldan. Impresiones con distinto número, distinta expansión o distinta variante MUST NOT quedar en la misma equivalencia, salvo que una fuente las una explícitamente como el mismo diseño.

#### Scenario: Prismatic en cinco idiomas
- **WHEN** el Full tiene la Eevee de Prismatic Evolutions #74 normal en inglés, español, francés, alemán e italiano
- **THEN** las cinco quedan en una misma equivalencia

#### Scenario: Reverse aparte
- **WHEN** el Full tiene la Eevee de 151 #133 normal y reverse en inglés
- **THEN** quedan en equivalencias distintas

### Requirement: Permiso "solo local"
Las fuentes SHALL poder tener el permiso "solo local": sus datos se pueden usar en el computador del usuario y MUST NOT salir de él. Una foto de una fuente "solo local" SHALL guardarse como dato de la impresión con su fuente, igual que cualquier otro dato.

#### Scenario: Foto de PokeCottage registrada
- **WHEN** se trae la foto de PokeCottage de la Eevee de Jungle #51 1st Edition con el error de la "d"
- **THEN** la impresión tiene un dato "foto" con la fuente PokeCottage (`pokecottage-fotos`) y el permiso "solo local"

### Requirement: Fotos solo local, apagadas por defecto
Las fotos "solo local" SHALL funcionar únicamente con el interruptor `ARMA_FOTOS_LOCALES=1`. Sin él, el sistema MUST NOT descargarlas, MUST NOT entregarlas en el Full y MUST NOT servir sus archivos.

#### Scenario: Interruptor apagado
- **WHEN** la app corre sin `ARMA_FOTOS_LOCALES=1` y alguien pide el Full o el archivo de una foto local
- **THEN** el Full no trae ninguna foto "solo local" y el archivo responde 404

### Requirement: Descarga local de las fotos
Con el interruptor encendido, el sistema SHALL traer las fotos de:
- PokeCottage: la foto de cada entrada de su master set, por variante;
- Limitless TCG: las cartas de expansiones japonesas, por código de expansión y número;
- Bulbagarden Archives: el escaneo de cada carta de la lista de Bulbapedia.

Cada foto SHALL descargarse una sola vez a una carpeta local fuera de git y fuera del almacenamiento de fotos compartido. Las fotos SHALL servirse desde esa carpeta, MUST NOT enlazarse directo al sitio de la fuente y MUST NOT copiarse a `IMAGE_DIR` ni a nada que se suba. Una foto que la fuente no tiene, o que falla, MUST NOT detener el resto.

#### Scenario: Segunda descarga
- **WHEN** se piden las fotos locales de Eevee dos veces seguidas
- **THEN** la segunda vez no se descarga ningún archivo que ya esté en la carpeta

#### Scenario: Foto que Limitless no tiene
- **WHEN** Limitless responde 404 para una carta japonesa
- **THEN** esa impresión queda sin foto de Limitless y las demás descargas siguen

### Requirement: Qué variante muestra cada foto
Cada foto de una impresión SHALL tener una variante mostrada. Si el usuario marcó a mano qué variante muestra la foto, SHALL valer esa marca. Si no, y la foto es compartida por la impresión sin sello y la 1st Edition de la misma carta (misma expansión, número e idioma), SHALL entenderse que muestra la 1st Edition. Si no se cumple ninguna de las dos, SHALL entenderse que muestra la variante de la impresión que la tiene. Las marcas SHALL guardarse como dato propio, con quién y cuándo las hizo.

#### Scenario: Foto compartida de Jungle #51
- **WHEN** pokemontcg.io da la misma foto a Jungle #51 sin sello y a la 1st Edition
- **THEN** esa foto muestra la 1st Edition

#### Scenario: Marca a mano
- **WHEN** el usuario marca que el escaneo de Bulbapedia de Team Rocket #55 muestra la 1st Edition
- **THEN** esa foto deja de contar como foto de la unlimited

### Requirement: Fotos propias subidas
El usuario SHALL poder subir una foto de una impresión (JPEG, PNG o WebP, hasta 8 MB) y quitarla. La foto SHALL guardarse en el almacenamiento propio (`IMAGE_DIR`) como dato propio de esa impresión y SHALL mostrar la variante de esa impresión.

#### Scenario: Subir la unlimited de Team Rocket #55
- **WHEN** el usuario sube su foto de Team Rocket #55 unlimited
- **THEN** la impresión tiene un dato "foto" de la fuente "Dato propio", y la foto se sirve desde `/img/arma/`

### Requirement: Fotos locales para la variante correcta
Con las fotos solo locales encendidas, el importador de fotos SHALL buscar fotos también para las impresiones que tienen fotos, pero ninguna que muestre su variante.

#### Scenario: Unlimited de Jungle #51
- **WHEN** se piden las fotos locales y Jungle #51 sin sello solo tiene la foto compartida con la 1st Edition
- **THEN** recibe el escaneo de Bulbapedia (`EeveeJungle51.jpg`) como foto solo local

### Requirement: Correcciones de clasificación al fusionar fuentes
Al fusionar las fuentes, el sistema SHALL tratar como holo cosmos una holo genérica (pokemontcg.io, TCGplayer, o TCGdex sin tipo de brillo) cuando una fuente específica (PokeCottage, o TCGdex con tipo de brillo) dice holo cosmos para la misma carta y ninguna fuente específica dice holo normal. SHALL poner en japonés las expansiones `jpn_*` de PokeCottage y en chino simplificado las `scn_*`. SHALL tratar como un solo sello dos nombres de sello de la misma carta y acabado cuando el de TCGdex es el final del de PokeCottage, y quedarse con el más completo.

#### Scenario: Wizards Promo #11 holo
- **WHEN** pokemontcg.io dice "Holo" y TCGdex, PokeCottage y TCGplayer dicen "Holo cosmos" para la Eevee Wizards Promo #11 inglesa
- **THEN** hay una sola impresión, holo cosmos, con las cuatro fuentes

#### Scenario: Promo japonesa marcada como International
- **WHEN** PokeCottage trae `jpn_unp-157` (JR East Rally 2000) con región "International"
- **THEN** la impresión queda en japonés, en las promos japonesas sin número

### Requirement: Sellos exclusivos de Japón
El sistema SHALL tener una lista de sellos exclusivos de Japón (JR Stamp Rally, también llamado JR East Rally 2000). Un dato que pone uno de esos sellos en una carta en idioma occidental MUST NOT crear una impresión: SHALL descartarse y contarse en el resumen de la importación como mal catalogado.

#### Scenario: JR Stamp Rally en la Wizards Promo #11
- **WHEN** TCGdex dice que la carta inglesa `basep-11` tiene una variante con el sello JR Stamp Rally
- **THEN** no existe la impresión "Wizards Black Star Promos #11 · Inglés · JR Stamp Rally", y el resumen de TCGdex cuenta 1 dato mal catalogado

### Requirement: Revisión de clasificación
El sistema SHALL marcar como "por verificar" cada impresión dudosa, con todos sus motivos:
- **región:** un sello exclusivo de Japón en un idioma occidental, una expansión japonesa en un idioma occidental o una expansión occidental en japonés;
- **acabado:** la misma carta sin sello como holo y como holo cosmos;
- **una sola fuente:** solo una fuente dice que existe y al menos otra conoce la carta;
- **sin nombre:** la variante solo tiene un código.

La revisión SHALL poder consultarse con `GET /api/audit/:dex` y SHALL venir en el Full.

#### Scenario: Variante sin nombre
- **WHEN** PokeCottage registra EX Unseen Forces #55 con la variante "X6M-1TY-0F6"
- **THEN** esa impresión aparece por verificar con el motivo "sin nombre"
