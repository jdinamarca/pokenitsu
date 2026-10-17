# Proposal

## Why

Siguen sin foto 3.548 cartas japonesas del catálogo. Limitless TCG cubre unas 2.900, pero no tiene ninguna de 1997–2005 (Jungle, Rocket Gang, Leaders' Stadium, Neo, la era ex…). Por eso esas 542 Pokémon antiguas se ven con la foto de referencia de otro Eevee, Pikachu o el que sea.

PokeCottage autorizó sus fotos **solo para uso local**, y tiene un álbum completo por Pokémon con las japonesas. En una muestra de 45 Pokémon tenía 136 de 145 cartas japonesas sin foto (94%), incluidas **35 de 35 de 1997–2005**. Calculado sobre el total, son unas 2.480 de las 2.644 cartas Pokémon japonesas sin foto.

El usuario pide usarlas, con una condición: **el método para obtenerlas no debe saturar a PokeCottage de requests.**

## What Changes

**PokeCottage como segunda fuente de fotos solo locales del catálogo japonés:**
- Se lee el archivo de datos del álbum de cada Pokémon que tenga cartas japonesas sin foto (`pokecottagecdn.com/mastersets/data/{dex}-{nombre}.json`, unos 850).
- Cada entrada japonesa se cruza con la carta del catálogo por **expansión** (nombre en inglés, con alias para los pocos que no calzan) y **número**.
- Además, el **Pokédex** de la carta tiene que ser el del álbum.
- La foto se baja una sola vez a `data/imagenes-locales/pokecottage-fotos/` (nunca a `data/imagenes`). Se registra con la fuente `pokecottage-fotos`, que tiene permiso "solo local".
- Solo se pide la foto de cartas que **no tengan ya** foto del catálogo, propia, de su impresión del Full ni de Limitless. Así no se baja dos veces lo que ya se ve.

**Sin saturar a PokeCottage:**
- **una sola petición a la vez**, con pausa entre peticiones;
- el archivo de datos de cada Pokémon se **guarda 30 días**, así que una segunda pasada no lo vuelve a pedir;
- cada foto se baja una sola vez (`downloadOnce`);
- si responde 429 o 503, se **espera lo que pide** (`Retry-After`). Si falla varias veces seguidas, la descarga **se detiene sola** y se puede retomar después;
- **solo a mano:** desde el botón de la galería "Por reemplazar", nunca al abrir una expansión en Cargar;
- solo con `ARMA_FOTOS_LOCALES=1`.

**El botón "Bajar fotos locales del catálogo japonés"** hace dos pasos: primero Limitless por expansión (como hoy) y después PokeCottage por Pokémon, para lo que siga sin foto. El avance dice en qué paso va. Al terminar, las fotos nuevas aparecen en "Por reemplazar" con la fuente PokeCottage.

**Orden de las fotos de una carta:** se agrega a la spec el que ya rige desde el #75 (la foto de la impresión del Full de esa carta). Entre las fotos solo locales de una misma carta, la de su impresión del Full gana, después Limitless y al final PokeCottage.

**Fuera del alcance:**
- Entrenadores y Energías japonesas: los álbumes de PokeCottage son por Pokémon y no los traen (son unas 900 de las que faltan).
- Cartas no japonesas del catálogo.
- Bajar las fotos de PokeCottage al abrir una expansión en Cargar.
- Producción: estas fotos nunca salen del computador del usuario.
- Completar el Pokédex de las japonesas que no lo tienen (cambio aparte ya anotado). Sin Pokédex, una carta no se puede buscar en un álbum.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `fotos-del-catalogo-en-arma`: el orden de las fotos incluye la de la impresión del Full, y las fotos solo locales del catálogo japonés suman PokeCottage, con sus reglas para no saturarlo.
- `fotos-por-reemplazar`: "Bajar fotos locales del catálogo japonés" hace los dos pasos (Limitless y PokeCottage) y muestra el avance de cada uno.

## Impact

- **Código:**
  - `apps/arma/server/catalogPhotos.ts`: el paso de PokeCottage, la cola de a una, la pausa, el manejo de 429/`Retry-After` y la detención.
  - `apps/arma/server/sources/http.ts`: que `fetchJson` y `downloadOnce` informen 429/`Retry-After`.
  - `apps/arma/server/inventory.ts`: la prioridad entre fotos solo locales.
  - `src/Reemplazar.tsx`: el avance por paso.
  - README.
- **Datos:** nada nuevo en el esquema. Las filas nuevas de `arma.card_photos` usan la fuente `pokecottage-fotos`, que ya existe. No se tocan el inventario, `public.cards` ni `data/imagenes`.
- **Datos del usuario:** el inventario no cambia. Las fotos van a `data/imagenes-locales/`, que no se sube a ningún lado y se puede borrar entera.
- **Externo:** unas 850 peticiones de datos y unas 2.500 fotos a `pokecottagecdn.com`, de a una y con pausa, una sola vez. Tarda del orden de una hora.
