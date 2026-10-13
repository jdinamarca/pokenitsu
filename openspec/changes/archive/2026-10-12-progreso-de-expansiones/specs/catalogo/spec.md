# Spec Delta

## ADDED Requirements

### Requirement: Variantes estándar de cada carta
El catálogo SHALL guardar, para cada carta internacional y japonesa, qué variantes estándar existen (normal, reverse, holo, 1st Edition) según TCGdex, y completarlas en segundo plano, primero las de las expansiones donde el usuario tiene cartas.

#### Scenario: Expansión abierta en modo Master set
- **WHEN** el usuario abre una expansión en modo Master set y sus cartas no tienen variantes
- **THEN** el sistema las descarga en segundo plano y el avance se actualiza al terminar

#### Scenario: Carta que TCGdex no conoce
- **WHEN** TCGdex no tiene la carta
- **THEN** se deducen las variantes por rareza (común a rara: normal y reverse; rara holo: holo y reverse; el resto: holo) y se marcan como deducidas
