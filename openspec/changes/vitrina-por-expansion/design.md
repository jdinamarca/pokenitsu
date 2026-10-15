# Design

## Context

- `shelvesOf()` (`apps/arma/src/model.ts`) agrupa por `design_id` y ordena por la fecha del diseño. Las repisas tienen `id`, `title`, `subtitle`, `printings` y `picture`; `Showcase` solo las dibuja.
- `/api/full` entrega `set_key`, `set_name` (el nombre del catálogo en inglés, `coalesce(cs.name_en, cs.name, p.set_name)`), `lang` y `release` (por impresión).
- Datos de Eevee (15-10-2026), con las expansiones contadas como en este cambio:
  - Hay 209 expansiones. 166 tienen fecha propia, 19 traducidas pueden tomar la de su japonesa y el catálogo (`public.sets.release_date`) cubre varias más (`bw3`, `bw8`, `ja-SM1p`). Quedan unas 20 sin fecha, sobre todo mazos y kits (`td:*`).
  - Las impresiones ZH-TW, TH e ID viven con `set_key` japonés (`ja-S8b`) y su `set_name` propio es el local (VMAX絕群壓軸). Las ZH-TW de mazos usan `td-zh-tw:*` y las indonesias `td-id:*`.

## Goals / Non-Goals

**Goals:** ver el Full como lo ve un coleccionista que arma por expansión, sin perder las reglas, la penumbra ni la ficha.

**Non-Goals:** filtros por región, fechas editables y guardar el orden en las vistas.

## Decisions

**1. La clave de expansión se calcula en el front** (`expansionOf(p)`):
- Si `set_key` empieza por `ja-` y el idioma no es `JA`, la clave es `set_key|lang` (la traducida).
- Si no, es `set_key`. Así, las internacionales agrupan los idiomas occidentales, que comparten `set_key`.

Las chinas simplificadas (`pc:scn_*`) y los mazos con prefijo de región (`td-zh-tw:*`) ya traen su propia clave.
- *Alternativa descartada:* calcularla en SQL. Es una regla de presentación, y en el front se prueba igual que `shelvesOf`.

**2. La región sale del idioma:**
- `EN`, `ES`, `ES-MX`, `FR`, `DE`, `IT`, `PT` y `PT-BR` → Internacional;
- `JA` → Japón;
- `ZH-CN` → China simplificado;
- `ZH-TW` → China tradicional;
- `KO` → Corea;
- `TH` → Tailandia;
- `ID` → Indonesia.

La clave de agrupación nunca mezcla regiones, así que cada repisa tiene una sola.

**3. Nombre:**
- **Internacional:** el del catálogo en inglés (`set_name`).
- **Japón:** el japonés (`set_name_local`), con el nombre en inglés al lado, igual que en la app actual.
- **Traducidas y chinas:** el nombre local (`set_name_local`).

Para eso, `/api/full` suma `p.set_name AS set_name_local`.

**4. Fecha:**
- La más antigua de `release` entre sus impresiones.
- Si no hay, y la expansión es una traducida, la fecha de la japonesa del mismo `set_key`.
- Si no, `set_release`, que `/api/full` suma desde `public.sets.release_date`.
- Si no, sin fecha: va al final, en orden alfabético, con "Fecha por confirmar".

En la línea de tiempo se desempata por región (Japón, Internacional y luego las demás) y por nombre.

**5. Dentro de la repisa:** número natural (`normNumber`, con los números con letras al final), luego `LANG_ORDER`, `FINISH_ORDER` y sello. La foto de referencia de cada impresión sin foto propia sigue siendo la de su diseño (`designPicture`), así que hay que calcular el mapa diseño → foto aparte de la repisa.

**6. Selector:** un grupo de dos botones con `aria-pressed` ("Por diseño", "Por expansión"), bajo la leyenda. Se guarda en `localStorage` (`arma.orden`), dentro de un try/catch; si falla, el orden vuelve a ser "Por diseño". `Showcase` no cambia: recibe repisas y, en las de expansión, el subtítulo es "Región · AAAA-MM".

## Risks / Trade-offs

- **[Fechas de mazos y kits]** → Quedan al final como "Fecha por confirmar". Un cambio futuro puede traerlas de TCGdex.
- **[Expansiones con una sola carta]** → Con Eevee, muchas repisas tienen una o dos impresiones. Es el dato real y la repisa ya funciona con pocas cartas.
- **[Rendimiento]** → Hay ~210 repisas en vez de ~320. Se recalculan solo al cambiar el Full o el orden (`useMemo`).
