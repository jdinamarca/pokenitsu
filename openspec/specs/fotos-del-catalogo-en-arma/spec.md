# fotos-del-catalogo-en-arma Specification

## Purpose
Mostrar en arma una foto para cada carta del catálogo, con fotos solo locales de Limitless para las japonesas sin foto y la foto propia del administrador, sin que una foto sin permiso llegue a producción.

## Requirements

### Requirement: Qué foto muestra una carta del catálogo
En Cargar y en Mi inventario, cada carta SHALL mostrar la primera foto que tenga, en este orden:
1. la foto que la cuenta puso a esa variante;
2. la foto propia de la carta;
3. la foto del catálogo;
4. la foto solo local de la carta (solo con `ARMA_FOTOS_LOCALES=1`);
5. la foto de referencia del mismo Pokémon.

Una foto solo local SHALL verse con la marca violeta de "solo uso local" en la carta, y con la nota "Foto solo para uso local · {fuente}" en la ficha. Sin el interruptor, las fotos solo locales MUST NOT entregarse ni servirse, y la carta pasa a la siguiente foto de la lista.

#### Scenario: Japonesa sin foto del catálogo
- **WHEN** el interruptor está encendido y una carta de VMAX Climax (S8b) no tiene foto en el catálogo, pero sí de Limitless
- **THEN** Cargar la muestra con la foto de Limitless y la marca violeta

#### Scenario: Interruptor apagado
- **WHEN** la app corre sin `ARMA_FOTOS_LOCALES=1`
- **THEN** esa carta se muestra con la foto de referencia o sin foto, y el archivo de Limitless responde 404

#### Scenario: Una foto propia gana
- **WHEN** el administrador sube su foto de una carta que tenía foto de Limitless
- **THEN** la carta se muestra con la foto propia, sin marca violeta, para todas las cuentas

### Requirement: Fotos solo locales del catálogo japonés
Con el interruptor encendido, el sistema SHALL bajar de Limitless TCG la foto de cada carta japonesa del catálogo que no tenga foto del catálogo ni foto propia, con las mismas reglas de nombre de la descarga local de las fotos.

Cada foto SHALL bajarse una sola vez a la carpeta de fotos locales y registrarse con su fuente y el permiso "solo local". Las fotos SHALL bajarse por expansión: al abrir en Cargar una expansión japonesa con cartas sin foto (en segundo plano, sin hacer esperar), o todas de una vez cuando el administrador lo pide. Una misma expansión MUST NOT bajarse dos veces a la vez. Las descargas SHALL ir de a pocas y con pausa, para no cargar el sitio de la fuente.

#### Scenario: Abrir una expansión japonesa sin fotos
- **WHEN** el interruptor está encendido y el usuario abre VMAX Climax en Cargar por primera vez
- **THEN** la vitrina aparece de inmediato, las fotos se bajan en segundo plano y, al volver a abrirla, se ven

#### Scenario: Una carta que Limitless no tiene
- **WHEN** Limitless no tiene una carta de una expansión
- **THEN** esa carta sigue sin foto solo local y las demás se bajan igual

#### Scenario: Nunca dos veces
- **WHEN** se abre dos veces una expansión cuyas fotos ya se bajaron
- **THEN** no se vuelve a pedir ningún archivo a Limitless

### Requirement: Foto propia de una carta del catálogo
El administrador SHALL poder subir su foto de una carta del catálogo (JPEG, PNG o WebP, hasta 8 MB) y quitarla. La foto SHALL guardarse en el almacenamiento propio, donde sí puede ir a producción, y registrarse como dato propio de la carta, con quién y cuándo la subió. Una cuenta que no es la del administrador MUST NOT poder subirla ni quitarla.

#### Scenario: Subir la foto de una carta
- **WHEN** el administrador sube su foto de VMAX Climax #1
- **THEN** la foto queda en el almacenamiento propio como dato propio de la carta y se muestra en Cargar y en Mi inventario

#### Scenario: Otra cuenta
- **WHEN** una cuenta que no es la del administrador intenta subir la foto de una carta del catálogo
- **THEN** recibe un error y la foto no cambia
