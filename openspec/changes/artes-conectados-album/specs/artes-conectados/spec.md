# Spec Delta

## MODIFIED Requirements

### Requirement: Grupos de cartas
El sistema SHALL permitir crear, editar y borrar grupos con nombre y lista de cartas escrita como `<expansión> <números>` por línea, aceptando rangos (`N2 20 32 38`, `30C 130-133`), validando que cada carta exista. La edición SHALL mostrar el panorama armado mientras se escribe, y borrar SHALL pedir confirmación.

#### Scenario: Número inexistente
- **WHEN** una línea trae un número que no existe en esa expansión
- **THEN** el sistema lo informa y no guarda esa carta

#### Scenario: Vista previa
- **WHEN** el usuario escribe `N2 20 38 32` con 3 columnas
- **THEN** ve Espeon, Eevee y Umbreon juntas en una fila antes de guardar

#### Scenario: Borrar
- **WHEN** el usuario toca Borrar en la edición de un grupo y cancela la confirmación
- **THEN** el grupo no se borra

### Requirement: Progreso del grupo
Cada grupo SHALL mostrar sus piezas unidas, sin espacios, en sus columnas, las que no se tienen en blanco y negro, y el progreso, contando todos los idiomas o uno elegido.

#### Scenario: Pieza tenida
- **WHEN** el usuario tiene 1 de 3 cartas del grupo
- **THEN** se muestra 1/3 piezas y las otras dos en blanco y negro

## ADDED Requirements

### Requirement: Orden, filtros y resumen
La lista SHALL poder mostrar todos los grupos, solo los completos o solo los que tienen piezas faltantes; ordenarse por más cerca de completar, valor, costo de lo que falta o nombre; filtrarse por idioma y serie; y mostrar un resumen con la cantidad de grupos, completos, piezas faltantes y el costo de completarlos.

#### Scenario: Solo completos
- **WHEN** el usuario elige "Completos"
- **THEN** solo se ven los grupos donde tiene al menos una copia de cada pieza

### Requirement: Detalle de un grupo
Al abrir un grupo el sistema SHALL mostrar el panorama en grande, la imagen del arte unido si existe, y cada pieza con su expansión, número, copias que tiene, ubicación de esas copias y precio.

#### Scenario: Buscar las piezas
- **WHEN** el usuario abre un grupo que tiene completo
- **THEN** ve en qué caja o carpeta está cada pieza

### Requirement: Valor de un grupo
Cada grupo SHALL mostrar su valor (la suma del precio NM de cada pieza) y el costo de las piezas que faltan, indicando cuántas no tienen precio.

#### Scenario: Grupo sin precios
- **WHEN** ninguna pieza tiene precio
- **THEN** se indica "sin precio" en vez de $0

### Requirement: Kit para vender
Cuando el usuario tiene al menos una copia para vender de cada pieza, el detalle SHALL ofrecer crear un lote de venta con una copia de cada pieza (preferentemente en NM). Si faltan copias para vender, SHALL indicar cuántas piezas faltan para el kit.

#### Scenario: Crear el kit
- **WHEN** el usuario tiene para vender las 3 piezas de "Ruinas de Eevee" y toca "Crear lote de venta"
- **THEN** se crea el lote abierto "Kit Ruinas de Eevee" con una copia de cada pieza, y el inventario no cambia hasta cerrarlo

### Requirement: Lista de faltantes
El detalle SHALL permitir copiar la lista de piezas que faltan (expansión, número y nombre) para buscarlas o pedirlas.

#### Scenario: Copiar faltantes
- **WHEN** faltan Espeon y Umbreon de Neo Discovery
- **THEN** se copia "Ruinas de Eevee — me faltan: Neo Discovery #20 Espeon, Neo Discovery #32 Umbreon"
