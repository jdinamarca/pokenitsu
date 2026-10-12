# 0007. Especificar los cambios con OpenSpec

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
El desarrollo se hace en gran parte con asistentes de IA. Sin una especificación escrita, los requisitos quedan en conversaciones y cada cambio puede romper reglas que nadie recuerda.

## Decisión
- Usar [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`openspec/`, flujo `spec-driven`, artefactos en español).
- `openspec/specs/` describe el comportamiento vigente por capacidad, con requisitos (SHALL) y escenarios (WHEN/THEN).
- Toda función nueva parte con `/opsx:propose`, se revisa, se implementa con `/opsx:apply` y se archiva con `/opsx:archive`, que actualiza las especificaciones.
- Las decisiones técnicas que salgan de un cambio van a un ADR ([0001](0001-registrar-decisiones-con-adr.md)).

## Alternativas consideradas
- **Spec Kit u otros frameworks de specs:** más pesados para un equipo de una persona.
- **Solo README:** no tiene estructura de requisitos ni escenarios verificables.

## Consecuencias
- Positivas: requisitos revisables antes de programar; los escenarios sirven de base para las pruebas.
- Negativas: cada cambio tiene un paso de planificación más.
