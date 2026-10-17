# Tasks

## 1. Base

- [ ] 1.1 Migración `007` del esquema `arma`: la nota de `pokecottage-fotos` pasa a "Solo uso local: PokeCottage autorizó sus fotos solo para uso local, nunca producción", y se crea la tabla `arma.card_photos (card_id, source_id → arma.sources, src, ref, by_name, saved_at)` con clave `(card_id, source_id)`. Verificar en una copia de la base que la migración corre y que una segunda vez no hace nada.
- [ ] 1.2 `limitlessFile(setKey, number)`: alias de promos y número sin ceros a la izquierda; `null` para las expansiones no japonesas o los números con letras. El importador del Full pasa a usarla. Pruebas para `SV2a 133 → SV2a_133`, `S8b 001 → S8b_1`, `SV-P 001 → SVP_1`, `M-P 012 → MP_12` y `TG05 → null`. Verificar con `pnpm --filter @pokenitsu/arma test`.
- [ ] 1.3 `isOwner` / `requireOwner` en `session.ts` (la primera cuenta creada), y `/api/me` con `owner`. Verificar con `curl` en la copia de la base: el dueño recibe `owner: true` y una segunda cuenta, `false`.

## 2. Fotos del catálogo

- [ ] 2.1 `ensureLocalCardPhotos(setId)`:
  - solo con el interruptor encendido y para expansiones japonesas;
  - toma las cartas sin `image_small` ni fila en `arma.card_photos`;
  - las baja de a 2, con pausa, con `downloadOnce` a `LOCAL_IMAGE_DIR/limitless/`;
  - registra lo encontrado, y deduplica por expansión.

  `GET /api/sets/:id/cards` la lanza sin esperarla. Verificar en la copia de la base, con una expansión japonesa sin fotos:
  - la primera respuesta no espera;
  - al volver a pedirla, las cartas traen `local`;
  - una segunda pasada no baja nada nuevo;
  - ningún archivo queda fuera de `LOCAL_IMAGE_DIR`.
- [ ] 2.2 `GET /api/sets/:id/cards` y `GET /api/inventory` entregan `own_card` y `local`, este último solo con el interruptor encendido. `CardPicture` aplica el orden: foto de la variante de la cuenta, `own_card`, `img`, `local` (con la marca violeta y la nota en la ficha) y `ref`. Verificar que, sin el interruptor, no llega ningún `local` y `/img-local/…` da 404.
- [ ] 2.3 Foto propia de una carta: `POST /api/card-photos/:cardId` y `DELETE` (solo el administrador; JPEG, PNG o WebP hasta 8 MB) a `IMAGE_DIR/arma/cartas/` + `arma.card_photos` con fuente `own`. Verificar con `curl`: el administrador sube y quita; otra cuenta recibe 403.

## 3. Galería "Por reemplazar"

- [ ] 3.1 API:
  - `GET /api/replace/cards`: las cartas del catálogo con foto solo local en uso, y M y N de cartas;
  - `POST /api/local-photos/catalog` y `GET` del avance: todas las expansiones japonesas, una por una, sin dos descargas a la vez.

  Todo solo para el administrador. Verificar con `curl` en la copia de la base: 403 para otra cuenta y avance coherente.
- [ ] 3.2 Pantalla `/reemplazar`:
  - enlace en el riel solo para el administrador, y aviso para otra cuenta;
  - galería con carta, fuente y "Subir la mía", con cartas del catálogo e impresiones del Full (usando `pictureOf`);
  - filtros por fuente y por tipo, con sus cantidades;
  - avance "N de M listas para producción";
  - "Bajar fotos locales del catálogo japonés" con su avance, y el aviso si el interruptor está apagado.

  Verificar typecheck y lint.
- [ ] 3.3 En Chrome sin interfaz, contra una copia de la base, con el interruptor encendido:
  - abrir en Cargar una expansión japonesa sin fotos y volver a abrirla con fotos de Limitless y la marca violeta;
  - la galería muestra esas cartas y las de PokeCottage de Eevee;
  - "Subir la mía" en una carta y en una impresión: salen de la galería, el avance sube y Cargar o la vitrina muestran la foto propia;
  - otra cuenta no ve el enlace;
  - con el interruptor apagado no aparece ninguna foto solo local;
  - sin errores de JS.

  Comprobar que `data/imagenes` solo recibió las fotos propias de la prueba (borrarlas al terminar) y que la base real no cambió.

## 4. Documentación y cierre

- [ ] 4.1 README:
  - fotos solo locales del catálogo (Limitless por expansión, la regla de nombres);
  - PokeCottage con fotos solo para uso local;
  - la galería "Por reemplazar" y el orden de las fotos.

  DESIGN.md de arma: la galería. Verificar leyendo ambas secciones.
- [ ] 4.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- PR contra `main`; merge solo a pedido, y después archivar este cambio.
- Cuando quieras, bajar todas las fotos del catálogo japonés desde la galería en tu base real (es local y no toca tu inventario).
