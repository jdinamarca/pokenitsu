# Spec Delta

## ADDED Requirements

### Requirement: Menús que nacen de su botón
Al abrirse, un menú desplegable SHALL aparecer con un fade y una escala sutil desde la esquina donde está su botón, en no más de 250 ms. Al cerrarse SHALL desaparecer al instante.

#### Scenario: Abrir el menú Datos
- **WHEN** el usuario toca "Datos ▾"
- **THEN** el menú aparece creciendo desde la esquina del botón en vez de aparecer de golpe

#### Scenario: Cerrar un menú
- **WHEN** el usuario cierra un menú abierto
- **THEN** el menú desaparece de inmediato

### Requirement: Entrada a vistas de detalle
Al pasar de una lista a su detalle (expansión, ilustrador, grupo de artes conectados, colección) o volver a la lista, la vista que aparece SHALL entrar con un fade corto (no más de 250 ms). Un redibujo de una vista que ya estaba visible MUST NOT volver a animarla.

#### Scenario: Entrar a una expansión
- **WHEN** el usuario toca una expansión en la lista de Expansiones
- **THEN** el detalle aparece con un fade corto

#### Scenario: Filtrar dentro del detalle
- **WHEN** el usuario cambia un filtro dentro del detalle abierto
- **THEN** el contenido se actualiza sin repetir la animación de entrada

### Requirement: Respuesta de botones al presionar
Un botón SHALL encogerse levemente (a no menos del 95 % de su tamaño) mientras se presiona y volver a su tamaño al soltarlo, en no más de 160 ms.

#### Scenario: Presionar un botón
- **WHEN** el usuario mantiene presionado un botón
- **THEN** el botón se ve levemente más pequeño hasta que lo suelta

### Requirement: Movimiento reducido en menús, detalles y botones
Cuando el sistema pide movimiento reducido, menús y vistas de detalle SHALL aparecer solo con fade, y los botones MUST NOT encogerse al presionarlos.

#### Scenario: Usuario con movimiento reducido abre un menú
- **WHEN** el sistema tiene activado "reducir movimiento" y el usuario abre "Datos ▾"
- **THEN** el menú aparece solo con un fade, sin escala
