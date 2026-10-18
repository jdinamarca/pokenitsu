# Design

## Context

- **Arma:**
  - `App.tsx` es la vitrina del Full, con `DEX = 133` y `SPECIES = 'Eevee'` fijos;
  - carga `api.full(DEX)`, `api.owned(DEX)` y `api.views()`, aplica las reglas con `applyRules` y calcula el avance con `ownership`;
  - el Full vacío muestra "Traer el Full de Eevee" y llama a `api.importDex(DEX)`;
  - `Reemplazar.tsx` también fija `DEX = 133` para las impresiones del Full.
- **Servidor:** genérico por número de Pokédex. `importDex(dex)` arma el Full con todas las fuentes, y `/api/full/:dex` trae las impresiones con sus datos y la auditoría (`auditPrintings`, con los motivos de "Por verificar"). `/api/owned/:dex` cruza el inventario con las impresiones dentro de la RLS, y `/api/audit/:dex` devuelve la revisión.
- **Fuentes que suponen Eevee:** en `sources/tcgdex.ts`, los nombres en francés llevan el alias fijo `'Evoli'`, porque PokéAPI da "Évoli". Las demás se arman desde el nombre en inglés (`speciesNames(dex)`): PokeCottage (`<dex>-<nombre>.json`), Bulbapedia ("<Nombre> (TCG)") y WikiDex.
- **Base real (2026-10-18):** solo el Full de Eevee (1.113 impresiones, 318 diseños, 13.351 datos).

## Goals / Non-Goals

**Goals:**
- Una sola vitrina para los 9 Pokémon, con los mismos criterios.
- Cambiar de Pokémon sin perder la vista ni las reglas.
- El avance de cada retrato con las reglas activas, igual que el contador principal.

**Non-Goals:**
- Otras familias o la búsqueda de cualquier Pokémon (el código queda listo).
- Revisar a mano cada impresión dudosa.

## Decisions

1. **`FAMILIES` en `packages/core/src/family.ts`:** `[{ id: 'eevee', name: 'Familia Eevee', base: 133, members: [134, 135, 136, 196, 133, 197, 470, 471, 700] }]`, en el orden del abanico, con Eevee al centro. La lista se completa con:
   - un slug por miembro (`eevee`, `vaporeon`…), que sale de una tabla fija con sus nombres en inglés (la misma de PokéAPI);
   - `memberFromPath(path)`: `/` o `/master-set` da 133, `/master-set/espeon` da 196 y un slug desconocido da `null`;
   - `pathOf(dex)`.

   Con pruebas.

2. **`GET /api/master-sets`**, con `requireViewer`. Por cada miembro de la familia devuelve:
   - `dex`, `name` y `ja`;
   - `printings`: `[{code, lang, stamp, equiv_id}]`, desde `arma.printings`;
   - `have`: los códigos con copias de la cuenta, con `ownedCopies` (RLS);
   - `pic`: el retrato (`pictures()` de `gallery.ts`, con la carta tuya más reciente de la especie o la representativa).

   El front aplica `applyRules` y `ownership` a cada uno con las reglas activas, así cada retrato dice lo mismo que diría la vitrina de ese Pokémon. Son unas pocas miles de filas pequeñas en una sola consulta por tabla. *Alternativa:* pedir el Full completo de los 9, varios MB, descartada. *Otra:* contar en el servidor sin reglas; descartada, porque el retrato no coincidiría con el contador principal.

3. **`App.tsx` toma el Pokémon de la dirección** (`useHref` y `memberFromPath`). Al cambiar de Pokémon, recarga `full`, `owned` y el retrato elegido; las reglas, la vista, el orden y "Ver" se mantienen; la impresión elegida se suelta. El Full vacío ofrece "Traer el Full de <Nombre>". Un slug desconocido muestra un aviso con enlace a Eevee.

4. **El abanico** (`components/FamilyFan.tsx`) es una fila de 9 retratos de 92px, en ventanitas como las de la Pokédex y con el arte recortado. El elegido va un poco más grande, con un filete `--light` y su nombre en cartulina. Debajo de cada uno, el nombre y "tienes / total" en Archivo Narrow. Un Pokémon sin Full se ve apagado y dice "Sin traer".
   - En el teléfono la fila se desliza hacia el lado, con el elegido centrado.
   - Al cambiar, el retrato elegido se agranda con `--ease-out`. Con "reducir movimiento", nada se mueve.
   - Es `role="tablist"` y cada retrato es un enlace con `aria-current`.

5. **El riel** sigue mostrando el nombre y el número del Pokémon elegido. Shell marca "Arma tu Master Set" en `/` y en `/master-set/*`.

6. **Nombres en francés:** `isSpecies` compara sin acentos ni mayúsculas (`normalize('NFKD')` sin diacríticos), y se quita el alias fijo `'Evoli'`. Una prueba confirma que Eevee sigue trayendo lo mismo: la misma cantidad de impresiones en la copia antes y después.

7. **`Reemplazar.tsx`** pide `/api/master-sets` y luego el Full de cada miembro que tiene impresiones, y junta sus impresiones con foto solo local.

8. **Verificación en la copia:**
   - importar las 8 evoluciones y reimportar Eevee, comparando su conteo con el de antes;
   - correr `/api/audit/:dex` para cada una;
   - corregir en el importador lo que sea un error claro, por ejemplo un nombre que no calza;
   - escribir el informe `openspec/changes/master-set-familia-eevee/informe-auditoria.md`, con cada Pokémon, sus impresiones, sus diseños, lo que quedó "Por verificar" y sus motivos más comunes.

## Risks / Trade-offs

- **[Muchas requests a TCGdex]** Cerca de mil por Pokémon. Es una API abierta y ya se consulta de a 4 con cache; además, el usuario importa uno por uno, cuando quiere.
- **[Una especie con cartas de varios Pokémon]** Un TAG TEAM como "Espeon & Deoxys-GX" entra en el Full de Espeon, igual que hoy pasa con Eevee. Así lo dice la regla del importador.
- **[La auditoría marca muchas impresiones]** Es lo esperado: queda en el informe para un cambio aparte, y la vitrina las muestra con "Por verificar".
- **[Cambiar `isSpecies` altera Eevee]** Se compara el conteo de Eevee en la copia antes y después de reimportar.
