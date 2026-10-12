# 0001. Registrar las decisiones de arquitectura con ADR

- Estado: Aceptado
- Fecha: 2026-10-12

## Contexto
El proyecto pasa de ser una herramienta personal a una plataforma con alfa testers. Muchas decisiones (fuentes de precio, cómo se elige la ubicación, el stack) solo existen en el código o en conversaciones. OpenSpec ya documenta **qué** hace el sistema, pero no **por qué** se eligió cada tecnología o diseño.

## Decisión
Cada decisión de arquitectura o de diseño difícil de revertir se registra como un ADR en `docs/adr/`, con numeración correlativa y el formato de [0000-plantilla.md](0000-plantilla.md) (estilo MADR, en español).
- Un ADR aceptado no se edita: si la decisión cambia, se escribe uno nuevo y el antiguo pasa a "Reemplazado por".
- Un cambio de OpenSpec que tome una decisión de este tipo enlaza o crea su ADR.

## Alternativas consideradas
- **Solo OpenSpec (`design.md` de cada cambio):** el diseño queda archivado junto al cambio y cuesta encontrarlo después; no hay una lista única de decisiones vigentes.
- **Wiki externa:** se desincroniza del código y no pasa por revisión.

## Consecuencias
- Positivas: cualquier persona (o IA) entiende por qué el sistema es como es antes de cambiarlo.
- Negativas: hay que escribir y mantener un documento más por decisión importante.
