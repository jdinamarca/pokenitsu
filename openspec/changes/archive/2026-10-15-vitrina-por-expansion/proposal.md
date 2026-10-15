# Proposal

## Why

La Vitrina de "Arma tu colección" agrupa las impresiones solo por **diseño** (una ilustración y todas sus impresiones). Un coleccionista también arma y revisa su master set **por expansión, en orden de salida**: qué salió en Rocket Gang (Japón, 1997), en Jungle (1999) y en Team Rocket (2000). En la era WotC, las expansiones japonesas son productos distintos de las internacionales, y las asiáticas traducidas (chino tradicional, tailandés, indonesio) también salieron como expansiones propias. Hoy esas traducidas quedan escondidas bajo la expansión japonesa de la que vienen.

## What Changes

- **Selector "Ordenar: Por diseño · Por expansión"** junto al contador de la Vitrina. "Por diseño" es el orden de hoy. La elección se recuerda en el navegador.
- **"Por expansión":** una repisa por expansión, en **una sola línea de tiempo** por fecha de salida que mezcla regiones: Rocket Gang (Japón, 1997) aparece antes que Team Rocket (Internacional, 2000). Cada repisa muestra:
  - el nombre de la expansión;
  - su región (Internacional, Japón, China simplificado, China tradicional, Corea, Tailandia, Indonesia);
  - su mes de salida, o "Fecha por confirmar".
- **Qué es una expansión:**
  - Las internacionales agrupan todos los idiomas occidentales (Jungle en inglés, francés, alemán…).
  - Cada expansión japonesa es propia, igual que cada china simplificada.
  - Las cartas en **chino tradicional, tailandés, indonesio o coreano** que hoy cuelgan de una expansión japonesa pasan a ser **su propia expansión**, con su nombre local (VMAX絕群壓軸) y su fecha. Si no tienen fecha, usan la de la japonesa.
- **Dentro de la repisa:** por número de carta y, para cada número, por idioma (inglés primero), acabado y sello. Así cada carta queda junto a sus variantes.
- **Fecha de salida de una expansión:** la más antigua de sus impresiones. Si no hay, se toma la de la japonesa (para las traducidas), y si tampoco, la del catálogo. Las que siguen sin fecha van al final, en orden alfabético.
- **Las reglas y la penumbra funcionan igual** en los dos órdenes: lo que una regla deja fuera se apaga en su lugar.

**Fuera del alcance:**
- Guardar el orden dentro de las vistas guardadas.
- Filtrar por región.
- Corregir fechas a mano.
- Separar las traducidas en el resto de la app: las equivalencias y las reglas no cambian.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `armado-de-coleccion`: la Vitrina suma el orden por expansión.

## Impact

- `apps/arma/server/index.ts`: `/api/full` entrega, por impresión, el nombre local de la expansión (`set_name_local`) y la fecha de salida del catálogo (`set_release`).
- `apps/arma/src`: un `shelvesBySet()` nuevo en `model.ts`, el selector en `App.tsx` y el subtítulo de la repisa en `Showcase.tsx`.
- `apps/arma/DESIGN.md` y el README.
