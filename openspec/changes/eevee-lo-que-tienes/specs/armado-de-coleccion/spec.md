## MODIFIED Requirements

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

### Requirement: Orden por expansión
La Vitrina SHALL ofrecer dos órdenes, "Por diseño" (el de siempre) y "Por expansión", y SHALL recordar el elegido en el navegador. En "Por expansión" SHALL mostrar una repisa por expansión, en una sola línea de tiempo por fecha de salida que mezcla regiones. Cada repisa SHALL mostrar el nombre, la región y el mes de salida de su expansión, y sus impresiones SHALL ir ordenadas por número de carta y, para cada número, por idioma, acabado y sello. Las reglas SHALL ocultar las impresiones, y el color, el blanco y negro y el sello SHALL funcionar igual que en el orden por diseño.

#### Scenario: Rocket Gang antes que Team Rocket
- **WHEN** el usuario elige "Por expansión" en la vista "Full"
- **THEN** la repisa "ロケット団" (Japón, 1997-11) aparece antes que "Team Rocket" (Internacional, 2000-04), y la de Jungle muestra #51 EN, #51 EN 1st Edition y luego #51 en francés y alemán

#### Scenario: El orden se recuerda
- **WHEN** el usuario elige "Por expansión" y recarga la página
- **THEN** la Vitrina sigue ordenada por expansión

## ADDED Requirements

### Requirement: Ver lo que tengo y lo que me falta
Sobre la vitrina SHALL haber un filtro con tres opciones, cada una con su cantidad: "Todas", "Las que tengo" y "Me faltan". Las cantidades SHALL contar solo las impresiones visibles con las reglas actuales. El filtro SHALL combinarse con "Por verificar", y las repisas que queden vacías SHALL ocultarse mientras el filtro esté activo. El contador "N / total tienes" MUST NOT cambiar con el filtro.

#### Scenario: Solo lo que me falta
- **WHEN** el usuario elige "Me faltan"
- **THEN** la vitrina muestra solo las impresiones visibles que no tiene, todas en blanco y negro, y oculta las repisas donde ya las tiene todas

#### Scenario: Lo que tengo y por verificar
- **WHEN** el usuario elige "Las que tengo" y activa "Por verificar"
- **THEN** la vitrina muestra solo las impresiones que tiene y que además están por verificar
