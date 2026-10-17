# Spec Delta

## MODIFIED Requirements

### Requirement: Ubicaciones en el riel
El riel SHALL listar "Todas" y cada ubicación, con su cantidad de copias y una línea que diga qué recibe. Si hay copias sin ubicación, SHALL agregar "Sin ubicación". Al elegir una, la vitrina SHALL mostrar solo esa repisa y el contador sus copias. La ubicación elegida SHALL verse con la luz cálida. Las ubicaciones se crean y editan en la pantalla "Cajas y carpetas" de Arma, o en Nitsu. Si la cuenta no tiene ninguna, el riel SHALL llevar a "Cajas y carpetas". Mi inventario SHALL poder abrirse con una ubicación ya elegida (`/inventario?ubicacion=<id>`, con `0` para "Sin ubicación"). Si esa ubicación no existe, se abre con "Todas".

#### Scenario: Elegir una carpeta
- **WHEN** el usuario elige "Carpeta Especiales" en el riel
- **THEN** la vitrina muestra solo esa repisa y el contador muestra sus copias

#### Scenario: Llegar desde Cajas y carpetas
- **WHEN** el usuario abre `/inventario?ubicacion=3`, y la ubicación 3 es "Caja 1 · Scarlet & Violet"
- **THEN** Mi inventario se abre con esa caja elegida en el riel

#### Scenario: Cuenta sin ubicaciones
- **WHEN** una cuenta sin ubicaciones abre Mi inventario
- **THEN** el riel dice que las cajas y carpetas se crean en "Cajas y carpetas", con un enlace a esa pantalla
