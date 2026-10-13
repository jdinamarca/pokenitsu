# progreso-de-expansiones Specification

## Purpose
Mostrar cuánto le falta al usuario para completar cada expansión, en distintos modos de completitud, y avisar el avance mientras carga cartas.

## Requirements

### Requirement: Modo Base
En modo Base, el avance de una expansión SHALL ser la cantidad de números distintos que el usuario tiene entre las cartas de número impreso (del 1 al total impreso de la expansión), sobre ese total.

#### Scenario: 151 en modo Base
- **WHEN** el usuario tiene las cartas 1 a 88 de 151, más la 199
- **THEN** el avance Base es 88/165

### Requirement: Modo Con secretas
En modo Con secretas, el avance SHALL contar todas las cartas de la expansión: las de número impreso, las de número mayor al total impreso y las de subcolecciones con prefijo (ej. TG, GG).

#### Scenario: 151 con secretas
- **WHEN** el usuario tiene las cartas 1 a 88 y la 199 de 151
- **THEN** el avance Con secretas es 89/207

### Requirement: Modo Master set
En modo Master set, el avance SHALL contar cada combinación de carta y variante estándar que existe según el catálogo (normal, reverse, holo, 1st Edition), sobre el total de esas combinaciones.

#### Scenario: Carta con normal y reverse
- **WHEN** una carta existe en normal y reverse y el usuario solo tiene la normal
- **THEN** esa carta aporta 1 de 2 al master set

#### Scenario: Variantes aún sin descargar
- **WHEN** el catálogo todavía no tiene las variantes de algunas cartas de la expansión
- **THEN** el modo Master set lo indica ("calculando variantes…") y no muestra un total falso

### Requirement: Qué copias cuentan
El avance SHALL poder calcularse con todas las copias, solo las copias para vender o solo las personales. Por defecto cuentan todas.

#### Scenario: Solo personales
- **WHEN** el usuario elige "Personales" y tiene una carta solo para vender
- **THEN** esa carta no cuenta en el avance

### Requirement: Idioma en expansiones internacionales
Para expansiones internacionales, el avance SHALL contar copias de cualquier idioma, o de un idioma elegido. Las expansiones japonesas, chinas y escritas a mano se cuentan como expansiones propias.

#### Scenario: 151 en español
- **WHEN** el usuario elige idioma Español y tiene la carta 25 solo en inglés
- **THEN** la carta 25 aparece como faltante

### Requirement: Vista de expansiones
El sistema SHALL mostrar una lista de expansiones con nombre, símbolo, serie, avance en el modo elegido y barra de progreso. Por defecto muestra las expansiones donde el usuario tiene al menos una carta; un filtro muestra todas.

#### Scenario: Ordenar por avance
- **WHEN** el usuario ordena por % de avance
- **THEN** primero aparecen las expansiones más cerca de completarse

### Requirement: Filtros y orden de la vista
La vista de expansiones SHALL filtrarse por serie, origen e idioma, y ordenarse por % de avance, por fecha de salida o por cartas faltantes.

#### Scenario: Filtrar por serie
- **WHEN** el usuario filtra por Scarlet & Violet
- **THEN** solo se ven expansiones de esa serie

### Requirement: Detalle de una expansión
Al abrir una expansión, el sistema SHALL mostrar todas sus cartas en orden de número, las faltantes en gris, con filtro tengo / me faltan, y el costo estimado para completarla en NM según el modo elegido.

#### Scenario: Costo para completar
- **WHEN** faltan 3 cartas con precio y 1 sin precio
- **THEN** se muestra la suma de las 3 y "1 sin precio"

### Requirement: Expansión completa
Al llegar al 100% en un modo, la expansión SHALL marcarse como completa en ese modo.

#### Scenario: Completar en modo Base
- **WHEN** el usuario carga la última carta de número impreso que le faltaba
- **THEN** la expansión aparece como completa en modo Base, aunque le falten secretas
