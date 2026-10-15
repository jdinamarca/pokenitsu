# armado-de-coleccion Specification

## Purpose
Permitir que cada coleccionista reduzca el Full de un Pokémon a su propia colección con reglas reversibles y vistas guardadas, en la pantalla Vitrina, sabiendo qué tiene de su inventario real y de dónde sale cada dato.

## Requirements

### Requirement: Reglas que reducen el Full
El usuario SHALL poder activar y desactivar reglas que deciden qué impresiones del Full cuentan para su colección. Al menos estas:
- "si el diseño y la variante son iguales en EE. UU., Latinoamérica y Europa, solo la de inglés" (compara solo idiomas occidentales);
- "las asiáticas traducidas cuentan como la japonesa" (entre japonés, chino, coreano, tailandés e indonesio, prefiere la japonesa);
- incluir sellos y mazos;
- incluir World Championship Decks;
- incluir jumbo.

Aplicar o quitar una regla MUST NOT borrar impresiones del Full ni modificar el inventario. El resultado SHALL actualizarse al instante.

#### Scenario: Solo inglés
- **WHEN** el usuario activa "solo inglés" y una equivalencia tiene la impresión en inglés y en otros cuatro idiomas
- **THEN** solo la de inglés cuenta para la colección y las otras cuatro quedan fuera, sin borrarse

#### Scenario: Sin impresión en inglés
- **WHEN** la regla "solo inglés" está activa y una equivalencia tiene la impresión en francés y en alemán, pero no en inglés
- **THEN** cuenta una sola: la del idioma occidental que va primero en orden alfabético (alemán), y la otra queda fuera

#### Scenario: Solo inglés no toca las japonesas
- **WHEN** la regla "solo inglés" está activa y una equivalencia tiene la impresión en inglés y en japonés
- **THEN** las dos cuentan, porque la regla compara solo EE. UU., Latinoamérica y Europa; las asiáticas tienen su propia regla

### Requirement: Vistas guardadas
El usuario SHALL poder guardar la combinación actual de reglas con un nombre, cambiar entre vistas guardadas, y siempre tener la vista "Full", sin reglas. Las vistas SHALL ser de cada usuario.

#### Scenario: Volver al Full
- **WHEN** el usuario está en "Master set inglés" y elige "Full"
- **THEN** todas las impresiones quedan bajo luz y el contador muestra el total del Full

### Requirement: Vitrina
La pantalla principal SHALL mostrar el Pokémon y sus reglas y vistas en un riel lateral; arriba, el contador "bajo luz / Full" y la regla activa; al centro, las impresiones agrupadas por diseño en repisas, con su foto a escala grande y una etiqueta (idioma o variante y un sticker de color con el permiso de su fuente). Las impresiones que una regla deja fuera SHALL verse en penumbra y en escala de grises, en su lugar. Con "reducir movimiento" la transición SHALL ser instantánea.

#### Scenario: Activar una regla
- **WHEN** el usuario activa "solo inglés"
- **THEN** las impresiones en otros idiomas de esas equivalencias pasan a penumbra en su lugar y el contador baja al nuevo total

### Requirement: Ficha de impresión
Al elegir una impresión, la Vitrina SHALL mostrar su ficha: código de catálogo, foto grande, expansión, número, ilustrador, cuántas copias de esa impresión tiene el usuario en su inventario (idioma, estado y ubicación), si cuenta o no para su colección con las reglas actuales, y de qué fuente sale cada dato, con su permiso.

#### Scenario: Una impresión que tengo
- **WHEN** el usuario elige la Eevee de 151 #133 normal en inglés y tiene 2 copias NM
- **THEN** la ficha dice "2 copias" con su estado y ubicación, y muestra las fuentes de cada dato

### Requirement: Inventario en solo lectura
La app SHALL identificar al usuario con su sesión de Nitsu y leer su inventario solo para mostrar lo que tiene. MUST NOT escribir en el inventario ni en ningún dato de la app actual. Sin sesión, SHALL pedir entrar en Nitsu.

#### Scenario: Sin sesión
- **WHEN** alguien abre la app nueva sin haber entrado en Nitsu
- **THEN** ve un aviso con el enlace para entrar y no ve ningún inventario

### Requirement: Prioridad y marca de las fotos solo local
La Vitrina y la ficha SHALL usar primero una foto con permiso de imagen (las copias propias del catálogo o TCGdex). Una foto "solo local" SHALL usarse solo cuando la impresión no tiene ninguna con permiso, y antes que la foto de otra impresión del mismo diseño. Una impresión que muestra una foto "solo local" SHALL llevar una marca violeta en la vitrina, y en la ficha SHALL decir "Foto solo para uso local" junto a su fuente.

#### Scenario: Promo japonesa sin foto con permiso
- **WHEN** el interruptor está encendido y una promo japonesa solo tiene foto de PokeCottage
- **THEN** la vitrina la muestra con esa foto y la marca violeta, y la ficha dice "Foto solo para uso local · PokeCottage"

#### Scenario: Carta con foto propia
- **WHEN** una impresión tiene nuestra copia de pokemontcg.io y además una foto de Bulbagarden Archives
- **THEN** se muestra nuestra copia, sin marca violeta

### Requirement: Orden por expansión
La Vitrina SHALL ofrecer dos órdenes, "Por diseño" (el de hoy) y "Por expansión", y SHALL recordar el elegido en el navegador. En "Por expansión" SHALL mostrar una repisa por expansión, en una sola línea de tiempo por fecha de salida que mezcla regiones. Cada repisa SHALL mostrar el nombre, la región y el mes de salida de su expansión, y sus impresiones SHALL ir ordenadas por número de carta y, para cada número, por idioma, acabado y sello. Las reglas SHALL apagar las impresiones igual que en el orden por diseño.

