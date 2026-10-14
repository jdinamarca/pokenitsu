# Spec Delta

## MODIFIED Requirements

### Requirement: Lista de ilustradores
El sistema SHALL listar los ilustradores del catálogo internacional como tarjetas con sus iniciales en un círculo de color propio, su nombre, cuántas cartas existen en el catálogo, cuántas cartas distintas tiene el usuario y su mejor nivel, buscable por nombre y ordenable por más avance, más cartas mías, más cartas en el catálogo, mayor valor para vender o nombre. Los favoritos aparecen primero. Al pasar el mouse o enfocar una tarjeta SHALL mostrarse de fondo su carta de portada en alta resolución, cargada solo en ese momento; en pantallas sin hover SHALL mostrarse una miniatura de la portada en lugar de las iniciales.

#### Scenario: Ordenar por más tenidas
- **WHEN** el orden es "más avance"
- **THEN** primero aparecen los ilustradores con más cartas distintas en el inventario

#### Scenario: Portada
- **WHEN** el usuario tiene cartas de un ilustrador
- **THEN** la portada es su copia de mayor nivel; si no tiene ninguna, una carta del catálogo de ese ilustrador

#### Scenario: Pasar el mouse
- **WHEN** el usuario pasa el mouse sobre la tarjeta de un ilustrador
- **THEN** aparece de fondo su carta de portada en alta resolución y solo esa imagen se descarga

#### Scenario: En el celular
- **WHEN** el usuario abre Artistas en un celular
- **THEN** cada tarjeta muestra una miniatura nítida de la portada al lado del nombre
