## ADDED Requirements

### Requirement: La foto de TCGdex de una japonesa con Poké Ball
En una carta japonesa que tiene impresión Poké Ball (SV2a, SV8a), la foto de TCGdex SHALL quedar solo en esa impresión, porque muestra la versión Poké Ball.

#### Scenario: Terastal Festival #125
- **WHEN** se importa el Full de Eevee
- **THEN** la impresión Poké Ball de SV8a #125 tiene la foto de TCGdex, y ni la Normal, ni la Reverse, ni la Master Ball la tienen

#### Scenario: Una carta sin Poké Ball
- **WHEN** la carta japonesa no tiene impresión Poké Ball, como SV8a #126 Eevee ex
- **THEN** sus fotos quedan como antes

### Requirement: Fotos locales de la impresión simple
La foto de Limitless SHALL ir solo a la impresión simple (Normal, Holo o Cosmos, sin sello), nunca a Reverse, Poké Ball, Master Ball ni a una impresión con sello. Una foto de PokeCottage que se repite en dos acabados de la misma carta SHALL quedar solo en la impresión simple.

#### Scenario: Fotos locales de SV8a #125
- **WHEN** se bajan las fotos locales de Eevee
- **THEN** la Normal tiene la de Limitless y la Normal de PokeCottage, y la Poké Ball y la Master Ball no tienen ninguna de las dos

### Requirement: Cada variante con su foto en Cargar y Mi inventario
En una carta japonesa con impresión Poké Ball, Cargar y Mi inventario SHALL mostrar cada variante con la foto de su propia impresión del Full antes que la foto del catálogo.

#### Scenario: Cargarla como Normal
- **WHEN** el usuario abre SV8a en Cargar y marca la #125 Normal
- **THEN** la ficha, la grilla y Mi inventario muestran la carta simple, no la versión Poké Ball
