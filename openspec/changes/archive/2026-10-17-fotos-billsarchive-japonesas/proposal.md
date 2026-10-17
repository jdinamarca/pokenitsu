# Proposal

## Why

Después de Limitless y PokeCottage, siguen sin foto unas 170 cartas japonesas del catálogo: 116 Entrenadores, 18 Energías y unas 38 de Pokémon.
- **Entrenadores y Energías:** PokeCottage organiza sus álbumes por Pokémon, así que no los tiene. Limitless no tiene las expansiones de 1997 a 2005.
- **Dónde están:** casi todas en Leaders' Stadium (30), The Town on No Map (18), Split Earth (12), Rocket Gang (12), Golden Sky, Silvery Ocean (10) y Holon Research Tower (11), más algunas de Neo y Jungle. Un ejemplo es la Poké Ball #048 de Jungle.

Se revisaron otras fuentes:

| Fuente | ¿Tiene esas cartas? | ¿Se puede usar? |
|---|---|---|
| Dittobase | Sí, todas | **No.** Sus términos (sección 12) prohíben bajar en forma automática sin permiso escrito (support@dittobase.com) |
| Pokellector | Sí, todas | **No.** Sus términos prohíben "retrieving images" en forma automática sin permiso escrito |
| TCGdex | Tiene los datos | **No sirve:** no tiene esas imágenes |
| **Bill's Archive** (billsarchive.com) | Sí, con Entrenadores y Energías: Expansion Pack, Jungle, Fossils, Rocket Gang, Leaders' Stadium, Challenge from the Darkness, las Neo, las e-Card y las ADV/PCG | **Sí, solo uso local.** No publica términos de uso y su `robots.txt` permite todo, imágenes incluidas. No hay permiso para producción |

Por eso, Bill's Archive entra igual que Limitless: **solo uso local**, marcada y en la galería "Por reemplazar".

## What Changes

**Bill's Archive, tercera fuente solo local del catálogo japonés**, para lo que sigue sin foto después de Limitless y PokeCottage:
- **Una página por expansión.** Bill's Archive tiene una página por expansión japonesa (`/rocket-gang-jp.html`) que trae las imágenes de todas sus cartas. Cada imagen se llama con el código y el número de TCGdex, los mismos del catálogo (`tcgdex_cards_jp/e4/e4-10_yanma.webp` es Split Earth #010).
- **Solo se pide lo que falta:** la página de las expansiones que tienen cartas sin ninguna foto. Se guarda 30 días.
- **Cada foto, una sola vez,** a `data/imagenes-locales/billsarchive/`, registrada con la fuente nueva `billsarchive` y el permiso "solo local".
- **El mismo cuidado que con PokeCottage:**
  - una petición a la vez a su sitio y a su almacenamiento de imágenes, con pausa;
  - `Retry-After` ante 429/503;
  - se detiene solo con 3 fallas seguidas;
  - **solo a mano**, desde "Por reemplazar", nunca al abrir Cargar.
- **Cruce:** la expansión y el número de la imagen tienen que existir en el catálogo. Antes de usar una página se comprueba que su cantidad de cartas calce con la del catálogo. Si no calza, esa expansión se salta y se anota en el avance.
- **"Bajar fotos locales del catálogo japonés"** pasa a tener tres pasos: Limitless, PokeCottage y Bill's Archive.
- **Orden entre fotos solo locales:** la impresión del Full, después Limitless, después PokeCottage y al final Bill's Archive.

**Fuera del alcance:**
- **Holon Research Tower:** Bill's Archive no la tiene.
- **Sun & Moon y Start Deck 100:** unas 35 cartas, sobre todo números que Limitless no usa. Quedan para "Subir la mía".
- **Producción:** estas fotos nunca salen del computador.
- **Pedir permiso a Dittobase o Pokellector:** lo puede hacer el usuario. Si alguno lo da, se agrega aparte.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `fotos-del-catalogo-en-arma`: las fotos solo locales del catálogo japonés suman Bill's Archive, y el orden entre fotos solo locales la incluye.
- `fotos-por-reemplazar`: la descarga del catálogo japonés va en tres pasos.

## Impact

- **Código:**
  - migración `008` del esquema `arma`: la fuente `billsarchive` (Bill's Archive, permiso `local`, con su nota);
  - `apps/arma/server/sources/billsarchive.ts`: la página de una expansión y el cruce, con pruebas;
  - `catalogPhotos.ts`: el paso de Bill's Archive;
  - `http.ts`: `LIMIT` de 1 para sus dos hosts;
  - `photoOrder.ts`: el orden;
  - `Reemplazar.tsx`: el avance;
  - README.
- **Datos:** una fila nueva en `arma.sources` y las filas de `arma.card_photos` de esa fuente. El inventario no se toca.
- **Externo:** unas 15 páginas y unas 150 fotos de Bill's Archive, de a una y con pausa, una sola vez.
