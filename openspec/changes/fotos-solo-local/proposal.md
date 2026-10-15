# Proposal

## Why

En "Arma tu colección" muchas impresiones se ven sin foto o con la de otra impresión del mismo diseño: promos japonesas, chinas simplificadas, mazos de Battle Academy, trainer kits y variantes con sello. Las fuentes con permiso de imagen (nuestras copias de pokemontcg.io y TCGdex) no las tienen. El usuario quiere ver las ilustraciones correctas mientras trabaja **en local**. Las fuentes que sí las tienen no dieron permiso de imagen: PokeCottage autorizó solo su texto, Limitless TCG no ha dado permiso y Bulbagarden Archives tiene una licencia por revisar. El usuario decidió usarlas **solo en su computador**, marcadas como tales, para saber qué falta antes de producción.

## What Changes

- **Nuevo permiso "solo local"** para fuentes de fotos, con su propio sticker violeta y la leyenda "Foto solo para uso local". Es distinto de "sin permiso": dice para qué se puede usar.
- **Tres fuentes de fotos solo local:**
  - **PokeCottage:** la foto de cada entrada de su master set, por variante.
  - **Limitless TCG:** cartas japonesas, con su patrón de URL por expansión y número.
  - **Bulbagarden Archives:** el escaneo de cada carta de la lista de Bulbapedia.
- **Copia local una vez:** las fotos se descargan una sola vez a una carpeta propia, fuera de git y separada de nuestras copias (`data/imagenes-locales/`), y las sirve la API de la app. Nunca se enlazan directo a su sitio.
- **Apagadas por defecto:** solo funcionan con `ARMA_FOTOS_LOCALES=1` en `.env`. Sin el interruptor, la API no las descarga, no las entrega y no las sirve; la app se ve como hoy.
- **Prioridad:** primero las fotos con permiso (copias propias y TCGdex). Una foto "solo local" se usa solo cuando la impresión no tiene otra.
- **Visibles como tales:** la ficha muestra la fuente de la foto con el sticker violeta, y la carta en la vitrina lleva una marca violeta discreta.
- **Barrera para producción:** las fotos "solo local" nunca se copian al almacenamiento compartido (`IMAGE_DIR`) ni a nada que se suba, y quedan registradas como datos con su fuente, para que el futuro informe "Listo para producción" las liste.

**Fuera del alcance:**
- Usarlas en producción o en la app actual (`apps/web`).
- Otras fuentes de fotos (tiendas, TCGplayer, Cardmarket).
- El informe "Listo para producción": se hará en su propio cambio, que ya podrá contar estas fotos.
- Editar o reemplazar fotos a mano.
- Convertir o redimensionar las fotos: se guardan tal como vienen.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

Las dos capacidades de "Arma tu colección" (cambio `arma-tu-coleccion`, aún no archivado; este cambio se archiva después):
- `universo-de-impresiones`: el permiso "solo local", las tres fuentes de fotos, la descarga local y el interruptor.
- `armado-de-coleccion`: cómo la Vitrina y la ficha eligen y marcan una foto "solo local".

## Impact

- `apps/arma/server`:
  - Migración 002, con el permiso `local` y las fuentes nuevas.
  - Un importador de fotos (`POST /api/local-photos/:dex`).
  - La ruta `/img-local/*`, servida solo con el interruptor.
  - `fetchJson` con una clave de caché propia, para pedir el JSON de PokeCottage con sus URLs sin mezclarlo con la caché sin fotos.
  - `/api/full`, que oculta las fotos "solo local" sin el interruptor.
- `apps/arma/src`: la prioridad de fotos, el sticker violeta y la marca en la vitrina.
- `.gitignore`: `data/imagenes-locales/`.
- `README.md` y `apps/arma/DESIGN.md`, por el sticker violeta.
- Servicios externos: el CDN de PokeCottage, el CDN de Limitless y la API de Bulbapedia/Archives, consultados con calma, con el User-Agent de Nitsu y una sola vez por foto.
