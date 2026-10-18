# Proposal

## Why

La vitrina principal de "Arma tu colección" se llama "Arma · Eevee" y solo muestra el Full de Eevee: el número 133 está fijo en `App.tsx` y en `Reemplazar.tsx`. El usuario quiere:

- que el enlace se llame **"Arma tu Master Set"**;
- agregar las **8 evoluciones de Eevee** (Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon y Sylveon) con los mismos criterios que Eevee: las mismas fuentes, la misma regla de carta distinta, las mismas reglas y vistas, la misma revisión de clasificación y la procedencia marcada en cada dato.

El importador y la API ya sirven para cualquier Pokémon (`/api/import/:dex`, `/api/full/:dex`, `/api/owned/:dex`). Lo que falta es poder elegirlo, y que lo demás deje de suponer que el Full es solo el de Eevee.

## What Changes

- **El enlace del riel** pasa de "Arma · Eevee" a **"Arma tu Master Set"**.
- **Abanico de la familia** arriba de la vitrina: los 9 retratos en una fila, con Eevee al centro y sus evoluciones a los lados, en orden de Pokédex (Vaporeon, Jolteon, Flareon y Espeon a la izquierda; Umbreon, Leafeon, Glaceon y Sylveon a la derecha). Cada retrato lleva el arte de tu mejor carta de ese Pokémon (o una suya en blanco y negro), su nombre y "tienes / total" con las reglas de la vista activa. El elegido se ilumina. Un Pokémon sin Full muestra "Sin traer".
- **Direcciones:** `/master-set/<pokémon>` (`/master-set/vaporeon`). `/` sigue abriendo Eevee, así que los enlaces de antes funcionan.
- **Un Full vacío** muestra "Traer el Full de Vaporeon", igual que Eevee. Las requests salen solo cuando el usuario lo pide.
- **Las reglas, las vistas guardadas, el orden, "Ver" y "Por verificar"** valen igual para cada Pokémon. Al cambiar de Pokémon, se mantienen la vista y las reglas elegidas.
- **El importador, con los mismos criterios para las 8:**
  - TCGdex en todos sus idiomas;
  - el catálogo (pokemontcg.io y TCGplayer);
  - PokeCottage (solo texto);
  - Bulbapedia ("<Pokémon> (TCG)" y los idiomas por expansión);
  - WikiDex;
  - las deducciones de idioma.

  Se ajusta lo que suponía Eevee: los nombres en francés se comparan sin acentos, en vez de llevar el alias fijo "Evoli".
- **Por reemplazar** muestra las fotos solo locales de las impresiones de todos los Full traídos, no solo de Eevee.
- **Revisión de clasificación:**
  - se importan las 8 en una copia de la base;
  - se corre la auditoría de cada una (`/api/audit/:dex`) y se corrige lo que sea un error claro del importador;
  - se entrega un informe por Pokémon con lo que queda "Por verificar", para revisarlo carta por carta en un cambio aparte, como los 97 de Eevee.
- **Familias en core** (`FAMILIES`): la familia Eevee queda definida en un solo lugar, con su orden de abanico. Agregar otra familia después es una línea.

**Fuera del alcance:**
- buscar o traer cualquier Pokémon fuera de la familia;
- revisar a mano cada impresión dudosa (queda en el informe);
- bajar las fotos solo locales de las evoluciones (se piden después, como las de Eevee);
- editar equivalencias.

## Capabilities

### New Capabilities
- `master-set-familia`: la vitrina "Arma tu Master Set" con el abanico de la familia, las direcciones por Pokémon, el avance de cada uno y el Full vacío con su botón.

### Modified Capabilities
- `universo-de-impresiones`: "Importar el Full desde las fuentes" deja de ser solo de Eevee y vale para cualquier Pokémon de la familia, con las mismas fuentes y la misma revisión.

## Impact

- **Datos:** sin migración. Las importaciones escriben solo en el esquema `arma` (`printings`, `facts`, `designs`, `imports`, `source_cache`), nunca en el inventario. En este cambio se importan solo en la copia `pokemon_fotos`; en la base real las trae el usuario con el botón. Al final se compara la huella de `inventory`, `inventory_log`, `locations` y `arma.printings` de la base real.
- **Fuentes:**
  - TCGdex: API abierta, de a 4, con cache de un día; cerca de mil requests por Pokémon (sus cartas en 13 idiomas).
  - Una página de PokeCottage, una de Bulbapedia y algunas de WikiDex por Pokémon, más las de idiomas que no estén en la cache.
  - La cache vive en cada base, así que la importación del usuario vuelve a pedirlas.
- **Código:**
  - `packages/core`: `FAMILIES`, el orden del abanico y el Pokémon de una dirección, con pruebas;
  - `apps/arma/server`: `GET /api/master-sets`, con cada Pokémon de la familia, sus impresiones mínimas (código, idioma, sello, equivalencia), los códigos que tienes y su retrato; nombres en francés sin acentos en `sources/tcgdex.ts`;
  - `apps/arma/src`: `App.tsx` toma el Pokémon de la dirección, el abanico va en un componente nuevo, `main.tsx` y `Shell` cambian el enlace, y `Reemplazar.tsx` recorre todos los Full.
- **Documentación:** README y `apps/arma/DESIGN.md`.
