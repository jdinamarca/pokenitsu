## ADDED Requirements

### Requirement: Idioma al abrir una expansión internacional
Al abrir una expansión internacional mientras el idioma de carga es asiático (japonés, chino, coreano, tailandés o indonesio), el sistema SHALL cambiar el idioma al último idioma occidental que usó el usuario, o al inglés si no usó ninguno. Esto SHALL valer al abrirla desde la búsqueda, desde las expansiones recientes y cuando Cargar reabre la última al entrar. Un idioma escrito en la búsqueda (`SWSHP JA`) MUST respetarse.

#### Scenario: Después de una expansión japonesa
- **WHEN** el usuario cargaba Pokémon GO (S10b) en japonés, antes había usado español y abre SWSH Black Star Promos
- **THEN** la expansión queda activa en Español

#### Scenario: Sin idioma occidental anterior
- **WHEN** el usuario solo ha cargado en japonés y abre SWSH Black Star Promos desde las recientes, donde figura "· JA"
- **THEN** la expansión queda activa en Inglés

#### Scenario: Al entrar a Cargar
- **WHEN** la última expansión abierta es SWSH Black Star Promos, guardada como "· JA", y el usuario entra a Cargar
- **THEN** se abre en Inglés

#### Scenario: Idioma escrito
- **WHEN** el usuario busca `SWSHP JA` y la abre
- **THEN** la expansión queda activa en Japonés

### Requirement: Aviso de idioma en que la carta no salió
Si la carta marcada tiene impresiones en el Full y ninguna en el idioma de carga, la ficha y la vista previa SHALL avisar que no salió en ese idioma y decir en qué idiomas salió. El aviso MUST NOT impedir cargarla.

#### Scenario: SWSH190 en japonés
- **WHEN** el idioma es Japonés y el usuario marca la SWSH190 de SWSH Black Star Promos
- **THEN** la ficha dice "Esta carta no salió en japonés. Salió en: EN, ES, PT, FR, DE, IT"
