# Proposal

## Why

A la colección Eevee le faltan cartas que sí existen en fuentes abiertas. Hay dos causas, que encontramos al revisar TCGdex:

- **Expansiones japonesas vacías.** TCGdex en japonés tiene Eevee Heroes (S6a), Pokémon GO (S10b), 仰天のボルテッカー (S4) y Time Gazer (S10D) sin ninguna carta. Sus traducciones en chino tradicional, en cambio, tienen la lista completa con los mismos números. Por ejemplo, Eevee S6a #058, S10b #054 y Radiant Eevee S10b #055.
- **Expansiones exclusivas de Asia.** Hay expansiones que no existen en Japón: las chinas SET A/B, Partner, Challenge y Strong, el Starter Deck 100 y las tailandesas e indonesias SV3s, SV6s y SV7s. Mezclan cartas y las numeran de nuevo, así que son cartas distintas.

El usuario quiere contar **solo las cartas distintas**, con una regla simple: **si solo cambia el idioma, va la carta japonesa; si cambia la expansión o el número, va la carta asiática**. Una traducción es la misma carta en otro idioma, igual que la Eevee de Prismatic Evolutions es la misma en EE. UU., Europa y Latinoamérica. Lo comprobamos: en 26 de 26 cartas con el mismo código y número en japonés, chino, tailandés e indonesio, el ilustrador coincide.

PokeCottage no autorizó usar sus datos, así que todo sale de TCGdex (datos abiertos) y PokéAPI.

## What Changes

- **Idiomas nuevos:** tailandés (TH) e indonesio (ID), para cargar copias en esos idiomas. El chino tradicional usa el ZH que ya existe.
- **Traducciones = carta japonesa.** Una carta china, tailandesa o indonesia con el mismo código de expansión y número que una japonesa es esa carta japonesa. Se carga como la japonesa con el idioma de la copia, y en la colección cuenta una sola vez, en cualquier idioma, como ya pasa con las japonesas.
- **Expansiones japonesas vacías en TCGdex:** se completan con la lista de su traducción del mismo código (chino tradicional, tailandés o indonesio). El nombre de la carta queda en japonés cuando se puede deducir (イーブイV a partir de 伊布V); si no, en el idioma de la traducción. No se usa la foto de la traducción, que mostraría texto en chino o tailandés en una carta japonesa.
- **Expansiones exclusivas de Asia:** se agregan como expansiones propias, con sus fotos. Sus cartas cuentan aparte aunque reimpriman una ilustración japonesa (por ejemplo, la indonesia SV3s #141 repite el arte de la SV3 #091), porque cambia la expansión y el número. Un mismo código en varios idiomas es una sola expansión; por ejemplo, SV7s tailandesa e indonesia. Las promos asiáticas (como SV-P en chino) no se mezclan con las japonesas, porque su numeración es distinta.
- **Número de Pokédex:** TCGdex no lo trae en estos idiomas, así que se deduce del nombre de la especie (nombres en chino y en inglés de PokéAPI). En tailandés, de la carta del mismo código y número en indonesio o japonés. Si no se puede deducir, la carta queda en el catálogo pero no entra en colecciones automáticas.
- **Colecciones:** "🇯🇵 Buscar japonesas" pasa a **"🌏 Buscar cartas de Asia"**. Busca las japonesas como ahora y además las de Asia de ese Pokémon. La vista "Por región" suma la sección "🌏 Otras de Asia" para las expansiones tailandesas e indonesias.

**Fuera del alcance:**
- Chino simplificado: TCGdex tiene una sola expansión, y los demás sitios (SimplifiedTCG, PikaQian, pokemontcgapi.com) requieren revisar sus términos primero.
- Coreano: TCGdex no tiene cartas de Eevee en coreano.
- Cualquier dato o foto de PokeCottage.
- Descargar todas las expansiones asiáticas de una vez: se buscan por Pokémon, desde una colección.
- No se mueven ni se cambian copias del inventario del usuario. Las copias ya cargadas siguen donde están.
- No hay fotos nuevas: se usan las de TCGdex cuando existen (pocas en chino); el resto queda para las fotos aportadas.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `catalogo`: expansiones exclusivas de Asia como fuente nueva, expansiones japonesas vacías completadas con su traducción, y el número de Pokédex deducido del nombre.
- `colecciones`: las traducciones cuentan como la carta japonesa; "Buscar cartas de Asia" reemplaza a "Buscar japonesas"; nueva sección "Otras de Asia".
- `carga-de-cartas`: idiomas tailandés e indonesio.

## Impact

- `packages/core/src/entry.ts`: `LANGS` y `langCode` (TH, ID), con pruebas.
- `apps/api/src/catalog.js`: búsqueda de cartas de Asia por Pokémon (TCGdex zh-tw/th/id + PokéAPI), relleno de expansiones japonesas vacías y expansiones `asia-*`.
- `apps/api/src/index.js`: la ruta de "buscar japonesas" de una colección.
- Una migración SQL, si hace falta, para la fuente `tcgdex-asia`.
- `apps/web/public/index.html`: nombres de idioma, el botón de la colección, la sección por región y la regla de ubicación por origen.
- `README.md`.
- Servicios externos nuevos: PokéAPI (solo nombres de especies, con User-Agent de Nitsu).
