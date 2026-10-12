# 0006. El precio propio se guarda en dólares y se convierte cada día

- Estado: Aceptado (registra una decisión ya tomada)
- Fecha: 2026-10-12

## Contexto
Para cartas sin precio de mercado, o cuando el usuario confía más en otra referencia (ej. Collectr, en USD), puede fijar su propio precio. Si se guardara en CLP, quedaría desfasado cuando cambia el dólar, y escribir `349,99` se interpretaba como $34.999.

## Decisión
- El precio propio (`price_overrides`) se escribe en **USD** (acepta `349,99`, `349.99`, `1.234,56`) y se guarda en `usd`; su valor en CLP se calcula con el tipo de cambio del día.
- Se conserva la columna `clp` para precios antiguos y como último valor calculado.
- Cada precio propio guarda `updated_at`; tras N días (7 por defecto) se marca "por actualizar". Guardar el mismo valor lo marca revisado.

## Alternativas consideradas
- **Guardar en CLP:** queda viejo con el dólar y confunde los decimales.
- **Elegir moneda por precio:** más flexible pero más pasos al cargar; se puede agregar después si los testers lo piden.

## Consecuencias
- Positivas: los precios propios siguen al mercado sin trabajo manual.
- Negativas: un precio que el usuario piensa en pesos queda atado al dólar.
