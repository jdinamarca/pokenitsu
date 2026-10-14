# Spec Delta

## ADDED Requirements

### Requirement: Accesos desde el perfil
En Mi perfil, las cifras de colecciones, artes conectados y ubicaciones SHALL abrir su sección (Mis colecciones, Artes conectados, Ubicaciones) y cerrar el perfil. Con mouse, al pasar sobre ellas SHALL asomar una ball distinta para cada una que se tambalea una vez; con "reducir movimiento" MUST NOT tambalearse ni mover la tarjeta, y en pantallas táctiles la ball SHALL verse quieta como pista.

#### Scenario: Ir a ubicaciones
- **WHEN** el usuario toca "8 ubicaciones" en su perfil
- **THEN** el perfil se cierra y se abre la pestaña Ubicaciones

#### Scenario: Pasar el mouse
- **WHEN** el usuario pasa el mouse sobre "artes conectados"
- **THEN** la tarjeta sube un poco y asoma una Great Ball que se tambalea

#### Scenario: Reducir movimiento
- **WHEN** el sistema pide reducir movimiento y el usuario pasa el mouse sobre una tarjeta
- **THEN** la ball aparece sin tambalearse y la tarjeta no se mueve
