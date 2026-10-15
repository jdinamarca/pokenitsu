# Tasks

## 1. Datos

- [x] 1.1 Migración `003_marcas_de_fotos.sql` (`arma.photo_marks`); verificar en una copia de la base que se aplica, que reaplicar no hace nada y que `public` no cambia
- [x] 1.2 `photoShows` en `packages/core` con pruebas: foto compartida entre la versión sin sello y la 1st Edition (muestra la 1st Edition), foto no compartida, marca a mano que gana y marca a "sin sello"

## 2. API

- [x] 2.1 `/api/full` con `photoMarks`, y `POST/DELETE /api/photo-marks` (sin sesión responde 401, y `shows` debe ser una variante válida); verificar con `curl` en la copia
- [x] 2.2 `POST/DELETE /api/photos/:code` (tipo y tamaño validados, guarda en `IMAGE_DIR/arma/`, dato `own`); verificar subiendo, sirviendo por `/img/arma/`, quitando, y rechazando un `.gif` y un archivo de 9 MB
- [x] 2.3 Importador de fotos locales con "foto que calce"; verificar en la copia que Jungle #51 y Neo Discovery #38 unlimited reciben su escaneo de Bulbapedia y que una segunda corrida no descarga nada

## 3. Front

- [x] 3.1 `pictureOf` con calce de variante, la atenuación y la nota "Foto de \<variante\> · falta esta variante"; verificar en Chrome sin interfaz: Jungle #51 unlimited con la unlimited de Bulbapedia (fotos locales encendidas), Team Rocket #55 unlimited atenuada con la nota, y la 1st Edition sin nota
- [x] 3.2 Ficha: "Esta foto muestra" (con "Automático") y "Subir tu foto" / "Quitar tu foto"; verificar en Chrome que marcar Gym Challenge #51 cambia la vitrina sin recargar, y que subir una foto la muestra con el sticker azul
- [x] 3.3 README y `DESIGN.md`; verificar que explican la regla automática, las marcas y las fotos subidas

## 4. Verificación integral

- [x] 4.1 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde; base real y `data/imagenes` sin cambios (salvo lo que el usuario suba); borrar la copia
