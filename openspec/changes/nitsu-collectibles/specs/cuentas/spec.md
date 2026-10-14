# Spec Delta

## ADDED Requirements

### Requirement: Gengar en el inicio de sesión
La pantalla de inicio de sesión SHALL mostrar a Gengar asomado detrás del formulario, que reacciona a lo que hace el usuario: se asoma más al escribir el email, se esconde al escribir la contraseña y se ríe (con la tarjeta sacudiéndose) cuando el inicio de sesión falla. Con "reducir movimiento" SHALL quedar sin animaciones.

#### Scenario: Escribir la contraseña
- **WHEN** el usuario enfoca el campo de contraseña
- **THEN** Gengar se esconde detrás de la tarjeta y dice "¡No miro, no miro! 🙈"

#### Scenario: Contraseña incorrecta
- **WHEN** el inicio de sesión falla
- **THEN** Gengar se ríe, dice "¡Jijiji! Esa no era 😈" y la tarjeta se sacude
