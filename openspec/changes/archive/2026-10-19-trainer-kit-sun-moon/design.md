# Design

## Contexto

Battle Academy ya funciona así (`mazos-y-campeonatos-de-la-familia`):
- `battleAcademy.ts` lee las páginas de Bulbapedia y las convierte en una lista de `{ year, deck, deckNo, name, setKey, number }`;
- `battleAcademyClaims` (core) convierte lo que traen las fuentes y agrega una impresión `bulbapedia-mazos` por carta de la especie.

El kit de Sun & Moon de 2018 tiene la misma forma en Bulbapedia: `{{Halfdecklist/nmheader|title=Alolan Ninetales Half Deck}}` y entradas `{{Halfdecklist/nmentry|26|{{TCG ID|Ultra Prism|Eevee|104}} <small>'''[Ultra Prism 104/156]'''</small>|…}}`.

## Decisiones

- **Una lista con un campo de tipo de mazo.** `BattleAcademyCard` (y `ListedCard`) suman `kit?: string`, que vale `'sm'` en las cartas del kit. `year` sigue siendo el año (2018).
  - El sello y el nombre los arma `deckStamp` / `deckLabel`: `tk-sm-alolan-ninetales-26` y "Trainer Kit Sun & Moon · Mazo Alolan Ninetales #26" cuando hay `kit`; `ba-…` como hoy cuando no.
  - `variantLabel` reconoce `tk-sm-…` como reconoce `ba-…`, para el caso sin nombre de la fuente.
  - Se descartó una lista aparte con su propio paso del importador: repetiría la conversión y el respaldo de Battle Academy.
- **El nombre del mazo:** el encabezado "Alolan Ninetales Half Deck" pierde " Half Deck" (Battle Academy ya quita " Deck").
- **Acabado:** la nota `[SM Promo 128; Water Web Holofoil]` da `finish: 'holo'` cuando dice "Holofoil" sin "Non". Si la nota no lo dice, vale la regla de hoy (holo para V/ex/GX; si no, normal). Va en `ListedCard.finish?`.
- **Idiomas:** la página del kit dice "are released in English, German, French, Italian, Spanish, and Portuguese". Se lee esa frase y se mapea a códigos (EN, DE, FR, IT, ES, PT). Cada carta de la especie suma una impresión por idioma, respaldada por `bulbapedia-mazos`. Si la frase no está, solo inglés. Battle Academy no cambia: solo inglés.
  - Las cartas que solo respalda Bulbapedia quedan "Por verificar" por la regla que ya existe.
- **PokeCottage:** `pc:tk11a` / `pc:tk11b` con su número del mazo. Se busca en la lista del kit la carta de la especie con ese `deckNo` (en cualquiera de los dos mazos; el número más la especie la identifican). El acabado sale del ref (`-holo`), como en Battle Academy. Si no hay ninguna, queda como vino.
  - Se descartó usar la letra `a`/`b` para elegir el mazo: PokeCottage no documenta cuál es cuál, y el número más la especie bastan.
- **Búsqueda de expansiones:** `searchSets` suma el puntaje 5. Lo reciben las expansiones con todas las palabras de la búsqueda (separadas por espacios, plegadas a minúsculas y sin tildes) en `nombre + serie + era + nombre japonés`. Los puntajes 0–4 no cambian, así que ningún resultado anterior se mueve.
- **Fuente:** se actualiza la nota de `bulbapedia-mazos` con una migración de datos chica en Arma (012), que también cubre el Trainer Kit. La licencia es la misma (CC BY-NC-SA, solo local).

## Riesgos

- Que Bulbapedia cambie la frase de los idiomas: en ese caso queda solo inglés, sin error.
- El otro kit de Sun & Moon (Lycanroc / Alolan Raichu) tiene números propios y ya está en el catálogo como `td-tk-sm-l` / `td-tk-sm-r`. No se toca.
