## 1. Datos

- [ ] 1.1 Migración Arma 014: `'asia'` en `sets_source_check`
- [ ] 1.2 `asiaSets.ts`: expansiones chinas del Full, cruce con TCGdex por código e idioma, filas de `sets`
- [ ] 1.3 Cartas: lista de TCGdex o, si viene vacía, armada desde el Full (`list_source = 'full'`); enlazar las impresiones del Full
- [ ] 1.4 Correrlo al arrancar la API y después de importar un Full; `loadCatalog` incluye `asia`
- [ ] 1.5 `@pokenitsu/inventory`: `ensureSetCards` no descarga nada para `asia`

## 2. Master Set

- [ ] 2.1 `ownedCopies`: una copia `ZH` calza con `ZH-CN`/`ZH-TW` (primero el idioma de la expansión)

## 3. Cargar

- [ ] 3.1 Buscador: etiqueta "Chino simplificado"/"Chino tradicional" y búsqueda por código, nombre chino o en inglés
- [ ] 3.2 Abrir una expansión china pasa la sesión a `ZH`
- [ ] 3.3 Ficha: "Lista armada desde tu Master Set"

## 4. Verificación

- [ ] 4.1 Pruebas del cruce de códigos y de la lista armada desde el Full
- [ ] 4.2 En una copia de la base: `CBB4C` muestra las 7 de Eevee y la 401 se carga y enciende; `zh-tw-SCC` trae las 171 de TCGdex; una copia `ZH` de una traducción japonesa cuenta; Chrome a 1440 y 390
