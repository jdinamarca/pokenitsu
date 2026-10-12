# 0003. Fuentes de precio y conversión a pesos chilenos

- Estado: Aceptado (registra una decisión ya tomada)
- Fecha: 2026-10-12

## Contexto
Los usuarios venden en Chile y piensan en pesos, pero no hay una fuente de precios en CLP. Las fuentes públicas tienen huecos: pokemontcg.io no tiene las expansiones recién salidas y su precio de Cardmarket está desactualizado; las japonesas solo aparecen en TCGdex. Collectr no tiene API pública.

## Decisión
- **TCGplayer (USD)** desde pokemontcg.io, por impresión (normal, holofoil, reverseHolofoil, 1st Edition…).
- **Cardmarket (EUR)** desde TCGdex, revisado cada 3 días; respaldo en TCGdex en inglés para expansiones nuevas; TCGdex Cardmarket para las japonesas.
- El usuario elige la fuente preferida; un precio **exacto** de cualquier fuente gana a uno **aproximado** (`≈`, el de la carta base cuando falta la variante).
- Conversión con el tipo de cambio del día de **exchangerate-api.com**, con **mindicador.cl** como respaldo.
- Se guarda el precio crudo (USD/EUR) por carta y se convierte al mostrarlo; los % por estado se aplican sobre el precio NM.
- La lógica de elección vive en un solo módulo compartido por front y servidor (hoy `public/pricing.js`, mañana `packages/core`).

## Alternativas consideradas
- **Guardar precios ya convertidos a CLP:** quedarían viejos cada vez que cambia el dólar.
- **Scraping de Collectr u otros sitios:** frágil y contra sus términos.
- **Una sola fuente:** deja sin precio a las japonesas y a las expansiones nuevas.

## Consecuencias
- Positivas: casi todas las cartas tienen precio en CLP actualizado; se sabe de dónde viene cada precio.
- Negativas: dependencia de APIs gratuitas sin SLA; hay que manejar límites de uso y caídas (reintentos en segundo plano, [0013](0013-tareas-en-segundo-plano-con-pg-boss.md)).
- Revisar si aparece una fuente con precios del mercado chileno.
