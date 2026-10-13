# Tasks

## 1. API

- [x] 1.1 Migración 025 y `fillJaImages(setId)` en `pokecottage.js` (slug, equivalencias de código, llenado por especie, 30 días); `POST /api/sets/:id/photos` con `POKECOTTAGE_IMAGES`; verificar con un servidor de prueba que con `on` Rocket Gang gana fotos (Ekans #001), que una segunda llamada no pide nada y que sin la variable responde `enabled: false`

## 2. Front

- [x] 2.1 Pedir fotos al elegir una expansión japonesa y repintar; verificar en Chrome sin interfaz que al elegir Pokémon Jungle llegan fotos reales y el aviso "📷 N fotos" (Rocket Gang ya se había llenado en la prueba de la API)
- [x] 2.2 Botón "Tomar o subir la foto de tu carta" en la vista previa sin foto real, "📸 Tomar foto" en pantallas táctiles y achicado antes de subir; verificar que el botón aparece solo sin foto real, que la cámara solo se ofrece en táctil y que una imagen de 3000 px se sube achicada (sin guardar en la base: subida interceptada)

## 3. Cierre

- [x] 3.1 README y `.env` local; `pnpm build && pnpm typecheck && pnpm lint && pnpm test`, verificaciones de Cargar y vista previa, inventario 32/33

## Workflow follow-up

- Commit en `fotos-japonesas` y PR contra `main` (apilado sobre #14); mergear a pedido y luego archivar.
