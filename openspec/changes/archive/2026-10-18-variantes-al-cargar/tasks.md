## 1. Variantes de una carta

- [x] 1.1 core: `inventoryVariant(finish, stamp)` y `variantFromInventory` con `reverseholo…` / `holo…`, con pruebas de ida y vuelta
- [x] 1.2 `session.ts`: sellos comparados sin guiones
- [x] 1.3 `inventory.ts`: `full` por carta en `/api/sets/:id/cards`; `api.ts`: el tipo
- [x] 1.4 `load.ts`: `variantsOf(card, lang)` y `planRow` con la variante elegida, con pruebas

## 2. Ficha de Cargar

- [x] 2.1 `Cargar.tsx` + `styles.css`: fichas "Variante", la elegida en "Cargar una", el segundo clic, Enter, la vista previa y la foto; vuelve a la automática al marcar otra carta

## 3. Verificación

- [x] 3.1 En la copia `pokemon_fotos`, Chrome en 1440 y 390: Sandstorm #63 en inglés ofrece las 6 variantes; cargar Reverse y FXE-WTF-G7Z deja esas filas y el Master Set de Eevee las cuenta; el sufijo manda; una carta sin variantes ofrece Normal, Holo y Reverse; `pnpm test`, `typecheck` y `lint`; huella de la base real igual
- [x] 3.2 README
