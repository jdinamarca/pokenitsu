# Design

## Context

Las checklists de PokeCottage están en `https://pokecottagecdn.com/mastersets/data/<dex>-<slug>.json` (`23-ekans`, `122-mr-mime`, `29-nidoran-female`, `83-farfetchd`); traen todas las cartas de esa especie, incluidas las japonesas (`region: Japan`, `set.id: jpn_b04`, `cardNumber`, `imageUrl`, `thumbnailUrl`). `pokecottage.js` ya traduce códigos de PokeCottage a TCGdex (`jaCode`). Las cartas japonesas tienen `dex` (número de Pokédex) aunque su nombre esté en japonés.

## Decisions

### 1. Por especie, no por expansión
Una checklist cubre todas las expansiones japonesas de esa especie: al pedirla se llenan todas sus cartas sin foto de una vez (un `UPDATE … FROM unnest(...)`), y la tabla `pokecottage_checks (dex, checked_at)` evita repetirla por 30 días. Para Rocket Gang son ~45 especies la primera vez; después casi nada.

### 2. Nombre del archivo
`<dex>-<slug>` con el nombre en inglés de la especie (el mismo que `/api/dex`): minúsculas, sin tildes ni `'` `.` `:`, `♀`/`♂` → `female`/`male`, lo demás → `-`. Un 404 se registra como consultado.

### 3. Código de expansión
`jaCode()` más las equivalencias conocidas donde PokeCottage y TCGdex difieren (`xy1x` → `XY1a`, `l1hg` → `L1a`, `sm0p` → `SM0`…; las mismas usadas para los nombres en inglés), comparando sin mayúsculas. Número con `norm()`.

### 4. Solo el link, y solo si está habilitado
Se guarda `imageUrl`/`thumbnailUrl` en `cards.image_large`/`image_small` (solo donde es `NULL`), como ya hace la importación de checklists; no se descargan archivos. `POKECOTTAGE_IMAGES=on` en `.env` lo habilita; sin eso el endpoint responde `{ enabled: false }` sin red.

### 5. Front
Al elegir una expansión japonesa con cartas sin foto, `POST /api/sets/:id/photos` en segundo plano; si llenó algo, vuelve a pedir las cartas de la expansión (sin forzar TCGdex), repinta y avisa "📷 N fotos de PokeCottage". La vista previa sin foto real muestra un botón destacado al diálogo de foto; en pantallas táctiles el diálogo agrega "📸 Tomar foto" (`capture="environment"`). Antes de subir, las imágenes de más de 1200 px se achican con `createImageBitmap` + `canvas` a JPEG.

## Risks / Trade-offs

- [Uso más allá de lo personal] → apagado por defecto; documentado en README que la alfa necesita permiso de PokeCottage.
- [Cambio de formato en PokeCottage] → las cartas siguen con imagen de referencia; nada se rompe.
- [Carga a PokeCottage] → de a 3 pedidos a la vez, una vez por especie cada 30 días.

## Migration Plan

Migración 025 crea la tabla. Agregar `POKECOTTAGE_IMAGES=on` al `.env` local. Rollback: revertir; los links guardados se pueden borrar con `UPDATE cards SET image_small = NULL, image_large = NULL WHERE image_small LIKE 'https://pokecottagecdn.com/%' AND set_id LIKE 'ja-%'`.
