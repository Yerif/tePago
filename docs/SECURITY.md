# SECURITY — Hallazgos y decisiones

> Bitácora de seguridad de Cuentas Conmigo (CLAUDE.md §9). Todo hallazgo, decisión o riesgo aceptado se registra aquí con fecha y severidad.
> Workflows: L8 (auditoría) y L9 (threat model) en `docs/LOOPS.md`. Prompts: A13 y A14 en `docs/PROMPTS.md`.

## Severidades

| Severidad | Significado | Qué hacer |
|---|---|---|
| Crítica | Fuga de datos entre grupos, secretos expuestos o gasto de IA sin control | Se arregla antes de cualquier otra cosa; bloquea release |
| Alta | Explotable con poco esfuerzo por un usuario del sistema | Bloquea release |
| Moderada | Requiere condiciones poco probables o impacto limitado | Ticket en el sprint siguiente |
| Baja | Endurecimiento o buena práctica | Backlog |
| Info | Decisión o contexto, sin riesgo directo | Solo registro |

## Registro de hallazgos y decisiones

| Fecha | Severidad | Hallazgo / decisión | Estado |
|---|---|---|---|
| 2026-09-29 | Info | Repo inicial: `.env*` ignorados por `.gitignore`; solo `.env.example` versionado. | Hecho |
| 2026-09-29 | Moderada/Alta (build-time) | `npm audit`: `postcss <=8.5.22` anidado en `next@15`. El fix forzado sube a Next 16 (breaking). Solo procesa CSS propio en build, sin input de usuarios. Se mantiene Next 15 y se reevalúa al migrar a Next 16 o cuando Next 15 publique parche. | Aceptado, revisar |
| 2026-09-29 | Info | Prompts de runtime (`docs/PROMPTS.md` Parte B): datos del usuario solo en el turno user dentro de etiquetas y sanitizados; salida con structured outputs + validación en código; advertencias como códigos cerrados; B4 sin texto libre de usuarios. A Anthropic no se envían emails ni ids. | Diseño aprobado |
| 2026-09-29 | Info | `lib/ai` (base, sin llamadas a la API): `limpiarParaPrompt` (NFC, sin control ni caracteres invisibles/tag, sin `<` `>`, recorte), plantillas de una sola pasada, validadores por prompt (alias, formato de monto, longitudes, sin enlaces, cifras de B4 presentes en los datos) y flujo 1 retry + fallback; los problemas de validación nombran campo y regla, nunca valores. Cobertura 100 % exigida. Dependencia nueva: `zod` (MIT, sin costo). | Hecho |

## Threat models (L9)

Uno por feature sensible, con este formato:

```markdown
### {{feature}} — {{fecha}}
- Activos:
- Actores:
- Superficies:
- Amenazas → control → test de abuso:
  - {{amenaza}} → {{control}} → {{test}}
- Riesgos aceptados:
```

_Aún no hay threat models registrados._

## Auditorías (L8)

| Fecha | Alcance | Hallazgos (C/A/M/B) | Resultado |
|---|---|---|---|
| — | Primera auditoría completa, antes de invitar a la banda | — | Pendiente |

## Controles vigentes

Referencia rápida; el detalle está en CLAUDE.md §9.

- RLS en toda tabla con `is_group_member` y tests pgTAP cruzados A/B.
- XP, badges y skins solo vía funciones `security definer`.
- `lib/api/guard.ts` en toda API route: sesión → Zod → pertenencia → rate limit.
- Rate limits: smart-split 10/h/usuario, categorizar 60/h/usuario, unirse por código 5/h/IP.
- Invite codes nanoid ≥ 12 caracteres y revocables.
- Secretos solo en servidor; `npm run check:secrets` antes de cada release.
- Crons con `Authorization: Bearer ${CRON_SECRET}`.
- Storage privado por tenant, signed URLs de 1 h, 5 MB, solo `image/*`.
- Headers: CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `nosniff`.
- Prohibido `dangerouslySetInnerHTML` (ESLint `react/no-danger`).
