## ADDED Requirements

### Requirement: Volver a traer el Full
El riel SHALL mostrar, bajo el nombre del Pokémon con su Full traído, cuándo se trajo por última vez y el botón "Volver a traer", que llama a la importación de siempre. Al terminar, SHALL recargar la vitrina y mostrar un resumen breve con el total de impresiones, las nuevas, las quitadas, las fotos solo locales traspasadas y las fuentes que fallaron.

#### Scenario: Volver a traer Eevee
- **WHEN** el usuario aprieta "Volver a traer" en el riel de Eevee y la importación agrega 5 impresiones, quita 4 y traspasa 4 fotos
- **THEN** el riel muestra "Full de Eevee actualizado: 1.114 impresiones · +5 nuevas · −4 quitadas" y "4 fotos locales traspasadas", la fecha pasa a la de ahora y la vitrina muestra las impresiones nuevas

#### Scenario: Mientras se trae
- **WHEN** la importación está corriendo
- **THEN** el botón dice "Trayendo…" y no se puede apretar de nuevo, y la vitrina sigue a la vista con lo de antes

#### Scenario: Una fuente que no responde
- **WHEN** Bulbapedia (mazos) falla durante la importación
- **THEN** el resumen dice "Bulbapedia (mazos) no respondió: quedó lo de la última vez"

#### Scenario: La importación falla entera
- **WHEN** la importación devuelve un error
- **THEN** el resumen muestra el error y la vitrina queda como estaba
