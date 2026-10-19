# Proposal

## Why

El usuario dijo "falta sun & moon trainer kit". Hay dos problemas:

- **El kit de Alolan Sandslash y Alolan Ninetales (2018) no está en ninguna parte.** TCGdex y pokemontcg.io no lo tienen. PokeCottage trae la Eevee de ese kit como `pc:tk11a` #26, sin enlace a ninguna carta del catálogo, así que no se puede cargar. Según Bulbapedia, ese kit no tiene números propios: cada carta es una reimpresión que conserva el número y el símbolo de su expansión, con un círculo de color y su número en el mazo. La Eevee es **Ultra Prism 104/156** con el círculo azul **26** del mazo Alolan Ninetales.
- **El buscador de expansiones no encuentra el otro kit escribiendo "sun & moon trainer kit".** Los dos kits de Lycanroc y Alolan Raichu sí están en el catálogo, pero se llaman "SM trainer Kit (…)" y el buscador pide la frase completa dentro del nombre.

## What Changes

- **El kit de Alolan Sandslash y Alolan Ninetales se muestra como los mazos de Battle Academy** (decisión del usuario): la carta original con el sello del mazo y su número.
  - La Eevee del kit es Ultra Prism #104 con el sello `tk-sm-alolan-ninetales-26`.
  - La vitrina y Cargar la llaman "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26".
  - La lista sale de la página del kit en Bulbapedia (solo local, como Battle Academy), con la fuente `bulbapedia-mazos` que ya existe.
  - La entrada `pc:tk11a` #26 de PokeCottage se convierte en esa impresión y deja de estar suelta.
  - El acabado sale de la nota de Bulbapedia ("Non Holofoil" o "Water Web Holofoil"). Así queda bien la promo de Alolan Ninetales, que viene en las dos versiones.
  - La impresión existe en los idiomas en que Bulbapedia dice que salió el kit: inglés, alemán, francés, italiano, español y portugués. Las que solo respalda Bulbapedia quedan "Por verificar".
- **En Cargar** se abre Ultra Prism, se elige la #104 y aparece la ficha "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26", como ya pasa con los mazos de Battle Academy.
- **El buscador de expansiones también encuentra por palabras.** Si no hay ninguna coincidencia mejor, muestra las expansiones que tienen todas las palabras de la búsqueda entre su nombre, su serie y su era. Así, "sun & moon trainer kit" encuentra los kits de Lycanroc y Alolan Raichu. Los resultados que ya existían no cambian de orden.

## Capabilities

### New Capabilities

### Modified Capabilities
- `universo-de-impresiones`: las cartas del Trainer Kit Sun & Moon de Alolan Sandslash y Alolan Ninetales.
- `carga-de-cartas`: la búsqueda de expansión por palabras.

## Impact

- `packages/core`: el sello y el nombre del mazo de un Trainer Kit; la conversión de las entradas de PokeCottage `pc:tk11*`; la búsqueda por palabras.
- `apps/arma/server/sources/battleAcademy.ts`: lee también la página del kit, con su acabado y sus idiomas.
- `apps/arma/server/importer.ts`: sin cambios de forma; las cartas del kit entran por el mismo paso.
- `apps/arma/server/inventory.ts`: Cargar e Inventario reciben el nombre de los sellos de mazo que el catálogo no nombra. Antes mostraban el nombre interno (`tksmalolanninetales26`), y lo mismo pasaba con los mazos de Battle Academy (`bacharizard26`).
- Sin migraciones: la fuente `bulbapedia-mazos` ya existe. Se actualiza su nota para que diga que también cubre el Trainer Kit.
- Los datos del usuario no cambian hasta que use "Volver a traer" en Eevee.
