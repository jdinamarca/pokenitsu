# Design

## Context

- Las cartas desde Sword & Shield traen abajo a la izquierda el código de expansión, el idioma y el número (`MEW EN 025/165`). Las anteriores traen el número (`58/102`) y un símbolo de expansión, sin código.
- El catálogo tiene `sets.code` y `sets.printed_total`, suficientes para identificar la expansión por código, o por total impreso entre las de la misma era.
- La carga ya está resuelta (`commitEntry` → `/api/inventory/add`); el escáner solo produce una entrada equivalente.
- La cámara requiere un contexto seguro (HTTPS o `localhost`).

## Goals / Non-Goals

**Goals:** leer un recuadro chico con texto de alto contraste, rápido y sin enviar imágenes fuera del dispositivo.

**Non-Goals:** reconocer la ilustración; funcionar sin luz o con cartas en fundas muy reflectantes.

## Decisions

### 1. OCR en el navegador (ADR 0017, Propuesto)
Reconocimiento de texto en el dispositivo con una librería de OCR en WebAssembly (candidata: Tesseract.js), limitado a un recuadro recortado y a un alfabeto restringido (dígitos, letras mayúsculas y `/`). El ADR compara esto con servicios de reconocimiento por imagen de pago y con OCR en el servidor, y define el criterio de aceptación de la prueba de concepto.

### 2. Recorte y preprocesamiento
Se recorta solo el marco guía del video, se pasa a escala de grises y se aumenta el contraste antes del OCR. Se procesan varios cuadros por segundo y se acepta una lectura cuando dos cuadros seguidos coinciden.

### 3. Interpretación en `core`
`parseCardCode(text)` extrae `{ setCode?, lang?, number, printedTotal? }` con tolerancia a confusiones típicas del OCR (O↔0, I↔1, S↔5 en posiciones numéricas). `findSetByCode(sets, code, printedTotal)` resuelve la expansión. Ambas con pruebas sobre textos reales leídos en la prueba de concepto.

### 4. Pantalla
Pantalla completa en celular: video arriba con el marco guía; abajo, la tarjeta propuesta, botones de variante y estado, y botón grande Confirmar. Se implementa en el front nuevo (React) si ya existe; si no, como un diálogo en el front actual.

## Risks / Trade-offs

- [Precisión insuficiente en cartas antiguas o con fundas] → la prueba de concepto mide la precisión antes de construir; siempre hay confirmación y corrección manual.
- [Peso de la librería de OCR (varios MB)] → se carga solo al abrir el escáner y queda en caché.
- [Celulares antiguos lentos] → limitar los cuadros por segundo; el teclado sigue disponible.
- [Variantes que la cámara no distingue] → se eligen con botones (decisión explícita, ver proposal).

## Migration Plan

Sin migraciones. Se habilita detrás del botón Escanear; si la prueba de concepto no alcanza el criterio del ADR 0017, el cambio se detiene antes de construir la pantalla.

## Open Questions

- Si conviene ofrecer una opción para cartas sin número legible (ej. elegir de una grilla de la expansión activa). Se puede decidir después de la prueba de concepto sin cambiar la especificación.
