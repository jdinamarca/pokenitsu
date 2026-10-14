# Proposal

## Why

La app solo corre en el computador del usuario. Para la alfa tiene que estar en internet. El ADR 0015 planeaba Vercel (front) + Fly.io (API) + Supabase, pero suponía un front en React aparte (ADR 0012) que no se hizo: hoy un solo proceso Node sirve la web, la API y las tareas de precios. El usuario eligió **Supabase** para la base, la dirección de **Fly** (`*.fly.dev`) por ahora y **copiar su base actual**.

## What Changes

- **Un solo servicio en Fly.io**, región São Paulo (`gru`):
  - `Dockerfile` (Node 24 + pnpm, compila `packages/core`) y `fly.toml`;
  - una máquina siempre encendida (las tareas de precios corren dentro);
  - HTTPS forzado y chequeo de salud.
- **`GET /health`** (público) responde si la base contesta; Fly lo usa para saber si la app está viva.
- **Fotos subidas en un volumen**:
  - `ART_DIR` (en Fly, `/data/art`) es donde se guardan las nuevas;
  - `/art/…` se sirve primero desde ahí y después desde las imágenes del repo (grupos y promos a mano).
- **Conexión a Supabase**:
  - TLS verificado con el certificado de Supabase (`DATABASE_CA_CERT`);
  - conexión en modo sesión, no transacción, porque la app fija el usuario en la conexión durante la petición.
- **Protección del aislamiento entre cuentas**:
  - en producción (`NODE_ENV=production`) la API no arranca si su rol de Postgres es superusuario o tiene `BYPASSRLS`, porque cada cuenta vería los datos de todas;
  - script SQL para crear el rol `nitsu_app` sin esos privilegios y quitarle a la API automática de Supabase (`anon`, `authenticated`) el acceso a las tablas.
- **Despliegue automático**: GitHub Actions despliega a Fly al pasar el CI en `main` (secreto `FLY_API_TOKEN`).
- **Guía** `docs/despliegue.md`: cuentas, rol, copia de la base (pg_dump/pg_restore), secretos, Google y Resend en producción, y cómo actualizar.
- **ADR 0020**: un servicio en Fly.io + Postgres en Supabase. Reemplaza al 0015.

**Fuera del alcance:** dominio propio (después: cambiar `BETTER_AUTH_URL` y la URI de Google), mover las fotos a Supabase Storage y monitoreo con Sentry.

## Capabilities

### New Capabilities
- `despliegue`: salud del servicio, fotos en un directorio configurable y protección del aislamiento en producción.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- Nuevos: `Dockerfile`, `.dockerignore`, `fly.toml`, `.github/workflows/deploy.yml`, `apps/api/db/produccion/rol.sql`, `docs/despliegue.md`, `docs/adr/0020-…`.
- `apps/api/src/index.js` (salud, `ART_DIR`, `/art` con dos orígenes, `trustProxy`), `apps/api/src/db.js` (TLS, chequeo del rol).
- README, ADR 0015 (estado: reemplazado).
