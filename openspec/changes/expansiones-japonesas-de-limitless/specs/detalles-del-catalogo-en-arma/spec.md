## ADDED Requirements

### Requirement: Expansiones japonesas que solo tiene Limitless
Con el modo local encendido (`ARMA_FOTOS_LOCALES=1`), el servidor SHALL agregar al catálogo cada expansión japonesa del índice de Limitless TCG que el catálogo no tenga, con su nombre en inglés, fecha, era, código y su lista de cartas (número, nombre japonés, tipo, rareza y Pokédex deducido del nombre), marcadas con Limitless como fuente. Una expansión que el catálogo ya tiene, con el mismo código, como promo equivalente o como equivalente XY, MUST NOT duplicarse. Sin el modo local, MUST NOT pedirse nada a Limitless.

#### Scenario: Starter Sets de Eevee GX
- **WHEN** el servidor arranca en modo local
- **THEN** el catálogo tiene la expansión SMI con 38 cartas, y la 019 es イーブイGX con el Pokédex 133, lista para cargar en Cargar

#### Scenario: Una expansión que TCGdex ya tiene
- **WHEN** el servidor arranca en modo local y TCGdex ya tiene SM12a
- **THEN** no se agrega otra SM12a y sus cartas siguen siendo las de TCGdex

#### Scenario: Sin modo local
- **WHEN** el servidor arranca sin `ARMA_FOTOS_LOCALES=1`
- **THEN** no se pide el índice ni las listas de Limitless

### Requirement: Equivalencias de códigos XY con Limitless
Las expansiones XY que Limitless nombra con otro código SHALL usar la lista y las fotos del código equivalente de Limitless: XY1a↔XY1x, XY1b↔XY1y, XY5a↔XY5g, XY5b↔XY5t, XY8a↔XY8b, XY8b↔XY8r, XY11a↔XY11b y XY11b↔XY11r. Las cartas que quedaron en la expansión equivocada SHALL moverse a la suya, con sus fotos.

#### Scenario: Blue Shock y Red Flash
- **WHEN** el usuario abre Blue Shock (XY8a) y Red Flash (XY8b) en Cargar
- **THEN** la 001 de Blue Shock es カイロス y la 001 de Red Flash es パラス

### Requirement: El Full se enlaza con las expansiones de Limitless
Las impresiones del Full sin carta del catálogo SHALL enlazarse con la carta de su expansión japonesa que tenga el mismo número y el mismo Pokédex, ya sea por el código de PokeCottage (`pc:jpn_smi` → SMI) o por su alias conocido (Thunder Knuckle → BW8n, THE BEST OF XY → XY). Esto SHALL repetirse después de cada importación.

#### Scenario: Eevee-GX 019 de SMI en el Full
- **WHEN** el servidor terminó de agregar SMI
- **THEN** la impresión `EEV·PC:JPN_SMI·19` queda enlazada con la carta SMI 019, y el Master Set la cuenta al cargarla
