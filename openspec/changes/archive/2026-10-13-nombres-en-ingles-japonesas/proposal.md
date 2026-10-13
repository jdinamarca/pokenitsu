# Proposal

## Why

Las 184 expansiones japonesas del catálogo (TCGdex) solo tienen su nombre en japonés, así que buscar "Rocket Gang", "VSTAR Universe" o "Leaders' Stadium" en Cargar no encuentra nada: hay que saber el código (`PMCG4`) o escribir en japonés (`ロケット団`). Los coleccionistas las conocen por su nombre en inglés.

## What Changes

- Cada expansión japonesa de TCGdex gana su nombre de coleccionista en inglés (169 de 184), tomado de las checklists de PokeCottage (cruzando su código con el de TCGdex, con una tabla de equivalencias donde difieren) y, para unas pocas que ninguna checklist trae, de una lista curada.
- La app muestra el nombre en inglés como nombre principal y el japonés al lado en la búsqueda y en la expansión activa; la búsqueda encuentra por cualquiera de los dos.
- Se corrigen dos nombres japoneses que TCGdex trae mal (`SV4a` aparece como レイジングサーフ y `CP5` como 冷酷の反逆者).

**Fuera del alcance:**
- Las 15 expansiones `CS*` que TCGdex lista como japonesas pero son chinas (todas llamadas トリプレットビート): quedan como están.
- Completar el catálogo con expansiones japonesas recientes o chinas que faltan.
- El nombre interno de la expansión no cambia (los precios buscan la expansión en TCGdex por ese nombre), ni el respaldo/exportación.
- Datos del usuario: no se tocan. La migración solo agrega una columna al catálogo; el inventario no cambia.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `catalogo`: las expansiones japonesas tienen nombre en inglés y se buscan por él.

## Impact

- Migración `024_set_name_en.sql` (columna `sets.name_en`).
- `apps/api/src/ja-sets.json` (nombres en inglés y correcciones), `catalog.js` (aplicarlos al sincronizar y al arrancar), `index.js` (`/api/sets` y las consultas que devuelven el nombre de la expansión al front).
- `apps/web/public/index.html`: búsqueda y muestra del nombre japonés.
- README.md.
