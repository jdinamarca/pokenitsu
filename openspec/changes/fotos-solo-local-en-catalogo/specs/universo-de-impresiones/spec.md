## MODIFIED Requirements

### Requirement: Descarga local de las fotos
Con el interruptor encendido, el sistema SHALL traer las fotos de:
- PokeCottage: la foto de cada entrada de su master set, por variante. PokeCottage autorizó sus fotos solo para uso local, nunca producción, y la fuente SHALL describirlo así;
- Limitless TCG: las cartas de expansiones japonesas, por código de expansión y número. El número SHALL ir sin ceros a la izquierda (`S8b_1`), y las promos con el código de Limitless (`SV-P` → `SVP`, `M-P` → `MP`);
- Bulbagarden Archives: el escaneo de cada carta de la lista de Bulbapedia.

Cada foto SHALL descargarse una sola vez a una carpeta local fuera de git y fuera del almacenamiento de fotos compartido. Las fotos SHALL servirse desde esa carpeta, MUST NOT enlazarse directo al sitio de la fuente y MUST NOT copiarse a `IMAGE_DIR` ni a nada que se suba. Una foto que la fuente no tiene, o que falla, MUST NOT detener el resto.

#### Scenario: Segunda descarga
- **WHEN** se piden las fotos locales de Eevee dos veces seguidas
- **THEN** la segunda vez no se descarga ningún archivo que ya esté en la carpeta

#### Scenario: Foto que Limitless no tiene
- **WHEN** Limitless responde que no tiene una carta japonesa
- **THEN** esa impresión queda sin foto de Limitless y las demás descargas siguen

#### Scenario: Número con ceros
- **WHEN** se busca en Limitless la Eevee japonesa SV2a #133 y la carta S8b #001
- **THEN** se piden `SV2a_133` y `S8b_1`

#### Scenario: Promo
- **WHEN** se busca en Limitless la promo japonesa `ja-SV-P` #001
- **THEN** se pide `SVP_1`
