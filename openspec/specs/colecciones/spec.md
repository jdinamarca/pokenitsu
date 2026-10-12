# colecciones Specification

## Purpose
Seguir colecciones personales (ej. todos los Eevee o un master set) y saber qué se tiene, qué falta, cuánto vale y cuánto cuesta completarla.

## Requirements

### Requirement: Colección por Pokémon
El sistema SHALL permitir crear una colección por número de Pokédex con un idioma en que cuentan las internacionales (o cualquiera). Una carta es una expansión + número; las internacionales son la misma carta en cualquier idioma y las japonesas, chinas y escritas a mano tienen expansiones propias.

#### Scenario: Colección de Eevee en inglés
- **WHEN** la colección cuenta solo en inglés y el usuario tiene una copia en español
- **THEN** esa copia no cuenta para la colección

### Requirement: Seguir una checklist de PokeCottage
El sistema SHALL permitir que una colección siga una checklist de pokecottage.com. Solo cuentan las cartas de la lista; cada una se busca en el catálogo y las que no existen se crean en expansiones `pc-*`. Cada variante de la checklist es un espacio aparte (ej. Unlimited, 1st Edition, misprint). Las cartas donde el Pokémon no es protagonista van como cameos, con su propio contador. La checklist se puede actualizar o dejar de seguir.

#### Scenario: Variante con nombre especial
- **WHEN** la única versión estándar de una carta en la checklist es "Cosmos Holo" y el usuario tiene una copia holo
- **THEN** la copia cuenta para ese espacio

### Requirement: Vistas y filtros
El sistema SHALL mostrar todas / las que tengo / las que me faltan, "Todas juntas" o "Por región", y ordenar con los mismos criterios de Mi colección; filtrar por rareza y por precio.

#### Scenario: Ver lo que falta
- **WHEN** el usuario elige "Me faltan"
- **THEN** solo aparecen los espacios sin copias

### Requirement: Valor y costo para completar
La cabecera SHALL mostrar el progreso (variantes y cartas), el valor de lo que se tiene (cada espacio una vez, al precio de la mejor copia), el costo estimado para completarla (lo que falta, en NM), cuántas no tienen precio, y cuántos precios propios hay y cuántos están por actualizar con un link al filtro.

#### Scenario: Precios por revisar
- **WHEN** hay precios propios vencidos en la colección
- **THEN** la cabecera muestra "⚠️ N por actualizar" y al tocarlo filtra esas cartas

### Requirement: Edición de la colección
El sistema SHALL permitir ocultar cartas, marcarlas como cameo o protagonista, agregar cameos o cartas a mano, sumar copias (+1) desde un espacio, y editar o borrar la colección.

#### Scenario: +1 en una variante especial
- **WHEN** el usuario toca +1 en el espacio "Poké Ball" de una carta
- **THEN** se agrega una copia de esa carta con variante `pokeballholo` a la colección personal
