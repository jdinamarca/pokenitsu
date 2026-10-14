# catalogo Specification

## Purpose
Mantener el catálogo local de expansiones y cartas (internacionales, japonesas, de checklists y escritas a mano) que usan la carga, las colecciones, los precios y los ilustradores.

## Requirements

### Requirement: Expansiones de varias fuentes
El sistema SHALL guardar expansiones de pokemontcg.io (internacionales, `source = 'ptcg'`), de TCGdex en japonés (`source = 'tcgdex-ja'`, ids `ja-*`), de PokeCottage (`source = 'pokecottage'`, ids `pc-*`) y creadas a mano (ids `x-<idioma>-*`), con nombre, serie, código impreso, fecha de salida, total de cartas y símbolo.

#### Scenario: Primera apertura
- **WHEN** se piden las expansiones y la tabla está vacía
- **THEN** el sistema las descarga de las fuentes y las devuelve ordenadas de la más nueva a la más antigua

#### Scenario: Actualizar expansiones
- **WHEN** el usuario pide actualizar la lista de expansiones
- **THEN** el sistema vuelve a sincronizarlas y conserva las cartas ya descargadas

### Requirement: Cartas de una expansión bajo demanda
El sistema SHALL descargar las cartas de una expansión la primera vez que se necesitan (al elegirla en Cargar, al importar o al seguir una checklist) y guardarlas con nombre, número, números de Pokédex, ilustrador, rareza, tipo (Pokémon/Entrenador/Energía) e imagen.

#### Scenario: Elegir una expansión sin cartas locales
- **WHEN** el usuario elige una expansión cuyas cartas no están guardadas
- **THEN** el sistema las descarga, las guarda y las entrega al front

### Requirement: Catálogo completo
El sistema SHALL permitir descargar todas las cartas de todas las expansiones (`npm run sync` o el botón en Artistas), retomando lo que falte si se vuelve a correr.

#### Scenario: Sincronización interrumpida
- **WHEN** la descarga completa se corta y se vuelve a ejecutar
- **THEN** solo se descargan las expansiones que faltan

### Requirement: Ilustrador y rareza completados en segundo plano
El sistema SHALL completar desde TCGdex el ilustrador y la rareza de las cartas que no los traen, primero las del inventario del usuario, y marcar cada carta revisada (`cards.details_at`) para no repetirla.

#### Scenario: Carta recién cargada sin ilustrador
- **WHEN** se carga una carta cuyo catálogo no trae ilustrador
- **THEN** el sistema lo busca en TCGdex y el front lo muestra al obtenerlo

### Requirement: Cartas escritas a mano
El sistema SHALL permitir crear cartas que no están en ningún catálogo (por ejemplo chinas) con expansión, número, nombre e imagen opcional.

#### Scenario: Carta china sin catálogo
- **WHEN** el usuario agrega a mano una carta china a una colección
- **THEN** el sistema crea la expansión `x-zh-*` si no existe y la carta dentro de ella

### Requirement: Variantes estándar de cada carta
El catálogo SHALL guardar, para cada carta internacional y japonesa, qué variantes estándar existen (normal, reverse, holo, 1st Edition) según TCGdex, y completarlas en segundo plano, primero las de las expansiones donde el usuario tiene cartas.

#### Scenario: Expansión abierta en modo Master set
- **WHEN** el usuario abre una expansión en modo Master set y sus cartas no tienen variantes
- **THEN** el sistema las descarga en segundo plano y el avance se actualiza al terminar

#### Scenario: Carta que TCGdex no conoce
- **WHEN** TCGdex no tiene la carta
- **THEN** se deducen las variantes por rareza (común a rara: normal y reverse; rara holo: holo y reverse; el resto: holo) y se marcan como deducidas

### Requirement: Nombre en inglés de las expansiones japonesas
Las expansiones japonesas de TCGdex SHALL tener su nombre de coleccionista en inglés cuando se conoce, y la app SHALL mostrarlo como nombre principal con el nombre japonés al lado. La búsqueda de expansiones SHALL encontrarlas por el nombre en inglés, el japonés o el código.

#### Scenario: Buscar por nombre en inglés
- **WHEN** el usuario escribe `rocket gang` en la búsqueda de expansión
- **THEN** aparece "Rocket Gang" con su nombre japonés ロケット団 y código PMCG4

#### Scenario: Buscar en japonés
- **WHEN** el usuario escribe `ロケット団`
- **THEN** aparece la misma expansión, mostrada como "Rocket Gang"

#### Scenario: Expansión sin nombre en inglés conocido
- **WHEN** una expansión japonesa no tiene nombre en inglés
- **THEN** se muestra y se busca por su nombre japonés y su código, como antes

### Requirement: Correcciones de nombres de TCGdex
El sistema SHALL corregir los nombres japoneses que TCGdex trae equivocados, también después de volver a sincronizar las expansiones.

#### Scenario: Shiny Treasure ex
- **WHEN** se sincronizan las expansiones japonesas
- **THEN** `SV4a` queda como シャイニートレジャーex (Shiny Treasure ex) y no como レイジングサーフ

### Requirement: Entradas basura de TCGdex ocultas
El catálogo MUST NOT incluir las expansiones japonesas de TCGdex marcadas como basura (vacías con nombre falso, o duplicados vacíos de una expansión que sí tiene las cartas), ni al sincronizar ni las que ya existían, siempre que no tengan cartas.

#### Scenario: Un solo resultado por expansión
- **WHEN** el usuario busca "GX Battle Boost"
- **THEN** aparece una sola expansión, `SM4p`, con sus cartas

#### Scenario: Nueva sincronización
- **WHEN** se vuelve a sincronizar la lista japonesa de TCGdex
- **THEN** las entradas `CS*` y los duplicados `+` no vuelven a aparecer
