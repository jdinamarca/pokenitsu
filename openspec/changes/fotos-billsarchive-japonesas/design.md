# Design

## Context

- **`catalogPhotos.ts`:** `startCatalogPhotos({dex?})` corre dos pasos.
  - **`limitless`:** por expansión, con `ensureLocalCardPhotos`.
  - **`pokecottage`:** por Pokémon, con `pokecottageStep`. Usa una petición a la vez, pausas, `SourceBusy`/`Retry-After`, se detiene a las 3 fallas seguidas y guarda el avance en `CatalogJob`.
  - **Dónde quedan:** las fotos en `LOCAL_IMAGE_DIR/<fuente>/` y en `arma.card_photos (card_id, source_id, src, ref)`.
- **`photoOrder.ts`:** `localRank` ordena así: impresión del Full, después `limitless` y después `pokecottage-fotos`.
- **Bill's Archive (medido el 2026-10-17):**
  - Cada expansión japonesa tiene una página `https://billsarchive.com/<slug>-jp.html` (`rocket-gang-jp`, `split-earth-jp`…). Las demás aparecen enlazadas en la navegación de cada página: 19 en total.
  - Las imágenes están en `https://bills-archive.nyc3.cdn.digitaloceanspaces.com/tcgdex_cards_jp/<código>/<código>-<número>_<nombre>.webp`, con el código de TCGdex en minúsculas (`pmcg5`, `e4`, `neo2`) y el número sin ceros.
  - Comprobado: Leaders' Stadium trae 96 imágenes (el catálogo, 96) y Split Earth, 91 (el catálogo, 91). La imagen de prueba responde 200 `image/webp`.
  - No hay páginas de Holon Research Tower, Sun & Moon ni Start Deck 100.
  - Su `robots.txt` permite todo, y no publica términos de uso.
- **Las expansiones del catálogo:** las japonesas tienen id `ja-<código de TCGdex>` (`ja-PMCG5`, `ja-E4`, `ja-neo2`).

## Goals / Non-Goals

**Goals:**
- Darles foto local a los Entrenadores y Energías japoneses antiguos, y a las de Pokémon antiguas que todavía falten.
- El mismo cuidado con el sitio que con PokeCottage.

**Non-Goals:**
- Fotos para producción.
- Expansiones que Bill's Archive no tiene.

## Decisions

### 1. Encontrar la página de cada expansión
- **El índice:** se pide **una** página conocida (`/expansion-pack-jp.html`) y se leen de su navegación los enlaces `/<slug>-jp.html`. Eso da la lista de expansiones de Bill's Archive.
- **Su código:** para saber qué código tiene cada página, se pide la página solo cuando hace falta y se lee el código de la carpeta de sus imágenes (`tcgdex_cards_jp/<código>/`).
- **Primero, las que tocan:** el slug que se deduce del nombre en inglés de la expansión (`Rocket Gang` → `rocket-gang`) se prueba antes. Así, una expansión del catálogo con cartas sin foto pide su página y nada más.
- **Lo que se guarda:** la página leída se guarda en `arma.source_cache` 30 días, con solo `{ code, images: [{n, url}], count }`.

*Alternativa descartada:* pedir las 19 páginas de una vez. Serían peticiones de más para expansiones que ya están completas.

### 2. `sources/billsarchive.ts`
- **`billsPage(slug)`:** con `fetchJson`. Hace falta una variante `fetchText` que también guarde en caché, porque es HTML.
  - Lee `src="…tcgdex_cards_jp/<code>/<code>-<n>_…webp"` sin repetir, y devuelve `{ code, count, images }`.
  - Responde `null` con 404.
- **`matchBills(page, cards)`:**
  - **Expansión:** la del catálogo es `ja-<code>`, sin distinguir mayúsculas.
  - **Imágenes:** cada imagen va con la carta cuyo número sin ceros coincide.
  - **Control:** si `count` no es igual al número de cartas de la expansión en el catálogo, devuelve `{ mismatch: true }` y nada más.
  - Va con pruebas, sobre un HTML de muestra guardado en la prueba.
- **`LIMIT`:** 1 para `billsarchive.com` y para `bills-archive.nyc3.cdn.digitaloceanspaces.com`.

### 3. El paso `billsarchive` en `catalogPhotos.ts`
- **Qué toma:** las cartas japonesas que siguen sin foto (sin `image_small`, sin fila en `card_photos` y sin `PRINTED_PHOTOS`), agrupadas por expansión.
- **El recorrido:** por cada expansión, la página (`ask()` con las mismas reglas), después `matchBills` y después las fotos con `downloadOnce` a `billsarchive/<archivo>`.
- **El registro:** cada foto va a `card_photos` con `source_id = 'billsarchive'`.
- **Ritmo:** las mismas pausas que PokeCottage (1,5 s por página pedida y 0,75 s por foto pedida). El contador de fallas se comparte en todo el paso.
- **Reutilizar:** `pokecottageStep` se generaliza a un `politeStep(groups, fetchGroup, j, polite)` para no copiar `ask()`. El ritmo y las paradas no cambian, así que sus pruebas siguen sirviendo.
- **Con `dex` (pruebas):** se limita a las expansiones de las cartas de esos Pokémon.

### 4. La fuente
La migración `008` agrega `arma.sources ('billsarchive', 'Bill''s Archive', permission 'local', images true)` con la nota "Solo uso local: sin términos publicados ni permiso para producción". Si no existe, se inserta; si existe, no hace nada.

### 5. Avance
`CatalogJob` suma:
- `phase: 'billsarchive'`;
- `billsSets`, `billsDone` y `billsSkipped: string[]` (las que no calzan o no están);
- `bySource.billsarchive`.

La galería agrega su línea: "Bill's Archive: N de M expansiones · fotos nuevas · que no tiene".

## Risks / Trade-offs

- **[Bill's Archive cambia su HTML o sus nombres]** → El cruce falla de forma segura: sin imágenes, no se registra nada. El control de cantidad evita cruzar con una página que no corresponde.
- **[Sin permiso explícito]** → Solo uso local, con marca y en "Por reemplazar", igual que Limitless. Se puede pedir permiso por su página de contacto.
- **[Las cartas de Pokémon que Bill's Archive también tiene]** → Entran igual: el paso toma todo lo que siga sin foto, no solo Entrenadores.

## Migration Plan

- La migración `008` agrega una fila a `arma.sources` y se puede repetir sin efecto.
- Para volver atrás: `DELETE FROM arma.card_photos WHERE source_id = 'billsarchive'` y la fila de la fuente, y revertir el PR.
