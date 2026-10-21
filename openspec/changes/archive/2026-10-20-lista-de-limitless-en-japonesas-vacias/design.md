## Context

`syncJaSet` (packages/inventory) baja la lista de una expansión japonesa desde TCGdex y marca `cards_synced_at`, aunque venga vacía. Limitless tiene una vista de lista con una fila por carta: número, nombre japonés, tipo (símbolo de tipo + etapa para un Pokémon; Item, Supporter, Stadium o Pokémon Tool para un Entrenador; Basic o Special Energy) y rareza. Arma ya usa Limitless, solo en local, para las fotos de las cartas japonesas (`limitlessFile`, `ensureLocalCardPhotos`).

## Goals / Non-Goals

**Goals:** poder cargar cartas de las expansiones japonesas vacías; dejar marcada la procedencia; ser cortés con Limitless.

**Non-Goals:** reemplazar a TCGdex en las expansiones que sí tienen cartas; traer ilustrador o variantes desde Limitless; tocar el paquete compartido `@pokenitsu/inventory`, que también usa Nitsu en producción.

## Decisions

- **Solo cuando TCGdex ya respondió vacío** (`cards_synced_at IS NOT NULL` y ninguna carta). Una expansión que nunca se abrió primero se le pide a TCGdex, como siempre. Así Limitless nunca le gana a TCGdex (S10a, por ejemplo, tiene 99 cartas en TCGdex).
- **El código de Limitless** se saca de `limitlessFile`, que ya conoce las promos (`S-P` → `SP`).
- **Ids iguales a los de TCGdex** (`ja-<código>-<número de 3 cifras>`), con `ON CONFLICT DO NOTHING`.
- **La marca va en la carta** (`list_source`, que referencia `arma.sources`), no en la expansión: una carta puede seguir siendo de Limitless aunque TCGdex complete la lista después.
- **El Pokédex** se saca del nombre con `dexFromJaName` al insertar. Así funcionan sin más cambios la imagen de referencia, el Master Set y la búsqueda de fotos por Pokémon.
- **Interruptor:** `ARMA_FOTOS_LOCALES=1`, el mismo de todo lo que es solo local.
- **Llenarlas todas:** como primer paso del trabajo de fotos de Por reemplazar, que ya es solo local y se lanza a mano. Recorre todas las japonesas sin cartas, de a una. A las que nunca se abrieron (124 de 132) primero se les pide la lista a TCGdex, y solo si viene vacía se usa la de Limitless. Las fotos de sus cartas se bajan en el mismo trabajo.
- **Enlace con el Full:** las impresiones del Full de esa expansión se importaron sin `card_id`, porque la carta no existía. Al agregar la lista se enlazan con el mismo criterio del importador (expansión y `normNumber`), así el Master Set cuenta la carta cargada sin tener que reimportar.

## Risks / Trade-offs

- Si Limitless cambia el HTML de la lista, el resultado queda vacío y la expansión se cuenta como "sin lista". Nada se rompe.
- Las cartas no traen ilustrador. El paso "Completar detalles" lo completa como con cualquier japonesa.
