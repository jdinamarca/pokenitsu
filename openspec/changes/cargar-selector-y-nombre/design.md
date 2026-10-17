# Design

## Context

- **Cargar (`apps/arma/src/Cargar.tsx`):** un solo `<input>` con dos modos (`picking`).
  - **En modo búsqueda**, filtra `sets` con `searchSetsLang` (core) y muestra una lista desplegable.
  - **En modo carga**, `resolveEntry(text, index)` (core) da `empty | lang | cond | card | range | missing | bad`.
  - El riel tiene las recientes (`localStorage` `arma.cargar`) y "Buscar otra expansión", que abre el modo búsqueda.
- **`GET /api/sets`:** devuelve todas las expansiones (343: 176 internacionales y 167 japonesas) con `name`, `name_ja`, `series`, `code`, `date`, `printed`, `sym` y `lang`.
  - De las japonesas, 127 vienen sin serie. `eraOf` (core) se la deduce del código: `PMCG*` → Base, `SM*` → Sun & Moon, etc.
  - Algunas antiguas no tienen fecha (Expansion Pack, Mystery of the Fossils).
- **`GET /api/sets/:id/cards`:** cada carta trae `name` en el idioma de la expansión (ニャース en las japonesas) y `dex`.
- **Nombre en inglés de un Pokémon:** el catálogo internacional lo tiene. `mode() WITHIN GROUP (ORDER BY name)` sobre las cartas de Pokémon de un solo Pokédex en expansiones no japonesas da el nombre de la especie. Comprobado: 25 → Pikachu, 52 → Meowth, 83 → Farfetch'd, 122 → Mr. Mime, 29 → Nidoran ♀.
- **Nitsu** tiene su propia copia de `resolveEntry` en `apps/web/public/index.html`. Cambiar la de core no lo afecta, pero se mantiene compatible igual.

## Goals / Non-Goals

**Goals:**
- Un lugar obvio para elegir o cambiar la expansión, que sirva para buscar y también para recorrer.
- Escribir un nombre y ver de inmediato si la carta está en la expansión.

**Non-Goals:**
- Buscar cartas en todo el catálogo.
- Cambiar la sintaxis de carga.

## Decisions

### 1. El selector es un panel propio (`components/SetPicker.tsx`); la entrada pierde el modo
- **Botón:** en la cabecera, `.set-button`, en lugar del bloque `.setname`. Muestra el nombre, el idioma, el código y el año, con un chevron. Sin expansión elegida, dice "Elige una expansión" y el panel se abre solo.
- **Panel:** un `dialog` no modal, anclado bajo el botón, de unos 520 px de ancho y 70 vh de alto, que en el teléfono ocupa toda la pantalla. Tiene buscador con foco automático, pestañas "Internacionales" / "Japonesas" y una lista con scroll.
- **Teclado:** ↑↓ recorren los resultados visibles, Enter elige y Esc cierra (y devuelve el foco a la entrada). `/` lo abre desde cualquier parte de Cargar, salvo mientras se escribe en otro campo.
- **Con texto en el buscador:** se muestran los resultados de `searchSetsLang` de las dos pestañas, con su idioma. Es el mismo criterio de hoy, sin límite de 14: hasta 50.
- **Sin texto:** se ven las recientes (hasta 8) y la pestaña elegida, agrupada por serie.
- En `Cargar.tsx` desaparecen `picking`, `query` y `results`. Esc con la caja vacía llama a `openPicker()`, que ahora abre el panel.

*Alternativa descartada:* la página de expansiones en grilla. El usuario eligió el selector arriba.

### 2. Agrupar por serie: `groupSets` en core
`groupSets(sets, lang: 'ja' | 'intl')` devuelve `{ era, sets }[]`.
- Divide por `lang === 'JA'`, agrupa por `eraOf(s)` (o "Otras" si no tiene) y ordena las series por la fecha de su expansión más nueva.
- Dentro de cada serie, ordena de la más nueva a la más antigua. Las que no tienen fecha van al final de su serie, por código.

