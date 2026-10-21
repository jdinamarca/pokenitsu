## ADDED Requirements

### Requirement: Cargar cartas de expansiones chinas
El buscador de Cargar SHALL encontrar las expansiones chinas por código, nombre chino o nombre en inglés, con la etiqueta "Chino simplificado" o "Chino tradicional". Al abrir una, el idioma de carga SHALL pasar a Chino. La ficha de una carta armada desde el Full SHALL decir "Lista armada desde tu Master Set".

#### Scenario: Cargar la Eevee 0401 de Gem Pack Vol. 4
- **WHEN** el usuario escribe `CBB4C`, abre la expansión y carga la 401
- **THEN** se guarda una copia en chino, la ficha dice "Lista armada desde tu Master Set" y el Master Set de Eevee enciende `EEV·PC:SCN_CBB4·401·ZH-CN·H`

### Requirement: Las copias en chino cuentan en el Master Set
Una copia en chino (`ZH`) SHALL contar como la impresión china de esa carta y variante: primero en el idioma de su expansión, cuando es china, y si no en `ZH-TW` o `ZH-CN`. No SHALL cambiarse ninguna copia guardada.

#### Scenario: Traducción de una expansión japonesa
- **WHEN** el usuario tiene una copia `ZH` de la S10D 052 normal y el Full tiene `EEV·JA-S10D·52·ZH-TW·N`
- **THEN** el Master Set de Eevee enciende esa impresión
