# Spec Delta

## Purpose

Permitir que cada coleccionista reduzca el Full de un Pokémon a su propia colección con reglas reversibles y vistas guardadas, en la pantalla Vitrina, sabiendo qué tiene de su inventario real y de dónde sale cada dato.

## ADDED Requirements

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
