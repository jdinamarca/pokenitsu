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
El sistema SHALL armar el Full de cada Pokémon de la familia Eevee (Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon y Sylveon) con las mismas fuentes:
- TCGdex en todos sus idiomas (cartas y `variants_detailed`);
- el catálogo actual (cartas de pokemontcg.io y variantes de TCGplayer de `card_prices`);
- el master set del Pokémon en PokeCottage (solo texto: expansión, número, nombre, variante, región e ilustrador);
- la lista de cartas de Bulbapedia (página "<Pokémon> (TCG)").

Los nombres del Pokémon en otros idiomas SHALL compararse sin acentos ni mayúsculas. Una impresión que varias fuentes describen SHALL existir una sola vez, con todas sus fuentes. Reimportar MUST NOT duplicar impresiones. Un fallo en una fuente MUST NOT borrar lo que ya se había importado de ella.

#### Scenario: Una impresión en tres fuentes
- **WHEN** la Eevee de Jungle #51 1st Edition aparece en TCGdex, en PokeCottage y en las variantes de TCGplayer
- **THEN** el Full tiene una sola impresión con esas tres fuentes

#### Scenario: Fuente caída
- **WHEN** se reimporta y Bulbapedia no responde
- **THEN** las demás fuentes se actualizan, lo que venía de Bulbapedia se conserva y el resultado avisa que esa fuente falló

#### Scenario: Nombre con acento
- **WHEN** se importa Vaporeon y TCGdex en francés lo llama "Aquali"
- **THEN** sus cartas francesas entran al Full, igual que las de Eevee con "Évoli" o "Evoli"

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
- PokeCottage: la foto de cada entrada de su master set, por variante. PokeCottage autorizó sus fotos solo para uso local, nunca producción, y la fuente SHALL describirlo así;
- Limitless TCG: las cartas de expansiones japonesas, por código de expansión y número. El número SHALL ir sin ceros a la izquierda (`S8b_1`), y las promos con el código de Limitless (`SV-P` → `SVP`, `M-P` → `MP`);
- Bulbagarden Archives: el escaneo de cada carta de la lista de Bulbapedia.

Cada foto SHALL descargarse una sola vez a una carpeta local fuera de git y fuera del almacenamiento de fotos compartido. Las fotos SHALL servirse desde esa carpeta, MUST NOT enlazarse directo al sitio de la fuente y MUST NOT copiarse a `IMAGE_DIR` ni a nada que se suba. Una foto que la fuente no tiene, o que falla, MUST NOT detener el resto.

#### Scenario: Segunda descarga
- **WHEN** se piden las fotos locales de Eevee dos veces seguidas
- **THEN** la segunda vez no se descarga ningún archivo que ya esté en la carpeta

#### Scenario: Foto que Limitless no tiene
- **WHEN** Limitless responde que no tiene una carta japonesa
- **THEN** esa impresión queda sin foto de Limitless y las demás descargas siguen

#### Scenario: Número con ceros
- **WHEN** se busca en Limitless la Eevee japonesa SV2a #133 y la carta S8b #001
- **THEN** se piden `SV2a_133` y `S8b_1`

#### Scenario: Promo
- **WHEN** se busca en Limitless la promo japonesa `ja-SV-P` #001
- **THEN** se pide `SVP_1`

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

### Requirement: Cartas en español confirmadas por WikiDex
El sistema SHALL importar de WikiDex, por cada carta del Pokémon, en qué expansión y con qué número salió en español, y la fecha de salida en España de esa expansión o "No distribuida (ES)". Una carta que WikiDex confirma en español SHALL existir en español aunque ninguna otra fuente la liste, con el acabado base de la carta internacional. WikiDex MUST NOT aportar fotos.

#### Scenario: Jungla #51
- **WHEN** WikiDex tiene "Eevee (Jungla TCG)" con expansión Jungla, número 51/64, y Jungla salió en España en 2000
- **THEN** existe la impresión de Jungle #51 en español, con WikiDex como fuente, aunque TCGdex no liste la carta

### Requirement: Impresiones deducidas en italiano y portugués
Cuando TCGdex lista una expansión en italiano o portugués, y una carta de esa expansión existe en su versión internacional sin ninguna fuente que la liste en ese idioma, el sistema SHALL crear la impresión en ese idioma, solo con el acabado base, de la fuente "Expansiones de TCGdex". MUST NOT deducir variantes (sellos, reverse, 1st Edition) ni impresiones en español latinoamericano.

