## 1. Datos

- [x] 1.1 Migración Arma 014: `'asia'` en `sets_source_check`
- [x] 1.2 `asiaSets.ts`: expansiones chinas del Full, cruce con TCGdex por código e idioma, filas de `sets`
- [x] 1.3 Cartas: lista de TCGdex o, si viene vacía, armada desde el Full (`list_source = 'full'`); enlazar las impresiones del Full
- [x] 1.4 Correrlo al arrancar la API y después de importar un Full (el enlace lo hace este paso, no `loadCatalog`)
- [x] 1.5 `@pokenitsu/inventory`: `ensureSetCards` no descarga nada para `asia`

## 2. Master Set

- [x] 2.1 `ownedCopies`: una copia `ZH` calza con `ZH-CN`/`ZH-TW` (primero el idioma de la expansión)

## 3. Cargar

- [x] 3.1 Buscador: pestaña "Chinas", etiqueta "Chino simplificado"/"Chino tradicional" y búsqueda por código, nombre chino o en inglés
- [x] 3.2 Abrir una expansión china pasa la sesión a `ZH`
- [x] 3.3 Ficha: "Lista armada desde tu Master Set"
- [x] 3.4 Grilla: etiqueta y foto de la variante de la ficha (no la de la rareza)

## 4. Verificación

- [x] 4.1 Pruebas del cruce de códigos y de la lista armada desde el Full
- [x] 4.2 En una copia de la base: `CBB4C` muestra las 7 de Eevee y la 401 se carga y enciende; `zh-tw-SCC` trae las 171 de TCGdex; una copia `ZH` de una traducción japonesa cuenta; Chrome a 1440 y 390
