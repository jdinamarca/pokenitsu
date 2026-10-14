# Spec Delta

## MODIFIED Requirements

### Requirement: Página pública
El sistema SHALL servir en `/alfa`, y en `/` cuando no hay sesión, una página de presentación con capturas reales de la app, las funciones principales, preguntas frecuentes y un aviso de que no hay afiliación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. La página SHALL tener accesos visibles al inicio de sesión ("Iniciar sesión" y "Ya tengo cuenta · Entrar") y, junto al título, un duelo animado entre cartas de Charizard y Gengar que se pausa cuando no está en pantalla. La página SHALL funcionar en celular sin scroll horizontal y respetar `prefers-reduced-motion`.

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene activado reducir movimiento
- **THEN** la demo de carga se muestra estática, las cartas del duelo quedan quietas y no hay animaciones

#### Scenario: Home sin sesión
- **WHEN** alguien sin sesión abre `/`
- **THEN** ve la página de presentación con el duelo y los botones para entrar

#### Scenario: Ir al login
- **WHEN** el visitante toca "Iniciar sesión"
- **THEN** llega a la pantalla de inicio de sesión en `/entrar`
