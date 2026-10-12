# respaldo-y-exportacion Specification

## Purpose
Que el usuario pueda sacar sus datos y volver a cargarlos.

## Requirements

### Requirement: Respaldo JSON
El sistema SHALL descargar un respaldo JSON con inventario (incluida la ubicación por nombre), copias personales, grupos de artes conectados y ubicaciones con sus reglas.

#### Scenario: Descargar respaldo
- **WHEN** el usuario toca Respaldo
- **THEN** se descarga `respaldo-inventario-pokemon-<fecha>.json`

### Requirement: Exportar CSV
El sistema SHALL exportar un CSV separado por `;` con expansión, número, variante, idioma, estado, ubicación, cantidad, personales, nombre, Pokédex, ilustrador, rareza, tipo, precio unitario y total en CLP y fuente del precio.

#### Scenario: Carta con precio propio
- **WHEN** una fila tiene precio propio en USD
- **THEN** el CSV la valoriza al tipo de cambio del día con fuente "propio"

### Requirement: Importar
El sistema SHALL importar un respaldo JSON o un CSV (columnas mínimas `set_id` y `numero`; acepta nombres en español o inglés y `,` o `;`), sumando al inventario actual o reemplazándolo según elija el usuario. Las ubicaciones se cruzan por nombre y se crean si faltan; las filas inválidas se omiten y se informan.

#### Scenario: Reemplazar
- **WHEN** el usuario importa eligiendo reemplazar
- **THEN** el inventario y su historial se borran y quedan solo las filas del archivo, en una sola transacción
