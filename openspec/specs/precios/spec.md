# precios Specification

## Purpose
Mostrar cuánto vale cada copia en pesos chilenos, con precios de mercado y precios propios del usuario.

## Requirements

### Requirement: Fuentes de precio
El sistema SHALL obtener precios NM de:
- TCGplayer (USD, por impresión) desde pokemontcg.io
- Cardmarket (EUR) desde TCGdex, revisado cada 3 días (más fresco que el de pokemontcg.io)
- TCGdex en inglés como respaldo para expansiones nuevas sin precio en pokemontcg.io (expansión guardada en `sets.tcgdex_en`)
- TCGdex Cardmarket para las japonesas

Los precios SHALL descargarse en segundo plano para las cartas del inventario, de las colecciones y de los lotes, y renovarse una vez al día.

#### Scenario: Expansión recién salida
- **WHEN** pokemontcg.io no tiene precio para una carta nueva
- **THEN** el sistema usa el precio de TCGdex en inglés

### Requirement: Variante exacta o aproximada
El sistema SHALL usar el precio de la impresión que corresponde a la variante. Si la carta solo tiene una impresión en TCGplayer, ese precio es exacto para cualquier variante salvo reverse. Si no hay precio de la variante, usa el de la carta base y lo marca con `≈`. Un precio exacto de cualquier fuente gana a uno aproximado.

#### Scenario: Promo de una sola impresión
- **WHEN** TCGplayer solo lista "holofoil" para la promo Wizards #11 y la copia es "normal"
- **THEN** se usa ese precio sin `≈`

### Requirement: Conversión a CLP
El sistema SHALL convertir USD y EUR a CLP con el tipo de cambio del día de exchangerate-api.com, con mindicador.cl como respaldo, y mostrar la fuente y la hora del tipo de cambio.

#### Scenario: Falla la fuente principal
- **WHEN** exchangerate-api.com no responde
- **THEN** se usa mindicador.cl

### Requirement: Descuento por estado y fuente preferida
El sistema SHALL aplicar a cada estado un % del precio NM configurable (por defecto NM 100, LP 85, MP 70, HP 50, DMG 30) y permitir elegir TCGplayer o Cardmarket como fuente preferida.

#### Scenario: Copia LP
- **WHEN** una carta vale $10.000 en NM y la copia es LP
- **THEN** su valor es $8.500

### Requirement: Alerta de carta valiosa
El sistema SHALL avisar al cargar una carta cuyo valor sea mayor o igual al umbral configurable (por defecto $5.000).

#### Scenario: Umbral en cero
- **WHEN** el umbral es 0
- **THEN** no se muestran alertas

### Requirement: Precio propio en dólares
El sistema SHALL permitir fijar un precio propio NM por carta + variante, escrito en USD (`349,99`, `349.99`, `1.234,56`). Se guarda en USD y su valor en CLP se recalcula con el tipo de cambio del día. Gana sobre el precio de mercado y se le aplican los % por estado. Dejarlo vacío vuelve al precio de mercado.

#### Scenario: Escribir 349,99
- **WHEN** el usuario escribe `349,99` como su precio y el dólar está a $979,01
- **THEN** se guarda US$349,99 y la carta vale $342.644 en NM

#### Scenario: Sube el dólar
- **WHEN** cambia el tipo de cambio
- **THEN** el valor en CLP del precio propio cambia sin que el usuario lo edite

### Requirement: Revisión de precios propios
Cada precio propio SHALL guardar cuándo se fijó o revisó. Tras N días (por defecto 7, configurable) se marca ⚠️ como "por actualizar". Guardar el mismo valor lo marca como revisado hoy. Las etiquetas muestran ✍️ y la fecha.

#### Scenario: Precio vencido
- **WHEN** un precio propio tiene 10 días y el plazo es 7
- **THEN** aparece en naranjo con ⚠️ y en el filtro "Mi precio por actualizar"
