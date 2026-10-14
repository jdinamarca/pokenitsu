## MODIFIED Requirements

### Requirement: Expansiones de varias fuentes
El sistema SHALL guardar expansiones de pokemontcg.io (internacionales, `source = 'ptcg'`), de TCGdex en japonés (`source = 'tcgdex-ja'`, ids `ja-*`) y creadas a mano (ids `x-<idioma>-*`), con nombre, serie, código impreso, fecha de salida, total de cartas y símbolo. El catálogo MUST NOT tener datos copiados de PokeCottage.

#### Scenario: Primera apertura
- **WHEN** se piden las expansiones y la tabla está vacía
- **THEN** el sistema las descarga de las fuentes y las devuelve ordenadas de la más nueva a la más antigua

#### Scenario: Actualizar expansiones
- **WHEN** el usuario pide actualizar la lista de expansiones
- **THEN** el sistema vuelve a sincronizarlas y conserva las cartas ya descargadas

#### Scenario: Base con datos de PokeCottage
- **WHEN** la API arranca sobre una base que tenía expansiones `pc-*` o fotos de `pokecottagecdn.com`
- **THEN** la migración borra los links y las cartas y expansiones `pc-*` que nada usa, y las que siguen en uso quedan sin foto

### Requirement: Cartas de una expansión bajo demanda
El sistema SHALL descargar las cartas de una expansión la primera vez que se necesitan (al elegirla en Cargar o al importar) y guardarlas con nombre, número, números de Pokédex, ilustrador, rareza, tipo (Pokémon/Entrenador/Energía) e imagen.

#### Scenario: Elegir una expansión sin cartas locales
- **WHEN** el usuario elige una expansión cuyas cartas no están guardadas
- **THEN** el sistema las descarga, las guarda y las entrega al front
