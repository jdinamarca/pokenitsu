## 1. Descarga y registro

- [x] 1.1 Migración `031`: tabla `card_images`
- [x] 1.2 `imagenes.js`: fuentes permitidas, Scrydex vía TCGdex, una descarga por carta, dos WebP con sharp, registro, la carta apunta a la copia
- [x] 1.3 `imagenes-cli.js` con `descargar` (`--set`, `--limite`, `--reintentar`) y `estado`; scripts en `package.json`
- [x] 1.4 `catalog.js` no pisa las copias

## 2. Servir

- [x] 2.1 `GET /img/*`: archivo local con caché, o storage, o link original; 404 para otras rutas
- [x] 2.2 `bigImg` en el front para `-small.webp` → `-large.webp`

## 3. Verificación y docs

- [x] 3.1 Probar sobre una copia de la base: una muestra de cada fuente (incluida Scrydex vía TCGdex y PokeCottage omitida), las imágenes correctas, la sincronización que no pisa, la ruta y sus respaldos, la vista previa en el navegador, y cortar y retomar
- [x] 3.2 README y `.gitignore`
