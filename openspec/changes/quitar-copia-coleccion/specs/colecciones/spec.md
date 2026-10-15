# Spec Delta

## MODIFIED Requirements

### Requirement: Edición de la colección
El sistema SHALL permitir ocultar cartas, marcarlas como cameo o protagonista, agregar cameos o cartas a mano, sumar copias (+1) y quitar copias (−1) desde un espacio, y editar o borrar la colección. "−1" SHALL aparecer solo en los espacios con copias y SHALL quitar una copia de las que llenan ese espacio: la agregada más recientemente. Quitar una copia SHALL poder deshacerse igual que una carga.

#### Scenario: +1 en una variante especial
- **WHEN** el usuario toca +1 en el espacio "Poké Ball" de una carta
- **THEN** se agrega una copia de esa carta con variante `pokeballholo` a la colección personal

#### Scenario: −1 después de un +1 por error
- **WHEN** el usuario tiene 1 copia normal de la Eevee de Jungle #51, toca +1 por error y después −1 en ese espacio
- **THEN** vuelve a tener 1 copia, y se quitó la que agregó el +1

#### Scenario: Espacio sin copias
- **WHEN** un espacio no tiene copias
- **THEN** no muestra "−1"
