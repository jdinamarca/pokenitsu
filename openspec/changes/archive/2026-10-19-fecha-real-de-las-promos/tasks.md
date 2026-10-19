## 1. Vitrina

- [x] 1.1 En `shelvesOf` (`apps/arma/src/model.ts`), calcular la fecha de la repisa sin la fecha genérica de las promos, con las vueltas atrás de la especificación
- [x] 1.2 Pruebas en `model.test.ts`: Radiant Eevee pasa a 2022-06-17 y una promo sin otra fecha sigue en la de la serie

## 2. Verificación

- [x] 2.1 `pnpm -r test`, `typecheck`, `lint` y `format`
- [x] 2.2 En la copia de la base, con Chrome: SWSH230 dice 2022 y queda junto a "Pokémon GO #54"; SWSH042 sigue en 2019 y SWSH065, que tiene otra impresión de 2022, pasa a 2022; "Por expansión" no cambia
