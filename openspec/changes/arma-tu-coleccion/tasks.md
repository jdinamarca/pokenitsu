# Tasks

## 1. Base de la app y ADR

- [x] 1.1 Escribir el ADR 0020 (app aparte `apps/arma`, esquema `arma`, modelo de procedencia y permisos por fuente) y agregarlo al índice; verificar que el link del índice funciona
- [x] 1.2 Crear `apps/arma` (Vite + React + TypeScript en `src/`, Fastify + `tsx` en `server/`), el script `pnpm arma` (front en 5180 con proxy `/api` → 3002) y sumarla a `typecheck`/`lint`; verificar que `pnpm arma` levanta ambas partes y que `GET /api/health` responde
- [x] 1.3 Migraciones propias del esquema `arma` (`sources` sembradas, `printings`, `facts`, `designs`, `views`, `source_cache`, `schema_migrations`); verificar en una copia de la base (`DATABASE_URL` apuntando a la copia) que se crean, que reaplicar no hace nada y que `public` no cambia

## 2. Reglas puras en core

- [x] 2.1 Código de catálogo estable y normalización de variantes (TCGdex `variants_detailed`, claves de TCGplayer, `variant`/`variantType` de PokeCottage, variantes del inventario), con pruebas para Jungle #51, 151 #133, Prismatic #74, SWSH042 y una promo GX
- [x] 2.2 Fusión de afirmaciones por `(set_key, número, idioma, finish, stamp)` y equivalencias por diseño y variante, con pruebas (Prismatic #74 en 5 idiomas = 1 equivalencia; 151 #133 normal y reverse = 2; un enset+jpset de Bulbapedia = 1)
- [x] 2.3 `applyRules` (solo inglés entre idiomas occidentales con preferencia EN → resto alfabético; asiáticas traducidas = japonesa; sellos y mazos; WCD; jumbo), con pruebas que cubren los escenarios de la spec y que verifican que nunca se quita una impresión del Full

## 3. Importadores (API)

- [x] 3.1 Cliente de fuentes (User-Agent de Nitsu, 2 pedidos a la vez, caché de 24 h en `arma.source_cache`, reintentos); verificar con un pedido repetido que el segundo sale de la caché
- [x] 3.2 Importadores de TCGdex (todos los idiomas, por dex y nombre) y del catálogo actual (cartas, copias propias de fotos y claves de TCGplayer); verificar en la copia que la Eevee de Jungle #51 queda con sus fuentes y que el precio de TCGplayer queda marcado ⛔
- [x] 3.3 Importador de PokeCottage (solo texto, sin guardar URLs de fotos) con el cruce de expansiones del lector anterior; verificar que importa las 435 entradas, cuántas cruzan con el catálogo y que no queda ninguna URL de `pokecottagecdn.com` en `arma.*`
- [x] 3.4 Importador de Bulbapedia (MediaWiki `action=parse`, plantillas `card list/card` y `card list/release`) para diseños y equivalencias EN↔JA; verificar que lee los 73 diseños, que no guarda imágenes y que, con la fuente caída, conserva lo anterior y avisa
- [x] 3.5 `POST /api/import/:dex` (fusión, equivalencias y resumen por fuente: nuevas, actualizadas y sin cruzar) y `GET /api/full/:dex`; verificar que reimportar no duplica impresiones (mismo total dos veces seguidas)

## 4. Sesión, inventario y vistas

- [x] 4.1 Sesión desde la cookie `pokenitsu.session_token` y lectura del inventario con RLS (`set_config('app.user_id', …)`), con el cruce inventario → impresión; verificar con la cuenta de prueba que las copias aparecen en sus impresiones, que sin cookie la API responde 401 y que el inventario no cambia
- [x] 4.2 Vistas guardadas por usuario (`GET`/`POST`/`DELETE /api/views`) con "Full" fija; verificar que un usuario no ve las vistas de otro

## 5. Pantalla Vitrina

- [x] 5.1 Tokens y tipografía del contrato de dirección (Archivo y Archivo Narrow desde `@fontsource`) y el layout: riel, contador, vitrina por diseño y ficha; verificar en Chrome sin interfaz a 1440×900 contra la maqueta AE
- [x] 5.2 Reglas y vistas en el riel con el gesto característico (penumbra en 450 ms y nada con "reducir movimiento") y el contador con cifras tabulares; verificar que activar "solo inglés" cambia el contador y pone en penumbra las impresiones correctas, y que "Full" las enciende todas
- [x] 5.3 Ficha de impresión (código, foto grande, datos, copias en el inventario, si cuenta o no, y la fuente y el permiso de cada dato, con stickers) y el aviso "Entra en Nitsu" sin sesión; verificar ambos estados con capturas
- [x] 5.4 Pasada de Impeccable: `impeccable detect --json` sobre la app, corregir lo mecánico y revisión de terminación con capturas a 1440 y 1280; luego escribir `apps/arma/DESIGN.md` desde lo construido (documentador de Impeccable)

## 6. Documentación y verificación integral

- [x] 6.1 README: sección "Arma tu colección" (cómo levantarla, fuentes y permisos, qué hace v1 y qué no)
- [x] 6.2 Verificar con una copia de la base que la base real no cambió (inventario, `public` sin cambios) y que no quedan copias ni cuentas de prueba, y correr `pnpm build && pnpm typecheck && pnpm lint && pnpm test`

## Workflow follow-up

- Commit con `Co-Authored-By`, PR contra `main` con 🤖 al final y CI verde
- Mergear solo cuando el usuario lo pida y luego archivar el cambio de OpenSpec