#### Scenario: Rocket Gang antes que Team Rocket
- **WHEN** el usuario elige "Por expansión"
- **THEN** la repisa "ロケット団" (Japón, 1997-11) aparece antes que "Team Rocket" (Internacional, 2000-04), y la de Jungle muestra #51 EN, #51 EN 1st Edition y luego #51 en francés y alemán

#### Scenario: El orden se recuerda
- **WHEN** el usuario elige "Por expansión" y recarga la página
- **THEN** la Vitrina sigue ordenada por expansión

### Requirement: Qué es una expansión
Las impresiones en idiomas occidentales de una misma expansión internacional SHALL formar una sola expansión. Cada expansión japonesa SHALL ser propia, igual que cada china simplificada. Las impresiones en chino tradicional, tailandés, indonesio o coreano que pertenecen a una expansión japonesa SHALL formar su propia expansión, con su nombre local y la región de su idioma.

#### Scenario: Expansión traducida
- **WHEN** el Full tiene Eevee de "VMAXクライマックス" en japonés y en chino tradicional
- **THEN** hay dos repisas: "VMAXクライマックス" (Japón) y "VMAX絕群壓軸" (China tradicional)

### Requirement: Fecha de salida de una expansión
La fecha de una expansión SHALL ser la más antigua entre sus impresiones. Si no hay ninguna, SHALL usarse la de su expansión japonesa (para las traducidas) y, si tampoco hay, la del catálogo. Las expansiones sin fecha SHALL ir al final de la línea de tiempo, en orden alfabético, con la leyenda "Fecha por confirmar".

#### Scenario: Traducida sin fecha propia
- **WHEN** "寶可夢卡牌151" (chino tradicional) no tiene fecha y "ポケモンカード151" sí (2023-06-18)
- **THEN** la repisa china toma 2023-06 y queda junto a la japonesa, después de ella

### Requirement: La foto calza con la variante
La Vitrina y la ficha SHALL mostrar, para cada impresión, una foto que muestre su variante, en este orden: una foto propia subida, una foto con permiso y una foto solo local. Si ninguna calza, SHALL mostrar la foto de otra variante de la misma carta, atenuada y, en la ficha, con la nota "Foto de \<variante\> · falta esta variante". Una impresión MUST NOT mostrar como propia una foto de otra variante.

#### Scenario: Team Rocket #55 unlimited sin foto propia
- **WHEN** Team Rocket #55 unlimited solo tiene la foto compartida con la 1st Edition
- **THEN** la vitrina la muestra atenuada y la ficha dice "Foto de la 1st Edition · falta esta variante"

#### Scenario: La 1st Edition con su foto
- **WHEN** se mira la Jungle #51 1st Edition
- **THEN** muestra la foto compartida, sin nota ni atenuación

### Requirement: Marcar y subir desde la ficha
La ficha SHALL permitir, para la foto que se muestra, marcar qué variante muestra (entre las variantes de la misma carta) y subir o quitar la foto propia de la impresión. Los cambios SHALL verse en la vitrina sin recargar la página.

#### Scenario: Corregir una foto
- **WHEN** el usuario marca en la ficha que la foto de Gym Challenge #51 unlimited muestra la 1st Edition
- **THEN** la unlimited pasa a mostrar la nota "Foto de la 1st Edition · falta esta variante", y la 1st Edition sigue mostrándola como propia

### Requirement: Impresiones por verificar a la vista
La Vitrina SHALL marcar en su etiqueta las impresiones por verificar y SHALL ofrecer el filtro "Por verificar (N)", que muestra solo esas. La ficha SHALL listar los motivos de una impresión por verificar, en lenguaje de coleccionista.

#### Scenario: Ficha de una impresión dudosa
- **WHEN** el usuario abre la ficha de una impresión que solo TCGdex conoce
- **THEN** ve "Por verificar" con el motivo "Solo TCGdex dice que existe; pokemontcg.io, PokeCottage y TCGplayer conocen la carta"

#### Scenario: Filtro
- **WHEN** el usuario activa "Por verificar (N)"
- **THEN** la vitrina muestra solo las N impresiones marcadas, y al desactivarlo vuelve a mostrar todo

### Requirement: Motivos de idioma en "Por verificar"
La revisión de clasificación SHALL marcar con el motivo "deducida" cada impresión deducida, diciendo de qué expansión y en qué idioma se dedujo. SHALL marcar con el motivo "no salió en este idioma" cada impresión en español de una expansión que WikiDex dice "No distribuida (ES)".

#### Scenario: Deducida
- **WHEN** el usuario abre la ficha de Majestic Dawn #62 en italiano
- **THEN** ve "Deducida: TCGdex lista Alba Suprema en italiano, pero ninguna fuente lista esta carta"

#### Scenario: No distribuida
- **WHEN** una fuente trae Team Rocket #55 en español
- **THEN** queda por verificar con "WikiDex dice que Team Rocket no se distribuyó en español"

### Requirement: No salió en este idioma
La revisión de clasificación SHALL marcar con el motivo "no salió en este idioma" cada impresión de una expansión que Bulbapedia (o WikiDex, para el español) dice que no salió en el idioma de la impresión, nombrando la fuente, la expansión y el idioma.

#### Scenario: Neo Discovery en español
- **WHEN** una fuente trae Neo Discovery #38 en español y la tabla de Bulbapedia dice "—" en español
- **THEN** queda por verificar con "Bulbapedia dice que Neo Discovery no salió en español"
