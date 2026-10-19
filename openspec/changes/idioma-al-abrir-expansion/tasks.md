## 1. Idioma al abrir

- [x] 1.1 `load.ts`: `Session.west` (último idioma occidental) y una función pura que da el idioma al abrir una expansión (idioma escrito, idioma de la expansión, o el occidental si el activo es asiático y la expansión es internacional), con pruebas
- [x] 1.2 `Cargar.tsx`: `chooseSet` la usa, distinguiendo el idioma escrito en la búsqueda del de las recientes; `setSession` recuerda el último idioma occidental

## 2. Aviso de idioma

- [x] 2.1 `load.ts`: una función que da los idiomas en que salió la carta según su Full cuando no salió en el activo, con pruebas
- [x] 2.2 `Cargar.tsx`: el aviso en la ficha y en la vista previa

## 3. Verificación

- [x] 3.1 `pnpm -r test`, `typecheck`, `lint` y `format`
- [x] 3.2 En la copia de la base, con Chrome: después de Pokémon GO (S10b) en japonés, SWSH Black Star Promos se abre en el idioma occidental; desde la reciente "· JA" también; con `SWSHP JA` queda en japonés y la SWSH190 muestra el aviso; cargar la SWSH190 Holo cosmos en inglés la marca en Arma tu Master Set
