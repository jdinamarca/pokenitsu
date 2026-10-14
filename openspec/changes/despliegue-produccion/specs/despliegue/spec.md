## ADDED Requirements

### Requirement: Chequeo de salud
La API SHALL responder `GET /health` sin sesión: `200 {"ok": true}` si la base de datos contesta y `503` si no.

#### Scenario: Base disponible
- **WHEN** el servicio de hosting pide `/health` y Postgres responde
- **THEN** recibe 200 con `{"ok": true}`

### Requirement: Fotos subidas en un directorio configurable
Las fotos que suben los usuarios SHALL guardarse en `ART_DIR` (por defecto `apps/web/public/art`). `/art/<archivo>` SHALL servirse desde `ART_DIR` y, si no está ahí, desde las imágenes que vienen en el repo.

#### Scenario: Foto subida en producción
- **WHEN** en Fly (con `ART_DIR=/data/art` en un volumen) un usuario sube la foto de una variante
- **THEN** el archivo queda en el volumen y sigue disponible después de un nuevo despliegue

#### Scenario: Imagen del repo
- **WHEN** se pide `/art/grupo-1-….jpg`, que viene en el repo y no está en el volumen
- **THEN** se sirve igual

### Requirement: Aislamiento protegido en producción
Con `NODE_ENV=production`, la API MUST NOT arrancar si el rol con que se conecta a Postgres es superusuario o tiene `BYPASSRLS`, y SHALL explicar por qué en el log.

#### Scenario: Rol con privilegios
- **WHEN** la API arranca en producción conectada con un rol que tiene `BYPASSRLS`
- **THEN** se detiene con un mensaje que pide usar el rol `nitsu_app`

#### Scenario: Rol correcto
- **WHEN** la API arranca en producción con `nitsu_app`
- **THEN** arranca y cada cuenta ve solo sus datos
