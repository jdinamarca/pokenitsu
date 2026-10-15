# Tasks

## 1. Datos

- [x] 1.1 `/api/full` con `set_name_local` (el `set_name` de la impresión) y `set_release` (de `public.sets.release_date`); verificar con `curl` que una impresión ZH-TW de `ja-S8b` trae "VMAX絕群壓軸" y que `bw3` trae su fecha

## 2. Modelo

- [x] 2.1 `expansionOf`, `regionOf` y `shelvesBySet` en `model.ts`, con su orden (fecha → región → nombre; dentro, número → idioma → acabado → sello) y la foto de referencia por diseño; verificar con pruebas en Vitest para: Rocket Gang antes de Team Rocket, traducida separada con la fecha de su japonesa, sin fecha al final y Jungle #51 EN, EN 1st Edition, FR y DE en ese orden

## 3. Vitrina

- [x] 3.1 Selector "Ordenar: Por diseño · Por expansión" recordado en `localStorage`, con el subtítulo "Región · AAAA-MM" o "Fecha por confirmar"; verificar en Chrome sin interfaz (en la copia de la base): el orden, que se recuerda al recargar, que las reglas siguen apagando y que no hay errores de JS, a 1440 y 390 px
- [x] 3.2 `DESIGN.md` (selector y repisa por expansión) y README; verificar que el README menciona el orden por expansión

## 4. Verificación integral

- [x] 4.1 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios
