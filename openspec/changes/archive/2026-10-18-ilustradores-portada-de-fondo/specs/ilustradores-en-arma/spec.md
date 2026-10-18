## MODIFIED Requirements

### Requirement: Portada al pasar el mouse
Al pasar el mouse o enfocar una tarjeta, la ilustración de su carta de portada SHALL quedar de fondo dentro de la tarjeta, recortada a la ilustración y con un velo que mantiene legibles el nombre, los años y el anillo. La carta de portada es la más reciente que la cuenta tiene de ese ilustrador o, si no tiene ninguna, la más nueva de una expansión regular. La imagen SHALL pedirse solo en ese momento. En pantallas sin hover, cada tarjeta SHALL mostrar una miniatura de la portada al lado del nombre. Con "reducir movimiento", el fondo SHALL aparecer sin zoom ni desplazamiento.

#### Scenario: Pasar el mouse
- **WHEN** el usuario pasa el mouse sobre la tarjeta de Kagemaru Himeno
- **THEN** la ilustración de su portada llena la tarjeta de fondo, el nombre se lee en claro encima, y es la única imagen de portada que se descarga

#### Scenario: Sin cartas del ilustrador
- **WHEN** la cuenta no tiene cartas de Naoki Saito y el usuario pasa el mouse sobre su tarjeta
- **THEN** el fondo es la ilustración de una carta suya del catálogo, en blanco y negro

### Requirement: Galería de un ilustrador
Al elegir un ilustrador, Arma SHALL abrir `/ilustradores/<nombre>`, con un encabezado que muestra el nombre, "N de M" y los filtros Todas · Tengo · Me faltan. Debajo SHALL ir la vitrina de fieltro con una repisa por expansión, de la más nueva a la más antigua. El encabezado de cada repisa SHALL ocupar siempre dos líneas: el nombre de la expansión en una línea, cortado con "…" si no cabe y completo al pasar el mouse, y debajo el código, el año y "tengo / total". Así, las cartas de repisas vecinas SHALL quedar a la misma altura. Las cartas que la cuenta tiene SHALL verse en color y con la cantidad de copias, y las que le faltan, en blanco y negro.

#### Scenario: Carta que falta
- **WHEN** el usuario no tiene la carta 33 de Team Up (Pikachu & Zekrom-GX), de Mitsuhiro Arita
- **THEN** la carta se ve en blanco y negro en la repisa de Team Up

#### Scenario: Solo las que me faltan
- **WHEN** el usuario toca "Me faltan"
- **THEN** solo quedan las cartas en blanco y negro, y desaparecen las repisas que quedan vacías

#### Scenario: Repisas vecinas alineadas
- **WHEN** en una misma fila quedan "Stellar Tera Type Starter Set: Sylveon ex" y "Temporal Forces"
- **THEN** el nombre largo se corta con "…" y las cartas de las dos repisas empiezan a la misma altura
