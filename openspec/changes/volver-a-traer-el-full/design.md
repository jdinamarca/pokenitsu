# Design

## Context

- `runImport` en `App.tsx` ya importa y recarga (`refresh()` y `loadFamily()`). Hoy solo lo usa el Full vacío.
- `/api/full/:dex` ya trae `lastImport` (`summary` y `started_at`).
- La importación devuelve un `ImportSummary` con `printings`, `added`, `removed`, `carried` y `sources[id].ok/error`.
- El nombre visible de cada fuente está en `arma.sources.name`, que la vitrina ya recibe como `sources`.

## Goals / Non-Goals

**Goals:** volver a traer un Full desde el riel, y ver qué cambió.

**Non-Goals:** importar en lote, historial, importaciones automáticas.

## Decisions

1. **El estado vive en `App.tsx`.** `runImport` guarda el resumen. Con un error, ya no reemplaza la vitrina por la pantalla de error: guarda el mensaje en el resumen. El Full vacío sigue mostrando el error donde está hoy.
2. **El riel recibe `lastImport`, `importing`, `result`, `onImport` y `onDismiss`.** La fecha se escribe con `toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })`.
3. **El resumen se cierra solo a los 10 segundos y con ×.** Usa `role="status"` y el estilo `notice` que ya usa Cargar. Un error no se cierra solo.
4. **Al cambiar de Pokémon** se borra el resumen, para que no aparezca el de otro.

## Risks / Trade-offs

- **Una importación tarda entre 20 segundos y un minuto.** El botón queda deshabilitado y el ícono gira. Si el usuario cambia de Pokémon mientras tanto, la importación sigue en el servidor, y al terminar se recarga la vitrina del Pokémon que esté a la vista.
