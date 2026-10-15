# Proposal

## Why

Las colecciones de hoy cuentan una carta por espacio y no saben de idiomas, sellos ni mazos. Tampoco dicen de dónde sale cada dato. El usuario quiere armar su master set de Eevee a medida:

1. Partir de **todas** las impresiones que existen (el **Full**: carta × idioma × variante, con sellos, Battle Academy, World Championship Decks y jumbo).
2. Reducirlas con **reglas** propias, por ejemplo "si el diseño y la variante son iguales en EE. UU., Latinoamérica y Europa, solo la de inglés".
3. Saber de qué fuente sale cada dato y si su permiso alcanza para producción.

Eligió hacerlo como una **opción completamente nueva**, "Arma tu colección", con un diseño premium. La maqueta elegida es la **AE · Vitrina de tienda** del canvas, con su contrato de dirección en `apps/arma/.impeccable/surfaces/index-html.md` y el producto descrito en `apps/arma/PRODUCT.md`.

PokeCottage autorizó usar el **texto** de sus master sets, también en producción, pero **no sus fotos**. Por ahora todo corre **solo en local**, así que se pueden usar todas las fuentes, siempre que cada dato quede marcado con su procedencia.

## What Changes

- **App nueva `apps/arma`:** Vite + React + TypeScript, en su propio puerto. Lleva una **API propia** pequeña (Fastify) que guarda sus datos en un esquema aparte, **`arma`**, de la misma base Postgres. Lee el inventario real del usuario **en solo lectura** y no modifica nada de la app actual.
- **El Full de Eevee**, armado con cuatro fuentes. Cada dato guarda su fuente y el estado de su permiso:
  - **TCGdex**, en todos sus idiomas: cartas, variantes detalladas y sellos. ✅
  - **pokemontcg.io** (catálogo actual): cartas internacionales y fotos. ✅ Las **variantes y precios de TCGplayer** que ya guarda la base van marcados ⛔.
  - **PokeCottage**, el master set de Eevee: 301 cartas y 435 entradas, **solo texto**. ✅ Sus fotos no se usan.
  - **Bulbapedia** (página "Eevee (TCG)"): 73 diseños y 142 impresiones en inglés y japonés, para las equivalencias entre regiones. ⚠️ CC BY-NC-SA.
- **Equivalencias automáticas:** se agrupan las impresiones que solo cambian de idioma o región, según lo que dicen las fuentes. Cada grupo indica qué fuente lo respalda.
- **Reglas y vistas guardadas:** las reglas reducen el Full **sin borrar nada**. Las combinaciones se guardan con nombre ("Full", "Master set inglés"…).
- **La Vitrina:**
  - Riel con las reglas y las vistas.
  - Contador "bajo luz / Full".
  - La vitrina por diseño: lo que sale por una regla queda **en penumbra**.
  - Ficha de la impresión elegida, con su código de catálogo, foto, copias en el inventario y la procedencia de cada dato.
- **ADR nuevo:** por qué es una app aparte con su propio esquema, y cómo se modela la procedencia.

**Fuera del alcance (v1):**
- Editar equivalencias a mano y agregar variantes propias (por ejemplo, un mazo de Battle Academy que ninguna fuente tiene).
- El informe "Listo para producción". Los permisos ya quedan guardados para hacerlo después.
- Otros Pokémon. El modelo es general, pero solo se importa Eevee.
- Producción, despliegue o cuentas de otros usuarios. Las sesiones existentes se usan para saber de quién es el inventario, nada más.
- Las fotos de PokeCottage, Bulbapedia o tiendas. Las fotos vienen solo de nuestras copias propias y de TCGdex.
- Cambiar la app actual (`apps/web`, `apps/api`) o sus datos, y escribir en el inventario desde la app nueva.
- Las cartas chinas, tailandesas e indonesias como cartas propias (cambio `cartas-asiaticas`). En v1 entran solo si alguna de las cuatro fuentes las trae (PokeCottage trae 93 chinas).

## Capabilities

### New Capabilities

- `universo-de-impresiones`: el Full de impresiones de un Pokémon, importado desde varias fuentes, con procedencia y estado de permiso por dato, y equivalencias automáticas entre idiomas y regiones.
- `armado-de-coleccion`: reglas y vistas guardadas que reducen el Full a la colección del usuario, la pantalla Vitrina, la ficha de impresión y el cruce con el inventario real.

### Modified Capabilities

(ninguna)

## Impact

- **Nuevo:** `apps/arma` (front Vite + React y API Fastify) y el esquema Postgres `arma`, con migraciones propias.
- **Lectura sin cambios:** `cards`, `sets`, `card_prices`, `inventory` (con la RLS del usuario) y la tabla `session` de Better Auth.
- `packages/core`: reglas puras del Full (equivalencias, aplicar reglas, código de catálogo), con pruebas.
- `package.json` raíz: un comando para levantar la app nueva.
- `docs/adr/0020-…`: el ADR nuevo.
- `README.md`.
- Servicios externos: TCGdex, PokeCottage (CDN de datos) y la API de MediaWiki de Bulbapedia. Se consultan con calma, con caché y con el User-Agent de Nitsu.
