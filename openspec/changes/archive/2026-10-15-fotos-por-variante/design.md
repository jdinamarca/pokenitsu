# Design

## Context

- Las fotos son datos `image` en `arma.facts` (`printing_code`, `field`, `source_id`, `value`, `ref`); una misma URL suele repetirse en varias impresiones.
- `pictureOf()` (`apps/arma/src/model.ts`) elige primero la copia propia (`/img/`), luego otra con permiso y luego la solo local. No sabe nada de variantes.
- Variantes: `stamp` (`1st Edition`, `First Edition d Misprint`, sellos de producto…) y `finish`. La "misma carta" es la que comparte `set_key`, `number` y `lang`.
- Lo que revisamos de cada fuente (15-10-2026):
  - **Foto única de la 1st Edition:** pokemontcg.io, TCGdex y PokeCottage en las 4 cartas WotC de Eevee con 1st Edition.
  - **Bulbapedia, unlimited:** Jungle #51 y Neo Discovery #38.
  - **Bulbapedia, 1st Edition:** Team Rocket #55 y Gym Challenge #51.
  - **pkmncards:** la 1st Edition.
  - **PriceCharting:** responde 403.

## Goals / Non-Goals

**Goals:** que ninguna impresión muestre como propia la foto de otra variante, que sea fácil corregirlo y que se pueda completar con fotos propias.

**Non-Goals:** visión artificial para detectar sellos; fuentes nuevas.

## Decisions

**1. `arma.photo_marks` (migración 003):** `src text PRIMARY KEY` (el valor de la foto, por ejemplo `/img/cards/base5/base5-55-large.webp`), `shows text NOT NULL` (el sello que muestra, o `''` para la variante sin sello), `marked_by text`, `marked_at timestamptz`. Es por foto, no por impresión: una URL compartida se marca una sola vez. La fuente de la marca es `own` (dato propio).
- *Alternativa descartada:* un dato `image_shows` por impresión. Duplicaría la marca en cada impresión que comparte la foto.

**2. Regla automática en `packages/core`:** `photoShows(src, holders, marks)`.
- Si hay marca, devuelve la marca.
- Si `holders` (las impresiones de la misma carta que tienen esa foto) incluye una con `stamp = '1st Edition'` y una sin sello, devuelve `'1st Edition'`.
- Si no, devuelve el `stamp` de la impresión.

Se prueba con Vitest y se usa en el front. El servidor la reutiliza para el importador de fotos locales.

**3. Elegir la foto** (`pictureOf(p, ctx)`):
- Los candidatos que calzan (`photoShows == p.stamp ?? ''`) se ordenan así: subida propia (`source = own`), copia propia `/img/`, otra con permiso y solo local.
- Si ninguno calza, se usa la foto de una variante hermana, con `{ other: '<variante>' }`.
- `Picture` suma `other?: string`.
- La vitrina atenúa (`.ref`) cuando hay `other`, y la ficha muestra "Foto de \<variante\> · falta esta variante".
- Para la 1st Edition, la foto compartida calza, así que la 1st Edition se sigue viendo bien.

**4. Marcar desde la ficha:**
- Bajo la foto, "Esta foto muestra:" con un selector de las variantes de la misma carta (sin sello, 1st Edition, …) y "Automático".
- Llama a `POST /api/photo-marks { src, shows }` o a `DELETE` para volver a "Automático".
- Lo puede hacer cualquier cuenta con sesión: es una app local con un solo dueño. Queda registrado `marked_by`.

**5. Subir tu foto:**
- `POST /api/photos/:code` con el cuerpo binario (`content-type: image/jpeg|png|webp`, hasta 8 MB, parser propio de Fastify para `image/*`).
- Se guarda en `IMAGE_DIR/arma/<código seguro>.<ext>`, se escribe el dato `(code, 'image', 'own', '/img/arma/…', 'Subida por <nombre>')` y se devuelve la foto.
- `DELETE /api/photos/:code` borra el archivo y el dato.
- Va en `IMAGE_DIR` y no en la carpeta local: es nuestra y podría ir a producción.

**6. Importador de fotos locales:** el objetivo pasa de "impresiones sin foto con permiso" a "impresiones sin foto con permiso **que calce con su variante**", usando `photoShows`. Bulbagarden asigna el escaneo a la impresión sin sello. Si ese escaneo resulta ser de la 1st Edition (Team Rocket, Gym Challenge), el usuario lo marca y queda como "falta esta variante".

## Risks / Trade-offs

- **[La regla automática supone 1st Edition]** → Es cierto en las 4 cartas revisadas. Si una foto compartida resulta ser la unlimited, una marca a mano lo corrige.
- **[Fotos subidas grandes]** → Hay un límite de 8 MB y se aceptan solo JPEG, PNG y WebP. No se redimensionan (fuera de alcance).
- **[Una marca afecta a todas las impresiones con esa foto]** → Es lo buscado: la foto muestra lo mismo para todas.
