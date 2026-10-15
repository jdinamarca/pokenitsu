# Tasks

## 1. Core

- [x] 1.1 `baseFinish` y los motivos `inferred` y `notReleased` en `auditPrintings`; verificar con pruebas

## 2. Fuentes e importación

- [x] 2.1 Migración 005 (`wikidex`, `tcgdex-expansiones`); verificar en una copia de la base que se aplica, que reaplicar no hace nada y que `public` no cambia
- [x] 2.2 `wikidexClaims` (cartas, expansiones, salida en España, "No distribuida", nombre en inglés → `set_key`); verificar contra WikiDex real: Jungla #51 ES confirmada y Team Rocket en `notReleased`
- [x] 2.3 Deducidas IT/PT con `tcgdexSetLists` en el importador, y resumen por fuente (confirmadas, deducidas, no distribuidas, expansiones sin mapear); verificar reimportando Eevee en la copia: cuántas ES, IT y PT nuevas, que ninguna sea una variante, y que ES-MX no cambia

## 3. App

- [x] 3.1 Números normalizados en `model.ts` y `localPhotos.ts`; verificar con una prueba de Vitest (`074` y `74` como la misma carta)
- [x] 3.2 Motivos nuevos en la ficha; verificar en Chrome sin interfaz (en la copia) una deducida italiana y una española confirmada por WikiDex, sin errores de JS
- [x] 3.3 README (WikiDex, deducidas, español de España y de Latinoamérica); verificar que explica las tres cosas

## 4. Verificación integral

- [x] 4.1 Informe para el usuario: qué impresiones nuevas hay por idioma y qué sigue faltando; `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios; borrar la copia
