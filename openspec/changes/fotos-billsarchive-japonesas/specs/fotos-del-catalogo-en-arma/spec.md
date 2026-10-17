## MODIFIED Requirements

### Requirement: Qué foto muestra una carta del catálogo
En Cargar y en Mi inventario, cada carta SHALL mostrar la primera foto que tenga, en este orden:
1. la foto que la cuenta puso a esa variante;
2. la foto propia de la carta, o la propia de su impresión del Full;
3. la foto del catálogo;
4. la foto solo local de la carta (solo con `ARMA_FOTOS_LOCALES=1`): la de su impresión del Full, si no la de Limitless TCG, si no la de PokeCottage y, si no, la de Bill's Archive;
5. la foto de referencia del mismo Pokémon.

La impresión del Full de una carta SHALL ser una que apunte a esa carta y esté en su mismo idioma: una impresión taiwanesa ligada a una carta japonesa MUST NOT darle su foto. Se prefiere la impresión sin sello y normal. Una foto marcada como de otra variante MUST NOT usarse.

Una foto solo local SHALL verse con la marca violeta de "solo uso local" en la carta, y con la nota "Foto solo para uso local · {fuente}" en la ficha. Sin el interruptor, las fotos solo locales MUST NOT entregarse ni servirse, y la carta pasa a la siguiente foto de la lista.

#### Scenario: Japonesa sin foto del catálogo
- **WHEN** el interruptor está encendido y una carta de VMAX Climax (S8b) no tiene foto en el catálogo, pero sí de Limitless
- **THEN** Cargar la muestra con la foto de Limitless y la marca violeta

#### Scenario: La foto de la impresión del Full
- **WHEN** el interruptor está encendido y la Eevee de Pokémon Jungle japonesa (#037) no tiene foto en el catálogo, pero su impresión del Full tiene la de PokeCottage
- **THEN** Cargar la muestra con esa foto y la marca violeta, no con la foto de referencia

#### Scenario: Interruptor apagado
- **WHEN** la app corre sin `ARMA_FOTOS_LOCALES=1`
- **THEN** esa carta se muestra con la foto de referencia o sin foto, y el archivo de Limitless responde 404

#### Scenario: Una foto propia gana
- **WHEN** el administrador sube su foto de una carta que tenía foto de Limitless
- **THEN** la carta se muestra con la foto propia, sin marca violeta, para todas las cuentas

### Requirement: Fotos solo locales del catálogo japonés
Con el interruptor encendido, el sistema SHALL bajar la foto de cada carta japonesa del catálogo que no tenga foto del catálogo, propia ni de su impresión del Full, de tres fuentes solo locales:
- **Limitless TCG**, por expansión, con las mismas reglas de nombre de la descarga local de las fotos;
- **PokeCottage**, por Pokémon, para las que Limitless no tiene;
- **Bill's Archive**, por expansión, para las que siguen sin foto (sobre todo Entrenadores y Energías antiguos).

Cada foto SHALL bajarse una sola vez a la carpeta de fotos locales (nunca al almacenamiento propio) y registrarse con su fuente y el permiso "solo local".

Las de Limitless SHALL bajarse al abrir en Cargar una expansión japonesa con cartas sin foto (en segundo plano, sin hacer esperar), o todas de una vez cuando el administrador lo pide. Una misma expansión MUST NOT bajarse dos veces a la vez. Las descargas SHALL ir de a pocas y con pausa, para no cargar el sitio de la fuente.

Las de PokeCottage SHALL cumplir estas reglas:
- **Cruce:** se buscan en el álbum de cada Pokémon. Una entrada japonesa SHALL corresponder a una carta solo si coinciden la expansión (por su nombre en inglés, con alias para los nombres que no calzan), el número sin ceros a la izquierda y el Pokédex de la carta. Si una carta tiene varias entradas, SHALL usarse la estándar.
- **Cuándo:** SHALL bajarse solo cuando el administrador lo pide desde la galería, nunca al abrir una expansión en Cargar.
- **Ritmo:** MUST NOT haber más de una petición a PokeCottage a la vez, y SHALL haber una pausa entre peticiones.
- **Lo ya pedido:** el álbum de cada Pokémon SHALL guardarse y reutilizarse por 30 días, sin volver a pedirlo. Lo que una carta tiene ya registrado MUST NOT volver a pedirse.
- **Respuestas de error:** ante una respuesta 429 o 503, el sistema SHALL esperar lo que indique `Retry-After` antes de seguir. Tras varias fallas seguidas, SHALL detener la descarga y decirlo, y una nueva descarga SHALL retomar donde quedó.

Las de Bill's Archive SHALL cumplir las mismas reglas de cuándo, ritmo, lo ya pedido y respuestas de error que PokeCottage, sobre su sitio y su almacenamiento de imágenes. Además:
- **Cruce:** se leen de la página de cada expansión, que se guarda 30 días. Una imagen SHALL corresponder a una carta solo si su expansión y su número existen en el catálogo.
- **Control de la página:** si la cantidad de cartas de la página no calza con la de la expansión en el catálogo, la expansión SHALL saltarse y anotarse en el avance.

#### Scenario: Abrir una expansión japonesa sin fotos
- **WHEN** el interruptor está encendido y el usuario abre VMAX Climax en Cargar por primera vez
- **THEN** la vitrina aparece de inmediato, las fotos de Limitless se bajan en segundo plano y, al volver a abrirla, se ven, sin que se pida nada a PokeCottage

#### Scenario: Una japonesa antigua
- **WHEN** el administrador baja las fotos del catálogo japonés y una carta de Rocket Gang (1997) no tiene foto del catálogo ni de Limitless
- **THEN** queda con la foto de PokeCottage de su misma expansión y número, con la marca violeta

#### Scenario: Una carta que Limitless no tiene
- **WHEN** Limitless no tiene una carta de una expansión
- **THEN** las demás se bajan igual, y esa carta queda para el paso de PokeCottage

#### Scenario: Un Entrenador antiguo
- **WHEN** el administrador baja las fotos del catálogo japonés y la Poké Ball (#048) de Pokémon Jungle no tiene foto de ninguna otra fuente
- **THEN** queda con la foto de Bill's Archive de Jungle #048, con la marca violeta, y aparece en "Por reemplazar" con la fuente Bill's Archive

#### Scenario: Una carta que ninguna fuente tiene
- **WHEN** ni Limitless, ni el álbum de PokeCottage, ni Bill's Archive tienen una carta
- **THEN** esa carta sigue sin foto solo local y las demás se bajan igual

#### Scenario: PokeCottage pide esperar
- **WHEN** PokeCottage responde 429 con `Retry-After: 60`
- **THEN** la descarga espera 60 segundos antes de la siguiente petición, y no hay otra petición en curso mientras tanto

#### Scenario: Nunca dos veces
- **WHEN** se baja otra vez el catálogo japonés, después de una descarga completa
- **THEN** no se vuelve a pedir ningún álbum ni ninguna foto ya bajada
