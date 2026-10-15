# Spec Delta

## ADDED Requirements

### Requirement: Permiso "solo local"
Las fuentes SHALL poder tener el permiso "solo local": sus datos se pueden usar en el computador del usuario y MUST NOT salir de él. Una foto de una fuente "solo local" SHALL guardarse como dato de la impresión con su fuente, igual que cualquier otro dato.

#### Scenario: Foto de PokeCottage registrada
- **WHEN** se trae la foto de PokeCottage de la Eevee de Jungle #51 1st Edition con el error de la "d"
- **THEN** la impresión tiene un dato "foto" con la fuente PokeCottage (`pokecottage-fotos`) y el permiso "solo local"

### Requirement: Fotos solo local, apagadas por defecto
Las fotos "solo local" SHALL funcionar únicamente con el interruptor `ARMA_FOTOS_LOCALES=1`. Sin él, el sistema MUST NOT descargarlas, MUST NOT entregarlas en el Full y MUST NOT servir sus archivos.

#### Scenario: Interruptor apagado
- **WHEN** la app corre sin `ARMA_FOTOS_LOCALES=1` y alguien pide el Full o el archivo de una foto local
- **THEN** el Full no trae ninguna foto "solo local" y el archivo responde 404

### Requirement: Descarga local de las fotos
Con el interruptor encendido, el sistema SHALL traer las fotos de:
- PokeCottage: la foto de cada entrada de su master set, por variante;
- Limitless TCG: las cartas de expansiones japonesas, por código de expansión y número;
- Bulbagarden Archives: el escaneo de cada carta de la lista de Bulbapedia.

Cada foto SHALL descargarse una sola vez a una carpeta local fuera de git y fuera del almacenamiento de fotos compartido. Las fotos SHALL servirse desde esa carpeta, MUST NOT enlazarse directo al sitio de la fuente y MUST NOT copiarse a `IMAGE_DIR` ni a nada que se suba. Una foto que la fuente no tiene, o que falla, MUST NOT detener el resto.

#### Scenario: Segunda descarga
- **WHEN** se piden las fotos locales de Eevee dos veces seguidas
- **THEN** la segunda vez no se descarga ningún archivo que ya esté en la carpeta

#### Scenario: Foto que Limitless no tiene
- **WHEN** Limitless responde 404 para una carta japonesa
- **THEN** esa impresión queda sin foto de Limitless y las demás descargas siguen
