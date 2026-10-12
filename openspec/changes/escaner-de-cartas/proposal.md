# Proposal

## Why

El teclado es rápido sentado frente al computador, pero muchos usuarios ordenan cartas en el suelo o en una mesa con el celular en la mano. Apuntar la cámara a la carta y confirmar es la forma más natural de cargar desde el celular, y es una de las funciones que más valoran las apps de colección.

## What Changes

- Botón **📷 Escanear** en Cargar (en celular y en computadores con cámara).
- Vista de cámara con un marco guía sobre la esquina inferior de la carta, donde viene impreso el número (ej. `025/165`) y, en las cartas modernas, el código de la expansión y el idioma (ej. `MEW EN`).
- La app lee ese texto y propone la carta: muestra su imagen, nombre, expansión y número para confirmar.
  - Si lee el código de la expansión, la elige sola; si no (cartas antiguas sin código), usa la expansión activa de Cargar.
  - Si lee el idioma impreso, lo usa; si no, usa el idioma activo.
- **Variante y estado** se eligen con botones grandes (Normal, Reverse, Holo…; NM, LP…), porque la cámara no distingue un reverse de forma confiable. Por defecto, la variante automática y el estado activo.
- **Confirmar** carga la carta igual que con el teclado: misma ubicación automática, avisos de precio y de carta nueva, deshacer, y avance de la expansión si ya existe.
- **Modo continuo**: tras confirmar, la cámara queda lista para la siguiente carta.
- Si la lectura falla o es dudosa, se muestra lo leído para corregirlo con el teclado numérico.
- Todo el reconocimiento ocurre en el dispositivo: las imágenes de la cámara no se envían a ningún servidor.

**Fuera del alcance:** reconocer la carta por su ilustración (sin leer el número), detectar la variante o el estado con la cámara, escanear varias cartas en una sola foto, y cartas sin número impreso.

**Requisito previo:** el navegador solo permite usar la cámara en sitios con HTTPS (o en `localhost`), así que este cambio se prueba en el computador y se usa en el celular después del despliegue de la alfa. Conviene hacerlo después del front en React (ADR 0012).

**Datos del usuario:** no se modifican; usa las mismas cargas que el teclado.

## Capabilities

### New Capabilities

- `escaner-de-cartas`: carga de cartas apuntando la cámara al número impreso, con confirmación, selección de variante y estado, y modo continuo.

### Modified Capabilities

Ninguna: el resultado de un escaneo pasa por la carga existente (`carga-de-cartas`) sin cambiar sus reglas.

## Impact

- **Front:** vista de cámara, lector de texto en el navegador (librería de OCR a definir en el ADR 0017) y pantalla de confirmación.
- **packages/core:** interpretación del texto leído (número, total impreso, código de expansión, idioma) y búsqueda de la expansión por código y total impreso, con pruebas.
- **API:** sin cambios (usa `/api/inventory/add`).
- **ADR nuevo:** 0017, cómo se reconoce la carta (Propuesto, a validar con una prueba de concepto).
