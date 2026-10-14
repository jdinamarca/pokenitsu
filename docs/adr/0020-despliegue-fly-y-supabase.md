# 0020. Despliegue: un solo servicio en Fly.io y Postgres en Supabase

- Estado: Aceptado
- Fecha: 2026-10-14
- Reemplaza a: [0015](0015-despliegue.md)

## Contexto
[0015](0015-despliegue.md) separaba el front (Vercel), la API y los workers (Fly.io) y la base e imágenes (Supabase), pensando en un front en React aparte ([0012](0012-front-react-vite-pwa.md)) y en workers con pg-boss ([0013](0013-tareas-en-segundo-plano-con-pg-boss.md)). Ninguno de los dos se hizo todavía:
- el front sigue siendo `index.html`, servido por la misma API, en el mismo origen que la cookie de sesión;
- las tareas de precios y catálogo corren dentro del proceso de la API.

Para la alfa hay que publicar lo que existe.

## Decisión
- **Un solo servicio en Fly.io**, región `gru` (São Paulo):
  - una imagen Docker con la web, la API y las tareas;
  - una máquina siempre encendida;
  - chequeo de salud en `/health`.
- **Fotos subidas en un volumen de Fly** (`ART_DIR=/data/art`), que sobrevive a los despliegues. `/art/` se sirve primero desde el volumen y después desde las imágenes del repo.
- **Postgres en Supabase**, región São Paulo, usado como Postgres normal:
  - conexión por el **Session pooler**, porque la app fija el usuario en la conexión durante cada petición ([0018](0018-rls-forzado-con-usuario-por-conexion.md)) y el modo transacción lo rompería;
  - TLS verificado con el certificado de Supabase.
- **Rol `nitsu_app`**, dueño de las tablas, sin superusuario ni `BYPASSRLS`. Con `NODE_ENV=production` la API no arranca si su rol puede saltarse RLS.
- **Sin acceso para la API automática de Supabase:** la Data API desactivada y sin permisos para `anon` y `authenticated`.
- **Despliegue automático** desde GitHub Actions al pasar el CI en `main`.
- Por ahora la dirección es `nitsu-collectibles.fly.dev`; el dominio propio viene después.

## Alternativas consideradas
- **Mantener 0015 (Vercel + Fly):** con el front servido por la API no hay nada que poner en Vercel. Separarlo obligaría a manejar CORS y la cookie entre dominios sin beneficio.
- **Neon en vez de Supabase:** igual de válido; Supabase deja abierta la puerta a Storage para las fotos.
- **Fotos en Supabase Storage desde ya:** es lo correcto a mediano plazo (no atadas a una máquina), pero el volumen basta para la alfa y no cambia el código de subida.
- **Railway o Render:** más simples, pero sin región en São Paulo o con menos control sobre la máquina siempre encendida.

## Consecuencias
- Positivas:
  - un proveedor menos que en 0015;
  - mismo origen para la web y la API;
  - el aislamiento entre cuentas queda protegido también ante un error de configuración.
- Negativas:
  - una sola máquina: sin redundancia, y el volumen la ata a una zona;
  - escalar a más máquinas exige mover las fotos a Storage y las tareas a un worker (0013).
- Guía paso a paso: [`docs/despliegue.md`](../despliegue.md).
