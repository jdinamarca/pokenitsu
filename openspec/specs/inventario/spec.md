# inventario Specification

## Purpose
Ver, filtrar, ordenar y editar las copias que tiene el usuario (pestaña "Mi colección").

## Requirements

### Requirement: Modelo de filas
Cada fila del inventario SHALL identificarse por carta + variante + idioma + estado (NM, LP, MP, HP, DMG) + ubicación, y guardar `qty` (copias), `personal` (cuántas son para el usuario, 0..qty) y `added_at` (cuándo se agregó la primera copia). Una fila con 0 copias se elimina.

#### Scenario: Misma carta en dos estados
- **WHEN** el usuario tiene una copia NM y otra LP de la misma carta y variante
- **THEN** existen dos filas distintas

### Requirement: Vistas Galería y Tabla
El sistema SHALL mostrar el inventario como galería de cartas o como tabla, con barra fija de orden, lote activo, conteo y valor.

#### Scenario: Cambiar a Tabla
- **WHEN** el usuario elige Tabla
- **THEN** cada fila muestra selectores para variante, idioma, estado y ubicación

### Requirement: Filtros
El sistema SHALL filtrar por texto (nombre, expansión, ilustrador, número), idioma, venta/personal, rareza, estado, precio (todos, con mi precio, mi precio por actualizar, solo mercado, sin precio), ubicación y variante.

#### Scenario: Filtrar por ubicación
- **WHEN** el usuario elige "Caja 1 · Mega Evolution"
- **THEN** solo se ven las copias guardadas ahí

### Requirement: Orden
El sistema SHALL ordenar por: última o más antigua agregada, nombre A-Z/Z-A, valor unitario mayor/menor, valor total, expansión más nueva/antigua, cantidad, Pokédex, ilustrador y ubicación.

#### Scenario: Más valiosas primero
- **WHEN** el usuario ordena por valor mayor
- **THEN** la primera carta es la de mayor precio unitario según su estado

### Requirement: Editar copias
El sistema SHALL permitir, desde la ficha de la carta o la tabla, cambiar la variante, el idioma, el estado o la ubicación de N copias de una fila (por defecto todas; primero se mueven las de venta), fusionándolas si la fila destino ya existe, y ajustar cuántas son personales.

#### Scenario: Mover parte de las copias
- **WHEN** una fila tiene 3 copias y el usuario mueve 1 a LP
- **THEN** quedan 2 en la fila original y 1 en la fila LP, y `added_at` conserva la fecha más antigua

### Requirement: Resumen
El sistema SHALL mostrar total de cartas y filas, valor de venta, cantidad para vender, personales y conteo por variante.

#### Scenario: Valor de venta
- **WHEN** hay copias para vender con precio
- **THEN** el valor de venta suma precio por estado × copias para vender

### Requirement: Idioma sin asignar
El sistema SHALL permitir asignar un idioma a todas las filas cargadas sin idioma.

#### Scenario: Asignar español
- **WHEN** el usuario asigna ES a las filas sin idioma
- **THEN** esas filas pasan a ES y se fusionan con las ES existentes

### Requirement: Borrar todo el inventario
El sistema SHALL borrar el inventario y su historial solo si el usuario confirma escribiendo `BORRAR`.

#### Scenario: Sin confirmación
- **WHEN** se pide borrar sin la palabra BORRAR
- **THEN** el servidor rechaza la operación
