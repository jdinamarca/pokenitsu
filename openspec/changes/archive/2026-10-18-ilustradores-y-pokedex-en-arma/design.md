# Design

## Context

- **Catálogo** (al 2026-10-17):
  - 24.606 cartas con ilustrador, de 410 ilustradores, entre internacionales (`sets.source = 'ptcg'`, 20.663 cartas, todas con `image_small`) y japonesas (`tcgdex-ja`, 4.551 cartas, 888 con imagen);
  - el resto de las japonesas tiene foto solo local en `arma.card_photos` cuando `ARMA_FOTOS_LOCALES=1`;
  - `cards.dex` es `int[]`, con un número por Pokémon en los TAG TEAM, y las 1.025 especies tienen alguna carta.
- **Nitsu** (`apps/api/src/index.js`) tiene `/api/artists`, `/api/artists/cards` y `/api/dex`, solo con el catálogo internacional y sin `asViewer`. Su regla de "carta representativa" de una especie deja al final las promos, McDonald's, Rumble y los kits, y prefiere una común de nombre simple.
- **Arma:**
  - `server/inventory.ts` ya resuelve las fotos con `pickCardPhotos` (`photoOrder.ts`) y la imagen de referencia;
  - `server/details.ts` (#87) tiene `speciesNames()`, la lista de PokéAPI en cache, con los nombres en japonés y en inglés;
  - el front usa `router.ts` (`usePath`, `navigate`), `Shell` con el riel, `CardPicture` y la vitrina de fieltro de Mi inventario.

## Goals / Non-Goals

**Goals:**
- Dos pantallas que se sientan como una exposición: pocas palabras, la carta en primer plano y movimiento con propósito.
- Respuestas rápidas: una sola consulta por pantalla, sin pedir nada a fuentes externas.
- Solo lectura, y por cuenta: el "tengo" de cada cuenta sale de su inventario, con la RLS.

**Non-Goals:**
- Paridad con Nitsu (favoritos, niveles, kits).
- Imágenes nuevas: solo se usan las que Arma ya muestra.

## Decisions

1. **Cuatro rutas en `server/gallery.ts`**, todas con `requireViewer` y `asViewer`, y con `scope` = `all`, `intl` o `ja` (por defecto `all`):
   - `GET /api/artists`: `[{name, total, mine, from, to, cover}]`. `total` son las cartas distintas del ilustrador en el scope, y `mine` las que tienen alguna copia en el inventario de la cuenta. `from` y `to` son el primer y el último año. `cover` es la imagen de la carta tuya más reciente o, si no tienes ninguna, la de la carta más nueva de una expansión regular (como en Nitsu).
   - `GET /api/artists/cards?name=`: las cartas del ilustrador con su expansión (id, nombre, código, fecha), número, nombre, qty de la cuenta y foto.
   - `GET /api/pokedex`: `[{dex, name, ja, total, mine, img}]` para las 1.025 especies. `img` es la imagen de la carta tuya más reciente de la especie o, si no, la representativa (regla de Nitsu, extendida a las japonesas cuando el scope es `ja`).
   - `GET /api/pokedex/:dex`: las cartas donde aparece esa especie (`$1 = ANY(c.dex)`), con lo mismo que las del ilustrador.

   Las fotos de las galerías usan `pickCardPhotos`, igual que Mi inventario. El "tengo" se calcula con `EXISTS` sobre `inventory` dentro de `asViewer`, así que la RLS deja solo las copias de la cuenta.

2. **Lógica pura en `packages/core/src/gallery.ts`, con pruebas:**
   - `REGIONS`: Kanto 1–151, Johto 152–251, Hoenn 252–386, Sinnoh 387–493, Teselia 494–649, Kalos 650–721, Alola 722–809, Galar 810–905 (Hisui incluido) y Paldea 906–1025;
   - `regionOf(dex)`;
   - `shelvesBySet(cards)`, que agrupa por expansión de la más nueva a la más antigua, con `mine/total`;
   - `filterOwned(cards, 'all' | 'mine' | 'missing')`;
   - `sortArtists(list, order)`.

3. **Rutas del front.** `/ilustradores`, `/ilustradores/<nombre codificado>`, `/pokedex`, `/pokedex/<región>` y `/pokedex/<n>`. El selector de scope va en la query (`?ver=intl`), así el botón Atrás vuelve al mismo lugar. `main.tsx` pasa a reconocer prefijos.

4. **Diseño** (se afina con las skills de diseño y de animación instaladas):
   - **Galería de firmas:**
     - tarjetas de 220×150 sobre la sala;
     - el nombre en una tipografía de firma (itálica serif variable, por ejemplo Fraunces, con `@fontsource`, sin CDN);
     - los años en versalitas apagadas;
     - el anillo SVG de avance con la cifra condensada (Archivo Narrow tabular);
     - al pasar el mouse, la portada aparece detrás, atenuada e inclinada unos grados, con `--ease-out`, y se pide solo en ese momento (`<img>` montado al hover o al foco).
   - **Pokédex:**
     - pestañas de región con su avance en una barra fina;
     - ventanitas de 120×168 con la carta recortada al arte (`object-position` arriba), el número en cifras condensadas y el nombre en inglés, con el japonés debajo;
     - las que no tienes, en `grayscale(1)` con contraste bajo; las tuyas, a color con un brillo cálido.
   - **Galería:** la vitrina de fieltro de Mi inventario, con una repisa por expansión.
     - Las cartas faltantes van en `grayscale(1) opacity(.55)`. Al pasar el mouse sobre una faltante, asoma el color a medias, como un "así se vería".
     - Las tuyas llevan una insignia "×2".
     - La entrada es escalonada solo en la primera pantalla.
     - Con "reducir movimiento" no hay entrada ni inclinación.
   - **Rendimiento:**
     - imágenes `loading="lazy"`;
     - la Pokédex muestra una región a la vez (151 como máximo);
     - una galería grande (Ken Sugimori tiene 1.286 cartas) se pinta por repisas con `content-visibility: auto`.

5. **El nombre del Pokémon.** Se muestra el nombre en inglés de PokéAPI, que en español es el mismo, con el japonés en kana debajo. Si la lista de PokéAPI no está en cache, se pide una vez con `speciesNames()` del #87. Si falla, se muestra el número.

## Risks / Trade-offs

- **[Japonesas sin foto cuando las fotos locales están apagadas]** Se ven con la imagen de referencia de la especie, atenuada, como en Mi inventario.
- **[Un ilustrador escrito distinto en dos fuentes]** Hoy no hay duplicados que difieran solo en mayúsculas. Se agrupa por el texto exacto y se revisa la lista en la verificación.
- **[Consultas pesadas]** Las de 24.000 cartas son agregaciones simples sobre índices existentes (`cards.set_id`, `inventory.card_id`). Se miden en la copia; la meta es menos de 300 ms.
- **[Una carta de varios Pokémon]** Cuenta en la Pokédex de cada uno.
