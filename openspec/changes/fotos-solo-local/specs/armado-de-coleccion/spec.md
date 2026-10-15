# Spec Delta

## ADDED Requirements

### Requirement: Prioridad y marca de las fotos solo local
La Vitrina y la ficha SHALL usar primero una foto con permiso de imagen (las copias propias del catálogo o TCGdex). Una foto "solo local" SHALL usarse solo cuando la impresión no tiene ninguna con permiso, y antes que la foto de otra impresión del mismo diseño. Una impresión que muestra una foto "solo local" SHALL llevar una marca violeta en la vitrina, y en la ficha SHALL decir "Foto solo para uso local" junto a su fuente.

#### Scenario: Promo japonesa sin foto con permiso
- **WHEN** el interruptor está encendido y una promo japonesa solo tiene foto de PokeCottage
- **THEN** la vitrina la muestra con esa foto y la marca violeta, y la ficha dice "Foto solo para uso local · PokeCottage"

#### Scenario: Carta con foto propia
- **WHEN** una impresión tiene nuestra copia de pokemontcg.io y además una foto de Bulbagarden Archives
- **THEN** se muestra nuestra copia, sin marca violeta
