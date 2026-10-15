# Tasks

## 1. Core

- [x] 1.1 Acabado genérico, sellos exclusivos de Japón (`misfiled`) y alias por sufijo en `mergeClaims`; verificar con pruebas: Wizards Promo #11 (pokemontcg "Holo" + TCGdex cosmos → una holo cosmos), 30th Celebration #116 (holo y cosmos específicos se mantienen), JR Stamp Rally en EN descartado, y "jun-hasebe" unido con el de PokeCottage
- [x] 1.2 `auditPrintings` con sus cuatro motivos; verificar con pruebas de cada motivo y de una impresión limpia sin marcas

## 2. Importación y API

- [x] 2.1 PokeCottage por prefijo (`jpn_`, `scn_`), TCGdex con acabado genérico, e importador que cuenta `misfiled`; verificar en una copia de la base reimportando Eevee: la #11 queda una sola holo cosmos, no hay "#11 · Inglés · JR Stamp Rally", la JR East Rally queda en japonés y el resumen cuenta 1 dato mal catalogado
- [x] 2.2 `/api/audit/:dex` y `audit` en el Full; verificar con `curl` que la lista trae las variantes "code" (sin nombre), SV8 #143 Pokémon TCG Gym (región) y BW94 (acabado o una fuente, según quede)

## 3. Front

- [x] 3.1 Marca en la etiqueta, filtro "Por verificar (N)" y caja de motivos en la ficha; verificar en Chrome sin interfaz (en la copia) que el filtro muestra solo las marcadas, que la ficha lista los motivos, y que no hay errores de JS, a 1440 y 390 px
- [x] 3.2 README (correcciones automáticas, revisión de clasificación y la regla); verificar que explica cómo correr la revisión con otro Pokémon

## 4. Verificación integral

- [x] 4.1 Informe para el usuario: lista de lo corregido y de lo que sigue por verificar en Eevee, con lo que dice Bulbapedia de cada caso dudoso; `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios; borrar la copia
