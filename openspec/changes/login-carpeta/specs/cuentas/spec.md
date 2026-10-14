## MODIFIED Requirements

### Requirement: Fondo animado del inicio de sesión
La pantalla de inicio de sesión SHALL verse como una carpeta abierta: en una página, 9 bolsillos con cartas reales nítidas (7 llenos y 2 vacíos) que se deslizan a su lugar al abrirla; en la otra, el formulario, que se sacude cuando el inicio de sesión falla. Mientras el usuario escribe en un campo, el bolsillo vacío "Tu próxima carta" SHALL iluminarse. Con mouse, la carta de un bolsillo SHALL levantarse al pasar sobre ella. En pantallas angostas SHALL verse una sola fila de bolsillos sobre el formulario. Con "reducir movimiento" SHALL quedar sin deslizamientos ni cartas que se levantan.

#### Scenario: Abrir el login
- **WHEN** el usuario abre `/entrar`
- **THEN** ve la carpeta con las cartas deslizándose a sus bolsillos y el formulario en la otra página, sin que nada tape los campos

#### Scenario: Escribir el email
- **WHEN** el usuario pone el cursor en el campo de email
- **THEN** el bolsillo "Tu próxima carta" se ilumina en dorado

#### Scenario: Celular
- **WHEN** el usuario abre `/entrar` en una pantalla de 390 px de ancho
- **THEN** ve una fila de 3 bolsillos sobre el formulario, sin scroll horizontal

#### Scenario: Contraseña incorrecta
- **WHEN** el inicio de sesión falla
- **THEN** la tarjeta del formulario se sacude y aparece el mensaje de error
