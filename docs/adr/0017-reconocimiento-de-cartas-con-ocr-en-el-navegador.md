# 0017. Reconocer las cartas con OCR en el navegador

- Estado: Propuesto (a validar con la prueba de concepto de `escaner-de-cartas`)
- Fecha: 2026-10-12

## Contexto
El escáner con cámara (`openspec/changes/escaner-de-cartas`) necesita identificar la carta. Las cartas modernas imprimen código de expansión, idioma y número (`MEW EN 025/165`); las antiguas, solo el número (`58/102`). La variante (reverse, holo) no se distingue bien con la cámara y se elige a mano. Los usuarios escanean en el celular, a veces con mala conexión, y las fotos de su colección son privadas.

## Decisión
Leer el texto del recuadro inferior de la carta con **OCR en el navegador** (librería en WebAssembly; candidata: Tesseract.js), con recorte, preprocesamiento y alfabeto restringido, y resolver la carta con el catálogo local (código + número, o expansión activa + número).

**Criterio de aceptación de la prueba de concepto** (100 cartas reales, celular de gama media):
- número correcto en al menos 90% de las cartas;
- código de expansión correcto en al menos 85% de las cartas que lo traen impreso;
- menos de 1,5 segundos por lectura.

## Alternativas consideradas
- **Servicio de reconocimiento por imagen de pago (ej. APIs especializadas en cartas):** reconoce también cartas sin número y por ilustración, pero cobra por consulta, envía las fotos a terceros y depende de la conexión. Queda como plan B si el OCR no alcanza el criterio.
- **OCR en nuestro servidor:** más poder de cómputo, pero envía imágenes, agrega costo y latencia, y no aporta precisión para un recuadro tan chico.
- **APIs nativas del sistema (reconocimiento de texto del celular):** muy buenas, pero no están disponibles de forma estándar en el navegador; requerirían una app nativa.
- **Leer por ilustración (comparar imágenes):** necesita un índice de imágenes de todo el catálogo y es mucho más complejo; fuera del alcance.

## Consecuencias
- Positivas: gratis, privado (las imágenes no salen del dispositivo), funciona con mala conexión.
- Negativas: la librería pesa varios MB (se carga solo al abrir el escáner); la precisión depende de la luz y del celular; las cartas sin número legible no se pueden escanear.
- Si no se cumple el criterio, se registra el resultado aquí y se evalúa el servicio de pago en un ADR nuevo.
