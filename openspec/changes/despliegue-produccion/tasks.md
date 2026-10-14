## 1. Código

- [x] 1.1 `GET /health` público con chequeo de la base
- [x] 1.2 `ART_DIR` para guardar fotos y `/art` servido desde `ART_DIR` y luego desde el repo
- [x] 1.3 TLS con `DATABASE_CA_CERT` y `trustProxy`
- [x] 1.4 En producción, no arrancar con un rol superusuario o con `BYPASSRLS`

## 2. Infraestructura

- [x] 2.1 `Dockerfile`, `.dockerignore` y `fly.toml` (gru, volumen, salud, siempre encendida)
- [x] 2.2 `apps/api/db/produccion/rol.sql`: rol `nitsu_app` y sin acceso para `anon`/`authenticated`
- [x] 2.3 GitHub Actions: desplegar a Fly después del CI en `main`

## 3. Verificación y docs

- [x] 3.1 Construir la imagen y correrla contra una copia de la base con un rol sin `BYPASSRLS`: salud, login, aislamiento entre dos cuentas, foto subida en el volumen tras recrear el contenedor, imágenes del repo, y que se niegue a arrancar con un rol con `BYPASSRLS`
- [x] 3.2 `docs/despliegue.md`, ADR 0020 (reemplaza al 0015) y README
