# Spec Delta

## MODIFIED Requirements

### Requirement: Kits por región
Para la región elegida (Kanto #1–#151, Johto, etc.) el sistema SHALL contar, por cada número de Pokédex, las copias que pasan los filtros activos de cartas de tipo Pokémon, y calcular:
- especies que se tienen / total de la región
- kits completos posibles (el mínimo de copias entre todas las especies)
- especies que faltan para el siguiente kit

Por defecto solo cuentan las cartas con un solo número de Pokédex.

#### Scenario: Una especie sin copias
- **WHEN** falta una especie de Kanto
- **THEN** los kits completos posibles son 0 y esa especie aparece en gris

#### Scenario: Kits según los filtros
- **WHEN** el usuario filtra solo nivel IR y tiene una IR de cada especie de Kanto salvo una
- **THEN** se muestran 150/151 especies y 0 kits completos

### Requirement: Filtros de idioma y variante
El sistema SHALL filtrar el conteo por idioma. La variante de la copia se considera a través de los niveles de carta.

#### Scenario: Kits en español
- **WHEN** el usuario elige idioma Español
- **THEN** solo cuentan las copias en español

#### Scenario: Reverse cuenta como challa holo
- **WHEN** el usuario tiene una común en reverse y filtra solo el nivel challa holo
- **THEN** esa copia cuenta

## ADDED Requirements

### Requirement: Qué copias cuentan
El sistema SHALL permitir elegir si cuentan todas las copias, solo las copias para vender o solo las copias personales. Por defecto cuentan las copias para vender.

#### Scenario: Pokédex personal
- **WHEN** el usuario elige "Personales"
- **THEN** solo cuentan las copias marcadas como colección personal

#### Scenario: Todas las copias
- **WHEN** una fila tiene 3 copias, 1 personal, y el usuario elige "Todas"
- **THEN** cuentan las 3 copias

### Requirement: Nivel de una copia
El sistema SHALL clasificar cada copia en un nivel, de menor a mayor: Challa, Challa holo, ex/V/GX, Edición especial, Variocolor, Full art, Ilustración (IR), Ilustración especial (SIR) y Dorada/Secreta, según la rareza de la carta, si su nombre es ex, V, GX u otra carta de ese tipo, y la variante de la copia.

#### Scenario: Común en normal
- **WHEN** la copia es una carta común que no es ex/V/GX, en variante normal
- **THEN** su nivel es challa

#### Scenario: Doble rara
- **WHEN** la copia es una ex con rareza Doble rara
- **THEN** su nivel es ex/V/GX

#### Scenario: Poké Ball
- **WHEN** la copia es una común en variante Poké Ball
- **THEN** su nivel es Edición especial

#### Scenario: Promo ex
- **WHEN** la copia es una promo cuyo nombre termina en ex
- **THEN** su nivel es ex/V/GX

### Requirement: Filtro de niveles
El sistema SHALL permitir elegir qué niveles cuentan (varios a la vez), con atajos "Solo challa", "Challa + holo", "Solo IR y SIR" y "Todo". Por defecto cuentan todos.

#### Scenario: Kanto solo con challa
- **WHEN** el usuario elige "Solo challa"
- **THEN** solo cuentan las copias de nivel challa y la región muestra cuántas especies se cubren así

### Requirement: Mejor carta por especie
Cada especie SHALL mostrar la copia de mayor nivel entre las que cuentan, con una insignia de su nivel. Si hay empate, gana la de mayor precio y luego la más reciente.

#### Scenario: Especie con challa y SIR
- **WHEN** el usuario tiene un Pikachu común y un Pikachu SIR, y cuentan todos los niveles
- **THEN** la casilla #025 muestra el Pikachu SIR con la insignia SIR

### Requirement: Resumen por nivel
El sistema SHALL mostrar cuántas especies de la región tienen como mejor carta cada nivel.

#### Scenario: Resumen de Kanto
- **WHEN** de 151 especies, 120 tienen como mejor carta una challa, 20 una challa holo, 8 una ex/V/GX y 3 una IR
- **THEN** el resumen muestra "120 challa · 20 holo · 8 ex/V/GX · 3 IR"

### Requirement: Filtros de serie, origen y estado
El sistema SHALL filtrar el conteo por serie de la expansión (ej. solo Scarlet & Violet), por origen (internacional, japonesa, china…) y por estado mínimo (ej. solo NM, o NM y LP).

#### Scenario: Solo NM
- **WHEN** el usuario elige estado mínimo NM y una especie solo tiene una copia LP
- **THEN** esa especie aparece como faltante

### Requirement: Cartas con varios Pokémon
El sistema SHALL permitir contar las cartas con varios números de Pokédex (ej. TAG TEAM) para cada una de sus especies. Por defecto no cuentan.

#### Scenario: TAG TEAM activado
- **WHEN** la opción está activa y el usuario tiene "Pikachu & Zekrom-GX"
- **THEN** la carta cuenta para #025 y para #644
