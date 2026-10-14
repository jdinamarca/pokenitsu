# Proposal

## Why

El usuario no quiere desplegar hasta resolver las imágenes. Al revisarlas apareció algo más urgente: **pokemontcg.io está obsoleto**. Su documentación dice *"Existing API keys will continue to function through March 1, 2027. Please migrate your application to Scrydex"*. De ahí vienen 19.814 imágenes del catálogo, enlazadas a `images.pokemontcg.io` y sin garantía de que sigan vivas.

Con una copia propia, la app deja de depender de otros sitios para mostrar una carta. Esa copia queda en una carpeta local mientras no haya producción y después se sube a un storage.

## What Changes

- **`pnpm imagenes:descargar`** (`apps/api/src/imagenes.js`):
  - baja la imagen grande de cada carta del catálogo una sola vez y genera dos WebP (245 px para listas, 600 px para la vista previa) en `IMAGE_DIR` (`data/imagenes/`, ignorada por git);
  - avanza de a pocas cartas a la vez, con pausa entre cada una, identificándose como Nitsu, y se puede cortar y retomar;
  - opciones `--set`, `--limite` y `--reintentar`.
- **Fuentes permitidas:**
  - `images.pokemontcg.io` (internacionales);
  - `assets.tcgdex.net` (japonesas). TCGdex solo responde a identificadores con el formato `Mozilla/5.0 (compatible; …)`, que es el estándar de los bots que se identifican.
  - Las internacionales cuya imagen venía de **Scrydex** se toman de TCGdex: los términos de Scrydex no permiten replicarlo (*mirror*) ni usarlo como *wholesale data source*.
  - **Nunca PokeCottage.**
- **Registro `card_images`** (migración `031`): por carta y tamaño guarda el estado (ok, sin foto, omitida, error), el archivo, el link original, el peso, las dimensiones, el sha256 y cuándo se subió al storage.
- **La carta apunta a su copia** (`/img/cards/…-small.webp`).
  - Las sincronizaciones del catálogo ya no la pisan.
  - El front deriva la grande de la chica (`bigImg`).
- **`GET /img/…`**: sirve el archivo de `IMAGE_DIR` con una semana de caché. Si no está, redirige al storage (`IMAGE_BASE_URL`, en producción) o, mientras tanto, al link original. No se rompe nada si faltan archivos.
- **`pnpm imagenes:estado`**: cuántas cartas están copiadas, sin foto, omitidas o con error, cuánto pesan y por qué faltan.

**Fuera del alcance:**
- La subida al storage (`imagenes:subir`): se hace al elegir Supabase Storage o R2, porque necesita sus credenciales para probarse. El registro ya guarda `uploaded_at` para eso.
- Migrar el catálogo y los precios fuera de pokemontcg.io (antes de marzo de 2027).
- Las fotos propias aportadas por usuarios.

## Capabilities

### New Capabilities
- `imagenes`: copia propia de las imágenes del catálogo y cómo se sirven.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- Nuevos: `apps/api/src/imagenes.js`, `apps/api/src/imagenes-cli.js`, migración `031_card_images.sql`.
- `apps/api/src/index.js` (ruta `/img/`), `apps/api/src/catalog.js` (no pisar copias), `apps/web/public/index.html` (`bigImg`).
- Dependencia `sharp`; scripts `imagenes:descargar` e `imagenes:estado`; `.gitignore` (`/data/`); README.
