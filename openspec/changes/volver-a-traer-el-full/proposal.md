# Proposal

## Why

Después del #95, el usuario tiene que volver a traer los Full de Eevee, Flareon y Espeon para que tomen la forma nueva de los mazos. Pero "Traer el Full de X" solo aparece cuando el Full está vacío: no hay forma de actualizar uno que ya existe, salvo llamando a la API a mano. El usuario pidió un botón.

## What Changes

- **En el riel, bajo el nombre del Pokémon** ("Eevee · #133 · 1.114 impresiones en el Full"):
  - una línea con cuándo se trajo por última vez ("Traído el 18 oct, 10:42", de la última importación de `arma.imports`);
  - el botón **"Volver a traer"** (ícono ↻).

  Mientras se trae, el botón dice "Trayendo…", gira el ícono y no se puede volver a apretar. La vitrina sigue a la vista con lo de antes y se recarga al terminar.
- **Al terminar, un resumen breve** en el riel, que se cierra solo a los 10 segundos o con su ×:
  - "Full de Eevee actualizado: 1.114 impresiones · +5 nuevas · −4 quitadas";
  - si traspasó fotos solo locales: "4 fotos locales traspasadas";
  - si una fuente falló, cuál, y que quedó lo de la última vez ("Bulbapedia (mazos) no respondió: quedó lo de la última vez").

  Si la importación entera falla, el resumen dice el error y la vitrina queda como estaba.
- El botón está en cada Pokémon de la familia con su Full traído. Un Full vacío sigue mostrando "Traer el Full de X" en la vitrina, como hoy.

**Fuera del alcance:**
- traer varios Full de una vez;
- programar importaciones automáticas;
- mostrar el historial de importaciones.

## Capabilities

### New Capabilities

### Modified Capabilities
- `master-set-familia`: se agrega volver a traer el Full de un Pokémon que ya lo tiene, con el resumen de lo que cambió.

## Impact

- **Datos:** sin migración. El botón llama a la importación de siempre (`POST /api/import/:dex`), que escribe solo en el esquema `arma`, nunca en el inventario. La importación ya evita correr dos veces el mismo Pokémon a la vez.
- **Fuentes:** las mismas requests que "Traer el Full", unas 250 por Pokémon, casi todas a TCGdex y con cache. Solo salen cuando el usuario aprieta el botón.
- **Código:**
  - `apps/arma/src/components/Rail.tsx`: la fecha, el botón y el resumen;
  - `App.tsx`: pasa la última importación y la acción al riel;
  - `api.ts`: el tipo completo del resumen de la importación (`added`, `removed`, `carried`, `sources`);
  - estilos en `styles.css`.

  La API no cambia: `/api/full/:dex` ya devuelve `lastImport` y `POST /api/import/:dex` ya devuelve el resumen.
- **Documentación:** README.
