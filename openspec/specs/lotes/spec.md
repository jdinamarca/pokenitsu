# lotes Specification

## Purpose
Agrupar las cartas de una venta o compra y ponerles precio a un % del valor de mercado, actualizando el inventario al cerrar el trato.

## Requirements

### Requirement: Lotes de venta y compra
El sistema SHALL permitir crear lotes de venta o compra con nombre, % del mercado (1–300; por defecto 90 para venta y 70 para compra, configurables), redondeo (1, 10, 50, 100, 500 o 1.000 CLP) y nota.

#### Scenario: Nuevo lote de venta
- **WHEN** el usuario crea un lote de venta
- **THEN** el lote parte abierto con el % de venta por defecto

### Requirement: Agregar cartas
El sistema SHALL permitir agregar líneas (carta + variante + idioma + estado + cantidad) tocando 📦 en Mi colección, agregando todas las filtradas, o escribiéndolas con la sintaxis de carga (ej. `MEW 25r lp*2`). En un lote de venta el sistema avisa si se agregan más copias que las disponibles para vender (no lo impide).

#### Scenario: Agregar las filtradas
- **WHEN** el usuario filtra por rareza IR y toca "📦 Agregar las filtradas"
- **THEN** todas las copias para vender de esas cartas entran al lote activo

### Requirement: Precio de cada línea
Cada línea SHALL valer el precio de mercado según su estado × % del lote, redondeado, salvo que el usuario fije a mano el precio de esa línea.

#### Scenario: Precio a mano
- **WHEN** el usuario fija $3.000 en una línea
- **THEN** esa línea usa $3.000 por copia aunque cambie el %

### Requirement: Listas para copiar
El sistema SHALL generar una lista de texto del lote (para WhatsApp o Instagram) y una lista para buscar las cartas, ordenada por ubicación.

#### Scenario: Lista para buscar
- **WHEN** el usuario copia la lista para buscar
- **THEN** las cartas salen agrupadas por ubicación y ordenadas por expansión y número

### Requirement: Cerrar y reabrir
Cerrar un lote SHALL descontar del inventario las copias para vender (venta) o sumarlas (compra), guardar el precio unitario cerrado y de qué ubicaciones salieron o a cuáles entraron las copias (`taken`). Reabrirlo SHALL deshacer exactamente esos movimientos.

#### Scenario: Reabrir una venta
- **WHEN** se reabre un lote de venta cerrado
- **THEN** las copias vuelven a las mismas ubicaciones de donde salieron
