# Spec Delta

## MODIFIED Requirements

### Requirement: Datos de cada cuenta
El inventario, su registro, las ubicaciones, los lotes, las colecciones, los ilustradores favoritos, los precios propios, las fotos propias y la configuración de precios y lotes SHALL pertenecer a una cuenta. Cada cuenta MUST ver, crear, modificar y borrar solo los suyos, también si conoce el ID de un dato ajeno.

#### Scenario: Cuenta nueva
- **WHEN** un invitado entra por primera vez
- **THEN** ve su inventario, ubicaciones y colecciones vacíos

#### Scenario: Misma carta en dos cuentas
- **WHEN** otra cuenta carga una carta que el dueño también tiene
- **THEN** la carta suma en el inventario de esa cuenta y el del dueño no cambia

#### Scenario: Dato ajeno por su ID
- **WHEN** una cuenta intenta renombrar o borrar una ubicación de otra usando su ID
- **THEN** la ubicación de la otra cuenta queda igual

### Requirement: Datos compartidos
El catálogo, los precios de mercado, el tipo de cambio, los nombres de variantes, las checklists, los cameos y los grupos de artes conectados SHALL ser los mismos para todas las cuentas.

#### Scenario: Precio de mercado
- **WHEN** se descarga el precio de una carta que tienen dos cuentas
- **THEN** ambas ven el mismo precio de mercado, cada una con su propia configuración

#### Scenario: Artes conectados para una cuenta nueva
- **WHEN** un invitado entra por primera vez
- **THEN** ve los mismos grupos de artes conectados que el dueño, con su avance en 0
