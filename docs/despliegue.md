# Desplegar Nitsu Collectibles

Un solo servicio en **Fly.io** (São Paulo) sirve la web, la API y las tareas de precios. La base es **Postgres en Supabase** (São Paulo). Por qué así: [ADR 0020](adr/0020-despliegue-fly-y-supabase.md).

```
https://nitsu-collectibles.fly.dev ──► Fly.io (gru) · 1 máquina siempre encendida
                                           │      └─ volumen nitsu_data → /data/art (fotos subidas)
                                           ▼
                                      Supabase Postgres (sa-east-1), rol nitsu_app
```

Los pasos 1 a 5 se hacen una sola vez. Después, cada merge a `main` se despliega solo (paso 6).

> No pegues claves en el chat ni en archivos del repo. Van en Supabase, en `fly secrets` y en los secretos de GitHub.

## 0. Herramientas

```bash
brew install flyctl libpq          # flyctl y un pg_restore nuevo (el de Homebrew por defecto es 14)
fly auth login                     # abre el navegador
```

## 1. Supabase: proyecto, rol y certificado

1. En [supabase.com](https://supabase.com) → **New project**. Región **South America (São Paulo)**. Guarda la contraseña de la base (es la de `postgres`, solo para administrar).
2. **Project Settings → Data API**: desactívala. La app no la usa, y así nadie puede consultar la base por esa vía.
3. **SQL Editor**: pega el contenido de [`apps/api/db/produccion/rol.sql`](../apps/api/db/produccion/rol.sql), cambia `CAMBIA-ESTA-CLAVE` por una clave larga nueva y ejecútalo. Crea el rol **`nitsu_app`**, con el que se conecta la app:
   - **no** es superusuario y **no** tiene `BYPASSRLS`;
   - si lo tuviera, cada cuenta vería los datos de todas;
   - con `NODE_ENV=production`, la API se niega a arrancar con un rol así.
4. **Project Settings → Database → SSL Configuration → Download certificate**: guarda el `.crt`.
5. **Connect** (arriba) → **Session pooler**. Copia la dirección y cambia el usuario `postgres.<ref>` por **`nitsu_app.<ref>`**:
   ```
   postgresql://nitsu_app.<ref>:<clave de nitsu_app>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
   - Usa el **Session pooler** (puerto 5432), **no** el *Transaction pooler* (6543). La app fija el usuario en la conexión durante toda la petición, y el modo transacción mezclaría usuarios.
   - No agregues `?sslmode=…`: el certificado se pasa aparte (`DATABASE_CA_CERT`).

## 2. Copiar tu base a Supabase

Desde la carpeta del repo, con tu Postgres local corriendo:

```bash
# 1. respaldo de la base local (con los datos de todas las cuentas, sin dueños ni permisos)
docker exec -e PGOPTIONS='-c app.all_users=on' postgres-mac \
  pg_dump -U pokemon -d pokemon -Fc --enable-row-security --no-owner --no-acl -f /tmp/nitsu.dump
docker cp postgres-mac:/tmp/nitsu.dump ./nitsu.dump

# 2. restaurar en Supabase como nitsu_app (pide la clave de nitsu_app)
PGSSLMODE=require /opt/homebrew/opt/libpq/bin/pg_restore --no-owner --no-acl \
  -h aws-0-sa-east-1.pooler.supabase.com -p 5432 -U nitsu_app.<ref> -d postgres ./nitsu.dump

rm ./nitsu.dump && docker exec postgres-mac rm /tmp/nitsu.dump
```

- **Restaura una sola vez, sobre una base vacía.** El Row Level Security forzado se activa después de copiar los datos. Si se repite sobre tablas que ya tienen RLS, falla con "query would be affected by row-level security policy".
- Las migraciones ya aplicadas quedan registradas en `schema_migrations`, así que la app no las repite.

Después, en el **SQL Editor**, corre los dos chequeos del final de `rol.sql`. Ambos deben devolver **0 filas**.

## 3. Fly.io: app, volumen y secretos

```bash
fly apps create nitsu-collectibles          # si el nombre está tomado, usa otro y cámbialo en fly.toml (app = …)
fly volumes create nitsu_data --region gru --size 1
```

Secretos (los valores que ya tienes en tu `.env` local sirven para Resend y Google):

```bash
fly secrets set --stage \
  DATABASE_URL='postgresql://nitsu_app.<ref>:<clave>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres' \
  DATABASE_CA_CERT="$(cat ~/Downloads/prod-ca-2021.crt)" \
  BETTER_AUTH_SECRET="$(openssl rand -base64 33)" \
  BETTER_AUTH_URL='https://nitsu-collectibles.fly.dev' \
  AUTH_ALLOWED_EMAILS='tu@email.com,tester@email.com' \
  EMAIL_FROM='Nitsu Collectibles <hola@jdinamarca.dev>' \
  RESEND_API_KEY='re_…' \
  GOOGLE_CLIENT_ID='….apps.googleusercontent.com' \
  GOOGLE_CLIENT_SECRET='GOCSPX-…'
```

- `--stage` guarda los secretos sin desplegar todavía.
- `BETTER_AUTH_SECRET` es uno nuevo, distinto del local. Las contraseñas no dependen de él, así que siguen funcionando.
- Lo que no es secreto (`NODE_ENV`, `HOST`, `PORT`, `ART_DIR`) ya está en [`fly.toml`](../fly.toml).
- Para ver qué hay: `fly secrets list` (no muestra los valores).

## 4. Google con la dirección de producción

En Google Cloud → Credenciales → tu cliente OAuth, agrega:
- **Orígenes de JavaScript autorizados:** `https://nitsu-collectibles.fly.dev`
- **URIs de redireccionamiento autorizados:** `https://nitsu-collectibles.fly.dev/api/auth/callback/google`

Deja también las de `localhost` para seguir probando en tu Mac.

## 5. Primer despliegue

```bash
fly deploy --ha=false   # una sola máquina: las tareas de precios corren dentro y el volumen es de una máquina
                        # (la imagen se construye en los servidores de Fly, no necesita Docker local)
fly logs            # deberías ver "Inventario Pokémon listo…"
fly open            # abre https://nitsu-collectibles.fly.dev
```

**Comprueba:**
- `https://nitsu-collectibles.fly.dev/health` responde `{"ok":true}`.
- Entras con tu contraseña o con Google y ves tu colección.
- "¿Olvidaste tu contraseña?" te llega con el link a `fly.dev`.

**Si no arranca,** mira `fly logs`:
- "El rol de la base … tiene BYPASSRLS": estás usando el usuario `postgres`. Revisa `DATABASE_URL` (paso 1.5).
- "self-signed certificate" o "unable to verify": falta `DATABASE_CA_CERT` o es otro certificado (paso 1.4).
- Timeout al conectar: revisa que la dirección sea la del Session pooler.

## 6. Despliegue automático desde GitHub

```bash
fly tokens create deploy -x 8760h     # token para desplegar esta app, válido 1 año
```

Cópialo en GitHub → el repo → **Settings → Secrets and variables → Actions → New repository secret**, con el nombre **`FLY_API_TOKEN`**. Desde ahí, cada push o merge a `main` pasa el CI y luego despliega (job `deploy` en `.github/workflows/ci.yml`). Sin el secreto, ese job solo avisa y no hace nada.

## Día a día

- **Actualizar:** mergear a `main`. Las migraciones nuevas se aplican solas al arrancar.
- **Invitar a alguien:** `fly secrets set AUTH_ALLOWED_EMAILS='…,nuevo@email.com'` (reinicia la app). Si va a entrar con Google y la app de Google sigue en modo Prueba, agrégalo también como usuario de prueba.
- **Logs:** `fly logs`. **Consola en la máquina:** `fly ssh console`.
- **Respaldos:**
  - Supabase hace respaldos diarios según tu plan; revísalo en **Database → Backups**.
  - Las fotos subidas están en el volumen, del que Fly guarda snapshots diarios (`fly volumes snapshots list <id>`).
  - Antes de cambios grandes, haz un `pg_dump` propio, igual que en el paso 2 pero al revés (`-h` de Supabase en `pg_dump`).
- **Costos (confirma los precios vigentes):** en Fly, una máquina `shared-cpu-1x` de 512 MB siempre encendida más 1 GB de volumen. En Supabase, el plan gratis pausa el proyecto tras un tiempo sin uso; con testers reales conviene el plan pagado.
- **Dominio propio (después):**
  - `fly certs add nitsu.jdinamarca.dev` y crea el registro DNS que indica;
  - cambia `BETTER_AUTH_URL`;
  - agrega el origen y la URI nuevos en Google.
