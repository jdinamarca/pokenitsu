# Tasks

## 1. Interpretación compartida

- [x] 1.1 `resolveEntry()` y `nameMatches()`; `commitEntry()` usa la misma interpretación; verificar que `3`, `3r`, `1-12`, `-25`, Enter vacío, `es` y `lp` cargan/cambian exactamente como antes (verificaciones de Cargar)

## 2. Vista previa y nombres

- [x] 2.1 Línea de lo que hará Enter y vista previa pendiente (borde punteado, clic para cargar); verificar en Chrome sin interfaz `3`, `3r`, `1-12`, `99` y `es` sin tocar el inventario
- [x] 2.2 Lista de nombres con ↑/↓, Enter, clic y Tab; `Esc` borra el texto; verificar `flar` → #3/#19, ↓ + Enter carga #19, Tab + `r` carga #3 reverse, clic en `eev` carga #51, y que la lista cabe en 390 px

## 3. Expansiones japonesas

- [x] 3.1 Búsqueda por nombre en inglés vía número de Pokédex e imagen de referencia para cartas sin foto; verificar en Rocket Gang que `eevee` encuentra イーブイ #049, `charmander` encuentra ヒトカゲ #012 con imagen de referencia rotulada, `12` dice "ヒトカゲ · Charmander" y `ヒトカ` sigue funcionando

## 4. Cierre

- [x] 4.1 README; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, verificaciones de Cargar y animaciones, inventario 32/33

## Workflow follow-up

- Commit en `vista-previa` y PR contra `main` (apilado sobre #13); mergear solo cuando el usuario lo pida y luego archivar.
