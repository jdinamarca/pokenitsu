# Tasks

## 1. Reglas puras y paquete compartido

- [x] 1.1 En `packages/core`, con pruebas de Vitest:
  - la cuenta de copias al sumar o restar (cantidad y personales, sacando primero las de venta);
  - el reparto al mover n copias;
  - `expandRange(index, entry)`, que se salta los números que no existen y marca cuándo hay que confirmar (más de 50).
- [x] 1.2 `packages/inventory`: `addCopies`, `undoLast`, `moveCopies`, `setPersonal`, `setOwnPrice`, `resolveCard`, `ensureSetCards` (pokemontcg.io y TCGdex) y `getFx`, con el SQL movido sin cambios desde `apps/api`. Lleva compilación, typecheck, lint y pruebas con un cliente falso (consultas y parámetros esperados). Verificar que compila y que las pruebas pasan.
- [x] 1.3 `apps/api` pasa a usar el paquete, con `index.js`, `catalog.js` y `prices.js` como adaptadores y las mismas rutas y respuestas. Verificar contra una copia de la base que en Nitsu funcionan cargar, quitar, un rango con su deshacer, mover, personales, mi precio y una expansión sin descargar, y que las filas quedan iguales que antes del cambio.

## 2. API de arma

- [x] 2.1 `server/viewerTx.ts`: transacción con `app.user_id`. Rutas `GET /api/sets`, `GET /api/sets/:id/cards` (con copias de la cuenta y precio guardado), `GET /api/inventory` (filas y ubicaciones), `POST /api/inventory/add`, `/undo`, `/move`, `/personal` y `PUT /api/prices/own`. Verificar con `curl` en la copia de la base: sin sesión da 401, y con dos cuentas, cada una ve y cambia solo lo suyo.
- [x] 2.2 El script raíz `arma` y el CI compilan `@pokenitsu/inventory`. Verificar que `pnpm arma` arranca desde cero.

## 3. Pantallas

- [x] 3.1 `Shell` con el riel de navegación ("Arma · Eevee", "Cargar", "Mi inventario", "Cerrar sesión"), rutas `/cargar` y `/inventario` con `pushState`, y redirección a `/entrar` sin sesión.
- [x] 3.2 Cargar (AO):
  - búsqueda de expansión con recientes y sufijo de idioma, y "Cargando cartas…" con reintento;
  - vitrina encendida o en penumbra con ×N, contador "N / total encendidas" y filtro "solo las que faltan";
  - entrada con toda la sintaxis, carta marcada al escribir, Esc, Enter vacío que repite y confirmación de rangos;
  - clic para marcar y cargar, ficha con lo que se va a cargar, "Nueva", resumen de la sesión y Deshacer (botón y ⌘/Ctrl+Z);
  - chips de la sesión recordados en el navegador.
- [x] 3.3 Mi inventario (AR):
  - repisas por ubicación en su orden, con "Sin ubicación" al final, ×N y etiqueta;
  - riel con "Todas", ubicaciones y conteos;
  - contador y nota de valor, búsqueda y filtro "Para";
  - ficha con −1/+1, mover en línea ("¿Cuántas de las N copias?"), personales y mi precio.
- [x] 3.4 En Chrome sin interfaz, contra una copia de la base, con Nitsu apagado y sin errores de JS:
  - cargar `133r`, `25*3`, `-25`, `1-10` y deshacer el rango;
  - una expansión sin descargar;
  - clic en una carta en penumbra;
  - Automático contra una ubicación fija;
  - en Inventario: elegir una ubicación, buscar, −1 hasta 0, mover 2 de 3, personales y mi precio;
  - con "reducir movimiento" emulado, que la penumbra cambia al instante;
  - a 1280 y 1440 px, que no hay cartas cortadas ni scroll horizontal.

  Después, encender Nitsu de prueba y comprobar que muestra exactamente lo cargado y lo movido.

## 4. Documentación y cierre

- [x] 4.1 Documentación: ADR 0023 ("Arma escribe el inventario compartido") y su índice; README (Cargar, Mi inventario, qué sigue en Nitsu); DESIGN.md de arma (riel de navegación, vitrina de carga y estantería). Verificar que lo explican.
- [ ] 4.2 `pnpm build && pnpm typecheck && pnpm lint && pnpm test` en verde. Comprobar que la base real no cambió y borrar la copia, las cuentas de prueba y el worktree (confirmar que la carpeta desapareció).