#### Scenario: Majestic Dawn en italiano
- **WHEN** TCGdex lista "Alba Suprema" (dp5) en italiano y no tiene sus cartas
- **THEN** existen Majestic Dawn #62 y #63 en italiano, normales, deducidas

### Requirement: Misma carta con número normalizado
Toda comparación de "la misma carta" (misma expansión, número e idioma) SHALL usar el número normalizado, de modo que `074` y `74` sean el mismo número.

#### Scenario: Evoluciones Prismáticas #74
- **WHEN** una fuente da el número `074` y otra `74` para la misma carta
- **THEN** la ficha muestra sus variantes juntas y la regla de fotos 1st Edition las trata como la misma carta

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

### Requirement: Cartas de Battle Academy
El sistema SHALL representar una carta de Battle Academy como la carta original (expansión y número) con el sello del mazo: `ba-<mazo>-<número>` si el mazo imprime números y `ba-<mazo>` si no. Cada número del mazo SHALL ser una impresión distinta. Lo que una fuente diga de otra forma SHALL convertirse a esa forma según las listas de Battle Academy de Bulbapedia, que además SHALL respaldar las cartas del Pokémon que traigan.

#### Scenario: Dos números del mismo mazo
- **WHEN** Bulbapedia lista Eevee de Hidden Fates #49 en el mazo Charizard de Battle Academy 2020 con los números 26 y 36, y PokeCottage trae esas dos entradas como la expansión `ba20c`
- **THEN** el Full de Eevee tiene dos impresiones de Hidden Fates #49 en inglés, con los sellos `ba-charizard-26` y `ba-charizard-36`, respaldadas por las dos fuentes, y ninguna con la expansión `pc:ba20c`

#### Scenario: La misma carta dicha de dos formas
- **WHEN** PokeCottage trae a Flareon como `ba20c` #27 y también como SM Promo SM186 con el sello "Battle Academy Charizard Deck #27 Stamp"
- **THEN** el Full de Flareon tiene una sola impresión, SM Promo SM186 con el sello `ba-charizard-27`

#### Scenario: Mazo sin números que una sola fuente trae
- **WHEN** Bulbapedia lista a Espeon de Lost Thunder #89 en el mazo Mewtwo de Battle Academy 2020 y ninguna otra fuente lo trae
- **THEN** el Full de Espeon tiene Lost Thunder #89 en inglés con el sello `ba-mewtwo`, marcada "Por verificar" porque la respalda una sola fuente

### Requirement: Cartas de mazos de campeonato
El sistema SHALL contar una carta de World Championships Deck para la regla "Incluir World Championship Decks" aunque la fuente escriba su nombre sin guiones, y SHALL tratar el mismo mazo con dos nombres como una sola impresión.

#### Scenario: Mazo de campeonato escrito sin guiones
- **WHEN** PokeCottage trae el mazo de Jimmy Ballard 2006 de Eevee como `worldchampionshipsdeck2006eeveelutionsbyjimmyballard`
- **THEN** es la impresión con el sello `world-championships-deck2006-jimmy-ballard`, y la regla "Incluir World Championship Decks" apagada la deja fuera

### Requirement: Reverse con el sello de la expansión en la era EX
Al fusionar las fuentes de una carta de una expansión EX, si PokeCottage tiene su sello de la expansión, no tiene una reverse sin sello y otra fuente sí la tiene, el sello de la expansión, como sea que cada fuente lo anote (normal, reverse u holo), SHALL unirse a esa Reverse, que conserva su código. La vitrina SHALL llamarla "Reverse · Sello de la expansión".

#### Scenario: Eevee δ de Delta Species
- **WHEN** se trae el Full de Eevee
- **THEN** la #68 de EX Delta Species en inglés tiene una sola impresión `EEV·EX11·68·EN·R`, "Reverse · Sello de la expansión", con TCGplayer, pokemontcg, TCGdex y PokeCottage detrás, y no existe `EEV·EX11·68·EN·N~SET-LOGO`

#### Scenario: TCGdex lo anota como holo
- **WHEN** TCGdex anota el sello de Vaporeon #18 de Delta Species como holo con sello, y PokeCottage solo tiene la holo y el sello
- **THEN** queda la Holo y una sola Reverse, sin impresiones con sello

#### Scenario: Una copia reverse que ya tenías
- **WHEN** el usuario tiene una copia "reverse" de la #68 y vuelve a traer el Full
- **THEN** esa copia sigue contando en esa impresión

