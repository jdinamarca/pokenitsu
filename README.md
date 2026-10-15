# Nitsu Collectibles

Carga rápida de cartas (expansión + número + variante + idioma) guardada en Postgres.

- Qué hace cada parte: [`openspec/specs/`](openspec/specs) (OpenSpec).
- Por qué está hecha así: [`docs/adr/`](docs/adr/README.md) (decisiones de arquitectura).
- Qué es esencial y en qué orden se construye: [`docs/producto/mapa-de-funcionalidades.md`](docs/producto/mapa-de-funcionalidades.md).

## Uso

Requiere Node 24 y pnpm (viene con Node a través de corepack):

```bash
corepack enable  # solo la primera vez: activa pnpm
pnpm install     # solo la primera vez, o cuando cambian las dependencias
pnpm start       # compila packages/core y abre http://localhost:3000
```

Si `corepack enable` falla por permisos, usa `npx pnpm@12 install` / `npx pnpm@12 start`, o instala pnpm con Homebrew.

- Catálogo completo (todas las cartas de todas las expansiones, necesario para la pestaña **Artistas**):
  `pnpm sync` (tarda ~30 min la primera vez; se puede volver a correr para completar lo que falte).
  También hay un botón **Descargar catálogo completo** en la pestaña Artistas.
- Base de datos: `pokemon` en el contenedor Docker `postgres-mac` (conexión en `.env`, fuera de git).
- Las migraciones de `apps/api/db/migrations/` se aplican solas al arrancar.
- Para cargar desde el celular en tu wifi: `HOST=0.0.0.0 pnpm start` y abre `http://<ip-de-tu-mac>:3000`;
  agrega ese origen a `.env` (`BETTER_AUTH_TRUSTED_ORIGINS=http://<ip-de-tu-mac>:3000`) para poder iniciar sesión desde ahí.

### Cuentas e inicio de sesión

La app pide iniciar sesión (Better Auth, [ADR 0011](docs/adr/0011-autenticacion-con-better-auth.md)); usuarios y sesiones viven en la misma base (tablas `user`, `session`, `account`, `verification`). Toda la API exige sesión salvo `/api/auth/*` y el formulario de la landing (`/api/alpha`). Sesiones de 30 días en cookie `HttpOnly`, `SameSite=Lax` (y `Secure` con https).

En `.env`:

```bash
BETTER_AUTH_SECRET=...            # secreto aleatorio para firmar sesiones (openssl rand -base64 33)
AUTH_ALLOWED_EMAILS=tu@email.com  # solo estos emails pueden crear cuenta (separados por coma)
BETTER_AUTH_URL=http://localhost:3000   # la dirección con que abres la app: va en los links de los correos y en el regreso de Google
RESEND_API_KEY=re_...             # correos (sin esto, los links se muestran en la consola del servidor)
EMAIL_FROM="Nitsu Collectibles <hola@jdinamarca.dev>"   # remitente, de un dominio verificado en Resend
GOOGLE_CLIENT_ID=...apps.googleusercontent.com          # "Continuar con Google" (sin esto, el botón no aparece)
GOOGLE_CLIENT_SECRET=...
```

La primera vez, abre la app, toca **Crear cuenta** con un email de esa lista y una contraseña de al menos 10 caracteres. **Cerrar sesión** está en **Datos ▾**.

**Confirmar el correo, recuperar la contraseña y Google** (fase 3):
- Una cuenta nueva con contraseña recibe un correo **Confirma tu correo** (link válido 24 horas) y no puede entrar hasta abrirlo; al abrirlo queda adentro y ve "¡Correo confirmado!". Si intenta entrar antes, se le reenvía el link; la pantalla "Revisa tu correo" tiene **Reenviar el correo**. Las cuentas creadas antes de esto quedaron confirmadas (migración `029`).
- **¿Olvidaste tu contraseña?** pide el email y responde siempre lo mismo, exista o no la cuenta. El link vale 1 hora y abre **Nueva contraseña** (dos veces); al guardarla se cierran las demás sesiones.
- Crear cuenta con un email que no está invitado avisa de inmediato. Con un email que ya tiene cuenta, la pantalla es la misma que al crearla (para no revelar qué emails tienen cuenta) y al dueño le llega **Ya tienes una cuenta**.
- **Continuar con Google** respeta la lista de invitados (si no está, vuelve al login con el aviso) y, si el email ya tiene cuenta, entra a esa misma cuenta.
- **Sin `RESEND_API_KEY`** (modo desarrollo) los correos no se envían: el link aparece en la consola del servidor (`✉️ Correo (modo desarrollo…)`). Antes de invitar testers configura Resend, o no podrán confirmar su correo.

