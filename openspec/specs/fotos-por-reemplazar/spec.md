# fotos-por-reemplazar Specification

## Purpose
Darle al administrador una galería de las fotos en uso que no pueden ir a producción, para reemplazarlas por fotos propias y ver el avance.

## Requirements

### Requirement: Galería "Por reemplazar"
"Arma tu colección" SHALL tener, solo para el administrador (la primera cuenta creada), una pantalla "Por reemplazar" en `/reemplazar`, a la que se llega desde el riel. Otra cuenta MUST NOT ver el enlace, y si abre la dirección SHALL recibir un aviso de que es solo para el administrador. Sin sesión, SHALL llevar a `/entrar`.

La pantalla SHALL mostrar como galería cada foto **en uso** que no puede ir a producción: la foto que hoy se ve en una carta del catálogo o en una impresión del Full, cuando esa foto viene de una fuente "solo local". Cada foto SHALL ir con la carta o impresión que la usa (nombre, expansión, número, idioma y variante) y con su fuente. Las fotos solo locales que ya no se ven, porque la carta tiene una foto propia o con permiso, MUST NOT aparecer.

#### Scenario: Abrir la galería
- **WHEN** el administrador abre "Por reemplazar" con las fotos locales encendidas
- **THEN** ve las fotos de PokeCottage, Limitless y Bulbagarden que hoy se muestran, cada una con su carta y su fuente

#### Scenario: Otra cuenta
- **WHEN** una cuenta que no es la del administrador abre `/reemplazar`
- **THEN** ve el aviso de que la pantalla es solo para el administrador y ninguna foto

### Requirement: Reemplazar una foto
Cada foto de la galería SHALL tener el botón "Subir la mía". La foto subida (JPEG, PNG o WebP, hasta 8 MB) SHALL guardarse como foto propia de esa carta o impresión. Desde ese momento, la carta o impresión SHALL mostrarse con la foto propia en todas las pantallas y SHALL salir de la galería.

#### Scenario: Reemplazar una de Limitless
- **WHEN** el administrador sube su foto para una carta de VMAX Climax que se veía con la de Limitless
- **THEN** la carta sale de la galería, el avance suma uno, y Cargar la muestra con la foto propia

#### Scenario: Reemplazar una de PokeCottage
- **WHEN** el administrador sube su foto para una impresión de Eevee que se veía con la de PokeCottage
- **THEN** la impresión queda con su foto propia en la vitrina de Eevee y sale de la galería

### Requirement: Avance y filtros
La galería SHALL mostrar el avance "N de M listas para producción". M son las cartas e impresiones que tienen alguna foto solo local bajada; N, cuántas de ellas ya tienen una foto propia o de una fuente con permiso. La galería SHALL poder filtrarse por fuente (PokeCottage, Limitless, Bulbagarden) y por tipo (cartas del catálogo, impresiones del Full), con la cantidad de cada filtro.

#### Scenario: Filtrar por fuente
- **WHEN** el administrador elige "Limitless"
- **THEN** la galería muestra solo las fotos de Limitless en uso, y el filtro dice cuántas son

### Requirement: Bajar las fotos locales del catálogo japonés
Con las fotos locales encendidas, la galería SHALL ofrecer al administrador "Bajar fotos locales del catálogo japonés". Esto baja las fotos de todas las expansiones japonesas con cartas sin foto, mostrando el avance (expansiones y fotos bajadas, las que la fuente no tiene y las que fallaron). Pedirlo otra vez mientras corre SHALL mostrar el avance en curso, MUST NOT empezar otra descarga. Con las fotos locales apagadas, la galería SHALL decir que hay que encenderlas (`ARMA_FOTOS_LOCALES=1`) y MUST NOT ofrecer la descarga.

#### Scenario: Bajar todo
- **WHEN** el administrador pide bajar las fotos del catálogo japonés
- **THEN** ve el avance por expansión y, al terminar, las cartas nuevas con foto de Limitless aparecen en la galería
