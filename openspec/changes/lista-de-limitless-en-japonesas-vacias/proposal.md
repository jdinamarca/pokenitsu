## Why

Las cartas japonesas del catálogo vienen de TCGdex. TCGdex registra algunas expansiones sin ninguna carta: por ejemplo S10D (Time Gazer) y S10b (Pokémon GO). En la base hay 132 expansiones japonesas sin cartas. Algunas solo nunca se abrieron; otras TCGdex las respondió vacías. En una expansión vacía, Cargar no deja cargar nada. El usuario tiene la S10D 052 (Eevee) y no puede cargarla. Limitless TCG tiene la lista completa (S10D: 88 cartas), pero no dio permiso: sirve solo para uso local.

## What Changes

- Cuando TCGdex responde una expansión japonesa sin cartas, el servidor lee la lista de Limitless (`/cards/jp/<código>?display=list`) y agrega sus cartas al catálogo. Esto pasa solo en modo local (`ARMA_FOTOS_LOCALES=1`). Cada carta trae su número, su nombre japonés, su tipo y su rareza. El Pokédex se deduce del nombre.
- Cada carta agregada queda marcada con su fuente (`cards.list_source = 'limitless'`), para reemplazarla más adelante por una fuente con permiso. Su id es el mismo que le daría TCGdex (`ja-S10D-052`), así una lista posterior de TCGdex no la duplica.
- En la ficha de Cargar, esas cartas muestran "Dato de Limitless · solo uso local".
- La descarga de fotos de Por reemplazar recorre primero todas las expansiones japonesas vacías, una tras otra. A las que nunca se abrieron les pide la lista a TCGdex, y si viene vacía, a Limitless. Muestra el avance y después baja las fotos como a las demás.
- Las impresiones del Full de esas expansiones se enlazan con las cartas nuevas, así el Master Set las cuenta.
- Cada lista se pide una sola vez y se guarda un día en `arma.source_cache`, con el mismo cliente HTTP que respeta 429 y `Retry-After`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detalles-del-catalogo-en-arma`: lista de Limitless para las expansiones japonesas que TCGdex trae sin cartas.

## Impact

- `apps/arma/server/jaLists.ts` (nuevo), `inventory.ts`, `catalogPhotos.ts`, migración `013_lista_de_limitless.sql` (columna `public.cards.list_source`).
- `apps/arma/src/Cargar.tsx`, `Reemplazar.tsx`, `api.ts`, `styles.css`.
- Producción no cambia: sin `ARMA_FOTOS_LOCALES=1` no se pide nada a Limitless.
