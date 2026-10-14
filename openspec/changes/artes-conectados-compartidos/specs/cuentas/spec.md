# Spec Delta

## ADDED Requirements

### Requirement: Avance de artes conectados en el perfil
El resumen de la colección en Mi perfil SHALL mostrar cuántos grupos de artes conectados tiene completos la cuenta sobre el total de grupos, y cuántos tiene empezados, en vez del número de grupos.

#### Scenario: Ninguna carta de los grupos
- **WHEN** la cuenta no tiene ninguna carta de los 35 grupos
- **THEN** el perfil muestra "0 / 35 artes conectados completos"

#### Scenario: Un grupo empezado
- **WHEN** la cuenta tiene 1 carta de un grupo de 3
- **THEN** el perfil muestra "0 / 35 artes conectados completos · 1 empezados"
