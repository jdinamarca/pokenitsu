## ADDED Requirements

### Requirement: Estante de ubicaciones
La pestaña Ubicaciones SHALL mostrar las ubicaciones como objetos sobre repisas: las carpetas como lomos de pie con su nombre y cantidad, y las cajas (y otras) como cajas con tapa y una etiqueta con nombre, cartas y valor. Las que tienen cartas SHALL ir en una repisa y las vacías en otra, apagadas, respetando el orden de la lista.

#### Scenario: Caja con cartas
- **WHEN** el usuario abre Ubicaciones y la Caja 1 · Mega Evolution tiene 19 cartas
- **THEN** la caja aparece en la repisa "con cartas" con su etiqueta "19 cartas · $888"

#### Scenario: Ubicación vacía
- **WHEN** una ubicación no tiene cartas
- **THEN** aparece en la repisa "vacías por ahora", apagada

### Requirement: Animación del estante
Con mouse, al pasar sobre una ubicación la carpeta SHALL inclinarse o la tapa de la caja levantarse, y asomar hasta 3 de sus cartas más valiosas. Con "reducir movimiento" MUST NOT haber movimiento.

#### Scenario: Pasar el mouse por una caja
- **WHEN** el usuario pasa el mouse sobre una caja con cartas
- **THEN** se levanta la tapa y asoman sus cartas más valiosas

#### Scenario: Movimiento reducido
- **WHEN** el usuario tiene activado reducir movimiento
- **THEN** las carpetas y cajas no se inclinan ni se abren

### Requirement: Detalle de la ubicación elegida
Al tocar una ubicación, el sistema SHALL marcarla como elegida y mostrar su detalle: tipo y posición en la lista, cartas, expansiones y valor, miniaturas de sus cartas, lo que recibe en chips con la regla completa como ayuda, los avisos de reglas superpuestas, la nota, y las acciones Ver cartas, Editar, subir, bajar y Borrar. Al abrir la pestaña SHALL quedar elegida la primera ubicación con cartas.

#### Scenario: Elegir una carpeta
- **WHEN** el usuario toca la Carpeta colección personal
- **THEN** el detalle muestra "12 cartas", el chip "🔒 Colección personal" y el botón "Ver las 12 cartas"

### Requirement: Explicación plegada
La explicación del orden sugerido y de cómo se elige la ubicación SHALL estar en un desplegable "¿Cómo decide dónde va cada carta?", cerrado si ya hay ubicaciones y abierto si no hay ninguna.

#### Scenario: Sin ubicaciones
- **WHEN** el usuario aún no tiene ubicaciones
- **THEN** ve la explicación abierta y el botón para crear el orden sugerido
