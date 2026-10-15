# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, como app aparte dentro del monorepo pnpm (`apps/arma`), con su propio puerto y solo en local por ahora. Es el stack destino que ya fija el ADR 0012 del proyecto. La app actual (`apps/web`, un `index.html` con JavaScript simple) sigue igual. Puede usar `packages/core` para las reglas de negocio puras, y la API y la base Postgres del proyecto, o servicios propios: queda por decidir en su propuesta OpenSpec.

## Users

- **Ahora:** el dueño de Nitsu Collectibles, coleccionista y vendedor chileno de cartas Pokémon TCG con ~6.000 cartas. Cura el universo de impresiones de un Pokémon (equivalencias, variantes, sellos, mazos, fuentes) y arma su propia colección a medida. Empieza por Eevee.
- **Después:** otros coleccionistas (los testers de la alfa de Nitsu), que arman su colección con reglas sobre lo que el dueño curó.
- **Situación de uso:** en el computador, en sesiones largas de investigación y armado, con tiempo y pantalla grande. El celular no es el caso principal.

## Product Purpose

Pasar del universo **Full** de un Pokémon (todas sus impresiones en todos los idiomas, con todas las variantes: acabados, sellos, mazos de Battle Academy con su número extra de color, World Championship Decks, jumbo…) a **la colección que cada coleccionista quiere tener**, con reglas claras y reversibles. Por ejemplo: "si el diseño y la variante son iguales en EE. UU., Latinoamérica y Europa, cuenta solo la de inglés".

Éxito: el dueño completa con confianza el master set de Eevee a su medida, sabe exactamente qué tiene y qué le falta, y sabe de dónde salió cada dato y si se puede usar en producción.

## Positioning

A diferencia de un checklist (como PokeCottage) o una planilla:

- **Colección a medida con reglas.** Se parte del Full y el coleccionista decide qué cuenta (idiomas, sellos, mazos, regiones), con vistas guardadas con nombre.
- **Conectada al inventario real.** Sabe qué copias tiene el usuario (idioma, estado, ubicación, si es para vender o personal) y qué le falta, con precios.
- **Procedencia de cada dato.** Cada impresión, número, foto y equivalencia dice de qué fuente viene y si su permiso alcanza para producción.
- **Todas las fuentes juntas, sin duplicados.** TCGdex, pokemontcg.io, PokeCottage, Bulbapedia, tiendas y datos propios, unidos en un solo universo.

## Operating Context

- Sesiones de escritorio: investigar fuente por fuente, revisar carta por carta, ajustar equivalencias y reglas, y comparar con el inventario.
- La unidad es la **impresión**: carta (expansión + número) × idioma × variante.
- Una **equivalencia** agrupa impresiones que solo cambian de idioma o región. Sale de los datos y se puede ajustar a mano: hay excepciones, como versiones latinoamericanas propias, World Championship Decks con otro reverso, o chinas exclusivas que reimprimen un arte japonés con otro número.
- Una **regla** reduce el Full a la colección. Una combinación de reglas se guarda con nombre ("Full", "Master set inglés", "Una por arte"…).
- Una regla ya confirmada por el usuario: si solo cambia el idioma, va la carta japonesa (o la internacional); si cambia la expansión o el número, es otra carta.
- El inventario, las colecciones actuales y los precios viven hoy en la app `apps/web` y su API (Fastify + Postgres, con datos por usuario y RLS).

## Capabilities and Constraints

- **Solo local, sin producción** por ahora. Se pueden usar todas las fuentes, aunque no tengan permiso, siempre que cada dato quede marcado con su fuente y el estado de su permiso:
  - ✅ con permiso o licencia abierta
  - ⚠️ licencia a revisar
  - ⛔ sin permiso
  - ✍️ dato propio
- **Informe "Listo para producción":** lista los datos que dependen solo de fuentes ⛔ o ⚠️ y que necesitan un permiso o un reemplazo propio.
- **Permisos conocidos:**
  - PokeCottage: solo texto ("text only"), válido para producción; **sus fotos no**.
  - TCGdex, pokemontcg.io y PokéAPI: abiertas.
  - Bulbapedia: CC BY-NC-SA, a revisar.
  - TCGplayer, Cardmarket, PikaQian y tiendas: sin permiso.
- **Interfaz en español de Chile, con lenguaje de coleccionista.** Se dice "expansión", no "set". Los nombres de rarezas y variantes son los que usan los coleccionistas (ex/V/GX, Ilustración especial, Poké Ball…), nunca jerga técnica.
- Los montos van en CLP sin decimales; los precios de mercado son en NM.
- **Por decidir:** el modelo de datos exacto y si se integra con la API actual o tiene la suya. También quién puede editar equivalencias y variantes cuando haya otros usuarios: el patrón actual es que el dueño cura lo compartido (ADR 0019).

## Brand Commitments

- Producto: **Nitsu Collectibles** (repo `pokenitsu`). Nombre de esta opción: **"Arma tu colección"**.
- La dirección visual de esta app es nueva y debe sentirse **premium**. Si resulta, se lleva de a poco a las demás vistas de Nitsu. El aspecto de `apps/web` es referencia, no obligación.

## Evidence on Hand

- La investigación de Eevee en inglés: 92 cartas y al menos 150 variantes, cruzando TCGdex y TCGplayer. Hay vacíos conocidos: las reverse de la era BW–Sun & Moon faltan en TCGdex, TCGplayer no trae sellos, y ninguna fuente tiene completos Battle Academy ni los sellos.
- Sus datos de trabajo están en el scratchpad de la sesión del 2026-10-15 y no son definitivos.
- Fotos propias de las cartas del catálogo internacional y japonés, en `data/imagenes/cards`.
- No hay testimonios, usuarios externos ni métricas: no se deben inventar.

## Product Principles

1. **El Full es la verdad; la colección es una vista.** Las reglas nunca borran datos: filtran, y se pueden deshacer.
2. **Cada dato dice de dónde viene.** Sin procedencia, un dato no está listo.
3. **El coleccionista decide qué es "la misma carta".** Las equivalencias son sugerencias que se revisan, no supuestos.
4. **Lo que tengo pesa más que lo que existe.** El inventario real guía el avance y lo que falta.
5. **Hecho para sesiones largas de curaduría.** Leer y comparar mucho sin cansarse.
