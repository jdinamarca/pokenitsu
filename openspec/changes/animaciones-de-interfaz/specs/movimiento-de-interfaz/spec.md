# Spec Delta

## Purpose

Definir cuándo y cómo se anima la interfaz de la app (diálogos, avisos y efectos al pasar el mouse) para que se sienta fluida sin volverse lenta, y cómo se respeta la preferencia de movimiento reducido del sistema.

## ADDED Requirements

### Requirement: Entrada de diálogos
Al abrirse, un diálogo SHALL aparecer con un fade y una escala sutil desde su centro (nunca desde escala cero), en no más de 300 ms, y su fondo oscuro SHALL aparecer con un fade de la misma duración. Si el diálogo ya está abierto y solo cambia su contenido, MUST NOT volver a animarse.

#### Scenario: Abrir la ficha de una carta
- **WHEN** el usuario abre la ficha de una carta
- **THEN** el diálogo y su fondo aparecen con una transición corta en vez de aparecer de golpe

#### Scenario: Cambiar de variante dentro de la ficha abierta
- **WHEN** la ficha ya está abierta y el usuario cambia de variante
- **THEN** el contenido se actualiza sin repetir la animación de entrada

#### Scenario: Navegador sin soporte
- **WHEN** el navegador no soporta animar la entrada de diálogos
- **THEN** el diálogo se abre al instante y funciona igual que antes

### Requirement: Avisos que entran y salen por el mismo borde
Un aviso (toast) SHALL entrar desde el borde inferior y, al cumplirse su tiempo, SHALL salir por ese mismo borde con un fade antes de desaparecer. Varios avisos seguidos MUST NOT reiniciar ni cortar la animación de los que ya están en pantalla.

#### Scenario: Aviso al guardar un precio
- **WHEN** el usuario guarda un precio propio y aparece el aviso
- **THEN** el aviso sube desde abajo y, después de unos segundos, baja y se desvanece en vez de desaparecer de golpe

#### Scenario: Varios avisos seguidos
- **WHEN** se disparan tres avisos en menos de un segundo
- **THEN** cada uno entra y sale de forma fluida, sin saltos en los que ya estaban

### Requirement: Movimiento reducido
Cuando el sistema del usuario pide movimiento reducido, la app SHALL detener el brillo holo animado y quitar los desplazamientos y escalas (levantar cartas, entrada escalada de diálogos, deslizamiento de avisos). Los fades cortos que ayudan a entender un cambio MAY mantenerse.

#### Scenario: Usuario con movimiento reducido
- **WHEN** el sistema tiene activado "reducir movimiento" y el usuario ve cartas holo en una galería
- **THEN** las cartas holo se ven sin el brillo animado y los diálogos aparecen solo con un fade

### Requirement: Efectos de hover solo con mouse
El efecto de levantar una carta, celda o espacio al pasar el puntero SHALL aplicarse solo en dispositivos con puntero preciso que permite hover. En pantallas táctiles MUST NOT quedar una carta levantada después de tocarla.

#### Scenario: Tocar una carta en el celular
- **WHEN** el usuario toca una carta en la galería desde un celular
- **THEN** la carta no queda levantada después del toque

#### Scenario: Pasar el mouse en el computador
- **WHEN** el usuario pasa el mouse sobre una carta en un computador
- **THEN** la carta se levanta levemente como hoy
