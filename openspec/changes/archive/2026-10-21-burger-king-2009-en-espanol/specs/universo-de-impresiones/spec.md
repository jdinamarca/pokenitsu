## ADDED Requirements

### Requirement: Impresiones confirmadas con la carta del usuario
Una impresión que ninguna fuente registra, y que el usuario mostró con una foto de su carta, SHALL agregarse al Full con la fuente «Confirmada con tu carta» y la prueba como referencia. Esa fuente MUST ser distinta de la de las fotos propias, para que importar nunca las borre.

#### Scenario: Eevee de Burger King 2009 en español
- **WHEN** se importa Eevee
- **THEN** el Full tiene Majestic Dawn 62 · Reverse · Burger King 2009 (sello Platinum) · Español, respaldada por «Confirmada con tu carta»

#### Scenario: Las fotos propias siguen
- **WHEN** se importa Eevee y el usuario tenía fotos propias subidas en sus impresiones
- **THEN** esas fotos siguen en su lugar
