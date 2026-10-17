# Tasks

## 1. Reglas en core

- [x] 1.1 `groupSets(sets, 'ja' | 'intl')` en `packages/core` (series por `eraOf`, ordenadas por su expansión más nueva; dentro, de la más nueva a la más antigua y sin fecha al final). Pruebas:
  - las japonesas `PMCG1–4` quedan juntas en "Base";
  - Scarlet & Violet va antes que Sword & Shield;
  - una sin fecha va al final de su serie.
- [x] 1.2 `nameQuery(raw)` y `matchesCardName(q, card)` en `packages/core`. Pruebas:
  - `meow` encuentra "Meowth" por `name_en`;
  - `ニャース` encuentra por `name`;
  - `nidoran` encuentra "Nidoran ♀";
  - `mr mime` y `MR. MIME` encuentran "Mr. Mime";
  - `es`, `nm`, `25r` y `1-30` dan `null`.

  Verificar con `pnpm --filter @pokenitsu/core test`.

## 2. API

- [x] 2.1 `GET /api/sets/progress` (con sesión y RLS de la cuenta): `{ setId: cartas distintas con copias }`. Verificar con `curl` en una copia de la base: el dueño ve su avance y una segunda cuenta, `{}`.
- [x] 2.2 `name_en` en `GET /api/sets/:id/cards`, con el mapa `dex → nombre` en memoria. Para varios Pokédex, los nombres van unidos por " & ". Verificar con `curl`: en `ja-PMCG4`, la #047 trae `name_en: "Meowth"` y los Entrenadores no lo traen.

## 3. Pantalla

- [x] 3.1 `components/SetPicker.tsx`:
  - botón de la cabecera y panel con buscador, pestañas, recientes, series y avance;
  - teclado: ↑↓, Enter, Esc y `/`;
  - estilos en `styles.css` con los tokens del tema, y pantalla completa en el teléfono.

  `Cargar.tsx` sin `picking`: "Buscar otra expansión" y Esc con la caja vacía abren el panel. Verificar typecheck y lint.
- [x] 3.2 Filtro por nombre en `Cargar.tsx`:
  - `shown` con `matchesCardName`;
  - contador "N cartas con «q»";
  - mensaje sin coincidencias;
  - Enter: una carta se carga, varias o ninguna dan un aviso;
  - ficha lateral con una o con varias.

  Verificar typecheck y lint.
- [x] 3.3 En Chrome sin interfaz, contra una copia de la base:
  - el botón abre el panel en "Japonesas" con la sesión en japonés;
  - la serie Base tiene PMCG1–4 con su avance;
  - buscar `MEW ES` y Enter elige 151 en español;
  - Esc cierra el panel;
  - en Rocket Gang, `meow` deja solo la #047 y Enter carga una copia (la cuenta y el contador suben);
  - en Leaders' Stadium, `vulpix` deja #017 y #018, y Enter no carga;
  - `es` cambia el idioma sin filtrar;
  - "Buscar otra expansión" del riel abre el panel;
  - a 390 px de ancho, el panel ocupa la pantalla y no hay scroll horizontal;
  - sin errores de JS.

  Deshacer lo cargado y comprobar que la base real no cambió.

## 4. Documentación y cierre

- [x] 4.1 README (Cargar en arma: el selector, el avance, buscar por nombre) y DESIGN.md de arma (el botón y el panel). Verificar leyendo ambas secciones.
- [x] 4.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Borrar la copia de la base y confirmar que se borró.

## Workflow follow-up

- PR contra `main`; merge solo a pedido; después, archivar este cambio.
