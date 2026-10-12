# ilustradores Specification

## Purpose
Explorar las cartas por ilustrador para armar kits de un artista o coleccionarlo.

## Requirements

### Requirement: Lista de ilustradores
El sistema SHALL listar los ilustradores del catálogo internacional con cuántas cartas distintas tiene el usuario y cuántas existen, filtrable por nombre e idioma, y ordenable por más tenidas, nombre o total.

#### Scenario: Ordenar por más tenidas
- **WHEN** el orden es "más tenidas"
- **THEN** primero aparecen los ilustradores con más cartas distintas en el inventario

### Requirement: Cartas de un ilustrador
Al elegir un ilustrador el sistema SHALL mostrar todas sus cartas, marcando cuáles se tienen, con filtro de todas / tengo / me faltan.

#### Scenario: Catálogo incompleto
- **WHEN** el catálogo completo no está descargado
- **THEN** se avisa que pueden faltar cartas y se ofrece descargarlo
