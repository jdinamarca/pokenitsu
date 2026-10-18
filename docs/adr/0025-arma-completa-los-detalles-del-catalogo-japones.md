# 0025. "Arma tu colección" completa los detalles del catálogo japonés

- Estado: Aceptado
- Fecha: 2026-10-17

## Contexto
Muchas cartas japonesas del catálogo no tienen número de Pokédex ni ilustrador. Sin Pokédex no tienen imagen de referencia, y sin ilustrador no aparecen en Ilustradores. Hasta ahora solo las completaba el trabajo de detalles de Nitsu (`apps/api/src/details.js`), al arrancar Nitsu. Ese trabajo:
- toma de TCGdex solo lo que TCGdex tiene: no trae `dexId` en muchas ex de Escarlata y Púrpura, ni ilustrador en los sets de 2000 a 2005;
- no vuelve a consultar una carta que ya tiene ilustrador.

El usuario trabaja en Arma (cambio `detalles-de-japonesas-en-arma`).

## Decisión
- **Arma escribe campos vacíos del catálogo compartido** (`cards.artist`, `rarity`, `dex`, `supertype`, `variants`, `details_at`) con el `pool` y no con `asViewer`, porque el catálogo no es de una cuenta.
  - Nunca reemplaza un dato que ya está.
  - Marca `details_at` igual que Nitsu, para que ninguna de las dos apps repita la consulta.
- **Tres fuentes, en orden:**
  1. **TCGdex**, con el mismo relleno de Nitsu.
  2. **El Pokédex por el nombre**, con `dexFromJaName` de `@pokenitsu/core`, sobre la lista de nombres de PokéAPI: un solo archivo, guardado 30 días en cache. Si hay duda, no escribe nada.
  3. **El ilustrador de la carta inglesa equivalente.** Bulbapedia (la lista de cartas de cada especie) dice qué japonesa es igual a qué inglesa, y el ilustrador sale del catálogo propio. Es solo local, como el resto de las fuentes de Arma con licencia CC BY-NC-SA.
- **Cuándo corre:**
  - al cargar una carta, solo para esa carta y después de responder;
  - en Por reemplazar, cuando el administrador lo pide, con avance.

  No corre solo al arrancar.
- **Cortesía:**
  - TCGdex se consulta de a 3 cartas;
  - Bulbapedia, de a una página, con pausa;
  - se respeta `Retry-After`;
  - el trabajo se detiene tras 3 fallas seguidas.

## Alternativas consideradas
- **Seguir dependiendo de Nitsu:** el usuario ya no lo abre a diario, y Nitsu no completa ni los Pokédex que TCGdex no tiene ni los ilustradores de los sets antiguos.
- **Leer la página de cada carta en Bulbapedia:** serían ≈490 requests en vez de ≈213, y el usuario prefirió la lista por especie.
- **Correr solo al arrancar Arma:** pediría requests sin que el usuario lo sepa y sin avance visible.

## Consecuencias
- Las japonesas ganan imagen de referencia y aparecen en Ilustradores.
- Quedan sin ilustrador los Entrenadores y Energías antiguos, y las cartas que Bulbapedia no empareja una a una.
- Antes de producción (#40), hay que revisar el uso de Bulbapedia como fuente de equivalencias.
