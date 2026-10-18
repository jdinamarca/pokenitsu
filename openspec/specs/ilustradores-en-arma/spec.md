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
Al pasar el mouse o enfocar una tarjeta, SHALL asomar detrás su carta de portada: la carta suya más reciente que la cuenta tiene o, si no tiene ninguna, la más nueva de una expansión regular. La imagen SHALL pedirse solo en ese momento. En pantallas sin hover, cada tarjeta SHALL mostrar una miniatura de la portada. Con "reducir movimiento", la portada SHALL aparecer sin inclinarse ni desplazarse.

#### Scenario: Pasar el mouse
- **WHEN** el usuario pasa el mouse sobre la tarjeta de Kagemaru Himeno
- **THEN** su portada aparece detrás y es la única imagen de portada que se descarga

### Requirement: Galería de un ilustrador
Al elegir un ilustrador, Arma SHALL abrir `/ilustradores/<nombre>`, con un encabezado que muestra el nombre, "N de M" y los filtros Todas · Tengo · Me faltan. Debajo SHALL ir la vitrina de fieltro con una repisa por expansión, de la más nueva a la más antigua, cada una con su nombre, código y "tengo / total". Las cartas que la cuenta tiene SHALL verse en color y con la cantidad de copias, y las que le faltan, en blanco y negro.

#### Scenario: Carta que falta
- **WHEN** el usuario no tiene la carta 33 de Team Up (Pikachu & Zekrom-GX), de Mitsuhiro Arita
- **THEN** la carta se ve en blanco y negro en la repisa de Team Up

#### Scenario: Solo las que me faltan
- **WHEN** el usuario toca "Me faltan"
- **THEN** solo quedan las cartas en blanco y negro, y desaparecen las repisas que quedan vacías

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
