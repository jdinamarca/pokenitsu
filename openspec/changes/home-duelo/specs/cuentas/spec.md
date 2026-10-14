# Spec Delta

## MODIFIED Requirements

### Requirement: Pantalla de inicio de sesión
La app SHALL mostrar la pantalla de inicio de sesión (Entrar / Crear cuenta) en `/entrar`, antes de cargar cualquier dato, con un enlace para volver a la home, y volver a ella si la sesión vence mientras se usa. Sin sesión, `/` SHALL mostrar la home pública en vez de la app; con sesión, `/entrar` SHALL llevar a `/`.

#### Scenario: Abrir la app sin sesión
- **WHEN** el usuario abre `/` sin haber iniciado sesión
- **THEN** ve la home pública y ningún dato del inventario

#### Scenario: Entrar
- **WHEN** el usuario inicia sesión en `/entrar`
- **THEN** queda en `/` con su colección

#### Scenario: Ya con sesión
- **WHEN** el usuario con sesión abre `/entrar`
- **THEN** lo lleva a `/`

#### Scenario: Sesión vencida
- **WHEN** la sesión vence y la app hace una llamada a la API
- **THEN** aparece la pantalla de inicio con "Tu sesión terminó. Vuelve a entrar."