Para activar Resend: en [resend.com](https://resend.com) agrega tu dominio (por ejemplo `jdinamarca.dev`) en **Domains**, copia los registros DNS (SPF y DKIM) en tu proveedor de dominio y espera que diga *Verified*; crea una **API key** con permiso de envío y ponla en `RESEND_API_KEY`, y usa un remitente de ese dominio en `EMAIL_FROM`.

Para activar Google: en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Crear credenciales → ID de cliente de OAuth → Aplicación web**. En **URIs de redireccionamiento autorizados** agrega `http://localhost:3000/api/auth/callback/google` (y la de producción cuando exista, `https://<tu-dominio>/api/auth/callback/google`). Copia el ID y el secreto a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. `BETTER_AUTH_URL` debe ser exactamente la dirección con que abres la app (`localhost` y `127.0.0.1` son distintas para Google). Reinicia el servidor después de cambiar `.env`.

**Mi perfil**: el botón con tu avatar (arriba a la derecha) abre un panel. Arriba muestra tu avatar, tu nombre, las etiquetas (Dueño, Alfa, Email sin verificar) y **Cerrar sesión**, siempre a la vista (en celulares angostos queda solo el 🚪). Debajo hay tres pestañas, y el panel recuerda en ese navegador la última que abriste (se pueden cambiar también con las flechas del teclado):
- **Colección**: un resumen de tu colección: cartas, distintas, valor estimado, colecciones, artes conectados completos de los 35 y cuántos empezados, y ubicaciones. Cada cifra es un link: cartas y distintas abren Mi colección, el valor la abre ordenada por valor total, y colecciones, artes conectados y ubicaciones abren su sección. Al pasar el mouse asoma una ball distinta en cada una (Premier, Luxury, Master, Poké, Great y Ultra Ball) que se tambalea. Más abajo: desde cuándo eres coleccionista, tu última carga, idiomas y lotes abiertos.
- **Aportes**: tus fotos aprobadas, en revisión y rechazadas, y el acceso a Mis aportes y Se buscan. Si el servidor no responde, la pestaña no aparece.
- **Cuenta**: tu email; elegir un avatar entre 15 entrenadores (el arte de sus cartas de Partidario del catálogo) o tus iniciales; cambiar el nombre y la contraseña; ver esta sesión y cerrar las de otros dispositivos.

**Datos por usuario** ([ADR 0010](docs/adr/0010-multiusuario-con-user-id-y-rls.md), [0018](docs/adr/0018-rls-forzado-con-usuario-por-conexion.md)): inventario, registro, ubicaciones, lotes, colecciones, favoritos, precios y fotos propias y la configuración de precios y lotes son de cada cuenta (`user_id` + Row Level Security forzado). El catálogo, los precios de mercado, el tipo de cambio, los cameos y los **artes conectados** son compartidos ([ADR 0019](docs/adr/0019-artes-conectados-compartidos.md)): los mismos grupos para todos, cada cuenta con su propio avance según su inventario, y solo el dueño (la primera cuenta) los crea, edita o borra. Al actualizar, los datos que había pasan a la **primera cuenta creada** (la tuya); si no hay ninguna, la migración pide crear la cuenta primero. Para invitar a alguien, agrega su email a `AUTH_ALLOWED_EMAILS`: empieza con todo vacío y no ve nada tuyo. Borrar una cuenta (`DELETE FROM "user" WHERE email = …`) borra sus datos.

Para SQL nuevo: las consultas de una petición ya ven solo los datos de su usuario (la API fija `app.user_id` en la conexión). Sin usuario (tareas en segundo plano) las tablas por usuario se ven vacías; una tarea de sistema que deba ver a todos usa `asSystem()` de `db.js`.

## Cargar cartas

Eliges la expansión (como sale impresa en la carta, ej. `MEW ES`) y escribes números + Enter.

Mientras escribes, sin presionar Enter, la vista previa (con borde punteado) muestra la carta que se va a cargar y una línea dice qué hará Enter ("Se cargará: Flareon #3 Holo ES (Jungle) → Caja 5", cuántas cartas tiene un rango, que un número no existe…); un clic en esa carta también la carga. También puedes escribir el **nombre del Pokémon** (`flar`): aparece una lista con las cartas de la expansión activa que coinciden; ↑/↓ eligen, Enter o clic la cargan con su variante automática y Tab pone su número en el campo para agregarle `r`, `*2`, `lp`… `Esc` borra lo escrito; con el campo vacío abre la búsqueda de expansión. En las expansiones japonesas (nombres en japonés) también puedes buscar por el nombre en inglés del Pokémon (`charmander` → ヒトカゲ · Charmander), y las cartas que no tienen foto muestran una **imagen de referencia** del mismo Pokémon, atenuada y rotulada.

Las expansiones japonesas se buscan por su nombre en inglés de coleccionista (`Rocket Gang`, `VSTAR Universe`, `Leaders' Stadium`…), por el japonés (`ロケット団`) o por el código (`PMCG4`); se muestran en inglés con el japonés al lado. Los nombres en inglés están en `apps/api/src/ja-sets.json` (las 164 expansiones japonesas; sacados de las checklists de PokeCottage más unos pocos a mano) junto con dos correcciones de nombres que TCGdex trae mal; se aplican al sincronizar y al arrancar. El mismo archivo lista 20 entradas basura de TCGdex que la app no muestra (`hidden`): las 15 `CS*` (vacías y todas con el mismo nombre) y los duplicados vacíos `SM1+`, `sm2+`, `SM3+`, `SM4+` y `SM5+` (las cartas están en `SM1p`…`SM5p`). Otras 48 expansiones japonesas reales vienen sin lista de cartas en TCGdex: se pueden cargar igual, sin verificar el número.

La pantalla muestra arriba la expansión activa con su avance y cuatro botones con los ajustes de carga (**Idioma**, **Estado**, **Guardar en** y **Para**: vender o colección personal); cada uno abre sus opciones al tocarlo. Un estado distinto de NM y la colección personal se ven destacados. Con una expansión elegida la búsqueda se esconde: "Cambiar expansión" o `Esc` la abren junto con tus expansiones recientes. Debajo del número hay una línea con los atajos más usados y "Todos los atajos" (con la opción de sonido). "Últimas cargas" muestra 5 y "Ver las 12". En el celular la carta recién cargada aparece justo debajo del número.


| Entrada | Qué hace |
|---|---|
| `25` | una copia, variante automática (normal si es común, poco común, rara o promo; holo si no) |
| `25r` `25h` `25e` `25p` `25m` | reverse, holo, 1st Edition, Poké Ball, Master Ball |
| `25*4` | cuatro copias · `-25` quita una |
| `lp`, `nm`… | cambia el estado de lo que sigue · `25r lp` solo para esa carta |
| `es`, `en`… | cambia el idioma de lo que sigue |
| `1-30` | una copia de cada carta del 1 al 30 (se combina: `1-30r`, `1-30*2`, `1-30 lp`, `-1-30`). Los números que no existen se saltan y se informan; más de 50 cartas pide confirmación |
| Enter vacío | repite la última entrada (en la misma expansión) |
| `⌘Z` | deshace la última carga; un rango se deshace completo (`inventory_log.batch`) |

## Estructura y pruebas

Monorepo pnpm:

| Carpeta | Qué es |
|---|---|
| `apps/api` | Servidor Fastify (`src/`) y migraciones SQL (`db/migrations/`). Sirve el front y la API en el puerto 3000. |
| `apps/web` | Front actual: `public/index.html` (sin build), la landing (`landing.html`) y las fotos subidas (`public/art/`). |
| `apps/arma` | **Arma tu colección** (app aparte, solo local): front Vite + React en el puerto 5180 y su propia API en el 3002. Ver la sección más abajo. |
| `packages/core` | Reglas de negocio puras en TypeScript, sin red ni base de datos: precios (`pickPrice`, `parseUsd`), carga (`parseEntry`), rarezas y tipo de carta (ex/V/GX…), series, ubicaciones (gana la más específica) y slots de colección; y las reglas de "Arma tu colección" (`arma.ts`: impresiones, fusión de fuentes, equivalencias y reglas). |

`pnpm build` compila `packages/core` en dos formatos: un módulo para la API (`import { pickPrice } from '@pokenitsu/core'`) y `apps/web/public/core.js`, que el front carga como `window.Core` (archivo generado, fuera de git).

```bash
pnpm test        # pruebas de packages/core (Vitest)
pnpm typecheck   # tipos
pnpm lint        # ESLint + Prettier
pnpm --filter @pokenitsu/core format   # formatea packages/core
```

Las pruebas siguen los escenarios de `openspec/specs/` y además comparan `core` con una copia congelada del código anterior (`packages/core/test/legacy/`) sobre todo el catálogo (`test/fixtures/catalog.json`, solo datos públicos). GitHub Actions corre build, tipos, lint y pruebas en cada push y pull request.

### Animaciones

La interfaz anima poco y con propósito (criterio de las skills de animación de Emil Kowalski): los diálogos entran con un fade y una escala sutil (250 ms, salen en 150 ms), y los avisos suben desde abajo y bajan por el mismo borde. Los menús ("Datos ▾", "⋯" de una colección) crecen desde su botón, al entrar o salir del detalle de una expansión, ilustrador, grupo o colección el contenido aparece con un fade corto, y los botones se encogen levemente al presionarlos. Lo que se usa muchas veces al día (búsqueda, ingreso de cartas, grillas) no se anima. Todo es CSS (`@starting-style`); los navegadores sin soporte muestran todo al instante.

- Con **reducir movimiento** activado en el sistema, el brillo holo se detiene y solo quedan fades cortos.
- El efecto de levantar las cartas al pasar el mouse solo funciona con mouse; en el celular no se queda pegado.

## Venta vs. colección personal

Cada fila del inventario tiene `qty` (copias) y `personal` (cuántas de esas copias son para ti, no para vender).
En la pestaña Pokédex eliges qué copias cuentan: para vender (por defecto, para armar kits), todas o solo las personales.

## Pokédex por región

Es un álbum por región (Kanto, Johto… como pestañas con su %): las cartas que tienes se ven en color y las que faltan en blanco y negro. Arriba, cuántas especies tienes, una barra con el nivel de tu mejor carta en cada una y, en "Para vender", cuántos kits completos puedes armar.
- **Nivel de cada copia** (de menor a mayor): Challa · Challa holo · ex/V/GX · Edición especial · Variocolor · Full art · Ilustración (IR) · Ilustración especial (SIR) · Dorada/Secreta. Se calcula con la rareza, el nombre (ex, V, GX…) y la variante (`cardTier` en `packages/core`; la tabla está en `docs/producto/mapa-de-funcionalidades.md`).
- **Cuentan**: eliges qué niveles valen (atajos: Todo, Solo challa, Challa + holo, Solo IR y SIR). Así ves si completaste Kanto solo con challa, o cuántas especies tienes en IR/SIR.
- **Mejor carta por especie**: cada casilla muestra la copia de mayor nivel (empate: la más cara) con su insignia, y arriba un resumen: "120 Challa · 20 Holo · 8 ex/V/GX · 3 IR".
- **Copias** (siempre visible): todas mis cartas, para vender o mi colección. **Filtros** (botón): idioma, serie, origen (internacionales, japonesas…), estado mínimo, cartas con varios Pokémon (los TAG TEAM cuentan para cada especie) y los niveles que cuentan. Todo se recuerda en el dispositivo.
- Al tocar una especie ves todas sus copias, de mayor a menor nivel, con su ubicación.

## Estado de las cartas

Cada fila del inventario tiene un `cond`: NM (por defecto), LP, MP, HP o DMG. Copias de la misma carta en distinto estado son filas distintas.
En **Cargar**, escribe `lp` (o toca el botón) para cambiar el estado de lo que sigues cargando, y `nm` para volver; `25r lp` aplica el estado solo a esa carta.
En **Mi colección → Tabla** puedes cambiar el estado de algunas o todas las copias de una fila.

## Precios

- Cartas internacionales: [pokemontcg.io](https://pokemontcg.io) entrega el precio de mercado de TCGplayer (USD) y la tendencia de Cardmarket (EUR) por variante.
- Si pokemontcg.io no tiene precio (expansiones recién salidas), se usa el catálogo en inglés de TCGdex como respaldo: la expansión se busca por nombre y código, y queda guardada en `sets.tcgdex_en`.
- Japonesas: [TCGdex](https://tcgdex.dev) (Cardmarket, EUR).
- Se convierten a CLP con el tipo de cambio de exchangerate-api.com (respaldo: mindicador.cl).
- Se descargan solas en segundo plano para las cartas del inventario y de las colecciones, y se renuevan una vez al día (`card_prices`).
- El precio es en NM; los otros estados se descuentan con los % de **Datos → Precios** (`settings`).
- Tus precios a mano guardan la fecha (`price_overrides.updated_at`). Después de N días (7 por defecto, en Datos → Precios) se marcan ⚠️; el filtro "Mi precio por actualizar" los junta, y guardar el mismo valor los marca como revisados hoy.
- Tu precio se escribe en **dólares** (`349,99` o `349.99`) y se guarda en `price_overrides.usd`; el valor en CLP se calcula con el tipo de cambio del día, así que sigue al dólar.
- Tocando un precio pones el tuyo (`price_overrides`), útil para cartas sin precio de mercado. Un `≈` indica que no había precio de esa variante exacta y se usó el de la carta base.
- El CSV exportado incluye estado, precio unitario y total.
- En **Mis colecciones** se muestra el valor de lo que tienes (cada carta una vez, al precio de tu mejor copia) y cuánto costaría completarla (lo que falta, en NM).

## Lotes (ventas y compras a un % del mercado)

Un lote junta las cartas de un trato y les pone precio a un % del valor de mercado según su estado: por ejemplo, vender al 90% o comprar al 70%. Los % por defecto se cambian en **Datos → Precios**.
- **Venta:** en **Mi colección** eliges el lote arriba y tocas 📦 en cada carta, o usas **📦 Agregar las filtradas** (por ejemplo, todas las IR).
- **Compra:** escribes las cartas en el lote: `MEW 25r lp*2`.
- Puedes fijar a mano el precio de cada línea; si la dejas vacía, se usa el % del lote. También eliges el redondeo.
- **📋 Copiar lista** genera el texto para WhatsApp o Instagram.
- **Cerrar** descuenta las copias para vender del inventario (venta) o las agrega (compra), y guarda los precios cerrados. **Reabrir** lo deshace.
- Tablas: `lots`, `lot_items`.

## Ilustradores

Pestaña **🎨 Artistas**: cada ilustrador del catálogo internacional como una tarjeta "firma": sus iniciales en un círculo con un color propio, su nombre, cuántas cartas tiene en el catálogo, cuántas tienes y la insignia de tu mejor nivel. Al pasar el mouse aparece de fondo una carta suya en alta resolución (tu copia de mayor nivel, o una del catálogo), que se carga solo en ese momento; en el celular se ve una miniatura nítida en vez de las iniciales. Búsqueda, orden (más avance, más cartas mías, kit más valioso, más cartas en el catálogo, A→Z) y copias (todas / para vender / mi colección) a la vista; idioma, serie, niveles y "solo favoritos" en Filtros.
- **Detalle**: sus cartas por año, las que tienes en color con su nivel y las que faltan en blanco y negro; resumen por nivel (toca uno para ver solo esas) y todas / tengo / me faltan.
- **Kit**: cuántas copias para vender tienes de ese ilustrador, de cuántas cartas y su valor; **📦 Crear lote de venta** arma el lote "Kit <ilustrador>" con ellas (el inventario cambia recién al cerrar el lote).
- **Favoritos** (★, tabla `favorite_artists`): aparecen primero y, al cargar una carta suya, la app avisa "⭐ Carta de …, tu ilustrador favorito".

## Artes conectados

Grupos de cartas cuyo arte se conecta (tablas `art_groups`, `art_group_cards`), de tres tipos (`art_groups.kind`):
- **🧩 Panorama**: las cartas forman una sola imagen (se muestran unidas, sin espacios).
- **👀 Cameo cruzado**: cada Pokémon aparece en la carta del otro (ej. Clefairy + Hypno de BREAKpoint).
- **🎬 Misma escena / continuación**: el mismo lugar visto desde cada carta, o una continuación años después (ej. Marshadow de Cosmic Eclipse y de Mega Evolution).

Cada grupo puede llevar una nota de cómo se conectan. Las cartas que no están en ningún catálogo (ej. promos japonesas SM-P) se agregan como cartas a mano con su imagen.
- **Álbum**: cada grupo es una tarjeta con el panorama armado (las piezas juntas, sin espacios, en sus columnas; las que faltan en blanco y negro), piezas tenidas, cuánto falta y el valor del grupo. Todos / Completos / Me faltan, orden (más cerca de completarse, más valiosos, menos cuesta completarlos, A→Z), filtros de idioma y serie, y un resumen de todos los grupos.
- **Detalle**: el panorama en grande, la imagen del arte unido si la tiene, y cada pieza con sus copias, dónde están guardadas y su precio. **📋 Copiar lista de faltantes** para buscarlas o pedirlas.
- **Kit**: si tienes una copia para vender de cada pieza, **📦 Crear lote de venta** arma "Kit <grupo>" con una copia de cada una (NM primero).
- **Crear / editar** en una ventana con vista previa del panorama mientras escribes las cartas (`N2 20 38 32`, una línea por expansión, rangos `30C 130-133`); Borrar está dentro de la edición.
- Los precios de las piezas se descargan junto con los del inventario.

## Expansiones (cuánto te falta para completarlas)

Pestaña **📚 Expansiones**: cada expansión donde tienes cartas, con su avance, ordenadas por lo cerca que estás de completarlas (también por faltantes o por fecha). Tres modos:
- **Base**: los números impresos (151: 165/165).
- **Con secretas**: todas las cartas, también las que pasan del número impreso y las subcolecciones (151: 207).
- **Master set**: cada variante estándar de cada carta (normal, reverse, holo, 1st Edition), según el catálogo (151: 362).

Las subcolecciones (Trainer Gallery, Galarian Gallery, Shiny Vault), las Classic Collection y las promos cuentan todas sus cartas en Base. Filtros: copias (todas / para vender / mi colección), idioma (solo afecta a las internacionales), serie, origen, mostrar también las que no tienes e incluir promos.

Al abrir una expansión ves todas sus cartas en orden (las que faltan en blanco y negro; en master set, cada variante marcada si la tienes) y cuánto cuesta completarla en NM. Los precios de toda la expansión se descargan en una sola consulta a pokemontcg.io; si es nueva y no los tiene, se completan desde TCGdex en segundo plano.

Las variantes de cada carta (`cards.variants`) vienen de TCGdex y se descargan solas para las expansiones donde tienes cartas (o al abrir una); si TCGdex no tiene la carta se deducen por rareza (`cards.variants_guessed`).

En **Cargar**, la expansión activa muestra su avance (en el modo elegido en Expansiones) y avisa "¡Nueva! 89/165" cuando la carta no la tenías; al completarla hay una celebración.

## Ubicaciones (cajas y carpetas)

Cada fila del inventario tiene una ubicación (`inventory.loc`, 0 = sin ubicación), así que copias de la misma carta pueden estar en lugares distintos.
- **El estante:** la pestaña muestra tus ubicaciones como objetos sobre repisas: las carpetas de pie (lomo con nombre y cantidad) y las cajas con tapa y etiqueta (nombre, cartas y valor). Las que tienen cartas van en una repisa y las vacías en otra, apagadas, siempre en el orden de la lista. Al pasar el mouse la carpeta se inclina o la tapa se levanta y asoman sus 3 cartas más valiosas. Al tocar una, a la derecha (en el celular, abajo) se ve su detalle: cartas, expansiones y valor, miniaturas, lo que recibe en chips (💰 Para vender, Challa, Mega Evolution…; la regla completa al pasar el mouse), avisos de reglas que se pisan, la nota y los botones Ver cartas, Editar, ↑, ↓ y Borrar. La explicación del orden sugerido está plegada en **¿Cómo decide dónde va cada carta?** (abierta si aún no tienes ubicaciones). Con "reducir movimiento" nada se mueve.
- **Las ubicaciones** (`locations`) tienen una regla que decide qué cartas van ahí: series o expansiones, región, rarezas especiales o precio mínimo, y copias personales o para vender. Al cargar (🪄 Automático), entre las ubicaciones que aceptan la carta gana la más específica: colección personal > especiales/precio > expansión nombrada > serie nombrada > solo challa > región > caja general. Si empatan, gana la que está más arriba en **Ubicaciones**.
- **Cuando se conoce el precio** de una carta recién cargada y la manda a otra ubicación (por ejemplo, la carpeta de lo que pasa de $5.000), se mueve sola.
- **Orden sugerido:** cajas de challa por expansión (en orden de salida) y dentro por número, con un separador por expansión. Carpetas aparte para lo valioso y para la colección personal.
- **Al cerrar un lote de venta** se sacan las copias de donde estén, y se recuerda de dónde (`lot_items.taken`) para que al reabrir vuelvan ahí. **📍 Lista para buscar las cartas** copia la lista ordenada por ubicación.
- El respaldo JSON y el CSV llevan la ubicación por nombre.

## Imágenes de las cartas (copia propia)

**pokemontcg.io está obsoleto.** Su documentación dice que las claves existentes funcionan hasta el 1 de marzo de 2027 y recomienda migrar a Scrydex. De ahí vienen las imágenes de las cartas internacionales, así que la app guarda una **copia propia** y deja de depender de otros sitios para mostrar una carta.

```bash
pnpm imagenes:descargar                   # todo lo que falta (se puede cortar con Ctrl+C y retomar)
pnpm imagenes:descargar -- --set sv3pt5   # una expansión
pnpm imagenes:descargar -- --reintentar   # vuelve a intentar las sin foto, omitidas o con error (y rehace las guardadas con el nombre antiguo)
pnpm imagenes:estado                      # cuántas hay copiadas, cuánto pesan y por qué faltan las demás
```

- **Qué guarda:** de cada carta se baja la imagen grande **una sola vez** y se guardan dos WebP, de 245 px (listas) y 600 px (vista previa), en `data/imagenes/cards/<expansión>/<carta>-small|large.webp`. La carpeta está fuera de git; se cambia con `IMAGE_DIR`. La carta pasa a apuntar a `/img/…` y el link original queda en la tabla `card_images`, con el estado, el peso, la huella sha256 y cuándo se subió al storage.
- **Fuentes:** `images.pokemontcg.io` (internacionales) y `assets.tcgdex.net` (japonesas).
  - Las internacionales cuya imagen venía de **Scrydex** se toman de TCGdex, porque los términos de Scrydex no permiten replicarlo.
  - **PokeCottage nunca.**
  - Las japonesas antiguas sin foto en ninguna fuente quedan "sin foto" y muestran la imagen de referencia.
- **Cómo descarga:** 4 cartas a la vez, con una pausa entre cada una, identificándose como `NitsuCollectibles` (para TCGdex, con el formato `Mozilla/5.0 (compatible; …)` que pide su CDN). El catálogo completo son ~22.000 cartas: alrededor de 14 GB de descarga, ~2 GB guardados y cerca de una hora.
- **Cómo se sirve:** `GET /img/…` entrega el archivo con una semana de caché. Si no está en esta máquina, redirige al storage (`IMAGE_BASE_URL`, en producción) o al link original. Las sincronizaciones del catálogo no reemplazan una imagen ya copiada.
- **Producción:** la carpeta se sube al storage (Supabase Storage o Cloudflare R2) y se configura `IMAGE_BASE_URL`. El comando de subida se agrega al elegir el storage.

## Fotos por variante

Si la foto del catálogo no corresponde, puedes cambiarla para esa variante: tocando la imagen en **Mi colección** o con **📷** en la vista previa de Cargar. Sirve un link o una foto de tu carta (se guarda en `apps/web/public/art/`, tabla `variant_images`). Un ejemplo: en todas las fuentes públicas, el Eevee de Jungle Unlimited aparece con la foto de la 1st Edition.

Si la carta no tiene foto, la vista previa de Cargar muestra **📷 Tomar o subir la foto de tu carta**; en el celular el diálogo ofrece **📸 Tomar foto** con la cámara. Las fotos de más de 1200 px se achican antes de subirse.

**Sin PokeCottage.** Antes la app podía tomar de PokeCottage las fotos de cartas japonesas y sus checklists de master sets. PokeCottage no autorizó usar sus datos en otras herramientas, ni siquiera privadas, así que esa integración se quitó: la migración `030` borra lo que había (links a sus fotos, colecciones que seguían una checklist y las cartas `pc-*` que nada usa). Las cartas japonesas sin foto muestran una imagen de referencia del mismo Pokémon hasta tener una foto propia.

## Fotos aportadas por la comunidad

Para las cartas que no tienen foto en ninguna fuente, sobre todo ~3.500 japonesas, cualquier cuenta puede **compartir la foto de su propia carta**:

- **Compartir:** en el diálogo **📷**, si la carta no tiene foto, aparece el interruptor **"Compartir con la comunidad"**.
  - Hay que aceptar los [Términos para aportar fotos](apps/web/public/terminos-fotos.html) (`/terminos-fotos`): la foto la sacaste tú, no la copiaste de otro sitio, y Nitsu puede mostrarla con tu nombre. Se guarda la versión aceptada y la fecha. Si los términos cambian, se piden de nuevo.
  - Antes de enviarla, la foto se encuadra en un marco con la forma de la carta (arrastrar y zoom).
  - La foto queda además como tu foto privada de esa variante.
- **Revisión:** el dueño (la primera cuenta) tiene la pestaña **📸 Fotos por revisar**, con un contador.
  - Ve la foto, cómo quedará y quién la mandó.
  - Para aprobar marca 3 comprobaciones: carta correcta, nítida y entera, y que no parece sacada de otro sitio. También puede girar la foto.
  - Puede rechazarla con un motivo: borrosa, carta equivocada, con sleeve o reflejo, o no parece suya.
- **Al aprobarla,** se generan los WebP de 245 y 600 px en `IMAGE_DIR` (`card_images` con `source = 'aporte'`) y la carta muestra **"📸 Foto de <nombre>"** para todos. Las demás fotos pendientes de esa carta se rechazan con el motivo "Ya tiene foto".
- **Reportar esta foto:** aparece junto al crédito. También se puede reportar sin cuenta desde `/terminos-fotos#reportar`, con un máximo de 5 por hora y dirección.
  - Desde un reporte, el dueño puede **quitar la foto**: la carta vuelve a quedar sin foto.
  - O puede **quitarla y bloquear los aportes** de esa cuenta, que sigue usando la app pero ya no puede compartir fotos.
- **Mi perfil → pestaña Aportes → Mis aportes:** muestra las fotos aprobadas, en revisión y rechazadas (con su motivo y un botón para reintentar). También incluye **Se buscan**: las cartas sin foto que más cuentas tienen, sin decir cuáles, y el % del catálogo con foto.
- **Datos:**
  - Tablas `photo_submissions` (con RLS: cada cuenta ve las suyas), `photo_reports` y `photo_contributor_blocks` (migración `032`).
  - Las fotos enviadas quedan en `IMAGE_DIR/aportes/`, fuera de `public/`. Solo las pueden ver su autor y el dueño.
  - Las rechazadas o retiradas se borran del disco a los 30 días.

## Mis colecciones (ej. todos los Eevee)

Una carta = una expansión + número. Las internacionales (pokemontcg.io) son la misma carta en inglés,
español, portugués…; la colección elige en qué idioma cuentan. Las japonesas vienen de TCGdex
(sets `ja-*`) y las que no están en ningún catálogo (ej. chinas) se agregan a mano (sets `x-<idioma>-*`).

La colección cuenta todas las cartas con el número de Pokédex del Pokémon, más las que agregas a mano.
Las cartas donde el Pokémon no es el protagonista que agregas a mano
(menú ⋯ → Agregar cameo) se guardan como cameos de la colección (`collection_cards.role = 'cameo'`).

La pestaña muestra cada colección como una tarjeta con portada, avance de **Cartas** y de **Cameos** y su valor.
Dentro, el encabezado fijo tiene las pestañas **Cartas** / **Cameos** y el menú **⋯** (editar, carta a mano, cameo,
buscar japonesas, borrar). En Cartas: Todas / Tengo / Me faltan, Por año / Por región y, en **Filtros**,
orden, rareza, precio y ocultas.

Cada espacio tiene **＋1** (suma una copia a tu colección personal) y, si tiene copias, **−1**: quita la última copia que
agregaste a ese espacio (si era personal, quita una personal) y avisa cuál quitó. Ambos se deshacen con ⌘Z o ↶ Deshacer en Cargar.

### Cameos

**Cameos** = cartas donde el Pokémon aparece sin ser el protagonista (el Eevee en el Snorlax de Wizards Promos #49).
Vienen de la **[Cameo Pokémon Card Database de RotomAmiti](https://docs.google.com/spreadsheets/d/18nIkOgqQrHZTz0TrH_gL1e1nL1RcHiCmPF5finAjToY)**
(≈3.300 cameos de ≈770 Pokémon, una pestaña por generación), más los cameos propios de cada colección.

- Se importa sola la primera vez que arranca el servidor (tabla `cameo_refs`, `apps/api/src/cameos.js`); después,
  con **actualizar** bajo el buscador (`POST /api/cameos/sync`). Si alguna pestaña falla o cambia de formato, se mantiene la base anterior.
- Cada cameo se cruza con el catálogo por expansión y número (alias como "Wizards Promos" → `basep`, promos con prefijo
  `176` → `XY176`, subcolecciones GG/TG/Shiny Vault). Los que no están (promos japonesas, jumbos, concursos) quedan en
  **Sin carta en el catálogo** como referencia.
- En la pestaña **Cameos**: en color los que tienes, en blanco y negro los que no; filtro Todos / Tengo / Me faltan y
  **Cómo aparece** (personaje, silueta, disfraz, dibujo o imagen, peluche o juguete, estatua, parcial, jumbo, otro), sacado de la nota de la planilla.
- **¿En qué cartas aparece…?** muestra los cameos de cualquier Pokémon, aunque no tengas su colección, con un botón para crearla.

La variante del inventario es `normal`, `holo`, `reverse` o una especial
(`firstedition`, `pokeballholo`, `masterballholo`, `pokemoncardgym`…; nombres en `variant_labels`).
En Cargar: `25e` 1st Edition, `25p` Poké Ball, `25m` Master Ball; las demás se agregan con ＋1 desde la colección.

## Arma tu colección (app aparte, solo local)

Una opción nueva, separada de la app actual ([ADR 0020](docs/adr/0020-arma-tu-coleccion-app-aparte.md)), para armar un master set a medida. Por ahora es solo para Eevee (#133) y solo corre en local.

- **Levantarla:** `pnpm arma`. Abre `http://localhost:5180`. Necesita la base Postgres del `.env` y una sesión de Nitsu: entra antes en `http://localhost:3000`, porque la cookie sirve en los dos puertos.
- **El Full:** todas las impresiones del Pokémon (carta × idioma × variante: acabado, sellos, mazos de Battle Academy, World Championship Decks, jumbo…). El botón "Traer el Full", o `POST /api/import/133`, lo arma desde cuatro fuentes y deja un resumen por fuente. Reimportar no duplica nada; si una fuente falla, se conserva lo que había traído.
- **Fuentes y permisos.** Cada dato guarda su fuente, y la ficha lo muestra con un sticker de color:

  | Fuente | Qué aporta | Permiso |
  |---|---|---|
  | TCGdex | Cartas en 13 idiomas, variantes detalladas, sellos y fotos | 🟢 abierta |
  | pokemontcg.io (catálogo de Nitsu) | Cartas internacionales y nuestras copias de las fotos | 🟢 abierta |
  | TCGplayer (vía `card_prices`) | Variantes y precios | 🔴 sin permiso |
  | PokeCottage (master set) | Cartas y variantes especiales, **solo texto** | 🟢 autorizó el texto, también para producción; sus fotos solo con las fotos solo locales (abajo) |
  | Bulbapedia ("Eevee (TCG)") | Qué carta inglesa y qué japonesa son el mismo diseño | 🟠 CC BY-NC-SA, por revisar |

- **Fotos solo para uso local** (apagadas por defecto). Para ver la ilustración correcta de las impresiones que no tienen una foto con permiso (promos japonesas, sellos, variantes con error…), la app puede usar fotos de fuentes que **no** dieron permiso de imagen, solo en tu computador:

  | Fuente | Qué fotos | Permiso |
  |---|---|---|
  | PokeCottage | La de cada entrada de su master set, por variante | 🟣 solo uso local (autorizó el texto, no las fotos) |
  | Limitless TCG | Cartas japonesas (por expansión y número) | 🟣 solo uso local |
  | Bulbagarden Archives | El escaneo de la carta base de la lista de Bulbapedia | 🟣 solo uso local |

  - **Encenderlas:** `ARMA_FOTOS_LOCALES=1` en el `.env`, reinicia `pnpm arma` y llama a `POST /api/local-photos/133` (con `curl -X POST http://localhost:3002/api/local-photos/133`). Deja un resumen por fuente: cuántas trajo, cuántas ya estaban, cuántas no existen y cuántas fallaron.
  - **Se copian una sola vez** a `data/imagenes-locales/` (o `LOCAL_IMAGE_DIR`), que está fuera de git y **separada de `data/imagenes`**, el almacenamiento que se sube. Volver a llamar solo baja lo que falte. Nunca se enlazan a su sitio.
  - **Nunca salen de tu computador:** no van a git, ni al almacenamiento compartido, ni a producción. Se marcan con un sticker violeta en la carta y en la ficha ("Foto solo para uso local · PokeCottage"), y quedan registradas con su fuente para el futuro informe "Listo para producción".
  - **Prioridad:** primero nuestra copia o TCGdex; una foto solo local se usa solo si la impresión no tiene ninguna de esas.
  - **Apagadas** (sin la variable), la app no las descarga, no las muestra y no sirve sus archivos: se ve igual que antes. Para borrarlas: borra la carpeta y, si quieres, `DELETE FROM arma.facts WHERE source_id IN ('pokecottage-fotos', 'limitless', 'bulbagarden')`.

- **Equivalencias:** la misma carta internacional en distintos idiomas, y la inglesa con su original japonesa cuando Bulbapedia las une. Solo agrupan; no cambian ningún conteo por sí solas.
- **Reglas** (no borran nada: lo que queda fuera se apaga en la vitrina):
  - "Mismo diseño en EE. UU., Latam y Europa: solo inglés": compara solo idiomas occidentales; si no hay inglés, deja el primero en orden alfabético.
  - "Asiáticas traducidas cuentan como la japonesa".
  - Incluir sellos, productos y mazos (la 1st Edition siempre cuenta).
  - Incluir World Championship Decks.
  - Incluir jumbo.

  Las combinaciones se guardan como **vistas** por cuenta; "Full" siempre está.
- **La Vitrina** (maqueta AE del canvas, diseño en `apps/arma/DESIGN.md` y `PRODUCT.md`): repisas por diseño, contador "bajo luz / Full", y una ficha con el código de catálogo, tus copias (leídas de tu inventario **en solo lectura**) y de dónde sale cada dato.
- **Clasificación verificada.** Las fuentes se equivocan, así que al importar se corrige lo seguro y se marca lo dudoso:
  - **Correcciones automáticas:** una "Holo" a secas (pokemontcg.io, TCGplayer, o TCGdex sin tipo de brillo) es la holo cosmos cuando PokeCottage o TCGdex con brillo dicen holo cosmos y nadie dice holo normal; las expansiones `jpn_*` de PokeCottage van en japonés y las `scn_*` en chino simplificado aunque digan "International"; un sello exclusivo de Japón (JR Stamp Rally) en una carta occidental se descarta y se cuenta como `misfiled` en el resumen; y el mismo sello con dos nombres (TCGdex "jun-hasebe", PokeCottage "world-championships-deck2007-jun-hasebe") queda con el más completo.
  - **Revisión de clasificación:** cada impresión dudosa queda "por verificar" con sus motivos (región, brillo, una sola fuente, variante sin nombre). Se ve con un icono en la etiqueta, con el filtro "Por verificar (N)" y en la ficha; también con `curl http://localhost:3002/api/audit/133`.
  - **Regla del proyecto:** al importar cualquier Pokémon nuevo, correr la revisión y comprobar cada marca contra Bulbapedia ("<Pokémon> (TCG)") y las demás fuentes antes de dar el Full por bueno (también está en `openspec/config.yaml`).
- **Fotos por variante.** Los catálogos (pokemontcg.io, TCGdex, PokeCottage) tienen una sola foto por carta, y en la era WotC es la de la 1st Edition; por eso cada foto sabe qué variante muestra:
  - **Regla automática:** una foto que comparten la versión sin sello (unlimited) y la 1st Edition de la misma carta muestra la 1st Edition.
  - **A mano:** en la ficha, "Esta foto muestra" (Automático, o una de las variantes de la carta). La marca vale para todas las impresiones con esa foto y queda con quién la hizo (`arma.photo_marks`).
  - Cada impresión muestra una foto de **su** variante: la tuya subida, luego nuestra copia o TCGdex, luego una solo local. Si no hay, muestra la de otra variante atenuada, con la nota "Foto de la 1st Edition · falta esta variante".
  - **Subir tu foto** desde la ficha (JPEG, PNG o WebP, hasta 8 MB): es dato propio (sticker azul), siempre gana, se guarda en `data/imagenes/arma/` y se puede quitar.
  - Con las fotos solo locales encendidas, el importador también busca fotos para las impresiones cuya foto no calza (Bulbapedia trae la unlimited de Jungle #51 y Neo Discovery #38; las de Team Rocket #55 y Gym Challenge #51 que trae son de la 1st Edition: márcalas en la ficha).
- **Ordenar la vitrina:** "Por diseño" (una repisa por ilustración) o "Por expansión" (una repisa por expansión en orden de salida, en una sola línea de tiempo con todas las regiones: Rocket Gang de Japón, 1997, va antes que Team Rocket, 2000). Las internacionales agrupan los idiomas occidentales; cada japonesa y cada china simplificada es propia; las traducidas al chino tradicional, tailandés, indonesio o coreano son su propia expansión, con su nombre local. La fecha es la de sus cartas, o la de su japonesa, o la del catálogo; las que no tienen van al final como "Fecha por confirmar". La elección se recuerda en el navegador.
- **Cartas en otros idiomas.** TCGdex tiene las cartas modernas en español, italiano y portugués, pero de muchas expansiones antiguas solo tiene la lista (Jungla: "64 cartas", 0 cargadas). Por eso:
  - **Español, confirmado por WikiDex** (wikidex.net, CC BY-SA 3.0, solo texto): cada página "Eevee (… TCG)" dice en qué expansiones salió la carta, y la página de cada expansión dice si salió en España (`lanzamiento = 2000 (ES)`) o `No distribuida (ES)`. Se crea la impresión en español con el acabado base de la carta. Una reimpresión con número alternativo (101a) no se confirma. Una impresión en un idioma donde Bulbapedia o WikiDex dicen que la expansión no salió queda por verificar.
  - **Idiomas y variantes por expansión, de Bulbapedia** (solo texto, CC BY-NC-SA: sticker ámbar "por revisar"): sus tablas de expansiones en otros idiomas dicen en qué idiomas salió cada expansión impresa (neerlandés, francés, alemán, italiano, portugués de Brasil, español) y en cuáles no ("—"), y la página de cada expansión dice dónde hubo 1st Edition ("in both 1st and unlimited edition") y reverse ("Reverse Holofoils"). Por cada carta se crea la versión base, y la 1st Edition o el reverse solo si la carta los tiene en inglés y Bulbapedia los nombra en ese idioma. Nunca otros sellos, ni promos, ni números alternativos (101a). Jungla #51, por ejemplo, queda en español, portugués y neerlandés, sin sello y en 1st Edition.
  - **Italiano y portugués deducidos, solo de respaldo:** para las expansiones que las tablas de Bulbapedia no incluyen, si TCGdex lista la expansión en ese idioma, se crea solo la versión base, marcada "deducida". Ojo: la lista de TCGdex incluye traducciones solo digitales (Pokémon TCG Online/Live), así que donde Bulbapedia dice que no salió impresa, no se deduce nada.
  - **Neerlandés (NL):** idioma internacional del Full; la regla "solo inglés" lo deja en penumbra como al resto.
  - **Español de España y de Latinoamérica:** son la misma carta hasta 2025. Desde *Aventuras Compartidas* (marzo de 2025) existe el español latinoamericano (`ES-MX`) como versión aparte, con otros nombres y vocabulario (Lylia/Lillie, Poké Ball/Pokébola). Viene de TCGdex, que tiene sus 11 expansiones; no se deduce.
  - El resumen de la importación cuenta lo confirmado, lo deducido, las expansiones "No distribuidas", las que no se pudieron emparejar y las que TCGdex no lista en cada idioma.
- **Datos:** esquema `arma` de la misma base (`printings`, `facts`, `sources`, `designs`, `views`, `source_cache`, `imports`), con migraciones propias en `apps/arma/server/migrations`. La app nueva solo escribe ahí. Para borrarla entera: `DROP SCHEMA arma CASCADE`.
- **Fuera de esta versión:** editar equivalencias a mano, agregar variantes propias, el informe "Listo para producción" y otros Pokémon.

## Consultas útiles

```sql
-- inventario con nombres
SELECT * FROM inventory_full ORDER BY set_code, number;

-- solo lo que está para vender
SELECT name, set_name, number, lang, qty - personal AS para_vender FROM inventory_full WHERE qty > personal;

-- especies de Kanto que tengo en español
SELECT d AS pokedex, sum(qty) FROM inventory_full, unnest(dex) d
WHERE lang = 'ES' AND d BETWEEN 1 AND 151 GROUP BY d ORDER BY d;
```

## Respaldo

`docker exec postgres-mac pg_dump -U nitsu pokemon > respaldo.sql` (con el administrador del contenedor).
Con el rol de la app (`pokemon`) las tablas por usuario tienen Row Level Security forzado: hay que respaldar y restaurar en modo sistema o `pg_dump` se niega:

```bash
docker exec -e PGOPTIONS='-c app.all_users=on' postgres-mac pg_dump -U pokemon -d pokemon -Fc --enable-row-security > respaldo.dump
docker exec -i -e PGOPTIONS='-c app.all_users=on' postgres-mac pg_restore -U pokemon -d <base-vacía> --no-owner < respaldo.dump
```

El botón **Datos ▾ → Descargar respaldo (JSON)** descarga solo los datos de tu cuenta, importable.

## Home y landing para alfa testers (`/` y `/alfa`)

`apps/web/public/landing.html` es la home: `http://localhost:3000/` la muestra a quien no tiene sesión (con sesión, `/` abre la app) y también queda en `/alfa`. Presenta la app con capturas reales (`apps/web/public/landing/*.jpg`: Mi colección, precios, Mis colecciones, Ubicaciones, Artes conectados e Ilustradores, sacadas de una copia de la base a 2×) y un formulario para postular a la alfa.
- **Duelo**: junto al título, Charizard lanza fuego a Gengar y Gengar responde con una Shadow Ball (CSS, ciclo de 6 s; se pausa fuera de pantalla y queda quieto con "reducir movimiento"; cartas en `landing/duelo-*.webp`).
- **Cómo funciona**: una demo animada de la pantalla de carga: escribe números (`1`, `25r`, `133*3`) y un nombre (`char`, con la lista de Charmander, Charmeleon y las Charizard ex y la elección con ↓), y antes de cada Enter muestra la carta en la vista previa con "Se cargará: …". Las cartas de 151 están en `landing/demo-*.webp`; con "reducir movimiento" queda estática.
- **Iniciar sesión** (arriba) y **Ya tengo cuenta · Entrar** llevan a `/entrar`, la pantalla de login de la app, que tiene "← Volver al inicio". El login es una **carpeta abierta**: en una página, 9 bolsillos con cartas reales (Charizard ex, Umbreon ex, Pikachu ex, Gengar ex, Mew ex, Espeon ex y Greninja ex, en `login/*.webp` de 320 px) que se deslizan a su lugar, y un bolsillo vacío, "Tu próxima carta", que se ilumina en dorado mientras escribes; en la otra, el formulario, que se sacude si la contraseña es incorrecta. Con mouse, la carta del bolsillo se levanta; en celular se ve una fila de 3 bolsillos sobre el formulario; con "reducir movimiento" las cartas no se mueven. Con sesión, `/entrar` lleva a `/`; al cerrar sesión vuelves a la home.
Las postulaciones quedan en la tabla `alpha_signups` (una por email; si alguien postula de nuevo se actualizan sus respuestas):

```bash
docker exec postgres-mac psql -U pokemon -d pokemon -c "SELECT created_at, name, email, handle, role, size, note FROM alpha_signups ORDER BY created_at DESC"
```

El nombre del producto es **Nitsu Collectibles** ("Nitsu" en el logo, "Collectibles" debajo); antes se llamaba "Challadex".
