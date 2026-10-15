# Tasks

## 1. Datos y permisos

- [x] 1.1 Migración `002_fotos_solo_local.sql`: agregar `local` al CHECK de `arma.sources.permission` y sembrar `pokecottage-fotos`, `limitless` y `bulbagarden` (`local`, `images = true`); verificar en una copia de la base que se aplica, que reaplicar no hace nada y que `public` no cambia
- [x] 1.2 `.gitignore` con `data/imagenes-locales/` y la variable `LOCAL_IMAGE_DIR` (por defecto esa carpeta, nunca `IMAGE_DIR`); verificar con `git check-ignore` que un archivo de prueba ahí queda ignorado

## 2. Descarga (API)

- [x] 2.1 Descarga binaria en `http.ts` (User-Agent de Nitsu, 2 a la vez por servidor, máximo 8 MB, sin bajar lo que ya existe) y la clave de caché propia en `fetchJson`; verificar que una segunda descarga del mismo archivo no hace ningún pedido
- [x] 2.2 Importador de PokeCottage fotos (JSON con clave `#fotos`, cruce por el `ref` de la entrada); verificar en la copia que la Jungle #51 "1st Edition d Misprint" y una promo japonesa quedan con su foto local, y que la caché sin fotos del importador de texto sigue sin URLs
- [x] 2.3 Importador de Limitless (solo `ja-*` sin foto con permiso, número de 3 cifras, 404 anotado y se sigue); verificar con SV2a #133 y con un número que no existe
- [x] 2.4 Importador de Bulbagarden (TCG ID de la lista, `pageimages` en lotes de 50, asignado a la impresión inglesa); verificar con Jungle #51
- [x] 2.5 `POST /api/local-photos/:dex` (403 con el interruptor apagado, resumen por fuente), `/img-local/*` (404 apagado, sin rutas fuera de la carpeta) y `/api/full` (sin fotos `local` y con `localPhotos: false` cuando está apagado); verificar los tres casos con y sin `ARMA_FOTOS_LOCALES=1`

## 3. Front

- [x] 3.1 `pictureOf` con prioridad (con permiso → solo local → del diseño), la marca violeta en la carta, "Foto solo para uso local · fuente" en la ficha y el sticker violeta en la leyenda solo con `localPhotos`; verificar en Chrome sin interfaz con el interruptor encendido (una promo japonesa con foto de PokeCottage y marca violeta; una carta con copia propia sin marca) y apagado (igual que antes)
- [x] 3.2 Actualizar `apps/arma/DESIGN.md` (sticker violeta) y el README (fotos solo local, interruptor, carpeta, fuentes); verificar que el README dice que nunca salen de tu computador

## 4. Verificación integral

- [x] 4.1 Confirmar que la base real no cambió y que `IMAGE_DIR` no recibió ningún archivo nuevo, borrar la copia y las sesiones de prueba, y correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## Workflow follow-up

- Este cambio va en el PR del cambio `arma-tu-coleccion` o en uno nuevo contra `main` después de mergear el #56, nunca en un PR apilado
- Archivar `arma-tu-coleccion` antes que este cambio (agrega requisitos a sus capacidades)
