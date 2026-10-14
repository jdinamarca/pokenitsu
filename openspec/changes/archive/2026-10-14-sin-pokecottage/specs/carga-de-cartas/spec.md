## MODIFIED Requirements

### Requirement: Imagen de referencia para cartas sin foto
Cuando una carta no tiene imagen (muchas japonesas antiguas), la vista previa, la lista de nombres, "Últimas cargas" y las cartas de Mis colecciones SHALL mostrar una imagen del mismo Pokémon de otra expansión, atenuada, y la vista previa SHALL indicar que es una imagen de referencia.

#### Scenario: Carta japonesa sin foto
- **WHEN** el usuario escribe `12` en Rocket Gang y la carta no tiene imagen
- **THEN** la vista previa muestra un Charmander de otra expansión, atenuado, con la etiqueta "Imagen de referencia"

#### Scenario: Colección con cartas japonesas antiguas
- **WHEN** el usuario abre su colección de Eevee y el Eevee de Rocket Gang no tiene foto
- **THEN** su carta muestra un Eevee de otra expansión, atenuado
