# Spec Delta

## ADDED Requirements

### Requirement: Avance de la expansión al cargar
La expansión activa en Cargar SHALL mostrar su avance en el modo de completitud elegido (por defecto Base), actualizado después de cada carga y de cada deshacer.

#### Scenario: Carga que suma
- **WHEN** la expansión activa está en 88/165 y el usuario carga una carta de número impreso que no tenía
- **THEN** el indicador pasa a 89/165

#### Scenario: Copia repetida
- **WHEN** el usuario carga otra copia de una carta que ya tenía
- **THEN** el avance no cambia

### Requirement: Aviso de carta nueva para la expansión
Cuando una carga agrega una carta que el usuario no tenía en esa expansión, la confirmación SHALL decir "¡Nueva!" con el avance resultante, y al completar la expansión en el modo elegido SHALL mostrar una celebración.

#### Scenario: Última carta
- **WHEN** el usuario carga la carta que completa 165/165 en modo Base
- **THEN** aparece una celebración "¡Completaste 151!"
