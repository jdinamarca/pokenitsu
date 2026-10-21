## Context

El catálogo japonés sale de TCGdex (`source = 'tcgdex-ja'`). El #117 llena con Limitless las expansiones que TCGdex responde vacías, usando el mismo código (`limitlessFile`). Limitless tiene un índice de expansiones japonesas (`/cards/jp`): una tabla por era con código, nombre en inglés, fecha y cantidad de cartas. Cada expansión tiene además una vista de lista (`?display=list`), que `parseLimitlessList` ya sabe leer. Las expansiones chinas (`asiaSets.ts`) muestran cómo se agrega una fuente de expansiones y se enlaza el Full al arrancar.

## Goals / Non-Goals

**Goals:** poder abrir y cargar en Cargar cualquier expansión japonesa que tenga Limitless; que el Full cuente esas cartas; reparar lo que el #117 llenó mal.

**Non-Goals:** reemplazar datos de TCGdex; traer nombres japoneses de expansiones; las expansiones anteriores a BW; tocar `@pokenitsu/inventory`.

## Decisions

- **Cuándo:** al arrancar el servidor, en segundo plano y solo en modo local. El índice se pide una vez por día (cache de `fetchText`). Las listas se piden una sola vez por expansión, de a una, solo para las que aún no tienen cartas. La primera vez son unas 140 requests; después, ninguna.
- **Qué falta:** una expansión de Limitless ya existe si el catálogo tiene `ja-<código>` (sin distinguir mayúsculas), su promo equivalente (`SVP` → `ja-SV-P`, `MP` → `ja-M-P`) o su equivalente XY. Comprobamos los 119 códigos que coinciden: en todos, al menos el 80 % de los nombres de las cartas coincide número por número.
- **`cards_synced_at` al crearla:** `ensureSetCards` de `@pokenitsu/inventory` no descarga nada de una expansión que ya tiene `cards_synced_at`. Así no hay que tocar el paquete compartido. Si la lista no llegó, abrir la expansión en Cargar la pide (`fillJaSetFromLimitless` también acepta `source = 'limitless'` sin cartas).
- **Nombre:** el inglés de Limitless va en `sets.name`, y `name_en` queda vacío, igual que una expansión sin nombre japonés. Serie: la era del índice ("Sun & Moon").
- **Equivalencias XY en `limitlessFile`:** el código de TCGdex se traduce al de Limitless antes que la regla general, porque `XY8b` y `XY11b` existen en ambas fuentes con otro significado. Las usan la lista (#117), las fotos locales y el índice.
- **Reparación en una migración:** solo actúa si `ja-XY8a` no tiene cartas y las de `ja-XY8b` son todas de Limitless (lo mismo para XY11). Primero inserta cada carta con el id nuevo, después mueve `arma.card_photos` y por último borra la vieja. Las fotos guardadas (`XY8b_1_R_JP_LG.png`) ya son las correctas para Blue Shock, así que se conservan.
- **Enlace del Full:** con el criterio del importador (`normNumber` del número) y además el Pokédex de la carta, para que un código mal cruzado nunca enlace otro Pokémon. Corre al arrancar, después de llenar las listas, y después de cada importación.

## Risks / Trade-offs

- Si Limitless cambia el HTML del índice, no se agrega nada y nada se rompe.
- Una expansión de Limitless que TCGdex tuviera con otro código, y que no esté en las equivalencias, quedaría duplicada. Lo revisamos: solo pasa con las ocho XY de la tabla.
- `x-ja-promos-sm-p` (3 cartas cargadas a mano, sin copias) queda junto a `ja-SM-P`, que tiene esas mismas tres. No se borra.
