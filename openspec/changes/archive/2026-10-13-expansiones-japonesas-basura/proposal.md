# Proposal

## Why

TCGdex lista 184 expansiones japonesas, pero 20 son basura: las 15 `CS*` vienen sin cartas, sin fecha y todas llamadas トリプレットビート, y `SM1+`, `sm2+`, `SM3+`, `SM4+` y `SM5+` son copias vacías de `SM1p`…`SM5p` (que sí tienen las cartas). Aparecían en la búsqueda de expansión: buscar "GX Battle Boost" daba dos resultados y uno no servía.

## What Changes

- `apps/api/src/ja-sets.json` gana una lista `hidden` con esas 20; la sincronización con TCGdex no las crea y al arrancar se borran las existentes que no tengan cartas.
- Los nombres en inglés de los duplicados se quitan (quedan en sus versiones con cartas): las 164 expansiones japonesas reales tienen nombre en inglés.
- Se aclara que el cruce `sm1+` → `SM1p` de las checklists de PokeCottage es correcto (apunta a la versión con cartas).

**Fuera del alcance:** las otras 48 expansiones japonesas reales que TCGdex trae sin lista de cartas (se pueden cargar sin verificar; varias tienen su versión de PokeCottage). Datos del usuario: no se tocan; las 20 entradas no tienen cartas ni nada que dependa de ellas (verificado).

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `catalogo`: entradas basura de TCGdex ocultas.

## Impact

- `apps/api/src/ja-sets.json`, `apps/api/src/catalog.js` (`syncJaSets`, `applyJaNames`); README.
