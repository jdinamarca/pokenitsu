## MODIFIED Requirements

### Requirement: Elegir expansión e idioma
El sistema SHALL permitir buscar la expansión por código impreso, nombre o código + idioma (ej. `MEW ES`, `PFL EN`, `151`), y recordar las expansiones recientes. Después de las coincidencias por código, nombre y serie, la búsqueda SHALL mostrar las expansiones que tienen todas las palabras buscadas entre su nombre, su serie y su era, en cualquier orden y sin importar mayúsculas ni tildes. `Esc` vuelve a la búsqueda de expansión.

#### Scenario: Buscar con código e idioma
- **WHEN** el usuario escribe `MEW ES` y elige el resultado
- **THEN** la expansión 151 queda activa y el idioma de carga pasa a Español

#### Scenario: Buscar por palabras
- **WHEN** el usuario escribe `sun & moon trainer kit`
- **THEN** aparecen "SM trainer Kit (Lycanroc)" y "SM trainer Kit (Alolan Raichu)", cuya serie es Sun & Moon

#### Scenario: Las coincidencias de antes van primero
- **WHEN** el usuario escribe `sun & moon`
- **THEN** la expansión "Sun & Moon" aparece primero, como antes
