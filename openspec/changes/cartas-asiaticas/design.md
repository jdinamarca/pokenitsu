# Design

## Context

- `syncJaDex(dex)` en `apps/api/src/catalog.js` busca en TCGdex japonés `cards?dexId=eq:<dex>` y guarda cada carta con `upsertJaCard` en `ja-<código>-<número>`. Lo llama la ruta de "🇯🇵 Buscar japonesas" de una colección (`apps/api/src/index.js:786`).
- Las colecciones cuentan las cartas del catálogo que tienen el número de Pokédex de la colección. En las expansiones con `lang` (`set_lang` en el front), una copia en cualquier idioma cuenta para la carta (`countLang`, `index.html:4304`). Así que una copia `ZH` de `ja-SV8a-125` ya cuenta como esa carta: no hay que cambiar cómo se cuenta.
- Al elegir una expansión con `lang` en Cargar, el idioma pasa al de la expansión (`index.html:3000`). El usuario lo cambia escribiendo un código de idioma.
- Datos de TCGdex que revisamos el 15-10-2026:
  - zh-tw tiene 98 expansiones, th e id tienen pocas. Ninguna carta trae `dexId`.
  - Las búsquedas `?name=` son por coincidencia parcial: 伊布 también devuelve 葉伊布 (Leafeon).
  - En japonés, S4, S6a, S10b y S10D existen pero con 0 cartas.
- PokéAPI (`pokemon-species/<dex>`) da el nombre de la especie en `zh-hant`, `ja-hrkt` y `en`, no en tailandés. Exige User-Agent.

## Goals / Non-Goals

**Goals:**
- Que una búsqueda por Pokémon traiga del catálogo todo lo distinto que TCGdex tiene en Asia, sin duplicar traducciones.
- Que sea repetible: buscar dos veces no duplica nada ni pisa datos mejores. Si una carta japonesa ya tiene datos de TCGdex japonés, la traducción no los reemplaza.

**Non-Goals:**
- Sincronizar todas las expansiones asiáticas completas.
- Cambiar cómo se cuentan las colecciones o cómo se identifica una fila de inventario (ADR 0004).

## Decisions

- **`syncAsiaDex(dex)` envuelve a `syncJaDex`.** Primero corre la búsqueda japonesa actual y después la asiática. La ruta existente pasa a llamar a `syncAsiaDex` y responde `{ cards, added, failed }`. Alternativa descartada: una ruta y un botón aparte. Serían dos pasos para el mismo objetivo.
- **Búsqueda por nombre en cada idioma:**
  - zh-tw: `cards?name=<zh-hant>`.
  - id: `cards?name=<en>`.
  - th: no hay nombre de la especie. Para cada expansión th que comparte código con una expansión id o ja ya revisada, se toma la carta del mismo número.
  - Después de buscar, se filtra con la regla de la spec: el nombre de la especie, más un sufijo de mecánica o "光輝"/"Radiant". La regla es una función pura en `packages/core`, con pruebas que cubren 伊布, 伊布V, 伊布VMAX, 伊布ex, 光輝伊布, 葉伊布ex y "Eevee & Snorlax-GX".
  - Las cartas con varios Pokémon (TAG TEAM) no entran por nombre. Es una limitación aceptada; se pueden agregar a mano.
- **Clasificación por código:** se pide la lista de expansiones de TCGdex japonés (ya la sincroniza `syncJaSets`).
  - Si el código existe en japonés y no es promo (no termina en `-P`), la carta es `ja-<código>-<número>`. Si la carta no existe, se crea con los datos de la traducción, pero sin su foto (tendría texto en otro idioma). Si existe sin ilustrador o rareza, se completan solo esos campos. El nombre japonés sale de reemplazar el nombre de la especie: 伊布V da イーブイV.
  - Si el código no existe en japonés, o es promo, la expansión es `asia-<código>`. Las promos van en `asia-<idioma>-<código>`, porque la numeración de promos de cada país es distinta.
  - Expansión con `source = 'tcgdex-asia'`. Su `lang` es el primer idioma en que aparece, en orden ZH, TH, ID. Así cuenta en cualquier idioma y en Cargar parte en ese idioma.
- **Número de Pokédex:** se guarda `dex = [<dex buscado>]` en las cartas que pasan el filtro. Nunca se borra un `dex` que ya existe.
- **Nombres de idioma en el front:** se agregan `TH: 'Tailandés'` e `ID: 'Indonesio'` a `LNAME`, y TH/ID a `LANGS` en core. En `REGION_SECTIONS` se suma `['ASIA', '🌏 Otras de Asia']`: las expansiones con `lang` TH o ID se agrupan ahí en la vista "Por región".
- **Ubicaciones:** el orden sugerido nuevo ("Caja 5 · Japonesas y otras") suma TH e ID a `origin`, y el formulario de reglas ofrece "Tailandesas" e "Indonesias". Las ubicaciones que el usuario ya creó no se modifican.
- **Migración:** no hace falta tabla nueva. `sets.source` es texto libre y `sets.lang` acepta 'TH'/'ID'. Se revisa al implementar si hay un CHECK que lo impida; si lo hay, una migración lo amplía.

## Risks / Trade-offs

- [El nombre japonés deducido puede ser incorrecto en cartas raras, como los nombres con entrenador (ロケット団の…)] → Solo se reemplaza cuando el nombre de la traducción es exactamente especie + sufijo. En otro caso queda el nombre de la traducción.
- [TCGdex agrega más adelante las cartas de S6a en japonés] → `upsertJaCard` actualiza la misma fila `ja-S6a-058` con los datos japoneses, porque tiene el mismo id. No se duplica.
- [PokéAPI no responde] → La búsqueda japonesa se hace igual. Se avisa que no se pudieron buscar las de Asia, y no se guarda nada a medias de Asia.
- [Muchas llamadas a TCGdex por búsqueda] → Cuatro a la vez, igual que `syncJaDex`, y solo en las expansiones que tienen la especie.
