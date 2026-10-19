## 1. Catálogo

- [ ] 1.1 `packages/inventory`: `syncTdSets` (sin Pocket, sin vacías, sin las que cruzan) y `syncTdSet` / `ensureSetCards` para `tcgdex-en`, con pruebas sobre respuestas guardadas
- [ ] 1.2 La API y Arma sincronizan las `tcgdex-en` junto a las demás expansiones

## 2. Full

- [ ] 2.1 `catalog.ts` del Full incluye `tcgdex-en`; el importador asegura sus cartas antes de cruzar
- [ ] 2.2 `pokecottage.ts`: cruce de los Trainer Kits por nombre, sin el sello del mazo, con prueba

## 3. Cargar

- [ ] 3.1 Lista de expansiones, buscador y origen (`INT`) con `tcgdex-en`

## 4. Verificación

- [ ] 4.1 En la copia `pokemon_fotos`:
  - en Chrome a 1440 y 390, Cargar encuentra "XY trainer Kit (Sylveon)" y carga Eevee #13;
  - el Master Set de Eevee la cuenta;
  - Nitsu abre la expansión;
  - el Full de Eevee y Sylveon no tiene `td:tk-xy-sy` ni `pc:tk6b`;
  - `pnpm test`, `typecheck` y `lint`; huella de la base real igual
- [ ] 4.2 README
