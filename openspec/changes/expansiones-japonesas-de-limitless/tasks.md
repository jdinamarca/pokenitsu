## 1. Datos

- [x] 1.1 Migración `015_expansiones_japonesas_de_limitless.sql`: `sets.source` acepta `limitless`; mover las cartas de Limitless de `ja-XY8b` → `ja-XY8a` y `ja-XY11b` → `ja-XY11a`, con sus fotos, solo si corresponde
- [x] 1.2 `limitless.ts`: equivalencias XY (TCGdex ↔ Limitless) con pruebas

## 2. Servidor

- [x] 2.1 `jaSets.ts`: `parseLimitlessIndex`, decidir qué expansiones faltan (`missingJaSets`), crearlas y llenarlas de a una; pruebas con el índice real
- [x] 2.2 `jaLists.ts`: llenar también expansiones `limitless` sin cartas, y usar las equivalencias
- [x] 2.3 Enlace del Full: `pc:jpn_*` por código y alias, y `ja-*` pendientes, con número + Pokédex; al arrancar y después de importar

## 3. Verificación

- [x] 3.1 En una copia de la base: arrancar en modo local, ver que se crean las expansiones, que `ja-SMI` tiene 38 cartas con la 019 イーブイGX (Pokédex 133) y que `EEV·PC:JPN_SMI·19` queda enlazada
- [x] 3.2 En la copia: `ja-XY8a` tiene Blue Shock (001 カイロス) con sus fotos, `ja-XY8b` tiene Red Flash (001 パラス), lo mismo en XY11; Collection X (`ja-XY1a`) se llena
- [x] 3.3 En la copia: abrir SMI en Cargar (Chrome sin interfaz) y cargar la 019; el inventario de la base real no cambia
- [x] 3.4 `pnpm build && pnpm typecheck && pnpm lint && pnpm test`; README
