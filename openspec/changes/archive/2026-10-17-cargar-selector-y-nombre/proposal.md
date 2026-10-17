# Proposal

## Why

En Cargar de arma no queda claro cómo elegir una expansión.
- **Hoy:** la búsqueda vive escondida en el mismo cuadro donde se escriben los números. Se llega con "Buscar otra expansión" en el riel o con Esc, y el cuadro cambia de modo sin avisar.
- **Las recientes:** quedan en el riel, separadas de la búsqueda.
- **Sin buscar, no hay lista:** no hay forma de recorrer las expansiones, por ejemplo "las japonesas de la era Base".

Además, con una expansión abierta, el usuario quiere escribir el nombre de un Pokémon ("meowth") y ver esa carta para decidir si la carga. Hoy la entrada solo entiende números.

El usuario eligió dos opciones:
- **"Selector arriba":** la expansión es un botón en la cabecera que abre un panel con buscador y lista.
- **"Filtrar la vitrina":** escribir un nombre deja en la vitrina solo las cartas que coinciden.

## What Changes

**Selector de expansión en la cabecera:**
- La expansión elegida pasa a ser un **botón** en la cabecera, con el nombre, el idioma, el código y el año. Al tocarlo, con `/` o con Esc en la caja vacía, se abre un **panel**.
- El panel tiene:
  - un **buscador**, con los mismos criterios de hoy (código con sufijo de idioma, nombre, serie);
  - las **recientes** primero;
  - la **lista de expansiones agrupada por serie** (era), de la más nueva a la más antigua, con dos pestañas: **Internacionales** y **Japonesas**. Se abre en la pestaña del idioma de la sesión.
- Cada expansión muestra su código, el año y el **avance de la cuenta**: cuántas cartas distintas tienes de cuántas impresas, por ejemplo "3/65".
- Se elige con clic o con ↑↓ y Enter, y Esc cierra el panel.
- El cuadro de entrada queda **solo para cargar**: deja de cambiar de modo. En el riel siguen las recientes, como hoy, y "Buscar otra expansión" abre el mismo panel.

**Buscar una carta por nombre en la vitrina abierta:**
- Si lo escrito no es un número, un rango, un idioma ni un estado, se lee como **nombre**.
- La vitrina muestra **solo las cartas que coinciden**, en orden y con el contador "N cartas con «meowth»".
- **Qué coincide:** el nombre de la carta tal como está en el catálogo (en japonés en las japonesas: ニャース) y el **nombre en inglés del Pokémon**, sacado del Pokédex de la carta. Así, "meowth" encuentra la ニャース de Rocket Gang y "vulpix", las dos タケシのロコン de Leaders' Stadium.
- No distingue mayúsculas, tildes ni signos, y basta con un pedazo del nombre ("meow").
- **Para cargar:**
  - si queda **una sola**, Enter carga una copia con los ajustes de la sesión, con la variante automática de siempre;
  - si quedan varias, se carga con clic, como hoy (un clic marca y el segundo carga), o escribiendo el número.
- Borrar lo escrito vuelve a mostrar toda la vitrina.

**Fuera del alcance:**
- Cambiar la sintaxis de números, rangos, idioma y estado, o cómo se elige la ubicación.
- Buscar por nombre fuera de la expansión abierta. Buscar una carta en todas las expansiones queda para otro cambio.
- Logos o imágenes de las expansiones en el panel: se usa el símbolo que ya trae el catálogo, cuando lo hay.
- Nitsu: su pantalla de carga no cambia.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `carga-en-la-vitrina`: elegir la expansión pasa a ser un selector en la cabecera, con panel, pestañas por idioma, series y avance. La entrada acepta además el nombre del Pokémon, que filtra la vitrina, y Esc con la caja vacía abre el selector.

## Impact

- **Código:**
  - `apps/arma/src/Cargar.tsx`: el selector, el filtro por nombre y la entrada sin modos;
  - un componente nuevo, `SetPicker.tsx`, y sus estilos en `styles.css`;
  - `apps/arma/server/inventory.ts`:
    - `GET /api/sets/progress`, con el avance por expansión de la cuenta y respetando RLS;
    - `name_en` en las cartas de `GET /api/sets/:id/cards`.
  - `packages/core`: cómo coincide un nombre (`matchesCardName`) y cómo se agrupan las expansiones para el panel (`groupSets`), con pruebas.
  - README y DESIGN.md de arma.
- **Datos:** ninguno. Solo lectura: el avance sale del inventario de la cuenta, y el nombre en inglés, del catálogo. El inventario del usuario no se toca.
- **Externo:** nada. Todo sale de la base local.
