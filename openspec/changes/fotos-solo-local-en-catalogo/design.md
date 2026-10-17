# Design

## Context

- **Fotos solo locales hoy (`apps/arma/server/localPhotos.ts`):** solo para las impresiones del Full de un Pokémon (`POST /api/local-photos/:dex`).
  - Busca en PokeCottage, Limitless y Bulbagarden, baja cada archivo una sola vez con `downloadOnce` a `LOCAL_IMAGE_DIR` (`data/imagenes-locales/<fuente>/`) y lo registra como dato `image` de la impresión en `arma.facts`, con el permiso `local` de su fuente.
  - Se sirven en `/img-local/*` solo con `ARMA_FOTOS_LOCALES=1`.
  - Hoy hay 287 de PokeCottage, 23 de Limitless y 7 de Bulbagarden.
- **El error de Limitless:** `limitless()` arma `${set}_${n.padStart(3,'0')}`. Comprobado contra el CDN: `S8b_1`, `SV2a_1` y `SVP_1` existen; `S8b_001`, `SV2a_001` y `SVP_001`, no. Las promos usan otro código: `SV-P` es `SVP` y `M-P` es `MP`. La lista de Limitless incluye `BWP`, `XYP`, `SMP`, `SP`, `SVP` y `MP`.
- **Fotos del catálogo en arma (`inventory.ts`):** las cartas traen `image_small` (catálogo), `photos`/`own_img` (`variant_images`, la foto que la cuenta puso a una variante) y `ref` (referencia del mismo Pokémon). `CardPicture` elige entre ellas.
- **Fotos de las impresiones del Full:** las elige `pictureOf` en `src/model.ts`, con este orden: propia, nuestra copia (`/img/`), otra con permiso y, al final, la solo local. Tiene en cuenta qué variante muestra cada foto.
- **Administrador:** Nitsu considera dueño a la primera cuenta creada (`isOwner`). Arma no tiene ese concepto.
- **De dónde vienen las expectativas:** 3.547 japonesas sin foto en el catálogo, de las cuales Limitless cubre 2.906 (comprobado contra su lista de expansiones).

## Goals / Non-Goals

**Goals:**
- Ver las japonesas con foto en local sin que ninguna foto sin permiso pueda llegar a `data/imagenes`.
- Que reemplazar una foto sea un clic desde la galería, y que el avance se vea.

**Non-Goals:**
- Cambiar cómo Nitsu muestra sus fotos (su catálogo sigue igual).
- Un sistema general de permisos o roles: solo "la primera cuenta".

## Decisions

### 1. Una tabla para las fotos de las cartas del catálogo: `arma.card_photos`
`(card_id, source_id → arma.sources, src, ref, by_name, saved_at)`, con clave `(card_id, source_id)`. Guarda las fotos solo locales de Limitless de cartas del catálogo y las fotos propias (`source_id = 'own'`). Va en el esquema `arma` (migración `007`), así que no toca `public` ni el catálogo de Nitsu.

*Alternativas descartadas:*
- **Escribir en `public.card_images`/`cards.image_small`:** mezclaría fotos sin permiso con nuestra copia del catálogo, que sí se sube.
- **Reusar `arma.facts`:** es por impresión del Full, no por carta del catálogo.

### 2. Limitless: una sola función para el nombre del archivo
`limitlessFile(setKey, number)` devuelve `null` si la expansión no es japonesa o el número no es solo dígitos. Si no, devuelve `{code, n}`: el código con alias (`SV-P`→`SVP`, `M-P`→`MP`, `SM-P`→`SMP`, `S-P`→`SP`, `XY-P`→`XYP`, `BW-P`→`BWP`) y el número sin ceros. La usan el importador del Full (que así queda arreglado) y la descarga del catálogo. Va con pruebas.

### 3. Descarga por expansión, en segundo plano y deduplicada
`ensureLocalCardPhotos(setId)`:
- toma las cartas de la expansión sin `image_small` y sin fila en `arma.card_photos`;
- baja de a 2 archivos con `downloadOnce` (que no repite lo que ya está en disco), con una pausa de 250 ms;
- registra lo encontrado;
- guarda el resultado en un `Map` por expansión, para que dos pedidos de la misma expansión compartan la misma descarga.

