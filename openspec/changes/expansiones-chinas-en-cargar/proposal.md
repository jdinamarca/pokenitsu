## Why

El usuario tiene la Eevee 0401/07 de 宝石包 Vol.4 (Gem Pack Vol. 4, CBB4C, chino simplificado) y no puede cargarla. El catálogo de Cargar solo tiene expansiones internacionales y japonesas. Las que salieron solo en China nunca se agregaron, aunque el Full ya las tiene: 498 impresiones de Eevee y sus evoluciones en 53 expansiones chinas, todas sin carta del catálogo.

Las fuentes:
- **TCGdex** tiene la lista de las 10 expansiones en chino tradicional (por ejemplo, 進化 SCC con 171 cartas). En chino simplificado, en cambio, casi no trae cartas: CBB4C figura con 7 cartas pero sin ninguna lista. Solo 对战派对组合 奖励包 (CSMPiC) trae la suya.
- **PokeCottage** tiene el resto en el Full. Autorizó usar su texto, también en producción.

Hay un segundo problema. Una copia cargada en chino queda guardada con el idioma `ZH`, pero el Full distingue `ZH-TW` y `ZH-CN`. Por eso el Master Set no cuenta ninguna copia china, ni siquiera las traducciones de expansiones japonesas.

## What Changes

- **Expansiones chinas en el catálogo:** cada expansión china del Full sin carta del catálogo pasa a ser una expansión propia (`source = 'asia'`, `lang` `ZH-CN` o `ZH-TW`). Su id es el código de TCGdex con su idioma, por ejemplo `zh-cn-CBB4C` o `zh-tw-SCC`.
  - Para cruzar una expansión de PokeCottage con la de TCGdex del mismo idioma se usa el código: `scn_cbb4` es `CBB4C`, y `scn_csmPi` es `CSMPiC`.
  - El nombre, la fecha y el total salen de TCGdex cuando la tiene; si no, de PokeCottage.
- **Sus cartas:**
  - **Con lista en TCGdex:** se usa esa lista, con sus fotos.
  - **Con TCGdex vacía:** se arma con las impresiones del Full, una carta por número, con el nombre, el Pokédex y el ilustrador del Full. Quedan marcadas `cards.list_source = 'full'`, y la ficha de Cargar dice "Lista armada desde tu Master Set". Solo aparecen las cartas de los Pokémon que el usuario colecciona, no la expansión completa.
  - Las impresiones del Full se enlazan con esas cartas.
- **Cargar:** el buscador encuentra estas expansiones por código (`CBB4C`), nombre chino o nombre en inglés, con la etiqueta "Chino simplificado" o "Chino tradicional". Al abrir una, el idioma de carga pasa a Chino.
- **Copias en chino cuentan:** el Master Set calza una copia `ZH` con la impresión `ZH-TW` o `ZH-CN` de esa carta, y prefiere el idioma de su expansión cuando es china. Así cuentan también las traducciones de expansiones japonesas ya cargadas.
- **Catálogo y PokeCottage:** el requisito "el catálogo MUST NOT tener datos copiados de PokeCottage" se actualiza: el texto de PokeCottage está permitido (tiene autorización), y sus fotos no.

**Fuera del alcance:**
- Las expansiones de Indonesia y Tailandia (SV3s, SV6s, SV7s), porque el inventario todavía no tiene los idiomas ID ni TH.
- Las traducciones chinas de expansiones japonesas: siguen siendo la carta japonesa.
- El cambio pendiente `cartas-asiaticas`, que era de Nitsu.

## Capabilities

### New Capabilities

### Modified Capabilities
- `catalogo`: expansiones exclusivas de China, con su lista desde TCGdex o, si viene vacía, desde el Full; el texto de PokeCottage pasa a estar permitido.
- `carga-de-cartas`: buscar y abrir expansiones chinas; las copias en chino cuentan en el Master Set.

## Impact

- **Servidor:** `apps/arma/server` (nuevo `asiaSets.ts`, `importer.ts` o el inicio, `inventory.ts`, `session.ts`), y migración de Arma 014 (`sets_source_check` con `'asia'`).
- **Interfaz:** `apps/arma/src`, en la etiqueta de idioma del buscador y la nota de la ficha.
- **Paquetes compartidos:** `@pokenitsu/inventory` (`ensureSetCards` no descarga nada para `source = 'asia'`, igual que con `manual`). Nitsu en producción no cambia.
