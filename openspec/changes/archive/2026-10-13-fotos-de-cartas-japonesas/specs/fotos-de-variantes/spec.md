# Spec Delta

## ADDED Requirements

### Requirement: Fotos de PokeCottage para cartas japonesas
Cuando está habilitado (`POKECOTTAGE_IMAGES=on`), al elegir una expansión japonesa con cartas de Pokémon sin imagen el sistema SHALL buscar sus fotos en las checklists de PokeCottage de esas especies, cruzándolas por código de expansión y número, y guardar el link en el catálogo sin reemplazar imágenes existentes. Cada especie SHALL consultarse a lo más una vez cada 30 días. Deshabilitado, el sistema MUST NOT consultar PokeCottage para esto.

#### Scenario: Rocket Gang
- **WHEN** está habilitado y el usuario elige Rocket Gang, donde Ekans #001 no tiene imagen
- **THEN** Ekans #001 queda con la foto de PokeCottage y la app la muestra en vez de la imagen de referencia

#### Scenario: Deshabilitado
- **WHEN** `POKECOTTAGE_IMAGES` no es `on`
- **THEN** no se consulta PokeCottage y las cartas sin foto siguen con la imagen de referencia

#### Scenario: Especie ya consultada
- **WHEN** el usuario vuelve a elegir la misma expansión dentro de 30 días
- **THEN** no se vuelven a pedir las checklists de esas especies

### Requirement: Foto propia desde la vista previa y la cámara
Cuando la carta de la vista previa no tiene foto real, la vista previa SHALL ofrecer "Tomar o subir la foto de tu carta". En pantallas táctiles el diálogo de foto SHALL ofrecer tomarla con la cámara. Las fotos de más de 1200 px SHALL achicarse en el navegador antes de subirse.

#### Scenario: Foto con el celular
- **WHEN** en el celular el usuario toca "Tomar o subir la foto de tu carta" y luego "Tomar foto"
- **THEN** se abre la cámara y la foto queda guardada para esa carta y variante
