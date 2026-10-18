# ilustradores-en-arma Specification

## Purpose
Explorar en "Arma tu colección" a los ilustradores del catálogo y la galería de las cartas de cada uno, con lo que la cuenta tiene en color y lo que le falta en blanco y negro.

## Requirements

### Requirement: Pantalla Ilustradores
Arma SHALL tener una pantalla "Ilustradores" en `/ilustradores`, con su enlace en el riel, para cualquier cuenta con sesión. Sin sesión, SHALL llevar a `/entrar` y volver después a la misma pantalla.

#### Scenario: Abrir la pantalla
- **WHEN** el usuario con sesión toca "Ilustradores" en el riel
- **THEN** ve la lista de ilustradores y el enlace queda marcado

#### Scenario: Sin sesión
- **WHEN** alguien sin sesión abre `/ilustradores/Mitsuhiro%20Arita`
- **THEN** llega a `/entrar` y, después de entrar, vuelve a la galería de Arita

### Requirement: Galería de firmas
La lista SHALL mostrar una tarjeta por ilustrador con su nombre en tipografía de firma, el primer y el último año de sus cartas, y un anillo de avance con las cartas distintas suyas que la cuenta tiene sobre las que existen en el catálogo. Arriba SHALL haber un buscador por nombre y un orden: más avance (por defecto), más cartas mías, más cartas en el catálogo o nombre.

#### Scenario: Ordenar por más avance
- **WHEN** el orden es "más avance"
- **THEN** primero aparecen los ilustradores con mayor proporción de cartas tenidas y, a igual proporción, los de más cartas tenidas

#### Scenario: Buscar
- **WHEN** el usuario escribe "arita"
- **THEN** solo queda la tarjeta de Mitsuhiro Arita

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

### Requirement: Qué cuenta como tengo
Una carta SHALL contar como tenida si la cuenta tiene al menos una copia de ella en el inventario, en cualquier idioma, variante, estado o ubicación, para vender o personal. Una cuenta MUST NOT ver lo que tienen otras cuentas.

#### Scenario: Otra cuenta
- **WHEN** otra cuenta abre la galería de Mitsuhiro Arita
- **THEN** ve en color solo las cartas de su propio inventario

### Requirement: Internacionales y japonesas
La lista y la galería SHALL tener un selector Todas · Internacionales · Japonesas, que cambia las cartas, los años y los avances, y que se conserva en la dirección (`?ver=`) para que Atrás vuelva al mismo lugar. Una carta japonesa y su inglesa equivalente SHALL contar como dos cartas.

#### Scenario: Solo japonesas
- **WHEN** el usuario elige "Japonesas" en la galería de Kagemaru Himeno
- **THEN** solo ve sus cartas de expansiones japonesas, y el contador cuenta solo esas
