## Purpose
Completar desde "Arma tu colección" el Pokédex, el ilustrador, la rareza y el tipo de las cartas japonesas del catálogo, con pocas requests a las fuentes y sin reemplazar nunca un dato que ya está.

## ADDED Requirements

### Requirement: Completar al cargar
Cuando el usuario carga en Arma una carta japonesa sin ilustrador o sin Pokédex, el servidor SHALL completarla en segundo plano después de responder la carga. Si nunca se consultó, SHALL consultarla en TCGdex. Si es un Pokémon y sigue sin Pokédex, SHALL deducirlo del nombre. Un error al completarla MUST NOT afectar la carga.

#### Scenario: Carga de una carta de Inferno X
- **WHEN** el usuario carga la carta 10 de Inferno X, que no tiene ilustrador ni Pokédex
- **THEN** la carga se confirma al tiro y, segundos después, la carta tiene su ilustrador, su tipo y el Pokédex 920, y Mi inventario muestra su imagen de referencia

#### Scenario: TCGdex no responde
- **WHEN** TCGdex falla mientras se completa una carta recién cargada
- **THEN** la carga ya quedó guardada y el error solo queda en el log del servidor

### Requirement: Pokédex por el nombre
Si un Pokémon japonés sigue sin Pokédex, el sistema SHALL deducirlo de su nombre con la lista oficial de nombres japoneses de PokéAPI, bajada una vez como un solo archivo y guardada en cache. SHALL ignorar los adornos del nombre (ex, GX, V, VMAX, VSTAR, Mega, "de …", formas regionales o máscaras). En los TAG TEAM con `&`, SHALL poner un número por Pokémon. Si alguna parte del nombre calza con ninguna especie o con más de una, MUST NOT escribir nada.

#### Scenario: Una ex de Terastal Fest
- **WHEN** se completa "エーフィex" (Espeon ex), que TCGdex trae sin Pokédex
- **THEN** queda con el Pokédex 196

#### Scenario: Nombre que contiene otro
- **WHEN** se completa "ミュウツーGX"
- **THEN** queda con el Pokédex 150 y no con el 151 (ミュウ)

#### Scenario: Nombre que no es de un Pokémon
- **WHEN** el nombre es "バトルコロシアム"
- **THEN** la carta queda sin Pokédex

### Requirement: Ilustrador desde la carta inglesa equivalente
Si un Pokémon japonés sigue sin ilustrador, el sistema SHALL leer la lista de cartas de su especie en Bulbapedia, que dice qué carta japonesa es la misma que qué carta inglesa, y copiar el ilustrador de esa carta inglesa del catálogo. Cuando la lista no trae el número japonés, SHALL usar la única carta de esa especie en ese set japonés; si hay más de una, MUST NOT escribir nada.

#### Scenario: Golden Sky Silver Sea
- **WHEN** se completa un Pokémon de "金の空、銀の海" sin ilustrador, que Bulbapedia empareja con una carta de EX Unseen Forces
- **THEN** la japonesa queda con el ilustrador de esa carta inglesa

#### Scenario: Par ambiguo
- **WHEN** la lista no trae el número japonés y la especie tiene dos cartas en ese set japonés
- **THEN** ninguna de las dos recibe ilustrador

### Requirement: Solo se rellenan campos vacíos
El sistema MUST NOT reemplazar un ilustrador, una rareza, un tipo, un Pokédex ni unas variantes que ya estén en el catálogo. SHALL marcar cada carta consultada en TCGdex (`cards.details_at`), para que ni Arma ni Nitsu la vuelvan a consultar.

#### Scenario: Carta con ilustrador
- **WHEN** una carta ya tiene ilustrador y la carta inglesa equivalente trae otro
- **THEN** la carta conserva el suyo

### Requirement: Completar detalles desde Por reemplazar
La galería Por reemplazar SHALL mostrar al administrador una sección "Detalles de las japonesas" con tres cifras: las cartas sin consultar en TCGdex, los Pokémon sin Pokédex y los Pokémon sin ilustrador. Su botón "Completar detalles" SHALL correr tres pasos en orden: TCGdex, Pokédex por nombre e ilustrador desde la inglesa. Pedirlo otra vez mientras corre MUST NOT empezar otro trabajo. Una cuenta que no es la administradora MUST NOT poder lanzarlo ni ver su avance.

#### Scenario: Completar todo
- **WHEN** el administrador toca "Completar detalles"
- **THEN** ve el avance de TCGdex, después el del Pokédex y después el del ilustrador y, al terminar, las cifras bajan

#### Scenario: Otra cuenta
- **WHEN** una cuenta que no es la administradora pide `POST /api/catalog-details`
- **THEN** recibe 403 y no empieza nada

#### Scenario: Volver a la página mientras corre
- **WHEN** el administrador sale de Por reemplazar y vuelve mientras el trabajo corre
- **THEN** ve el avance en curso, sin que empiece otro

### Requirement: Avance del trabajo de detalles
Mientras el trabajo corre, la sección SHALL mostrar el paso, el avance, lo completado, lo que la fuente no tiene, los fallos, y si una fuente pidió esperar o el trabajo se detuvo por fallas. Al terminar SHALL actualizar las tres cifras.

#### Scenario: Avance del paso del ilustrador
- **WHEN** el trabajo está en el paso del ilustrador
- **THEN** la sección muestra "Ilustrador desde la carta inglesa", la especie que se está leyendo, cuántas especies van de cuántas y cuántos ilustradores se completaron

### Requirement: Cortesía con las fuentes
El sistema SHALL consultar TCGdex de a 3 cartas a la vez y Bulbapedia de a una página, con una pausa entre especies. SHALL guardar cada respuesta en cache (la lista de PokéAPI y las páginas de Bulbapedia por 30 días). Si una fuente responde 429 o 503, SHALL esperar lo que indique `Retry-After`. Tras 3 fallas seguidas de Bulbapedia, SHALL detenerse y avisarlo. Al pedirlo otra vez, SHALL seguir con lo que falta, usando la cache.

#### Scenario: Bulbapedia pide esperar
- **WHEN** Bulbapedia responde 429 con `Retry-After: 120`
- **THEN** la sección dice que la fuente pidió esperar, y la siguiente página se pide después de 2 minutos

#### Scenario: Repetir después de una interrupción
- **WHEN** el trabajo se detuvo a mitad del paso del ilustrador y el administrador lo pide otra vez
- **THEN** las especies ya leídas salen de la cache y solo se piden las que faltan
