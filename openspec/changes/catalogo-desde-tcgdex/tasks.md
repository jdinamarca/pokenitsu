## 1. Catálogo

- [x] 1.1 `packages/inventory`: `syncTdSets` (sin Pocket, sin vacías, sin las que cruzan) y `syncTdSet` / `ensureSetCards` para `tcgdex-en`, con pruebas sobre respuestas guardadas
- [x] 1.2 La API y Arma sincronizan las `tcgdex-en` junto a las demás expansiones; migraciones 033 (Nitsu) y 011 (Arma) para `sets_source_check`

## 2. Full

- [x] 2.1 `catalog.ts` del Full incluye `tcgdex-en`; el importador asegura sus cartas antes de cruzar
- [x] 2.2 `pokecottage.ts`: cruce de los Trainer Kits por nombre, sin el sello del mazo; core: `normal`, `nonHolo` y `holofoil` de PokeCottage son acabados, con prueba

## 3. Cargar

- [x] 3.1 Lista de expansiones, buscador y origen (`INT`) con `tcgdex-en`

## 4. Verificación

- [x] 4.1 En la copia `pokemon_fotos`:
  - en Chrome a 1440 y 390, Cargar encuentra "XY trainer Kit (Sylveon)" y carga Eevee #13;
  - el Master Set de Eevee la cuenta;
  - Nitsu abre la expansión;
  - el Full de Eevee y Sylveon no tiene `td:tk-xy-sy` ni `pc:tk6b`;
  - `pnpm test`, `typecheck` y `lint`; huella de la base real igual
- [x] 4.2 README
