# Design

## Context

- **`undo(c)` (`packages/inventory/src/inventory.ts`):** toma la entrada más nueva de `inventory_log` de la cuenta (RLS), y su rango completo si tiene `batch`. Revierte las filas y borra esas entradas. La usan Nitsu (`apps/api`) y arma (`/api/inventory/undo`).
- **`add(c, body)`:** devuelve `logId` (la entrada nueva del historial, si hubo cambio real) y recibe `batch` para los rangos. `delta` negativo quita copias.
- **Cargar (`apps/arma/src/Cargar.tsx`):**
  - `loaded: {copies, fresh, last}[]` solo cuenta; no guarda qué deshacer.
  - `undo()` llama a `api.undo()` sin decir qué, y la ficha tiene el botón "Deshacer".
  - `SetCard.copies: CopyRow[]` ya trae las filas de la cuenta (variante, idioma, estado, ubicación, cantidad, personales).
- **Mi inventario** ya quita una copia de una fila con `add` y `delta: -1` sobre esa fila.

## Goals / Non-Goals

**Goals:**
- Que "Deshacer" no pueda tocar nada fuera de la sesión, y que diga qué deshace.
- Quitar una copia de la fila exacta desde Cargar.

**Non-Goals:**
- Cambiar Nitsu.
- Persistir la sesión.

## Decisions

### 1. Deshacer por identidad: `undo(c, { logId?, batch? })`
- **Con `batch`:** revierte las entradas de ese grupo.
- **Con `logId`:** revierte esa entrada.
- **Si ya no está** (otra pestaña o Nitsu la deshizo): devuelve `{ undone: null, rows: [] }` y no toca nada.
- **Sin parámetros:** la de siempre, la última de la cuenta. Así Nitsu no cambia.

La consulta sigue con `FOR UPDATE` y bajo la RLS de la cuenta: una cuenta no puede deshacer lo de otra aunque adivine un id.

*Alternativa descartada:* "deshacer la última de la cuenta, pero solo si es de la sesión". Una carga hecha desde otro dispositivo en medio la bloquearía, o haría deshacer la equivocada.

### 2. La lista de la sesión en el front
`loaded` pasa a ser `SessionEntry[]`:

```ts
{ key, kind: 'one' | 'range', copies, fresh, text, logId?, batch?, sid, nums }
```

- **Una carga (`runOne`):** guarda el `logId` que devuelve `add`.
- **Un rango:** guarda el `batch` que ya genera.
- **Una quita con −1:** es una carga de `delta: -1` con su `logId`.
- **Si `add` no hizo nada** (`real` 0, por ejemplo al quitar sin copias): no entra a la lista.

`undo()` toma el último de la lista y llama a `api.undo({ logId | batch })`.
- **Si responde `undone`:** actualiza las cartas de la vitrina y saca el renglón.
- **Si responde `null`:** avisa "Esa carga ya no estaba (se deshizo en otro lado)" y saca el renglón igual, porque ya no se puede deshacer.

⌘Z llama a lo mismo. La lista se muestra de lo más nuevo a lo más viejo, con un máximo visible de 50 y scroll; las más viejas se resumen en "y N más".

### 3. Las filas de la ficha con −1
- `focus.copies`, ordenadas por variante, idioma, estado y ubicación, se muestran como renglones: "Normal · JA · NM · Caja 4 ×2 (1 personal)" y un botón `−1`.
- **El −1:** `enqueue` → `api.add({ sid, num, variant, lang, cond, loc, delta: -1 })`.
  - **Copias personales:** no se envía `personal`. `addToCopies` quita primero las que son para vender, igual que el −1 de Mi inventario, y lo mismo vale al deshacer.
  - **Al responder:** `withRow` actualiza la carta, y el renglón entra a la lista de la sesión.
  - **El botón:** queda deshabilitado mientras la cola escribe, para evitar dobles clics.
- **Los nombres:** la ubicación se escribe con `locName` y la variante con `variantName`, los mismos de Mi inventario.

### 4. La ficha sin "Deshacer"
Los botones de la ficha quedan solo con "Cargar una".

## Risks / Trade-offs

- **[Deshacer en Nitsu sigue siendo "la última de la cuenta"]** → Fuera del alcance. Su botón está en la vista de carga de Nitsu, con su propio aviso. Se puede alinear después.
- **[Una carga hecha en otra pestaña de arma]** → No está en la lista de esta pestaña, así que esta no la deshace. Es lo esperado.

## Migration Plan

Sin migraciones. Para volver atrás, se revierte el PR. El parámetro nuevo de `undo` es opcional.
