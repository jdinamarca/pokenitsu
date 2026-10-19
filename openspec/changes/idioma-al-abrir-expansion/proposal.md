# Proposal

## Why

El usuario abrió SWSH Black Star Promos, eligió la SWSH190, cargó "Holo cosmos" y la carta no apareció marcada en "Arma tu Master Set". La copia se guardó en **japonés**:

- Antes había cargado una expansión japonesa (Pokémon GO S10b), así que el idioma de Cargar quedó en japonés.
- Las expansiones internacionales no tienen un idioma propio en el catálogo. Por eso, al abrirlas, Cargar mantiene el idioma anterior: arriba dice "SWSH Black Star Promos · Japonés". Lo mismo pasa al abrirlas desde "Expansiones recientes", que guarda el idioma con el que se abrieron.
- Cargar no avisa que la SWSH190 no salió en japonés. Ofrece "Holo" y "Cosmos Holo" igual, y la copia queda en una impresión que no existe.

Así quedaron en japonés dos copias de su base: SWSH190 Cosmos Holo y SWSH230 (Radiant Eevee) Holo.

## What Changes

- **Al abrir una expansión internacional con un idioma asiático activo** (japonés, chino, coreano, tailandés o indonesio), Cargar vuelve al **último idioma occidental** que usó el usuario, o al inglés si no hay ninguno (decisión del usuario). Esto vale al abrirla desde la búsqueda, desde "Expansiones recientes" y cuando Cargar reabre la última al entrar.
  - Si el usuario busca con el idioma escrito (`SWSHP JA`), se respeta lo que escribió.
  - Cargar recuerda el último idioma occidental en el navegador, junto con los demás ajustes.
- **Aviso de idioma:** si la carta marcada tiene impresiones en el Full pero ninguna en el idioma activo, la ficha y la vista previa dicen "Esta carta no salió en japonés. Salió en: EN, ES, PT, FR, DE, IT". No bloquea la carga, porque el Full puede estar incompleto.
- Las copias que ya quedaron en japonés las corrige el usuario: no se tocan sus datos.

## Capabilities

### New Capabilities

### Modified Capabilities
- `carga-de-cartas`: el idioma al abrir una expansión internacional y el aviso de un idioma en que la carta no salió.

## Impact

- `apps/arma/src/Cargar.tsx` (`chooseSet`, `setSession`, la ficha y la vista previa), `apps/arma/src/load.ts` (`Session` y funciones puras con sus pruebas), y `SetPicker.tsx` si hace falta distinguir el idioma escrito.
- No cambian la base ni la API.
