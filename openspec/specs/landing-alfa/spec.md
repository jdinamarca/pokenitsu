# landing-alfa Specification

## Purpose
Presentar el producto a coleccionistas y vendedores, y reclutar alfa testers para la alfa privada.

## Requirements

### Requirement: Página pública
El sistema SHALL servir en `/alfa` una página de presentación con capturas reales de la app, las funciones principales, preguntas frecuentes y un aviso de que no hay afiliación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. La página SHALL funcionar en celular sin scroll horizontal y respetar `prefers-reduced-motion`.

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene activado reducir movimiento
- **THEN** la demo de carga se muestra estática y no hay animaciones

### Requirement: Postulación a la alfa
El sistema SHALL recibir postulaciones con nombre, email, Instagram o tienda, rol (colecciono, vendo, ambas, tienda), cantidad aproximada de cartas y comentario, y guardarlas en `alpha_signups` (una por email; si se repite se actualizan las respuestas).

#### Scenario: Email inválido
- **WHEN** se envía un email sin formato válido
- **THEN** el servidor responde 400 "Ese email no parece válido" y no guarda nada

#### Scenario: Bot
- **WHEN** viene lleno el campo oculto `website`
- **THEN** se responde éxito sin guardar

### Requirement: Sin datos falsos
La página SHALL NOT mostrar testimonios, contadores de cupos ni cifras que no sean reales.

#### Scenario: Cifras del catálogo
- **WHEN** la página muestra cantidad de cartas y expansiones
- **THEN** corresponden al catálogo real
