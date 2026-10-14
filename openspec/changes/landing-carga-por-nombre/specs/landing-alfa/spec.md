## ADDED Requirements

### Requirement: Cómo funciona la carga
La sección "Cómo funciona" SHALL explicar que, tras elegir la expansión, se puede escribir el número o el nombre de la carta, y que antes de agregarla se ve una vista previa. Su demo animada SHALL mostrar la carta pendiente con su imagen antes de cada Enter, y al menos una carga por nombre en la que aparece la lista de cartas que coinciden y se elige una.

#### Scenario: Carga por nombre en la demo
- **WHEN** la demo escribe `char`
- **THEN** aparece la lista con Charmander, Charmeleon y las Charizard ex, la vista previa sigue a la carta elegida y con Enter se agrega a "Últimas cargas"

#### Scenario: Demo con movimiento reducido
- **WHEN** el visitante tiene activado reducir movimiento
- **THEN** la demo se muestra estática con la lista de nombres, la vista previa y algunas cargas, sin animaciones
