# Spec Delta

## MODIFIED Requirements

### Requirement: Lista de ilustradores
El sistema SHALL listar los ilustradores del catálogo internacional como tarjetas con una carta de portada, cuántas cartas distintas tiene el usuario y cuántas existen, buscable por nombre y ordenable por más avance, más cartas mías, más cartas en el catálogo, mayor valor para vender o nombre. Los favoritos aparecen primero.

#### Scenario: Ordenar por más tenidas
- **WHEN** el orden es "más avance"
- **THEN** primero aparecen los ilustradores con más cartas distintas en el inventario

#### Scenario: Portada
- **WHEN** el usuario tiene cartas de un ilustrador
- **THEN** la portada es su copia de mayor nivel; si no tiene ninguna, una carta del catálogo de ese ilustrador

### Requirement: Cartas de un ilustrador
Al elegir un ilustrador el sistema SHALL mostrar todas sus cartas agrupadas por año, las que tiene en color con la insignia de nivel de su mejor copia y las que faltan en blanco y negro, con filtro de todas / tengo / me faltan.

#### Scenario: Catálogo incompleto
- **WHEN** el catálogo completo no está descargado
- **THEN** se avisa que pueden faltar cartas y se ofrece descargarlo

#### Scenario: Carta que falta
- **WHEN** el usuario no tiene una carta del ilustrador
- **THEN** la carta se muestra en blanco y negro

## ADDED Requirements

### Requirement: Qué copias cuentan para un ilustrador
El sistema SHALL permitir elegir si cuentan todas las copias, solo las copias para vender o solo las personales, y filtrar por idioma, serie y niveles de carta (los mismos de la Pokédex).

#### Scenario: Solo IR y SIR
- **WHEN** el usuario filtra los niveles IR y SIR
- **THEN** el avance de cada ilustrador cuenta solo sus cartas que el usuario tiene en IR o SIR

### Requirement: Resumen por nivel de un ilustrador
El detalle de un ilustrador SHALL mostrar cuántas de sus cartas tiene el usuario en cada nivel, y tocar un nivel SHALL mostrar solo esas.

#### Scenario: Tocar un nivel
- **WHEN** el usuario toca "Ilustración (IR)" en el resumen
- **THEN** el detalle muestra solo las cartas que tiene en ese nivel

### Requirement: Kit de un ilustrador
El detalle SHALL mostrar cuántas copias para vender tiene el usuario de ese ilustrador (con los filtros activos), de cuántas cartas distintas y su valor de mercado, y ofrecer crear un lote de venta con todas ellas.

#### Scenario: Crear lote
- **WHEN** el usuario tiene 12 copias para vender de Kagemaru Himeno y toca "Crear lote de venta"
- **THEN** se crea un lote de venta abierto llamado "Kit Kagemaru Himeno" con esas 12 copias, y el inventario no cambia hasta cerrarlo

#### Scenario: Sin copias para vender
- **WHEN** el usuario no tiene copias para vender de ese ilustrador
- **THEN** el botón no aparece y se indica que no hay copias para vender

### Requirement: Ilustradores favoritos
El sistema SHALL permitir marcar y desmarcar ilustradores como favoritos con una estrella; los favoritos se guardan en la base de datos, aparecen primero en la lista y tienen un filtro propio.

#### Scenario: Marcar favorito
- **WHEN** el usuario toca la estrella de Mitsuhiro Arita
- **THEN** Arita queda como favorito y aparece primero en la lista, también después de recargar

### Requirement: Aviso al cargar una carta de un favorito
Al cargar una carta cuyo ilustrador es favorito, el sistema SHALL avisarlo.

#### Scenario: Carga de un favorito
- **WHEN** Arita es favorito y el usuario carga una carta suya
- **THEN** aparece el aviso "⭐ Carta de Mitsuhiro Arita, tu ilustrador favorito" con su avance
