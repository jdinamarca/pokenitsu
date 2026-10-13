# Spec Delta

## MODIFIED Requirements

### Requirement: Deshacer
El sistema SHALL deshacer la última carga con `⌘Z` o el botón, revirtiendo cantidad, copias personales y ubicación según el registro (`inventory_log`). Si la última carga fue un rango, se deshace el rango completo.

#### Scenario: Deshacer una carga movida por precio
- **WHEN** una carga se movió de ubicación por su precio y el usuario deshace
- **THEN** la copia se quita de la ubicación donde quedó finalmente

#### Scenario: Deshacer un rango
- **WHEN** el usuario cargó `1-30` y luego deshace
- **THEN** se quitan las 30 copias de una vez y el inventario queda como antes del rango

## ADDED Requirements

### Requirement: Rangos de números
El sistema SHALL aceptar `<desde>-<hasta>` para cargar una copia de cada carta con número entre ambos, en la expansión activa, combinable con sufijo de variante, cantidad, estado y `-` para quitar (ej. `1-30r`, `1-30*2`, `1-30 lp`, `-1-30`).

#### Scenario: Rango con variante
- **WHEN** el usuario escribe `1-10r` en 151
- **THEN** se suma una copia reverse de cada carta del 1 al 10

#### Scenario: Rango al revés
- **WHEN** el usuario escribe `30-1`
- **THEN** se carga igual que `1-30`

### Requirement: Números inexistentes en un rango
Los números del rango que no existen en la expansión SHALL saltarse, y la confirmación SHALL indicar cuántas cartas se cargaron y cuáles se saltaron.

#### Scenario: Rango con huecos
- **WHEN** el usuario carga `1-12` y la 7 no existe en la expansión
- **THEN** se cargan 11 cartas y la confirmación dice que la 7 se saltó

### Requirement: Confirmación de rangos grandes
Un rango de más de 50 cartas SHALL pedir confirmación antes de cargar.

#### Scenario: Rango de 100
- **WHEN** el usuario escribe `1-100`
- **THEN** el sistema pregunta si quiere cargar 100 cartas y no carga nada si cancela

### Requirement: Repetir la última entrada
Enter con la entrada vacía SHALL repetir la última entrada (carta o rango, variante, cantidad y estado) en la misma expansión, mostrando qué se repitió.

#### Scenario: Repetir una carta
- **WHEN** el usuario cargó `25r` y luego presiona Enter con la entrada vacía
- **THEN** se suma otra copia reverse de la 25 y el mensaje dice "Repetido: 25r"

#### Scenario: Nada que repetir
- **WHEN** el usuario presiona Enter vacío sin haber cargado nada en esta sesión o después de cambiar de expansión
- **THEN** no pasa nada
