# pokedex-en-arma Specification

## Purpose
Recorrer en "Arma tu colección" la Pokédex por región y la galería de las cartas de cada Pokémon, con lo que la cuenta tiene en color y lo que le falta en blanco y negro.

## Requirements

### Requirement: Pantalla Pokédex
Arma SHALL tener una pantalla "Pokédex" en `/pokedex`, con su enlace en el riel, para cualquier cuenta con sesión. Sin sesión, SHALL llevar a `/entrar` y volver después a la misma pantalla.

#### Scenario: Abrir la Pokédex
- **WHEN** el usuario con sesión toca "Pokédex" en el riel
- **THEN** ve la región Kanto con sus 151 Pokémon y el enlace queda marcado

### Requirement: Regiones en pestañas
La Pokédex SHALL separar las 1.025 especies en pestañas por región, con estos rangos: Kanto #1–151, Johto #152–251, Hoenn #252–386, Sinnoh #387–493, Teselia #494–649, Kalos #650–721, Alola #722–809, Galar #810–905 y Paldea #906–1025. Cada pestaña SHALL mostrar su avance: las especies de las que la cuenta tiene alguna carta, sobre las especies de la región. La región elegida SHALL quedar en la dirección (`/pokedex/johto`).

#### Scenario: Cambiar de región
- **WHEN** el usuario toca "Johto"
- **THEN** ve los Pokémon #152 a #251, la dirección pasa a `/pokedex/johto` y Atrás vuelve a Kanto

### Requirement: Ventanita de cada Pokémon
Cada Pokémon SHALL verse como una ventanita con:
- su número (#001);
- su nombre, con el japonés debajo;
- "tengo / total" de sus cartas;
- una imagen: si la cuenta tiene alguna carta suya, el arte de su carta tenida más reciente, en color; si no, una carta representativa, en blanco y negro.

#### Scenario: Pokémon que no tengo
- **WHEN** la cuenta no tiene ninguna carta de Ivysaur
- **THEN** su ventanita muestra una carta de Ivysaur en blanco y negro con "0 / N"

### Requirement: Galería de un Pokémon
Al elegir un Pokémon, Arma SHALL abrir `/pokedex/<número>`, con un encabezado que muestra el número, los nombres, la región, "N de M" y los filtros Todas · Tengo · Me faltan. Debajo SHALL ir una repisa por expansión, de la más nueva a la más antigua, con las cartas tenidas en color (con la cantidad de copias) y las que faltan en blanco y negro. SHALL incluir las cartas de varios Pokémon en las que aparece esa especie.

#### Scenario: TAG TEAM
- **WHEN** el usuario abre la galería de Pikachu
- **THEN** entre sus cartas aparece "Pikachu & Zekrom-GX"

#### Scenario: Volver
- **WHEN** el usuario vuelve desde la galería de Espeon
- **THEN** llega a la pestaña Johto

### Requirement: Selector y qué cuenta como tengo en la Pokédex
La Pokédex y la galería de un Pokémon SHALL tener el selector Todas · Internacionales · Japonesas (`?ver=`) y SHALL contar como tenida una carta con al menos una copia en el inventario de la cuenta, en cualquier idioma, variante, estado o ubicación. Una cuenta MUST NOT ver lo que tienen otras cuentas.

#### Scenario: Internacionales
- **WHEN** el usuario elige "Internacionales" en Kanto
- **THEN** los avances y las imágenes cuentan solo cartas de expansiones internacionales

### Requirement: Movimiento con sobriedad
Las cartas y las ventanitas SHALL entrar escalonadas solo al abrir la pantalla, y una carta que falta SHALL dejar asomar su color a medias al pasarle el mouse. Con "reducir movimiento", MUST NOT haber entrada escalonada, inclinación ni transición de color.

#### Scenario: Reducir movimiento
- **WHEN** el sistema pide reducir el movimiento
- **THEN** la Pokédex y las galerías aparecen sin animación
