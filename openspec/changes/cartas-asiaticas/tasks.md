# Tasks

## 1. Reglas en core

- [ ] 1.1 Agregar TH e ID a `LANGS` y que `langCode('th')`/`langCode('id')` los reconozcan, con pruebas en Vitest (`pnpm test` en verde)
- [ ] 1.2 Agregar a `packages/core` la función que decide si un nombre de carta es de la especie (`伊布`, `伊布V`, `伊布VMAX`, `伊布ex`, `光輝伊布`, `Eevee ex` sí; `葉伊布ex`, `Eevee & Snorlax-GX` no) y la que deduce el nombre japonés (伊布V → イーブイV), con pruebas para cada caso

## 2. Catálogo (API)

- [ ] 2.1 Crear una base de prueba copiando la real (receta de `pg_dump`/`pg_restore`), comprobar que `DATABASE_URL` apunta a la copia y revisar si `sets` tiene restricciones que impidan `source = 'tcgdex-asia'` o `lang` TH/ID. Agregar una migración solo si hace falta
- [ ] 2.2 Implementar `syncAsiaDex(dex)` en `catalog.js` (zh-tw por nombre, id por nombre, th por código y número, PokéAPI con User-Agent) con la clasificación por código: traducción → `ja-*` (crear o completar sin pisar datos japoneses), exclusiva → `asia-<código>`, promo → `asia-<idioma>-<código>`. Verificar en la copia que la búsqueda de Eevee deja `ja-S6a-058`, `ja-S10b-055` con dex 133, una sola `asia-SV7s` con la #125, `asia-SCB` con #106, #107 y #108, y ningún 葉伊布 con dex 133; que `ja-S6a-058` quede sin foto y que `asia-SV3s-141` exista aparte de `ja-SV3-091`
- [ ] 2.3 Verificar que repetir la búsqueda no cambia el número de cartas ni pisa una carta japonesa que ya tenía datos (por ejemplo `ja-SV8a-125` conserva nombre e imagen)
- [ ] 2.4 Cambiar la ruta de la colección para que use `syncAsiaDex` y responda cuántas cartas sumó. Verificar con `curl` contra el servidor de prueba (:3001) que, si TCGdex falla (URL bloqueada), responde error y el catálogo queda igual

## 3. Front

- [ ] 3.1 Sumar `TH: 'Tailandés'` e `ID: 'Indonesio'` a `LNAME`, y verificar en Chrome sin interfaz que el botón de idioma los ofrece y que escribir `th` y `id` en Cargar cambia el idioma
- [ ] 3.2 Cambiar "🇯🇵 Buscar japonesas" por "🌏 Buscar cartas de Asia" (botón, nota de la sección y aviso con cuántas se sumaron) y agregar la sección "🌏 Otras de Asia" en "Por región". Verificar contra la copia que la colección Eevee muestra S6a #058, S10b #055 y SV7s #125 en su región, y que una copia ZH de SV8a #125 cuenta en el espacio japonés sin crear otro
- [ ] 3.3 Sumar TH e ID al orden sugerido de ubicaciones y a las regiones del formulario de reglas, y verificar que las ubicaciones existentes no cambian
- [ ] 3.4 Actualizar el README (idiomas, Buscar cartas de Asia, fuentes TCGdex zh-tw/th/id y PokéAPI) y verificar que no menciona PokeCottage como fuente

## 4. Verificación integral

- [ ] 4.1 Confirmar que la base real sigue igual (inventario 32/33 y mismo número de colecciones y ubicaciones), borrar la base de prueba y cualquier archivo temporal, y correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test` sin errores

## Workflow follow-up

- Commit con `Co-Authored-By`, PR contra `main` con 🤖 al final y CI verde
- Al mergear, el usuario toca "🌏 Buscar cartas de Asia" en su colección Eevee (la búsqueda no corre sola sobre su base)
- Archivar el cambio de OpenSpec después del merge
