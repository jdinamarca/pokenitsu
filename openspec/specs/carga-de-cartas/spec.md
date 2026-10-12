# carga-de-cartas Specification

## Purpose
Cargar cartas al inventario lo más rápido posible usando solo el teclado: se elige la expansión una vez y después se escriben números.

## Requirements

### Requirement: Elegir expansión e idioma
El sistema SHALL permitir buscar la expansión por código impreso, nombre o código + idioma (ej. `MEW ES`, `PFL EN`, `151`), y recordar las expansiones recientes. `Esc` vuelve a la búsqueda de expansión.

#### Scenario: Buscar con código e idioma
- **WHEN** el usuario escribe `MEW ES` y elige el resultado
- **THEN** la expansión 151 queda activa y el idioma de carga pasa a Español

### Requirement: Sintaxis de entrada
El sistema SHALL interpretar un número solo (`25`) como una copia de esa carta con variante automática: normal si es común, poco común, rara o promo; holo en otro caso. Un sufijo fija la variante: `n` normal, `h` holo, `r` reverse, `e` 1st Edition, `p` Poké Ball, `m` Master Ball.

#### Scenario: Variante automática
- **WHEN** el usuario escribe `25` y la carta es común
- **THEN** se suma una copia normal

### Requirement: Cantidad, quitar, estado e idioma
El sistema SHALL aceptar `25*4` o `25x4` para varias copias y `-25` para quitar una. `nm`, `lp`, `mp`, `hp` o `dmg` solos cambian el estado de lo que sigue; detrás de una entrada (`25r lp`, `25 lp*2`) aplican solo a esa entrada. Un código de idioma solo (`es`, `en`, `ja`…) cambia el idioma de lo que sigue.

#### Scenario: Reverse con cantidad y estado
- **WHEN** el usuario escribe `25r lp*2` y Enter
- **THEN** se suman 2 copias reverse LP de la carta 25 y el estado de carga sigue igual que antes

#### Scenario: Número con letra que existe en la expansión
- **WHEN** el número completo (ej. `SV107` o `25a`) existe tal cual en la expansión
- **THEN** se usa ese número y no se interpreta la última letra como variante

#### Scenario: Carta que no existe
- **WHEN** el número no existe en la expansión activa
- **THEN** el sistema avisa "¿Expansión equivocada?" y no cambia el inventario

#### Scenario: Quitar sin copias
- **WHEN** el usuario escribe `-25` y no tiene copias de esa carta
- **THEN** el sistema avisa que no había copias y no cambia nada

### Requirement: Estado por defecto
El estado de carga SHALL ser NM al abrir la app, aunque en la sesión anterior se haya usado otro.

#### Scenario: Nueva sesión
- **WHEN** el usuario recarga la página después de cargar en LP
- **THEN** el estado activo vuelve a NM

### Requirement: Venta o colección personal
El sistema SHALL permitir alternar si lo que se carga es para vender o para la colección personal (🔒). Las copias personales se cuentan aparte en la misma fila.

#### Scenario: Cargar para la colección personal
- **WHEN** el modo personal está activo y se carga una carta
- **THEN** la copia suma en `qty` y en `personal`

### Requirement: Ubicación al cargar
El sistema SHALL guardar cada copia en la ubicación elegida, o en "🪄 Automático" en la ubicación que gane según las reglas de ubicaciones. Al quitar, saca la copia de una ubicación donde exista.

#### Scenario: Carga automática
- **WHEN** la ubicación activa es Automático y se carga una carta de Scarlet & Violet
- **THEN** la copia queda en la ubicación más específica que acepta esa carta

### Requirement: Confirmación y avisos
Tras cada carga, el sistema SHALL mostrar la carta en la vista previa, sonar (si está activado), agregarla a "Últimas cargas" y:
- avisar con ✨ si es IR, SIR o secreta
- celebrar la primera carta de un ilustrador
- descargar su precio si falta y avisar 💰 "¡sepárala!" si vale al menos el umbral de alerta

#### Scenario: Carta valiosa
- **WHEN** se carga una carta cuyo precio es mayor o igual al umbral (por defecto $5.000)
- **THEN** aparece el aviso dorado con su valor y, si su precio la manda a otra ubicación en modo Automático, se mueve sola

### Requirement: Deshacer
El sistema SHALL deshacer la última carga con `⌘Z` o el botón, revirtiendo cantidad, copias personales y ubicación según el registro (`inventory_log`).

#### Scenario: Deshacer una carga movida por precio
- **WHEN** una carga se movió de ubicación por su precio y el usuario deshace
- **THEN** la copia se quita de la ubicación donde quedó finalmente
