# Spec Delta

## ADDED Requirements

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