`GET /api/sets/:id/cards` la llama **sin esperarla**, solo con el interruptor encendido y si la expansión es japonesa. La galería tiene `POST /api/local-photos/catalog`, solo para el administrador, que recorre las expansiones japonesas de a una y deja el avance en memoria, consultable con `GET`. Una carta que Limitless no tiene se recuerda en la misma pasada, pero no entre reinicios, así que un reintento vuelve a preguntar. Eso es aceptable, porque `downloadOnce` no repite lo que ya bajó.

### 4. Prioridad de fotos de una carta, en el servidor
Las respuestas de Cargar y de Mi inventario agregan dos campos:
- `own_card`: la foto propia de la carta;
- `local`: `{src, source}`, la foto solo local, solo si el interruptor está encendido.

`CardPicture` elige en el orden de la spec: foto de la variante de la cuenta, `own_card`, `img`, `local` (con la marca violeta) y `ref`. Así se reutiliza la marca `.local-mark` y la nota de la ficha que ya existen.

### 5. Administrador = primera cuenta, como en Nitsu
`isOwner(viewer)` en `session.ts`: `SELECT id FROM "user" ORDER BY "createdAt" LIMIT 1`. `/api/me` agrega `owner: boolean`, y el riel muestra "Por reemplazar" solo si es `true`. Todas las rutas del administrador usan `requireOwner`, que responde 403 si no lo es.

### 6. La galería se arma con dos fuentes de datos
- **Cartas del catálogo:** `GET /api/replace/cards` devuelve las cartas con foto solo local en uso, es decir, sin foto propia de la carta y sin `image_small`. Trae `card_id`, nombre, expansión, número, fuente y `src`, más los totales M y N de cartas.
- **Impresiones del Full:** el front usa el mismo `/api/full/133` que la vitrina y la misma `pictureOf`, y toma las impresiones cuya foto elegida es `local`. Así la galería decide igual que la vitrina, también para "qué variante muestra cada foto".

Las M y N de las impresiones se cuentan igual: impresiones con algún dato `image` de fuente local, y cuántas de ellas ya muestran una foto que no es local. "Subir la mía" usa `POST /api/photos/:code` (impresiones, la ruta de siempre, sin cambios) o `POST /api/card-photos/:cardId` (cartas, nueva). Al responder, el front saca el ítem de la galería y suma uno al avance.

*Alternativa descartada:* calcular todo en el servidor. Habría que duplicar `pictureOf` y la lógica de variantes, que viven en el front.

### 7. La foto propia de una carta va al almacenamiento propio
Se guarda en `IMAGE_DIR/arma/cartas/<card_id>.<ext>`, que ya sirve `/img/*`, con `?v=` para que el navegador no guarde la vieja, igual que las fotos propias de las impresiones. Quitarla borra el archivo y la fila.

## Risks / Trade-offs

- **[Una foto sin permiso termina en lo que se sube]** → Las fotos solo locales solo se escriben en `LOCAL_IMAGE_DIR`, y las propias solo en `IMAGE_DIR`. Habrá una prueba que compruebe que la descarga del catálogo nunca escribe fuera de `LOCAL_IMAGE_DIR`. La regla de siempre sigue: `/img-local` da 404 sin el interruptor.
- **[Cargar mucho el sitio de Limitless]** → Se baja una sola vez, de a 2 archivos con pausa, por expansión. La descarga completa (unas 2.900 fotos) la pide el administrador a mano, y se puede cortar y retomar.
- **[La galería del Full depende de `/api/full`]** → Muestra solo el Full de Eevee, el único importado. Cuando haya otros Pokémon, la galería sumará uno por uno.

## Migration Plan

- **Migración `007` del esquema `arma`:** actualiza la nota de `pokecottage-fotos` y crea `arma.card_photos`. Nada más cambia en la base.
- **Para volver atrás:** `DROP TABLE arma.card_photos` y se revierte el PR. Las fotos de `data/imagenes-locales/` se pueden borrar a mano.
