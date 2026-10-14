## MODIFIED Requirements

### Requirement: Datos compartidos
El catálogo, los precios de mercado, el tipo de cambio, los nombres de variantes, los cameos y los grupos de artes conectados SHALL ser los mismos para todas las cuentas.

#### Scenario: Precio de mercado
- **WHEN** se descarga el precio de una carta que tienen dos cuentas
- **THEN** ambas ven el mismo precio de mercado, cada una con su propia configuración

#### Scenario: Artes conectados para una cuenta nueva
- **WHEN** un invitado entra por primera vez
- **THEN** ve los mismos grupos de artes conectados que el dueño, con su avance en 0
