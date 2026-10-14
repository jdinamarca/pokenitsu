# 0015. Despliegue: Vercel para el front, Fly.io para la API y los workers, Supabase para Postgres e imágenes

- Estado: Reemplazado por [0020](0020-despliegue-fly-y-supabase.md)
- Fecha: 2026-10-12

## Contexto
La plataforma tiene tres piezas con necesidades distintas:
- **Front** (SPA estática de React): solo archivos; lo ideal es una CDN.
- **API + worker**: procesos Node que corren todo el tiempo; el worker descarga precios durante minutos ([0013](0013-tareas-en-segundo-plano-con-pg-boss.md)).
- **Postgres e imágenes**: deben estar administrados, con respaldos.

Los usuarios están en Chile: conviene la región más cercana, São Paulo.

## Decisión
- **Front en Vercel**: CDN global, despliegue automático desde GitHub y una URL de vista previa por cada pull request.
- **API y worker en Fly.io**, región `gru` (São Paulo), como contenedores Docker (el mismo con dos comandos).
- **Postgres en Supabase**, región São Paulo, con respaldos diarios. Se usa como Postgres normal, conectado desde la API.
- **Imágenes subidas en Supabase Storage** (fotos de variantes, arte unido). Reemplaza a Cloudflare R2 de la propuesta inicial, para tener un proveedor menos.
- La API se publica en un subdominio (ej. `api.<dominio>`) para que la cookie de sesión funcione con el front.

## Alternativas consideradas
- **Todo en Vercel (también la API como funciones):** las funciones serverless tienen límite de duración y no mantienen procesos vivos; el worker de pg-boss no puede correr ahí y la API tendría arranques en frío. Vercel es excelente para el front, no para este backend.
- **Todo en Supabase (Auth, base, Storage, Edge Functions):** cubriría casi todo, pero habría que reescribir la API en Edge Functions (Deno) o en llamadas directas a la base, y ataría la identidad a Supabase. Se usa solo lo que aporta sin atarnos: Postgres y Storage. Su API automática (PostgREST) queda bloqueada con RLS en todas las tablas ([0010](0010-multiusuario-con-user-id-y-rls.md)) o desactivada.
- **Neon en vez de Supabase para Postgres:** también tiene São Paulo y es excelente; Supabase suma Storage y un panel más completo.
- **Railway o Render en vez de Fly.io:** más simples de configurar; Fly.io tiene región en São Paulo y buen precio para procesos pequeños siempre encendidos. Railway es la alternativa si Fly resulta complejo.

## Consecuencias
- Positivas: cada pieza en el servicio que mejor la resuelve; despliegue automático desde GitHub; respaldos administrados.
- Negativas: tres proveedores que configurar y vigilar.
- **A verificar antes de lanzar:**
  - El plan Hobby de Vercel es para uso no comercial; si la plataforma cobra, se necesita el plan Pro.
  - Los proyectos gratis de Supabase se pausan tras un período sin actividad; para usuarios reales conviene el plan pagado.
  - Confirmar precios vigentes de los tres servicios.
