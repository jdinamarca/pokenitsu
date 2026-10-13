# Design

## Context

- `sets` ya tiene `total` y `printed_total` para las 176 expansiones internacionales. Las japonesas traen su total desde TCGdex.
- `cards.number` es texto: hay números puros (`025`), con letra (`25a`), con prefijo de subcolección (`TG01`, `GG35`, `SV107`) y promos (`SWSH050`).
- El front ya tiene el índice de cartas por expansión (`cards[sid]`, cargado bajo demanda) y el inventario completo en memoria (`data.inv`).
- TCGdex entrega por carta `variants: { normal, reverse, holo, firstEdition, wPromo }`, y `details.js` ya consulta TCGdex carta por carta para completar ilustradores.
- En las expansiones de promos el "número impreso" no tiene sentido.

## Goals / Non-Goals

**Goals:** cálculo de avance en `packages/core`, puro y con pruebas; el indicador de Cargar se actualiza sin pedir nada al servidor.

**Non-Goals:** guardar avances en la base (siempre se calculan); variantes no estándar en el master set.

## Decisions

### 1. Clasificar cada número: impreso o extra
En `core`, `isPrintedNumber(number, printedTotal)`: es impreso si es solo dígitos (ignorando ceros a la izquierda) y está entre 1 y el total impreso. Todo lo demás (mayor al total, con prefijo, con letra) es extra.
- Base = impresos que se tienen / total impreso.
- Con secretas = todas las cartas que se tienen / total de cartas del catálogo de la expansión.
- Para expansiones de promos (sin total impreso), Base y Con secretas son iguales.

*Alternativa:* usar la rareza para detectar secretas. Se descarta: las rarezas varían entre eras y fuentes; el número es más confiable.

### 2. Variantes en el catálogo
- Migración: `cards.variants text[]` (null = no se sabe) y `cards.variants_guessed boolean`.
- `details.js` guarda `variants` al consultar TCGdex. Se agrega un trabajo por expansión que completa las variantes de todas sus cartas (una petición por carta, con límite de concurrencia), priorizando las expansiones con cartas del usuario. Con pg-boss (ADR 0013) si ya está; si no, con la misma cola en proceso que usa hoy `details.js`.
- Si TCGdex no tiene la carta, se deduce por rareza y se marca `variants_guessed`.
- `wPromo` (sello de promo de Wizards) se ignora.

### 3. Qué tiene el usuario
Para cada expansión, el front arma desde `data.inv` el conjunto de `número` y de `número|variante` que pasan los filtros (copias, idioma). En master set, las variantes de checklist (Poké Ball, etc.) no suman, y las variantes del inventario se comparan con `variants` del catálogo (`firstedition` ↔ `firstEdition`).

### 4. Vista de expansiones
- Nueva pestaña **📚 Expansiones** con la lista y el detalle (grilla tipo checklist).
- El detalle carga las cartas de la expansión con su imagen (`/api/sets/:id/cards`, ampliada con `variants`) y los precios de las faltantes (se descargan en segundo plano como hoy).
- Lista: por defecto, expansiones con al menos una carta; "Todas" muestra el catálogo completo (unas 440 expansiones; sin imágenes en la lista, solo el símbolo).

### 5. Indicador en Cargar
Junto al nombre de la expansión activa: "88/165 · 53%" con una barra fina. `commitEntry` y `undoLast` recalculan solo la expansión activa. El aviso "¡Nueva!" se agrega al mensaje de confirmación existente.

## Risks / Trade-offs

- [Muchas peticiones a TCGdex para completar variantes de expansiones grandes] → solo bajo demanda y para expansiones con cartas del usuario; concurrencia limitada; se guarda una vez por carta.
- [Números raros (25a, SV107) mal clasificados] → prueba con todos los números del catálogo: cada uno debe clasificarse sin error, y se revisan a mano los casos con letras.
- [`printed_total` incorrecto en alguna fuente] → se muestra el total usado y se puede reportar; no se corrige a mano en este cambio.
- [Las promos inflan "Todas las expansiones"] → las expansiones de promos se pueden ocultar con un filtro "Sin promos".

## Migration Plan

Migración aditiva (`ALTER TABLE cards ADD COLUMN ...`), sin tocar tablas del usuario. Vuelta atrás: la columna se puede dejar o borrar sin efecto en el resto.
