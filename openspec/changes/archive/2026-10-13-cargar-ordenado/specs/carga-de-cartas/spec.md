# Spec Delta

## ADDED Requirements

### Requirement: Ajustes de carga compactos
La pantalla de carga SHALL mostrar el idioma, el estado, la ubicación y el destino (vender o colección personal) como un botón cada uno con su valor actual. Las opciones de cada ajuste SHALL abrirse al tocar su botón y cerrarse al elegir una o al tocar fuera. Un estado distinto de NM y el modo colección personal SHALL verse destacados.

#### Scenario: Cambiar la ubicación
- **WHEN** el usuario toca "Guardar en: Automático" y elige "Caja 1"
- **THEN** el menú se cierra, el botón dice "Caja 1" y las cartas siguientes se guardan ahí

#### Scenario: Estado cambiado desde el teclado
- **WHEN** el usuario escribe `lp` en el campo del número y Enter
- **THEN** el botón de estado muestra LP destacado como advertencia

#### Scenario: Preferencias guardadas
- **WHEN** el usuario recarga la página
- **THEN** los botones muestran el idioma, la ubicación y el destino que tenía elegidos (el estado vuelve a NM)

### Requirement: Búsqueda de expansión a pedido
Con una expansión activa, la búsqueda SHALL quedar oculta y la pantalla SHALL mostrar la expansión con su avance y un botón "Cambiar expansión". Ese botón o `Esc` en el campo del número SHALL abrir la búsqueda, que muestra las expansiones recientes. Sin expansión activa, la búsqueda SHALL verse siempre.

#### Scenario: Cambiar con Esc
- **WHEN** hay una expansión activa y el usuario presiona `Esc` en el campo del número
- **THEN** aparece la búsqueda con el foco y las expansiones recientes

#### Scenario: Cancelar el cambio
- **WHEN** la búsqueda está abierta con una expansión activa y el usuario presiona `Esc`
- **THEN** la búsqueda se esconde y el foco vuelve al campo del número

### Requirement: Ayuda de atajos compacta
La pantalla de carga SHALL mostrar en una sola línea los atajos más usados y un "Todos los atajos" que abre la lista completa.

#### Scenario: Ver todos los atajos
- **WHEN** el usuario toca "Todos los atajos"
- **THEN** se muestra la lista completa de atajos y la opción de sonido

### Requirement: Historial corto
"Últimas cargas" SHALL mostrar las 5 cargas más recientes y un "Ver las 12" que muestra hasta 12.

#### Scenario: Ver más cargas
- **WHEN** hay 12 cargas y el usuario toca "Ver las 12"
- **THEN** la lista muestra las 12

### Requirement: Vista previa en el celular
En pantallas angostas, la vista previa de la carta SHALL aparecer justo debajo del campo del número, antes de "Últimas cargas", y la pantalla de carga MUST NOT desbordarse hacia los lados.

#### Scenario: Cargar desde el celular
- **WHEN** el usuario carga una carta en un celular de 390 px de ancho
- **THEN** ve la carta cargada sin bajar más allá del campo y sin desplazamiento horizontal
