# Tasks

## 1. Core

- [x] 1.1 `parseLanguageTables` y `parseLanguageSentence` con pruebas: colspan, "—", columnas ausentes (serie Neo), y las frases de Jungle, Team Rocket, EX Unseen Forces y Majestic Dawn
- [x] 1.2 `notReleased` con idioma y fuente en `auditPrintings`; verificar con una prueba

## 2. Fuente e importación

- [x] 2.1 Migración 006 (`bulbapedia-idiomas`); verificar en una copia de la base que se aplica, que reaplicar no hace nada y que `public` no cambia
- [x] 2.2 `bulbapediaLanguages` y `confirmedClaims`, con la deducción de TCGdex solo como respaldo y `notReleased` de ambas fuentes en el resumen; verificar reimportando Eevee en la copia: Jungle #51 en ES y PT con 1st Edition, en NL sin sello y con 1st Edition, ninguna Team Rocket en NL, PT o ES, EX Unseen Forces #55 reverse en ES y PT, Majestic Dawn #62 IT confirmada y no deducida, y ningún sello que no sea 1st Edition

## 3. App

- [x] 3.1 Neerlandés en `model.ts` (nombre, orden y región Internacional); verificar con una prueba de Vitest y en Chrome sin interfaz (en la copia) que Jungle #51 NL aparece y que "solo inglés" la apaga, sin errores de JS
- [x] 3.2 README (Bulbapedia por idioma, variantes confirmadas, neerlandés, la deducción como respaldo); verificar que lo explica

## 4. Verificación integral

- [x] 4.1 Informe para el usuario: impresiones nuevas por idioma y variante, y lo que sigue sin confirmar; `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real sin cambios; borrar la copia
