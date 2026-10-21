## Context

El Full (`arma.printings`) guarda las impresiones chinas con claves de expansión de PokeCottage (`pc:scn_cbb4`, para chino simplificado) o de TCGdex (`td-zh-tw:SCC`, `td-zh-cn:CSMPiC`), con `card_id` nulo. El inventario guarda las copias por `card_id`, variante e idioma. Sus idiomas son `ES, EN, PT, FR, DE, IT, JA, KO, ZH` y no tienen `ZH-TW` ni `ZH-CN`. `ownedCopies` busca la impresión con el idioma exacto.

## Goals / Non-Goals

**Goals:** cargar cualquier impresión china del Full desde Cargar y que cuente en el Master Set; tener el catálogo completo cuando TCGdex lo tenga.

**Non-Goals:** traer expansiones chinas que el Full no tiene; agregar idiomas al inventario; cambiar la regla de las traducciones.

## Decisions

- **Qué expansiones:** las claves del Full con idioma `ZH-CN` o `ZH-TW` que no son `ja-*`. Se calculan al importar un Full y al arrancar la API. Así, cada Pokémon que se importe suma las suyas.
- **Una expansión por código e idioma:** `pc:scn_csmPi` y `td-zh-cn:CSMPiC` son la misma, porque comparten código e idioma. El cruce se hace con `upper(código de PokeCottage) + 'C'` contra el id de TCGdex en chino simplificado, o con el código igual. El id queda como `<idioma>-<código de TCGdex>`; si TCGdex no la tiene, `<idioma>-<CÓDIGO DE POKECOTTAGE>`.
- **Lista:** si TCGdex trae cartas, se usa `tdCardRow`, igual que en `tcgdex-en`. Si no, una carta por número a partir del Full: id `<set>-<número>`, nombre en inglés del Full (PokeCottage no trae el nombre chino), `dex`, `artist`, sin foto y con `list_source = 'full'`. Una impresión del Full que no esté en la lista de TCGdex se agrega igual, marcada `full`.
- **Enlace:** `UPDATE arma.printings SET card_id` por clave de expansión del Full y `normNumber`, como en `lista-de-limitless-en-japonesas-vacias`. Este paso corre al arrancar la API y después de cada importación, así que también enlaza las impresiones de los Full que se importen más adelante. El importador conserva el enlace (`coalesce`).
- **Idioma de la copia:** el inventario sigue guardando `ZH`. `ownedCopies` prueba primero el idioma de la expansión de la carta cuando es `ZH-CN` o `ZH-TW`, y después `ZH-TW` y `ZH-CN` para las cartas japonesas. No se toca ninguna copia guardada.
- **Fuente `full`:** `list_source` referencia `arma.sources`, así que la migración agrega la fuente `full` ("Tu Master Set", `text_only`).
- **Pestaña:** el buscador suma "Chinas" junto a "Internacionales" y "Japonesas" (`groupSets` por región). Sin ella, las chinas quedarían entre las internacionales.
- **Cargar:** una expansión con `lang` `ZH-CN` o `ZH-TW` abre con idioma de sesión `ZH`, igual que las japonesas abren con `JA`. Esto sigue la regla de `idioma-al-abrir-expansion`.

## Risks / Trade-offs

- Una expansión armada desde el Full queda incompleta: solo trae los Pokémon importados. La ficha y el contador lo dejan claro, y se completa a medida que se importen más Pokémon.
- El nombre de esas cartas queda en inglés hasta que haya una fuente china.
- Si TCGdex publica después la lista de una expansión armada desde el Full, la próxima sincronización agrega las cartas que faltan (`ON CONFLICT DO NOTHING`). Las cartas del Full conservan su marca.
