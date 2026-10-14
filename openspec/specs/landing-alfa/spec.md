# landing-alfa Specification

## Purpose
Presentar el producto a coleccionistas y vendedores, y reclutar alfa testers para la alfa privada.

## Requirements

### Requirement: Página pública
El sistema SHALL servir en `/alfa`, y en `/` cuando no hay sesión, una página de presentación con capturas reales de la app, las funciones principales, preguntas frecuentes y un aviso de que no hay afiliación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. La página SHALL funcionar en celular sin scroll horizontal y respetar `prefers-reduced-motion`.

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene activado reducir movimiento
- **THEN** la demo de carga se muestra estática, las cartas del duelo quedan quietas y no hay animaciones

### Requirement: Accesos y duelo en la home
La página SHALL tener accesos visibles al inicio de sesión ("Iniciar sesión" y "Ya tengo cuenta · Entrar") y, junto al título, un duelo animado entre cartas de Charizard y Gengar que se pausa cuando no está en pantalla.

#### Scenario: Home sin sesión
- **WHEN** alguien sin sesión abre `/`
- **THEN** ve la página de presentación con el duelo y los botones para entrar

#### Scenario: Ir al login
- **WHEN** el visitante toca "Iniciar sesión"
- **THEN** llega a la pantalla de inicio de sesión en `/entrar`

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

### Requirement: Nombre del producto
El producto SHALL llamarse "Nitsu Collectibles" en la landing, la app y el inicio de sesión, con un logo que muestra "Nitsu" y debajo "Collectibles".

#### Scenario: Abrir la landing
- **WHEN** alguien abre la landing
- **THEN** ve el nombre "Nitsu Collectibles" y ninguna mención a "Challadex"

### Requirement: Capturas actuales de la app
La landing SHALL mostrar capturas de las vistas actuales de la app (Mi colección, precios, Mis colecciones, Ubicaciones, Artes conectados e Ilustradores), tomadas de una copia de la base y nítidas en pantallas de alta densidad.

#### Scenario: Sección de ilustradores
- **WHEN** el visitante llega a las funciones
- **THEN** ve una sección de Ilustradores con la captura de la pestaña Artistas
