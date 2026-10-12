# Inventario Pokémon

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
- Para cargar desde el celular en tu wifi: `HOST=0.0.0.0 pnpm start` y abre `http://<ip-de-tu-mac>:3000`
  (ojo: no tiene login, cualquiera en tu red podría usarlo).

## Cargar cartas

Eliges la expansión (como sale impresa en la carta, ej. `MEW ES`) y escribes números + Enter:

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
| `packages/core` | Reglas de negocio puras en TypeScript, sin red ni base de datos: precios (`pickPrice`, `parseUsd`), carga (`parseEntry`), rarezas y tipo de carta (ex/V/GX…), series, ubicaciones (gana la más específica) y slots de colección. |

`pnpm build` compila `packages/core` en dos formatos: un módulo para la API (`import { pickPrice } from '@pokenitsu/core'`) y `apps/web/public/core.js`, que el front carga como `window.Core` (archivo generado, fuera de git).

```bash
pnpm test        # pruebas de packages/core (Vitest)
pnpm typecheck   # tipos
pnpm lint        # ESLint + Prettier
pnpm --filter @pokenitsu/core format   # formatea packages/core
```

Las pruebas siguen los escenarios de `openspec/specs/` y además comparan `core` con una copia congelada del código anterior (`packages/core/test/legacy/`) sobre todo el catálogo (`test/fixtures/catalog.json`, solo datos públicos). GitHub Actions corre build, tipos, lint y pruebas en cada push y pull request.

## Venta vs. colección personal

Cada fila del inventario tiene `qty` (copias) y `personal` (cuántas de esas copias son para ti, no para vender).
Los kits de la pestaña Pokédex solo cuentan las copias para vender.

## Estado de las cartas

Cada fila del inventario tiene un `cond`: NM (por defecto), LP, MP, HP o DMG. Copias de la misma carta en distinto estado son filas distintas.
En **Cargar**, escribe `lp` (o toca el botón) para cambiar el estado de lo que sigues cargando, y `nm` para volver; `25r lp` aplica el estado solo a esa carta.
En **Mi colección → Tabla** puedes cambiar el estado de algunas o todas las copias de una fila.

## Precios

- Cartas internacionales: [pokemontcg.io](https://pokemontcg.io) entrega el precio de mercado de TCGplayer (USD) y la tendencia de Cardmarket (EUR) por variante.
- Si pokemontcg.io no tiene precio (expansiones recién salidas), se usa el catálogo en inglés de TCGdex como respaldo: la expansión se busca por nombre y código, y queda guardada en `sets.tcgdex_en`.
- Japonesas: [TCGdex](https://tcgdex.dev) (Cardmarket, EUR).
- Se convierten a CLP con el tipo de cambio de exchangerate-api.com (respaldo: mindicador.cl).
- Se descargan solas en segundo plano para las cartas del inventario y de las checklists, y se renuevan una vez al día (`card_prices`).
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

## Ubicaciones (cajas y carpetas)

Cada fila del inventario tiene una ubicación (`inventory.loc`, 0 = sin ubicación), así que copias de la misma carta pueden estar en lugares distintos.
- **Las ubicaciones** (`locations`) tienen una regla que decide qué cartas van ahí: series o expansiones, región, rarezas especiales o precio mínimo, y copias personales o para vender. Al cargar (🪄 Automático), entre las ubicaciones que aceptan la carta gana la más específica: colección personal > especiales/precio > expansión nombrada > serie nombrada > solo challa > región > caja general. Si empatan, gana la que está más arriba en **Ubicaciones**.
- **Cuando se conoce el precio** de una carta recién cargada y la manda a otra ubicación (por ejemplo, la carpeta de lo que pasa de $5.000), se mueve sola.
- **Orden sugerido:** cajas de challa por expansión (en orden de salida) y dentro por número, con un separador por expansión. Carpetas aparte para lo valioso y para la colección personal.
- **Al cerrar un lote de venta** se sacan las copias de donde estén, y se recuerda de dónde (`lot_items.taken`) para que al reabrir vuelvan ahí. **📍 Lista para buscar las cartas** copia la lista ordenada por ubicación.
- El respaldo JSON y el CSV llevan la ubicación por nombre.

## Fotos por variante

Si la foto del catálogo no corresponde, puedes cambiarla para esa variante: tocando la imagen en **Mi colección** o con **📷** en la vista previa de Cargar. Sirve un link o una foto de tu carta (se guarda en `apps/web/public/art/`, tabla `variant_images`). Un ejemplo: en todas las fuentes públicas, el Eevee de Jungle Unlimited aparece con la foto de la 1st Edition.
Las variantes especiales de una checklist (1st Edition, Poké Ball, misprints…) usan automáticamente la foto de la checklist.

## Mis colecciones (ej. todos los Eevee)

Una carta = una expansión + número. Las internacionales (pokemontcg.io) son la misma carta en inglés,
español, portugués…; la colección elige en qué idioma cuentan. Las japonesas vienen de TCGdex
(sets `ja-*`) y las que no están en ningún catálogo (ej. chinas) se agregan a mano (sets `x-<idioma>-*`).

Una colección puede **seguir una checklist de PokeCottage** (ej. https://pokecottage.com/pokemon-master-sets/eevee):
entonces solo cuentan las cartas de esa lista. Cada carta se busca en el catálogo (internacionales en pokemontcg.io,
japonesas en TCGdex); las que no están se crean en sets `pc-*` con las imágenes de PokeCottage.
Las cartas donde el Pokémon no es el protagonista (entrenadores, otros Pokémon) van como **cameos**
(`collection_cards.role = 'cameo'`), con su propio contador.

Con checklist, cada **variante** es un espacio aparte (Jungle Eevee: Unlimited, 1st Edition, 1st Edition d Misprint),
igual que en PokeCottage. La variante del inventario es `normal`, `holo`, `reverse` o el slug de la checklist
(`firstedition`, `pokeballholo`, `masterballholo`, `pokemoncardgym`…; nombres en `variant_labels`).
En Cargar: `25e` 1st Edition, `25p` Poké Ball, `25m` Master Ball; las demás se agregan con ＋1 desde la colección.

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

`docker exec postgres-mac pg_dump -U nitsu pokemon > respaldo.sql`
(o el botón **Respaldo** en la página, que descarga un JSON importable).

## Landing para alfa testers (`/alfa`)

`apps/web/public/landing.html` (servida en `http://localhost:3000/alfa`) presenta la app con capturas reales (`apps/web/public/landing/*.jpg`) y un formulario para postular a la alfa.
Las postulaciones quedan en la tabla `alpha_signups` (una por email; si alguien postula de nuevo se actualizan sus respuestas):

```bash
docker exec postgres-mac psql -U pokemon -d pokemon -c "SELECT created_at, name, email, handle, role, size, note FROM alpha_signups ORDER BY created_at DESC"
```

El nombre "Challadex" es provisorio. Antes de publicar: la app todavía no tiene login ni separa datos por usuario, así que cada alfa tester necesitaría su propia instancia o hay que agregar cuentas.