#### Scenario: Fuera de la era EX
- **WHEN** PokeCottage tiene el sello de la expansión de Espeon de Obsidian Flames y también una reverse aparte
- **THEN** las dos siguen siendo impresiones distintas

### Requirement: Acabado de los sellos de PokeCottage
Un sello de PokeCottage sin acabado (sin `foil`) SHALL tomar el acabado del mismo sello en la misma carta según TCGdex, cuando TCGdex lo tiene con un solo acabado, y unirse a esa impresión.

#### Scenario: Eevee ex de Prismatic Evolutions
- **WHEN** TCGdex tiene la #75 con el sello de la expansión como holo y PokeCottage como "Expansion Stamp"
- **THEN** hay una sola impresión `EEV·SV8PT5·75·EN·H~SET-LOGO`, con TCGdex y PokeCottage detrás

#### Scenario: TCGdex con dos acabados
- **WHEN** TCGdex tiene el sello de la expansión de Espeon #86 de Obsidian Flames como holo y como reverse
- **THEN** el sello de PokeCottage no toma ninguno por esta regla

### Requirement: Acabado según las cartas adicionales de Bulbapedia
El sistema SHALL leer, de la página de cada expansión en Bulbapedia, las cartas adicionales con su número, el sello entre comillas y el acabado al comienzo de la nota. Cuando la nota dice el acabado, todas las impresiones de esa carta con ese sello SHALL tomar ese acabado y quedar en una. Un sello con el nombre de la misma expansión SHALL leerse como el sello de la expansión. La fuente SHALL ser "Bulbapedia (cartas adicionales)", solo texto y de uso local.

#### Scenario: Espeon de Obsidian Flames
- **WHEN** Bulbapedia dice `086/197 … Reverse Holo "Obsidian Flames" stamp Best Buy gift with purchase exclusive (USA)`
- **THEN** Espeon #86 tiene una sola impresión con el sello de la expansión, Reverse, con TCGdex, PokeCottage y Bulbapedia (cartas adicionales) detrás

#### Scenario: Umbreon de GameStop
- **WHEN** Bulbapedia dice `130/197 … Reverse Holo "GameStop" stamp` y TCGdex y PokeCottage la tienen como normal
- **THEN** la Umbreon #130 GameStop es Reverse

#### Scenario: Una nota sin acabado
- **WHEN** la nota de la Eevee ex #75 de Prismatic Evolutions dice solo `Surprise Box exclusive with "Prismatic Evolutions" stamp`
- **THEN** esta regla no cambia su acabado

### Requirement: Un sello con su año
Dos nombres de sello de la misma carta y acabado SHALL ser uno cuando uno es el otro con un número al final, y SHALL quedar el más completo.

#### Scenario: Trick or Trade
- **WHEN** TCGdex tiene Umbreon #130 con `trick-or-trade` y PokeCottage con `trick-or-trade24`
- **THEN** hay una sola impresión con `trick-or-trade24`, con las dos fuentes

### Requirement: Expansiones de TCGdex por identificador
Una expansión de TCGdex que no cruza por nombre con el catálogo SHALL cruzar con la del catálogo que tiene su mismo identificador, si ninguna otra quedó con él.

#### Scenario: Undaunted
- **WHEN** TCGdex trae Umbreon #10 de "Undaunted" (`hgss3`) y el catálogo tiene "HS—Undaunted" (`hgss3`)
- **THEN** la impresión queda en `hgss3`, enlazada a la carta `hgss3-10`, junto a las de las otras fuentes, y no existe `UMB·TD:HGSS3·10·EN·N`

### Requirement: Impresiones de las expansiones que solo tiene TCGdex
Las impresiones de una expansión `tcgdex-en` SHALL quedar en esa expansión y enlazadas a su carta. Las de TCGdex SHALL cruzar por su identificador. Las de PokeCottage SHALL cruzar por el identificador cuando es el mismo, y si no, por el nombre, leyendo "<serie> Trainer Kit: <Pokémon> Half Deck" como "<serie> trainer Kit (<Pokémon>)".

#### Scenario: Eevee del kit de Sylveon
- **WHEN** se trae el Full de Eevee, con la #13 del kit en TCGdex (`tk-xy-sy`) y en PokeCottage (`tk6b`, sello "Sylveon Deck")
- **THEN** la #13 en inglés está en "XY trainer Kit (Sylveon)", enlazada a `td-tk-xy-sy-13`, con TCGdex y PokeCottage detrás, y no existen impresiones `td:tk-xy-sy` ni `pc:tk6b`
