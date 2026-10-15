# Proposal

## Why

El usuario no ve la Eevee de Jungla **1st Edition en español** ni la **1st Edition en portugués**. Existen: Bulbapedia dice que Jungle salió "in English, Dutch, German, French, Italian, Spanish, and Portuguese in both 1st and unlimited edition". Faltan por dos huecos nuestros:

- **No había fuente para las variantes en español y portugués.** WikiDex confirma la carta en español pero no sus variantes, y el portugués se dedujo de la lista de TCGdex. La regla acordada fue no deducir variantes que ninguna fuente confirma, así que solo existe la versión sin sello.
- **No hay neerlandés.** Jungle, Base Set y Fossil salieron en neerlandés, y el Full no tiene ninguna carta en ese idioma.

Bulbapedia tiene esto escrito, con dos tipos de dato:
- **Tablas por serie** ("List of Pokémon Trading Card Game expansions in other languages") con el nombre de cada expansión en neerlandés, francés, alemán, italiano, portugués de Brasil y español, o "—" si **no salió** en ese idioma.
- **Una frase en la página de cada expansión** con las variantes por idioma: "released in English, German, French, and Italian, in both 1st and unlimited edition" (Team Rocket), o "released in … Spanish, and Portuguese with cards also available as Reverse Holofoils" (EX Unseen Forces).

Eso permite pasar de *deducir* a *confirmar*, y sumar la 1st Edition y el reverse donde Bulbapedia los nombra.

## What Changes

- **Nueva fuente "Bulbapedia (idiomas)"**, solo texto, CC BY-NC-SA, con permiso "por revisar" como la Bulbapedia que ya usamos:
  - **De las tablas:** en qué idiomas salió cada expansión internacional, con su nombre en ese idioma, y en cuáles no ("—").
  - **De la frase de cada expansión:** en qué idiomas hubo 1st Edition y en cuáles reverse.
- **Impresiones confirmadas por expansión.** Por cada carta internacional del Full, en cada idioma donde Bulbapedia dice que salió su expansión:
  - **el acabado base**, si falta;
  - **la 1st Edition**, si la carta la tiene en inglés y la frase nombra ese idioma "in both 1st and unlimited edition";
  - **el reverse**, si la carta lo tiene en inglés y la frase dice "Reverse Holofoils" para ese idioma.

  Nunca otros sellos, ni promos.
- **Reemplaza la deducción** de italiano y portugués de las listas de TCGdex cuando Bulbapedia tiene la expansión en su tabla. La deducción queda solo para las expansiones que Bulbapedia no lista, y sigue marcada "deducida".
- **No salió en ese idioma:** si Bulbapedia dice "—", no se crea nada, y cualquier impresión que una fuente traiga en ese idioma queda "por verificar" con "Bulbapedia dice que <expansión> no salió en <idioma>". Esto generaliza el motivo de WikiDex, que solo cubría el español.
- **Neerlandés (`NL`)** pasa a ser un idioma del Full: nombre "Neerlandés", región Internacional, y la regla "Mismo diseño en EE. UU., Latam y Europa: solo inglés" lo incluye.

**Fuera del alcance:**
- Otros sellos, promos y tamaños por idioma.
- Expansiones que Bulbapedia no lista en esas tablas.
- El coreano y el chino tradicional de esas tablas ("Other"), que ya vienen de TCGdex.
- Fotos.
- Editar o corregir a mano desde la app.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `universo-de-impresiones`: la fuente "Bulbapedia (idiomas)", las impresiones confirmadas por expansión, el neerlandés, y la deducción solo como respaldo.
- `armado-de-coleccion`: el motivo "no salió en este idioma" para cualquier idioma, y el neerlandés en la vitrina y en las reglas.

## Impact

- **Migración 006:** la fuente `bulbapedia-idiomas`.
- `apps/arma/server/sources/bulbapedia-idiomas.ts` (nuevo).
- `apps/arma/server/languages.ts`: confirmación por expansión; la deducción como respaldo.
- `apps/arma/server/index.ts`: el motivo "no salió" desde el último resumen.
- `packages/core`:
  - lectura de la frase de idiomas y de las tablas, con pruebas;
  - el motivo `notReleased` con su idioma.
- `apps/arma/src/model.ts`: el neerlandés.
- **Reimportar el Full:** solo agrega impresiones en el esquema `arma`; el inventario del usuario no se toca.
- README.
