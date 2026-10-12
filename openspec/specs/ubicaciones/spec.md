# ubicaciones Specification

## Purpose
Saber dónde está guardada cada copia (cajas, carpetas) y decidir automáticamente dónde guardar cada carta nueva.

## Requirements

### Requirement: Ubicaciones con reglas
El sistema SHALL permitir crear, editar, ordenar y borrar ubicaciones (caja, carpeta u otra) con nombre único, nota y una regla opcional. Una regla vacía acepta cualquier carta (caja general).

#### Scenario: Caja general
- **WHEN** una ubicación no tiene regla
- **THEN** acepta cualquier copia, con la menor especificidad

### Requirement: Partes de una regla
Una regla SHALL poder combinar: `series` o `sets` (series o expansiones aceptadas), `origin` (región: INT, JA, ZH…), `special` o `minPrice` (rarezas especiales o precio mínimo), `personal` (solo personales o solo para vender), `bulk` (solo challa: común a rara holo sin ex/GX/V, en normal/holo/reverse) y `auto: false` (nunca se asigna automáticamente).

#### Scenario: Carpeta de especiales
- **WHEN** una regla tiene `special: [ir, sir]` y `minPrice: 5000`
- **THEN** acepta copias IR o SIR, o cualquier copia que valga $5.000 o más

### Requirement: Borrar sin perder cartas
Al borrar una ubicación, sus copias SHALL quedar sin ubicación (0).

#### Scenario: Borrar una ubicación con cartas
- **WHEN** se borra una ubicación que tiene copias
- **THEN** esas copias quedan sin ubicación (0) y no se pierden

### Requirement: Gana la más específica
Al asignar automáticamente, entre las ubicaciones cuya regla acepta la copia SHALL ganar la de mayor especificidad: colección personal > especiales/precio > expansión nombrada > serie nombrada > solo challa > región > caja general. El orden de la lista solo desempata.

#### Scenario: Caja de Mega Evolution más abajo que la caja general de Scarlet & Violet
- **WHEN** se carga una carta de Mega Evolution y la caja de esa expansión está más abajo en la lista que una caja que acepta toda la serie
- **THEN** la carta va a la caja de Mega Evolution

### Requirement: Avisos de reglas superpuestas
El sistema SHALL avisar (⚠️) cuando otra ubicación se queda con cartas que una ubicación también acepta.

#### Scenario: Dos cajas aceptan la misma serie
- **WHEN** dos ubicaciones aceptan Scarlet & Violet con la misma especificidad
- **THEN** la de más abajo muestra un aviso indicando cuál se queda con las cartas

### Requirement: Asignación automática del inventario existente
El sistema SHALL proponer y aplicar, con detalle por serie, el traslado de las copias sin ubicación o mal ubicadas a la ubicación que les corresponde.

#### Scenario: Aplicar la asignación
- **WHEN** el usuario confirma la asignación automática
- **THEN** todas las filas propuestas se mueven en una sola transacción

### Requirement: Orden sugerido
El sistema SHALL ofrecer crear un conjunto sugerido de ubicaciones (cajas por serie y carpetas para lo valioso y lo personal) y explicar el orden recomendado de guardado: por expansión en orden de salida y, dentro, por número.

#### Scenario: Crear las sugeridas
- **WHEN** el usuario acepta el orden sugerido
- **THEN** se crean 2 carpetas (colección personal y especiales) y 6 cajas (una por serie reciente, japonesas y una general) con sus reglas

### Requirement: Estadísticas por ubicación
Cada ubicación SHALL mostrar cuántas cartas, cuántas expansiones y cuánto valor contiene, y permitir ver sus cartas en Mi colección.

#### Scenario: Ver cartas de una caja
- **WHEN** el usuario toca "Ver cartas"
- **THEN** Mi colección se abre filtrada por esa ubicación
