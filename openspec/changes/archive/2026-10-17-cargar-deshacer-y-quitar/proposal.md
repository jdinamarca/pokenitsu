# Proposal

## Why

En Cargar de arma, el botón "Deshacer" de la ficha no dice qué va a deshacer, y revierte **la última carga de la cuenta**, sea cual sea. El 17 de octubre el usuario lo tocó 7 veces sin saber qué hacía y deshizo cargas del 12 y del 15 de octubre, que no eran de esa sesión. Hubo que devolverlas desde un respaldo.

Además, el usuario necesita **descontar una carta** cuando se equivoca al cargar, en la carta o en la cantidad. Hoy la única forma en Cargar es escribir `-25`, que quita según los ajustes de la sesión y no se ve en pantalla. Si la copia equivocada es de otra variante, idioma o estado, hay que cambiar primero la sesión.

El usuario eligió dos opciones:
- **"Deshacer" en la lista de la sesión:** se quita el botón grande de la ficha.
- **Sus copias en la ficha, con −1.**

## What Changes

**"En esta sesión" pasa a ser la lista de lo cargado:**
- Cada carga o rango es un renglón, de lo más nuevo a lo más viejo: "+1 ニャース #047 Normal · JA · NM → Caja 4", "−1 …" o "+30 cartas (1–30)". Arriba van el total de copias y las cartas nuevas.
- **Solo el renglón más nuevo tiene "↶ Deshacer"**, y debajo dice "Deshacer revierte solo la última carga de esta sesión".
- **Deshacer revierte exactamente esa carga**: la de ese renglón, o el rango completo, identificada por su registro en el historial. Nunca una carga de otra sesión ni de otro dispositivo.
- Si ya no existe, por ejemplo porque se deshizo en Nitsu, avisa y no toca nada.
- Al deshacer, el renglón sale de la lista y el siguiente queda como el último que se puede deshacer.
- **⌘/Ctrl+Z con la caja vacía** hace lo mismo que ese "Deshacer". Con la lista vacía, dice "No hay nada que deshacer en esta sesión" y no toca el inventario.
- **Se quita el botón "Deshacer" de la ficha.**
- La lista vive mientras la página está abierta. Al recargar, empieza vacía.

**Tus copias en la ficha, con −1:**
- La ficha de la carta marcada muestra "Tienes N copias" y **cada fila que tienes** de esa carta: variante · idioma · estado · ubicación ×N, con cuántas son personales.
- Cada fila tiene un botón **−1** que quita una copia de **esa fila exacta**, con el mismo efecto que en Mi inventario.
- La quita queda en la lista de la sesión como "−1 …" y se puede deshacer como cualquier carga.
- Sin copias, la ficha dice "Te falta · está en penumbra", como hoy.

**Lo de siempre sigue igual:** "Cargar una", el doble clic, `-25` y los rangos.

**API (`@pokenitsu/inventory` y arma):**
- `undo` acepta opcionalmente `{ logId }` o `{ batch }` y revierte solo eso.
- Si ya no existe, responde `{ undone: null }` sin tocar nada.
- Sin parámetros se comporta como hoy, así que **Nitsu no cambia**.

**Fuera del alcance:**
- Mi inventario: ya tiene −1/+1.
- El "Deshacer" de Nitsu.
- Guardar la lista de la sesión al recargar.
- Un historial de cargas por días.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `carga-en-la-vitrina`: "Deshacer" pasa a la lista de la sesión y revierte solo la última carga de esa sesión; "Lo cargado en la sesión" pasa a ser una lista; la ficha muestra tus copias con −1.

## Impact

- **Código:**
  - `packages/inventory/src/inventory.ts`: `undo(c, { logId?, batch? })`, con pruebas;
  - `apps/arma/server/inventory.ts`: la ruta acepta el cuerpo;
  - `apps/arma/src/Cargar.tsx`: la lista de la sesión, Deshacer y ⌘Z, y las filas con −1 en la ficha;
  - `apps/arma/src/api.ts` y `styles.css`;
  - README y DESIGN.md de arma.
- **Datos:** ninguna migración. Las quitas y los "deshacer" escriben el inventario y su historial, como hoy.
- **Nitsu:** sin cambios. Su `/api/inventory/undo` llama a `undo` sin parámetros.
