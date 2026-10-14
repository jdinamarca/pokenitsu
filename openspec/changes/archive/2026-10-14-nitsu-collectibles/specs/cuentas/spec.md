# Spec Delta

## ADDED Requirements

### Requirement: Fondo animado del inicio de sesión
La pantalla de inicio de sesión SHALL mostrar de fondo lienzos de colores con forma de carta que flotan y giran suavemente, dibujados sin imágenes para verse nítidos en cualquier pantalla, detrás de un formulario que se sacude cuando el inicio de sesión falla. Con "reducir movimiento" SHALL quedar sin animaciones.

#### Scenario: Abrir el login
- **WHEN** el usuario abre `/entrar`
- **THEN** ve los lienzos de colores moviéndose detrás del formulario, sin tapar los campos

#### Scenario: Contraseña incorrecta
- **WHEN** el inicio de sesión falla
- **THEN** la tarjeta del formulario se sacude y aparece el mensaje de error
