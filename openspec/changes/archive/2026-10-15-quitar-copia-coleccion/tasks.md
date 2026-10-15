# Tasks

## 1. Quitar una copia desde la colección

- [x] 1.1 Agregar "−1" en `colTile` (solo con copias) que quita una copia de la clave más reciente de `colKeys` con `addQty(k, -1)` y avisa qué quitó. Verificar en Chrome sin interfaz, con la API simulada y las escrituras interceptadas, que +1 y luego −1 dejan la cantidad igual, que se quita la copia recién agregada, que un espacio sin copias no muestra −1 y que Deshacer vuelve a sumarla
- [x] 1.2 Documentar "−1" en la sección Mis colecciones del README y verificar que se menciona junto a "＋1"
- [x] 1.3 Correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test` sin errores

## Workflow follow-up

- Commit con `Co-Authored-By`, PR contra `main` con 🤖 al final y CI verde
- Archivar el cambio de OpenSpec después del merge
