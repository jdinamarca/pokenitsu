# Spec Delta

## ADDED Requirements

### Requirement: Grupos compartidos, editados por el dueño
Los grupos de artes conectados SHALL ser los mismos para todas las cuentas, y el avance de cada grupo SHALL calcularse con el inventario de cada cuenta. Solo el dueño (la primera cuenta) SHALL poder crear, editar, borrar o cambiar la imagen de un grupo; para las demás cuentas la API MUST rechazarlo y la app MUST NOT mostrar esos botones.

#### Scenario: Tester intenta editar
- **WHEN** una cuenta que no es la del dueño intenta editar o borrar un grupo
- **THEN** recibe "Solo el administrador puede editar los artes conectados" y el grupo no cambia

#### Scenario: Avance propio
- **WHEN** un tester tiene 1 de las 3 cartas de un grupo y el dueño ninguna
- **THEN** el tester ve ese grupo en 1/3 y el dueño en 0/3