Va en core, con pruebas, porque es una regla de cómo se presentan los datos y también le sirve a Nitsu.

### 3. Avance por expansión: `GET /api/sets/progress`
Una consulta con RLS de la cuenta (`asViewer`):

```sql
SELECT k.set_id, count(DISTINCT k.number_norm)::int AS have
FROM inventory i JOIN cards k ON k.id = i.card_id WHERE i.qty > 0 GROUP BY 1
```

Devuelve `{ [setId]: have }`, con el mismo criterio de "encendida" que `litCount`: cartas distintas de las que se tiene al menos una copia. El panel lo muestra como `have/printed` (o `have/total` si no hay impreso), y nada si `have` es 0, para no llenar la lista de "0/…".

Se pide al abrir el panel la primera vez y otra vez después de cada carga (se invalida en `enqueue`). Es barato: el inventario son decenas o miles de filas.

### 4. Nombre en inglés en las cartas: `name_en`
`GET /api/sets/:id/cards` agrega `name_en` a cada carta con un solo Pokédex. Sale de un mapa `dex → nombre` que el servidor arma con la consulta de `mode()` la primera vez y guarda en memoria mientras corre. El catálogo internacional no cambia en una sesión.

Las cartas sin Pokédex (Entrenadores, Energías) o con varios (TAG TEAM) no traen `name_en`. Con varios, se agregan los nombres unidos por " & ", así que "pikachu" encuentra "Pikachu & Zekrom-GX".

### 5. Leer un nombre: `nameQuery` y `matchesCardName` en core
- **`nameQuery(raw)`:** devuelve el texto normalizado si lo escrito no tiene dígitos, tiene al menos 2 letras y no es un idioma ni un estado. Si no, `null`.
  - Normalizar es pasar a NFKC, minúsculas, sin tildes ni signos (♀/♂ incluidos), sin espacios repetidos y con las katakana de ancho completo.
  - Arma la usa solo cuando `resolveEntry` dice `bad`, así que la sintaxis de siempre gana: `es` es idioma y `25r` es carga.
- **`matchesCardName(q, {name, name_en})`:** contiene `q` en el nombre normalizado o en `name_en` normalizado.

No se toca `resolveEntry`, así que todo lo que hoy funciona sigue igual.

### 6. La vitrina filtrada y Enter
- `shown` se calcula así: `onlyMissing` (como hoy) y, si hay `nameQuery`, las que cumplen `matchesCardName`.
- La cabecera muestra "N cartas con «q»" en lugar del contador de encendidas mientras se filtra. Si no hay ninguna, la vitrina dice "Ninguna carta de {expansión} se llama «q»".
- **Enter con nombre:**
  - con una sola carta, `runOne(num, {qty:1, v:null…})` con la variante automática, y se borra lo escrito;
  - con varias, el aviso "Hay N cartas con «q»: elige una con clic o escribe su número";
  - con ninguna, el aviso de que no hay.
- **La ficha lateral:** con una sola carta muestra "Cargar una: …" igual que con un número. Con varias, "N cartas: clic en una para marcarla".

## Risks / Trade-offs

- **[Un nombre que también es sintaxis]** → `resolveEntry` decide primero. Los únicos choques posibles son nombres de 2 letras que son códigos de idioma o estado, y no hay Pokémon así ("Mew" tiene 3).
- **[Nombres en inglés que no están en el catálogo internacional]** (Pokémon solo japoneses o muy nuevos) → No traen `name_en` y se encuentran por su nombre japonés. Es raro, y se puede completar con PokéAPI en otro cambio.
- **[El panel con 343 expansiones]** → Pestañas, agrupado por serie y con scroll. Se pinta una sola vez por apertura, sin problema de rendimiento a ese tamaño.

## Migration Plan

Sin migraciones ni datos nuevos. Para volver atrás, se revierte el PR.
