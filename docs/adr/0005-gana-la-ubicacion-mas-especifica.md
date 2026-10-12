# 0005. Al asignar una ubicación, gana la más específica

- Estado: Aceptado (registra una decisión ya tomada)
- Fecha: 2026-10-12

## Contexto
El usuario define cajas y carpetas con reglas que se superponen: una caja para toda la serie Scarlet & Violet, otra solo para Mega Evolution, una carpeta para lo que vale más de $5.000. Con "gana la primera de la lista", una caja general puesta arriba se quedaba con cartas que tenían una caja propia, y el usuario no entendía por qué.

## Decisión
Entre las ubicaciones cuya regla acepta la copia, gana la de mayor especificidad:
colección personal > especiales/precio mínimo > expansión nombrada > serie nombrada > solo challa > región > caja general (sin regla).
El orden de la lista solo desempata. Las ubicaciones con `auto: false` nunca se asignan solas. La interfaz avisa (⚠️) cuando otra ubicación se queda con cartas que una regla también acepta.

## Alternativas consideradas
- **Gana la primera de la lista:** simple, pero obliga al usuario a ordenar con cuidado y fue fuente de errores reales.
- **El usuario elige siempre a mano:** lento al cargar miles de cartas.

## Consecuencias
- Positivas: el resultado es predecible ("la caja que nombra la expansión gana a la que nombra la serie") sin importar el orden.
- Negativas: la función de puntaje (`locScore`) es lógica de negocio crítica; debe tener pruebas automáticas y vivir en `packages/core`.
