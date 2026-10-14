## REMOVED Requirements

### Requirement: Seguir una checklist de PokeCottage
**Reason**: PokeCottage no autoriza copiar sus checklists en otras herramientas, ni siquiera privadas.
**Migration**: Las colecciones que seguían una checklist pasan a contar todas las cartas con su número de Pokédex; las cartas agregadas a mano se conservan.

## MODIFIED Requirements

### Requirement: Acciones de una colección
Las acciones de una colección (editar, agregar carta a mano, agregar cameo, buscar japonesas, borrar) SHALL estar en un menú "⋯" del encabezado, y borrar SHALL pedir confirmación.

#### Scenario: Borrar cancelado
- **WHEN** el usuario elige Borrar y cancela la confirmación
- **THEN** la colección no se borra
