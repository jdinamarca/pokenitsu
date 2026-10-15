# Design

## Context

- "Arma tu colección" (`apps/arma`, PR #56) guarda cada dato con su fuente en `arma.facts`. Las fuentes viven en `arma.sources`, con `permission` (`ok`, `text_only`, `review`, `none`, `own`, validado por un CHECK) e `images` (si se pueden mostrar sus fotos).
- El front elige la foto con `pictureOf()` (`src/model.ts`): primero una copia propia (`/img/…`), después cualquier foto de una fuente con `images = true`, y si no hay, la de otra impresión del mismo diseño.
- `fetchJson()` (`server/sources/http.ts`) guarda las respuestas en `arma.source_cache` usando la URL como clave. El JSON de PokeCottage se guarda **sin** sus campos `*Url`, por la transformación `withoutPictures`.
- Formatos que revisamos el 15-10-2026:
  - **PokeCottage:** cada entrada trae `imageUrl` (`…__large.webp`), `originalImageUrl` (`….png`) y `thumbnailUrl`, por variante, en `pokecottagecdn.com/mastersets/images/cards/`.
  - **Limitless:** `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc/<SET>/<SET>_<NNN>_R_JP_<SM|LG>.png` (por ejemplo `SV2a_133_R_JP_SM.png`).
  - **Bulbagarden Archives:** `bulbapedia…/api.php?action=query&titles=Eevee_(Jungle_51)&prop=pageimages&piprop=original` devuelve `archives.bulbagarden.net/media/upload/…/EeveeJungle51.jpg`. Los títulos salen de `{{TCG ID|Set|Eevee|Num}}` en la lista de cartas que ya leemos.

## Goals / Non-Goals

**Goals:**
- Ver la ilustración correcta de casi todas las impresiones en local, sin perder de vista qué fotos no podrían salir a producción.
- Que, con el interruptor apagado, sea imposible que una foto "solo local" se muestre o se sirva.

**Non-Goals:**
- Producción, exportaciones o el informe de permisos (este cambio solo deja los datos listos para él).
- Elegir a mano entre fotos de distintas fuentes.

## Decisions

**1. Permiso `local` y tres fuentes nuevas (migración 002).** Se amplía el CHECK de `arma.sources.permission` con `local` y se siembran:
- `pokecottage-fotos` ("PokeCottage", con su sticker violeta);
- `limitless` ("Limitless TCG");
- `bulbagarden` ("Bulbagarden Archives").

Las tres llevan `permission = 'local'` e `images = true`. Son fuentes aparte del texto de PokeCottage (`pokecottage`, `text_only`), para que el permiso de cada dato sea exacto.
- *Alternativa descartada:* usar `none`. Diría "sin permiso", pero no "se puede usar en local"; el informe de producción necesita distinguirlos.

**2. Carpeta y servicio.**
- Los archivos van en `LOCAL_IMAGE_DIR` (por defecto `data/imagenes-locales/`, en `.gitignore`), bajo `<fuente>/<nombre derivado de la URL>`, con la extensión original.
- La API los sirve en `/img-local/*` con las mismas protecciones de ruta que `/img/*`, **solo** si `ARMA_FOTOS_LOCALES=1`; si no, 404.
- El dato `image` guarda la ruta local (`/img-local/pokecottage-fotos/…`) y en `ref` la URL de origen.
- *Alternativa descartada:* reutilizar `IMAGE_DIR`. Es el almacenamiento que el script de imágenes sube a producción, y mezclarlos rompería la barrera.

**3. Importador de fotos aparte:** `POST /api/local-photos/:dex`. Responde 403 si el interruptor está apagado. Corre después de la importación del Full y para cada fuente:
- **PokeCottage:** pide el mismo JSON con otra clave de caché (`…133-eevee.json#fotos`, guardando solo `id → imageUrl`). Así la caché sin fotos del importador de texto no cambia. Las entradas calzan con su impresión por el `ref` del dato `exists` de `pokecottage`, que guarda el id de la entrada.
- **Limitless:** solo para impresiones con `set_key` japonés (`ja-<CÓDIGO>`) sin foto con permiso. La URL sale del código y el número con 3 cifras; un 404 se anota y se sigue.
- **Bulbagarden:** toma los `TCG ID` de la lista de cartas, pide `pageimages` en lotes de 50 títulos y asigna cada escaneo a la impresión inglesa de esa expansión y número.
- **Para todas:** solo se descarga si el archivo no existe. Se usa `fetch` binario con el User-Agent de Nitsu, 2 a la vez por servidor y como máximo 8 MB por archivo. El resumen dice cuántas trajo, cuántas ya estaban y cuántas fallaron, por fuente.

**4. El Full sin el interruptor.** `/api/full` filtra en SQL los datos `image` de fuentes `local` cuando el interruptor está apagado, y entrega `localPhotos: true/false`. Así el front no necesita saber de la variable de entorno.

**5. Front.**
- `pictureOf()` pasa a devolver `{ src, local }`, con este orden: copia propia, TCGdex u otra con permiso, "solo local", y por último la del diseño.
- La carta muestra un punto violeta (`--local: #9b6ef3`) en la esquina inferior izquierda de la foto, con `aria-label` "Foto solo para uso local".
- La ficha reemplaza "Foto de otra impresión…" por "Foto solo para uso local · <fuente>".
- `STICKER` agrega `local: { label: 'Solo uso local', tone: 's-local' }` y la leyenda de arriba suma el violeta solo si `localPhotos`.
- `DESIGN.md` agrega el sticker violeta a su vocabulario: sigue siendo un sticker de permiso, así que la Regla del Sticker se mantiene.

## Risks / Trade-offs

- **[Las fuentes cambian sus URLs]** → El dato guarda la URL de origen en `ref`. Si cambia el formato, el importador falla en esa fuente y no toca lo ya descargado.
- **[Peso de la carpeta]** → Unas 500 fotos de Eevee (~100–300 KB cada una). La carpeta está fuera de git y se puede borrar entera sin efecto en la base: los datos apuntarían a archivos que ya no existen, y `/img-local` respondería 404. → El importador vuelve a descargar lo que falte.
- **[Un descuido sube estas fotos]** → Viven fuera de `IMAGE_DIR` y de git, y se marcan con su fuente en la base. El informe de producción las listará.
- **[Limitless no tiene todas las promos japonesas]** → Se intenta solo una vez por impresión al día (gracias a la caché de 404 en `source_cache`) y queda anotado en el resumen.
