# Proposal

## Why

La Pokédex por región es parte de la columna vertebral: el usuario quiere saber no solo si completó Kanto, sino **con qué** la completó (solo challa, challa holo, ex, IR, SIR…), en qué idioma, y poder usar la misma vista para su colección personal y para armar kits de venta. Hoy la pestaña solo cuenta copias para vender, con un filtro de variante muy básico.

## What Changes

- Filtro **Copias**: todas, para vender (como hoy) o personales.
- Cada copia se clasifica en un **nivel**: challa, challa holo, con mecánica, variante especial, variocolor, full art, IR, SIR o secreta. La definición está en `docs/producto/mapa-de-funcionalidades.md`.
- Filtro **Niveles que cuentan** (multi-selección), con atajos: "Solo challa", "Challa + holo", "Solo IR y SIR", "Todo".
- **Mejor carta por especie**: cada casilla muestra la copia de mayor nivel entre las que cuentan, con una insignia del nivel.
- **Resumen por nivel** de la región: "120 challa · 20 holo · 8 con mecánica · 3 IR" (contando la mejor carta de cada especie).
- Más filtros: **idioma** (ya existe), **serie** (ej. solo Scarlet & Violet), **origen** (internacional o japonesa…), **estado mínimo** (ej. solo NM) y **cartas con varios Pokémon** (contar los TAG TEAM para cada especie o no).
- La variante pasa a ser parte de los niveles: se elimina el filtro "Todas las variantes / Solo holo + reverse / Solo normal".
- Se mantiene el conteo de **kits completos posibles** y "especies que faltan para el siguiente kit", ahora según los filtros.

**Fuera del alcance:** regiones o Pokédex personalizadas, formas regionales como especies separadas (un Vulpix de Alola sigue contando como #037) y compartir la Pokédex con otras personas.

**Datos del usuario:** no se modifican; es una vista calculada sobre el inventario.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `kits-pokedex`: el conteo por región admite elegir qué copias cuentan; se agregan niveles de carta, mejor carta por especie, resumen por nivel y filtros de serie, origen, estado y cartas con varios Pokémon; se reemplaza el filtro de variante.

## Impact

- **Front:** pestaña Pokédex (`renderKits`, `dexCounts`, `renderDexDetail`).
- **packages/core:** nueva función de nivel de carta, con pruebas (depende de `monorepo-typescript-y-pruebas-del-nucleo`).
- **API:** sin cambios.
- Las preferencias de filtro se guardan por dispositivo, como las demás.
