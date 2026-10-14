# datos-por-usuario Specification

## Purpose
Separar los datos de cada cuenta: qué es de cada persona y qué es compartido, cómo se aísla una cuenta de otra y qué pasa con los datos que había antes de las cuentas.

## Requirements

### Requirement: Datos de cada cuenta
El inventario, su registro, las ubicaciones, los lotes, las colecciones, los grupos de artes conectados, los ilustradores favoritos, los precios propios, las fotos propias y la configuración de precios y lotes SHALL pertenecer a una cuenta. Cada cuenta MUST ver, crear, modificar y borrar solo los suyos, también si conoce el ID de un dato ajeno.

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
El catálogo, los precios de mercado, el tipo de cambio, los nombres de variantes, las checklists y los cameos SHALL ser los mismos para todas las cuentas.

#### Scenario: Precio de mercado
- **WHEN** se descarga el precio de una carta que tienen dos cuentas
- **THEN** ambas ven el mismo precio de mercado, cada una con su propia configuración

### Requirement: Valores únicos por cuenta
Los nombres de ubicación y las filas de inventario (carta + variante + idioma + estado + ubicación) SHALL ser únicos dentro de cada cuenta, no entre cuentas.

#### Scenario: Mismo nombre de ubicación
- **WHEN** dos cuentas crean una ubicación llamada "Caja 1"
- **THEN** ambas se crean

### Requirement: Datos existentes al dueño
Al pasar a datos por usuario, las filas que había SHALL quedar en la primera cuenta creada sin modificarse. Si hay datos y ninguna cuenta, la actualización MUST detenerse pidiendo crear la cuenta.

#### Scenario: Actualizar con la cuenta del dueño creada
- **WHEN** se actualiza teniendo la cuenta del dueño
- **THEN** el dueño ve exactamente las mismas filas y copias que antes

### Requirement: Borrar una cuenta
Borrar una cuenta SHALL borrar todos sus datos y ninguno de otra.

#### Scenario: Borrar la cuenta de un tester
- **WHEN** se borra la cuenta de un tester
- **THEN** desaparecen su inventario y ubicaciones, y los del dueño quedan iguales
