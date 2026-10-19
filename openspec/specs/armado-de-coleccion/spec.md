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
- **THEN** la vitrina vuelve a mostrar todas las impresiones del Full y el contador cuenta cuántas de ellas tiene, sobre el total del Full

### Requirement: Vitrina
La pantalla principal SHALL mostrar el Pokémon y sus reglas y vistas en un riel lateral. Arriba SHALL ir el contador "N / total tienes": cuántas de las impresiones visibles tiene el usuario, sobre el total de impresiones visibles. Al centro, las impresiones agrupadas por diseño en repisas, cada una con su foto a escala grande y una etiqueta (idioma o variante y un sticker de color con el permiso de su fuente).

Las impresiones que una regla deja fuera MUST NOT mostrarse, y una repisa sin impresiones visibles SHALL ocultarse. La nota de arriba SHALL decir cuántas impresiones dejó fuera la regla activa y cuántas de ellas tiene el usuario.

Una impresión SHALL verse a color si el usuario tiene al menos una copia de **esa** impresión exacta (carta, idioma, variante y sello), y en blanco y negro (escala de grises, sin oscurecer) si no la tiene. Una copia de otra impresión de la misma equivalencia MUST NOT contarla como tenida. Cada impresión que el usuario tiene SHALL llevar un sello de inventario en la esquina de la foto, con un ✓ y la cantidad de copias.

Con "reducir movimiento", los cambios de color SHALL ser instantáneos.

#### Scenario: Activar una regla
- **WHEN** el usuario activa "solo inglés"
- **THEN** las impresiones en otros idiomas de esas equivalencias dejan de verse, el contador baja al nuevo total y la nota dice cuántas dejó fuera la regla y cuántas de ellas tiene

#### Scenario: Una impresión que tengo
- **WHEN** el usuario tiene 2 copias de la Eevee de 151 #133 normal en inglés
- **THEN** esa impresión se ve a color, con un sello "✓ 2" en la esquina de la foto, y cuenta en el contador

#### Scenario: Una impresión que me falta
- **WHEN** el usuario no tiene ninguna copia de la Eevee de 151 #133 reverse en inglés
- **THEN** esa impresión se ve en blanco y negro, sin sello

#### Scenario: Tengo otra impresión de la misma equivalencia
- **WHEN** "solo inglés" está activa y el usuario tiene la #133 de 151 en español, pero no en inglés
- **THEN** la impresión en inglés se ve en blanco y negro, y la nota cuenta la española entre las que la regla dejó fuera y que el usuario tiene

#### Scenario: Una impresión que tengo queda fuera por una regla
- **WHEN** el usuario tiene un jumbo de Eevee y apaga "Incluir jumbo"
- **THEN** el jumbo deja de verse y la nota dice que la regla dejó fuera los jumbo, 1 de los cuales el usuario tiene

### Requirement: Ficha de impresión
Al elegir una impresión, la Vitrina SHALL mostrar su ficha: código de catálogo, foto grande, expansión, número, ilustrador, y de qué fuente sale cada dato, con su permiso. Si el usuario tiene la impresión, la ficha SHALL decir "Tienes N copias", con el idioma, el estado y la ubicación de cada una. Si no la tiene, SHALL decir "Te falta". Si la impresión elegida queda fuera por una regla, la ficha SHALL dejar de mostrarla.

#### Scenario: Una impresión que tengo
- **WHEN** el usuario elige la Eevee de 151 #133 normal en inglés y tiene 2 copias NM
- **THEN** la ficha dice "Tienes 2 copias", con su estado y ubicación, y muestra las fuentes de cada dato

#### Scenario: Una impresión que me falta
- **WHEN** el usuario elige una impresión de la que no tiene copias
- **THEN** la ficha dice "Te falta"

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
La Vitrina SHALL ofrecer dos órdenes, "Por diseño" (el de siempre) y "Por expansión", y SHALL recordar el elegido en el navegador. En "Por expansión" SHALL mostrar una repisa por expansión, en una sola línea de tiempo por fecha de salida que mezcla regiones. Cada repisa SHALL mostrar el nombre, la región y el mes de salida de su expansión, y sus impresiones SHALL ir ordenadas por número de carta y, para cada número, por idioma, acabado y sello. Las reglas SHALL ocultar las impresiones, y el color, el blanco y negro y el sello SHALL funcionar igual que en el orden por diseño.

#### Scenario: Rocket Gang antes que Team Rocket
- **WHEN** el usuario elige "Por expansión" en la vista "Full"
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

### Requirement: Ver lo que tengo y lo que me falta
Sobre la vitrina SHALL haber un filtro con tres opciones, cada una con su cantidad: "Todas", "Las que tengo" y "Me faltan". Las cantidades SHALL contar solo las impresiones visibles con las reglas actuales. El filtro SHALL combinarse con "Por verificar", y las repisas que queden vacías SHALL ocultarse mientras el filtro esté activo. El contador "N / total tienes" MUST NOT cambiar con el filtro.

#### Scenario: Solo lo que me falta
- **WHEN** el usuario elige "Me faltan"
- **THEN** la vitrina muestra solo las impresiones visibles que no tiene, todas en blanco y negro, y oculta las repisas donde ya las tiene todas

#### Scenario: Lo que tengo y por verificar
- **WHEN** el usuario elige "Las que tengo" y activa "Por verificar"
- **THEN** la vitrina muestra solo las impresiones que tiene y que además están por verificar

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
