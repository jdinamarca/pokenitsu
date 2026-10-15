# Design

## Context

- Bulbapedia (`https://bulbapedia.bulbagarden.net/w/api.php`, ya usada para los vínculos de diseño, CC BY-NC-SA) tiene "List of Pokémon Trading Card Game expansions in other languages":
  - **Tablas por serie.** Las cabeceras dicen las columnas, que varían por serie: English, Dutch, French, German, Italian, Brazilian Portuguese, Spanish, Other. La serie Neo no tiene Dutch ni Portuguese.
  - **Filas:** el nombre en inglés va en `{{TCG|Jungle}}` y cada celda es el nombre local o "—". `colspan=N` repite una celda en N columnas (`colspan=2 | Jungle` = neerlandés y francés).
- **La página de cada expansión** tiene una frase de idiomas, revisada el 15-10-2026:
  - Jungle: "released in English, Dutch, German, French, Italian, Spanish, and Portuguese in both 1st and unlimited edition".
  - Team Rocket y Neo Discovery: "English, German, French, and Italian, in both 1st and unlimited edition".
  - EX Unseen Forces: "English, German, French, Italian, Spanish, and Portuguese with cards also available as Reverse Holofoils".
  - Majestic Dawn: "English, German, French, and Italian, which all also had Reverse Holos available".
  - Gym Challenge y Legendary Collection: sin frase.
- Hoy el español viene de WikiDex (carta por carta, sin variantes), y el italiano y el portugués de la deducción por las listas de TCGdex (`languages.ts`).

## Goals / Non-Goals

**Goals:**
- Confirmar con texto de una fuente los idiomas y las variantes 1st Edition y reverse por expansión.
- Sumar el neerlandés.

**Non-Goals:**
- Sellos de producto, promos y variantes por carta en otros idiomas.

## Decisions

**1. Lectura pura en core, con pruebas:**
- `parseLanguageTables(wikitext)` → `Map<englishSetName, Record<Lang, string | null>>`. Expande `colspan` y mapea las cabeceras: Dutch → NL, French → FR, German → DE, Italian → IT, Brazilian Portuguese → PT, Spanish → ES. "—" es `null` (no salió); una columna ausente es `undefined` (sin dato).
- `parseLanguageSentence(wikitext, englishSetName)` → `{ firstEdition: Lang[], reverse: Lang[] }`:
  - toma la oración "The <set> set is released in A, B, and C …";
  - mapea los nombres de idioma (Portuguese → PT);
  - "in both 1st and unlimited edition" → `firstEdition`;
  - "Reverse Holofoils" o "Reverse Holos" → `reverse`.

**2. `bulbapediaLanguages(cat, setKeys)`** (servidor):
- Lee la lista una vez (caché de 24 h).
- Para las expansiones internacionales del Full, lee sus páginas de a 50 títulos con `prop=revisions` (Bulbapedia también limita).
- El nombre en inglés lleva a nuestro `set_key` (`intlSetByName`).

**3. Impresiones confirmadas** (`confirmedClaims` en `languages.ts`), por cada carta internacional del Full, idioma `L` con nombre en la tabla:
- **Base:** acabado base, si falta.
- **1st Edition:** si `L ∈ firstEdition` y la carta tiene `1st-edition` en inglés.
- **Reverse:** si `L ∈ reverse` y la carta tiene `reverse` sin sello en inglés.

Fuente `bulbapedia-idiomas`, `ref` = la página de la expansión, `set_name` = el nombre en `L`. Se fusionan con lo que traigan las demás fuentes (TCGdex alemán, WikiDex español…).

**4. Deducción como respaldo:**
- `deducedClaims` (TCGdex) solo actúa en expansiones sin fila en las tablas.
- Si la tabla dice "—" para `L`, no deduce nada y el par va a `notReleased`.
- Las expansiones de promos siguen excluidas.

**5. "No salió en este idioma":**
- El resumen de la importación guarda `notReleased: { setKey, lang, name, source }[]`, de Bulbapedia y de WikiDex.
- `AuditPrinting.notReleased` pasa a `{ name, language, source }`, y el texto es "<fuente> dice que <expansión> no salió en <idioma>".

**6. Neerlandés:**
- `LANG_NAME.NL = 'Neerlandés'` y `NL` en `LANG_ORDER` (después del inglés) y en `WEST` de `model.ts`.
- `WESTERN` de core ya incluye `NL`, así que la regla "solo inglés" lo apaga como a los demás.

**7. Lo que apareció al implementar** (15-10-2026):
- **TCGdex traduce el tamaño** (`size`: "Standard", "estándar", "Padrão"), y `variantFromTcgdex` lo tomaba como sello cuando no era `standard` en minúscula: 129 impresiones falsas con sello "Standard", "Estandar" o "Padrao" (desde el PR #56). Ahora esos nombres cuentan como tamaño normal (`STANDARD_SIZE`); jumbo sigue siendo una variante.
- **Números alternativos** (101a, "Yellow A"): pueden existir solo en inglés, así que no se confirman por expansión ni se deducen.
- **La lista de expansiones de TCGdex incluye traducciones solo digitales** (Pokémon TCG Online/Live): "Tesouros Lendários", "Chamado das Lendas" y "Destemido" están en portugués en TCGdex, pero Bulbapedia (que lista solo lo impreso) dice que no salieron en portugués. Gana Bulbapedia, y la deducción por TCGdex queda solo para las expansiones que sus tablas no incluyen, siempre marcada.

## Risks / Trade-offs

- **[La frase cambia de forma entre expansiones]** → Las pruebas cubren las formas vistas. Una frase que no se entiende no aporta variantes, solo los idiomas base de la tabla, y se cuenta en el resumen.
- **[Licencia NC]** → El permiso "por revisar" lo deja visible con el sticker ámbar y el informe de producción lo listará, igual que los vínculos de Bulbapedia.
- **[Más impresiones (neerlandés, reverse en EX)]** → Es el Full real; la regla "solo inglés" las deja en penumbra para quien no las colecciona.
