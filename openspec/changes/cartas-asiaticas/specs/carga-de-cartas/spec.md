# Spec Delta

## ADDED Requirements

### Requirement: Idiomas tailandés e indonesio
Los idiomas de carga SHALL incluir tailandés (`th`) e indonesio (`id`) además de los que ya existen, tanto en el botón de idioma como escritos solos en el campo del número o junto al código de la expansión.

#### Scenario: Cambiar a tailandés escribiendo
- **WHEN** el usuario escribe `th` y Enter
- **THEN** el idioma de carga pasa a Tailandés y lo que se cargue después queda en ese idioma

#### Scenario: Copia indonesia de una japonesa
- **WHEN** con Terastal Festival (SV8a) activa y el idioma en Indonesio el usuario carga `125`
- **THEN** queda una copia de la Eevee SV8a #125 en indonesio
