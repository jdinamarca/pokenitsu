# Proposal

## Why

De las 4.435 cartas japonesas del catálogo, 3.547 no tienen foto (TCGdex no trae ninguna de esas expansiones), y en Cargar y Mi inventario se ven en blanco. Mientras el usuario consigue permisos, quiere ver esas cartas en su computador con fotos de fuentes que solo sirven para uso local. Cada una de esas fotos debe quedar marcada, para irlas reemplazando de a poco por fotos propias o de una fuente con permiso. Como administrador, necesita ver de un vistazo cuáles le faltan reemplazar.

## What Changes

**Las fotos de PokeCottage:** el usuario informa que PokeCottage autorizó sus fotos **solo para uso local, nunca producción**. Ya se bajan una sola vez a `data/imagenes-locales/`. Se corrige la nota de la fuente, que hoy dice que no autorizó sus fotos.

**Limitless TCG, también para el catálogo japonés** (solo uso local, sin permiso; cubre 2.906 de las 3.547):
- Las fotos de las cartas japonesas sin foto se bajan **por expansión**, una sola vez, a `data/imagenes-locales/limitless/`. Nunca van a `data/imagenes`.
- Se bajan sola al abrir en Cargar una expansión japonesa sin fotos, o todas de una vez desde la galería del administrador.
- **Se corrige el importador:** Limitless no usa ceros a la izquierda (`S8b_1`, no `S8b_001`); hoy arma rellena a 3 dígitos y solo encuentra las cartas desde el número 100. Además, las promos tienen otro código: `SV-P` es `SVP` y `M-P` es `MP`. Esto también arregla las fotos locales de Eevee.

**Prioridad de las fotos en Cargar y Mi inventario:**
1. tu foto de la variante;
2. la foto propia de la carta;
3. la foto del catálogo;
4. la foto solo local, con su marca violeta;
5. la foto de referencia del mismo Pokémon.

Sin `ARMA_FOTOS_LOCALES=1`, ninguna foto solo local se baja, se entrega ni se sirve.

**Foto propia de una carta del catálogo:** el administrador puede subir la suya (JPEG, PNG o WebP, hasta 8 MB). Se guarda en el almacenamiento propio (`data/imagenes/arma/cartas/`), así que sirve también para producción, y reemplaza a la foto solo local para todas las cuentas.

**Galería "Por reemplazar"**, solo para el administrador (la primera cuenta creada, como en Nitsu), en `/reemplazar`:
- muestra, como galería, cada foto **en uso** que no puede ir a producción (de fuentes "solo local": PokeCottage, Limitless y Bulbagarden), tanto de cartas del catálogo como de impresiones del Full de Eevee;
- cada una con su carta, su fuente y el botón **"Subir la mía"**, que la reemplaza ahí mismo;
- filtros por fuente y el avance "N de M listas para producción";
- el botón "Bajar fotos locales del catálogo japonés", con su avance.

**Fuera del alcance:**
- TCG Collector: lo bloquea Cloudflare, y no se va a esquivar.
- Las 641 japonesas antiguas (1997–2005) que Limitless no tiene: siguen con foto de referencia o con la tuya.
- Pasar fotos a producción, subirlas a un almacenamiento externo o cualquier despliegue.
- Fuentes nuevas con permiso. Cuando alguna lo dé, se agrega aparte.
- Completar el número de Pokédex de las japonesas (cambio aparte, ya anotado).
- Fotos solo locales para cartas no japonesas del catálogo.

**Datos del usuario:** el inventario no se toca. Las migraciones solo cambian el esquema `arma`: la nota de la fuente PokeCottage y una tabla nueva con las fotos de las cartas del catálogo (solo locales y propias). Las fotos propias se guardan en `data/imagenes/arma/cartas/`. Las solo locales, en `data/imagenes-locales/`, que no está en git ni se sube.

## Capabilities

### New Capabilities
- `fotos-del-catalogo-en-arma`: qué foto muestra arma para una carta del catálogo (orden de prioridad), las fotos solo locales de Limitless para las japonesas del catálogo, y la foto propia de una carta.
- `fotos-por-reemplazar`: la galería del administrador con las fotos en uso que no pueden ir a producción, su reemplazo por una foto propia y el avance.

### Modified Capabilities
- `universo-de-impresiones`: "Descarga local de las fotos" cambia en dos cosas. Limitless se busca por código y número sin ceros a la izquierda, con los alias de las promos. Y PokeCottage queda descrita como fuente de fotos autorizada solo para uso local.

## Impact

- **`apps/arma/server`:**
  - `localPhotos.ts`: número sin ceros, alias de promos y descarga por expansión del catálogo;
  - `inventory.ts`: prioridad de fotos en `/api/sets/:id/cards` y `/api/inventory`;
  - `session.ts`: quién es el administrador;
  - rutas nuevas: fotos del catálogo, galería y descarga del catálogo;
  - migración `007`: la nota de PokeCottage y la tabla `arma.card_photos`.
- **`apps/arma/src`:** la pantalla `Reemplazar` (galería), el enlace en el riel solo para el administrador, y `CardPicture`/`api.ts` con la marca violeta de solo local.
- **Documentación:** README (fotos solo locales y galería) y DESIGN.md (la galería).
- **Sin cambios en `public`, en Nitsu ni en `packages/*`.**
