---
name: conventional-commit
description: Se usa al redactar el mensaje de un commit de Git, cuando el usuario pide "hacé el commit", "escribí el mensaje de commit" o pide ayuda para commitear cambios. Genera mensajes en formato Conventional Commits (tipo(scope): descripción en imperativo).
---

# Conventional Commit

Generá mensajes de commit siguiendo el formato Conventional Commits.

## Paso 1: mirá qué cambió

Nunca inventes el tipo o la descripción sin ver el diff real. Antes de escribir el mensaje, corré:

```
git diff --staged
```

Si no hay nada en el stage, usá `git status` para ver qué archivos cambiaron y avisale al usuario que primero tiene que hacer `git add`. Si el diff está vacío o no hay cambios, decilo en vez de inventar un commit.

## Paso 2: elegí el tipo

Basándote en lo que realmente cambió en el diff, elegí uno de estos tipos:

- `feat`: agrega una funcionalidad nueva
- `fix`: corrige un bug
- `docs`: cambios solo de documentación
- `refactor`: cambio de código que no arregla un bug ni agrega una feature
- `test`: agrega o corrige tests
- `chore`: mantenimiento (dependencias, config, build, etc.), no toca lógica de negocio

## Paso 3: definí el scope (opcional)

Si el cambio se concentra claramente en un módulo, carpeta o área del proyecto (ej: `auth`, `tickets`, `prd`), usalo como scope entre paréntesis. Si el cambio es transversal o no hay un scope claro, omitilo.

## Paso 4: escribí la descripción

- En imperativo ("agregar", "corregir", "rechazar" — no "agregando" ni "agregado")
- En minúscula
- Sin punto final
- Máximo 72 caracteres
- Tiene que describir el QUÉ del cambio, no el cómo

## Formato final

```
tipo(scope): descripción en imperativo
```

Ejemplos:

```
feat(auth): agregar validación de email en el registro
fix(tickets): rechazar tickets con asunto vacío
docs(prd): aclarar criterio de control de acceso
```

## Notas

- Si el diff mezcla varios tipos de cambio no relacionados, sugerile al usuario separarlo en varios commits en vez de forzar un solo mensaje que no represente bien el cambio.
- Si el usuario pide explícitamente el mensaje sin ejecutar el commit, solo devolvé el texto del mensaje (no corras `git commit`).
