# Spec Delta

## ADDED Requirements

### Requirement: Entradas basura de TCGdex ocultas
El catálogo MUST NOT incluir las expansiones japonesas de TCGdex marcadas como basura (vacías con nombre falso, o duplicados vacíos de una expansión que sí tiene las cartas), ni al sincronizar ni las que ya existían, siempre que no tengan cartas.

#### Scenario: Un solo resultado por expansión
- **WHEN** el usuario busca "GX Battle Boost"
- **THEN** aparece una sola expansión, `SM4p`, con sus cartas

#### Scenario: Nueva sincronización
- **WHEN** se vuelve a sincronizar la lista japonesa de TCGdex
- **THEN** las entradas `CS*` y los duplicados `+` no vuelven a aparecer
