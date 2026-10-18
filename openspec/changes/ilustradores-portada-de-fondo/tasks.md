# Tasks

## 1. Ajustes

- [x] 1.1 Portada de fondo en la tarjeta del ilustrador. Al pasar el mouse o enfocar, la ilustración recortada llena la tarjeta, con un velo y el texto en claro. La imagen se pide solo en ese momento; en pantallas sin hover se mantiene la miniatura; con "reducir movimiento", aparece sin zoom.
- [x] 1.2 Encabezado de repisa en dos líneas fijas (nombre con "…" y `title`; código, año y avance debajo), en el componente compartido.
- [x] 1.3 Verificar en Chrome, contra la copia, en 1440 y 390:
  - el fondo al hover, con una sola imagen pedida;
  - que en Kagemaru Himeno los encabezados de una misma fila tengan el mismo alto y las cartas la misma altura;
  - lo mismo en la galería de un Pokémon;
  - sin scroll horizontal.

  Actualizar `apps/arma/DESIGN.md` y README. Correr `pnpm test`, `pnpm typecheck` y `pnpm lint`.

## Workflow follow-up

- PR contra `main`; mergear solo cuando el usuario lo pida; después, actualizar su carpeta y archivar.
