# Spec Delta

## ADDED Requirements

### Requirement: Impresiones por verificar a la vista
La Vitrina SHALL marcar en su etiqueta las impresiones por verificar y SHALL ofrecer el filtro "Por verificar (N)", que muestra solo esas. La ficha SHALL listar los motivos de una impresión por verificar, en lenguaje de coleccionista.

#### Scenario: Ficha de una impresión dudosa
- **WHEN** el usuario abre la ficha de una impresión que solo TCGdex conoce
- **THEN** ve "Por verificar" con el motivo "Solo TCGdex dice que existe; pokemontcg.io, PokeCottage y TCGplayer conocen la carta"

#### Scenario: Filtro
- **WHEN** el usuario activa "Por verificar (N)"
- **THEN** la vitrina muestra solo las N impresiones marcadas, y al desactivarlo vuelve a mostrar todo
