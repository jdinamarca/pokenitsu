# Design

## Context

- **Lo que revisamos el 15-10-2026:**
  - Las impresiones en ES, IT y PT vienen solo de TCGdex, que tiene las cartas de las expansiones modernas pero no las antiguas.
  - **Listas de expansiones de TCGdex:** en italiano conoce 18 de las 27 expansiones donde falta la carta (Team Rocket, Alba Suprema, EX Forze Segrete, Senza Paura…); en portugués, 9 de 31 (Selva, Chamado das Lendas…). En español la lista no sirve: le falta Intrépidos, que salió en español.
  - **Español latinoamericano:** TCGdex tiene las 11 expansiones (desde *Aventuras Compartidas*, sv09, marzo de 2025).
- **WikiDex** (`https://www.wikidex.net/api.php`, CC BY-SA 3.0):
  - **Páginas de cartas:** `list=allpages&apprefix=Eevee (`. Las de cartas terminan en " TCG)"; se excluyen las de "TCG Pocket", "JTCG", "KTCG" e "ITCG". Su ficha `{{Carta Pokémon}}` trae `expansión`, `número` y `expansión 2`/`número 2`… para las reimpresiones. Algunas son redirecciones (Llamada de las Leyendas → Intrépidos 47).
  - **Páginas de expansiones:** el título es "<expansión> (TCG)". Su ficha `{{Expansión}}` trae `lanzamiento = 2000 (ES)<br />…` o `No distribuida (ES)`, y el texto dice el nombre en inglés (`'''''Jungle''''' en inglés`).
  - **El título dice el idioma:** las cartas que salieron en español tienen título en español (Jungla); las que no, en inglés (Team Rocket, Neo Discovery).

## Goals / Non-Goals

**Goals:**
- Que estén todas las impresiones en español que existen, confirmadas por una fuente.
- Sumar en italiano y portugués solo lo que se puede deducir con una base clara, siempre marcado.

**Non-Goals:**
- Variantes deducidas.
- Fuentes bloqueadas.
- Fotos.

## Decisions

**1. Fuentes nuevas (migración 005):**
- `wikidex` ("WikiDex", `ok`, `images = false`, nota "CC BY-SA 3.0: citar a WikiDex").
- `tcgdex-expansiones` ("Expansiones de TCGdex", `ok`, `images = false`, nota "Solo dice que la expansión salió en ese idioma").

**2. `wikidexClaims(cat, species)`:**
- Lista las páginas de cartas, lee cada ficha y, por cada par `expansión`/`número`, lee la página de la expansión (con caché).
- Si `lanzamiento` incluye una fecha con `(ES)`, la expansión salió en España: su nombre en inglés lleva a nuestro `set_key` (`intlSetByName`) y se emite un dato `ES` con el `set_name` en español y el número sin el total ("51/64" → "51").
- Si dice `No distribuida (ES)`, se guarda el par en `notReleased`, que el importador entrega a la revisión.
- **Acabado:** el de la impresión internacional sin sello de esa carta (normal, o holo/cosmos si es la única). Se elige con `baseFinish(claims)` en core, después de fusionar las demás fuentes.

**3. Deducidas (IT y PT):**
- `tcgdexSetLists()` lee `/v2/{it,pt}/sets` (con caché).
- Por cada expansión internacional del Full que aparece en esa lista, y por cada carta sin impresión en ese idioma, se emite un dato del idioma con la fuente `tcgdex-expansiones`, el acabado base, `ref = it/sets/<id>` y el `set_name` traducido.
- No se deduce para el español (WikiDex lo cubre mejor) ni para el español latinoamericano.
- **Promos:** nunca se deducen. Que la expansión de promos (SVP, Wizards, NB) salga en un idioma no significa que cada promo se haya repartido ahí; se cuentan en el resumen (`promoSetsSkipped`).
- **Código de TCGdex:** se usa el del catálogo (`tcgdex_en`) o, si no lo tiene, el mismo código de la expansión (`hgss3`, `svp`).
- **WikiDex lista todas las reimpresiones de una carta:** un número alternativo (`101a`, las "Yellow A") no se confirma aunque su expansión haya salido en España; queda en `unknown`.
- **WikiDex se lee de a 50 páginas por consulta:** página por página responde 429. La página de cada expansión sale de los enlaces de la carta, porque las modernas llevan la serie delante ("Escarlata y Púrpura (TCG): 151").

**4. Revisión:** `AuditPrinting` suma `inferredFrom?: string` (el nombre de la expansión en ese idioma) y `notReleased?: boolean`.
- Motivo `inferred`: "Deducida: TCGdex lista <expansión> en <idioma>, pero ninguna fuente lista esta carta".
- Motivo `notReleased`: "WikiDex dice que <expansión> no se distribuyó en español".

El servidor arma esos campos con el dato `exists` de `tcgdex-expansiones` y con la lista `notReleased` guardada en el último resumen de importación (`arma.imports.summary.sources.wikidex.notReleased`).

**5. Números normalizados:** en `model.ts`, las claves de carta (`withPhotoShows`, `siblings`, `shelvesBySet`) usan `normNumber`, igual que `localPhotos.ts` en su consulta (`regexp_replace` con el mismo patrón que core).

## Risks / Trade-offs

- **[WikiDex cambia el formato de sus fichas]** → El importador falla en esa fuente y conserva lo anterior, como con las demás.
- **[Una deducción equivocada]** → Siempre queda marcada como "deducida" y solo con el acabado base. La revisión del usuario y la regla de veracidad la cubren.
- **[Unas 100 páginas de WikiDex]** → Una consulta por página, de a 2 a la vez, con caché de 24 h y el User-Agent de Nitsu.
