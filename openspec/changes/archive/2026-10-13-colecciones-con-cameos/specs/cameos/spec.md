# Spec Delta

## Purpose

Saber en qué cartas aparece cada Pokémon sin ser el protagonista (cameos), a partir de la base comunitaria de RotomAmiti cruzada con el catálogo.

## ADDED Requirements

### Requirement: Importar la base de cameos
El sistema SHALL descargar la Cameo Pokémon Card Database de RotomAmiti (las pestañas por generación del Google Sheets público) y guardar cada cameo con su número de Pokédex, Pokémon, nombre de la carta, expansión, número y nota. La primera importación ocurre sola si la tabla está vacía; después, con un botón. Cada importación reemplaza la anterior completa.

#### Scenario: Primera vez
- **WHEN** la app arranca y no hay cameos guardados
- **THEN** importa la base y quedan miles de cameos de cientos de Pokémon

#### Scenario: Falla la descarga
- **WHEN** una pestaña no se puede descargar
- **THEN** no se borra la base anterior y se informa el error

### Requirement: Cruce con el catálogo
Cada cameo SHALL enlazarse con la carta del catálogo cuando la expansión y el número coinciden, considerando nombres de expansión distintos (ej. "Wizards Promos" ↔ Wizards Black Star Promos), números de promos con prefijo (176 ↔ XY176) y subcolecciones (GG61 en Crown Zenith Galarian Gallery). Los que no coinciden quedan como referencia sin carta.

#### Scenario: Promo con prefijo
- **WHEN** un cameo dice "XY Promos 176"
- **THEN** se enlaza con la carta XY176 de XY Black Star Promos

#### Scenario: Promo japonesa
- **WHEN** un cameo es de "SM-P Promos" (no está en el catálogo)
- **THEN** queda como referencia con su nombre, expansión y número

### Requirement: Cameos de un Pokémon
El sistema SHALL entregar los cameos de un número de Pokédex con los datos de su carta (imagen, expansión, rareza) cuando está en el catálogo.

#### Scenario: Eevee
- **WHEN** se piden los cameos de #133
- **THEN** se obtienen las cartas donde aparece Eevee, por ejemplo Snorlax de Wizards Promos #49

### Requirement: Crédito de la fuente
La interfaz SHALL indicar que los datos de cameos vienen de la Cameo Pokémon Card Database de RotomAmiti y cuándo se actualizaron.

#### Scenario: Ver la fuente
- **WHEN** el usuario abre los cameos de un Pokémon
- **THEN** ve el crédito y la fecha de la última importación
