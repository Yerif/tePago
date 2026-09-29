# LOOPS — Workflows de Cuentas Conmigo

> Cada ticket del backlog de Notion trae en la columna **Loop** el workflow que le toca. Aquí está qué pasos tiene cada uno y cuándo se da por terminado.
> Los prompts para arrancar cada loop en Claude Code están en `docs/PROMPTS.md` (Parte A). Manda `CLAUDE.md`.

| Loop | Nombre | Cuándo | Prompts |
|---|---|---|---|
| L0 | Setup | Infraestructura del proyecto | A1–A4, A8 |
| L1 | Feature | Toda funcionalidad nueva | A9, A10, A11 |
| L2 | Pase cozy | Pulir UI sin tocar lógica | A15 |
| L3 | Evals | Crear o cambiar un prompt de runtime | A12 |
| L4 | Base de datos | Migraciones, RLS, funciones SQL | A5, A6, A7 |
| L6 | Release | Deploy a producción y feedback | A17 |
| L8 | Auditoría | Revisión de seguridad completa | A14 |
| L9 | Secure by design | Antes del plan de algo sensible | A13 |

Un ticket puede tener varios loops (p. ej. `L1 + L9`): se corren en el orden L9 → L4 → L1 → L3 → L2.

---

## Ciclo común a todos los loops

1. **Ticket** a "En progreso" en Notion; rama `tipo/slug` desde `develop` actualizado.
2. **Plan** (si toca más de un archivo): archivos, decisiones, riesgos y cómo se prueba. Espera OK de Yerif.
3. **Implementación** con commits pequeños en Conventional Commits en español.
4. **Verificación**: `npm run lint && npm run test && npm run build` en verde, más lo específico del loop.
5. **Cierre**: resumen (qué cambió, qué probar a mano en dark/light y móvil, si CLAUDE.md cambia), push, PR a `develop` cuando Yerif lo pida, ticket a "Hecho".

---

## L0 · Setup

**Objetivo:** dejar lista una pieza de infraestructura que el resto del proyecto va a usar.

1. Revisar que no cueste dinero ni meta dependencias pesadas; justificar cada dependencia nueva en el PR.
2. Implementar lo mínimo que sirva al MVP; nada "por si acaso".
3. Documentar cualquier variable nueva en `.env.example` y cualquier comando nuevo en CLAUDE.md §14.

**Terminado:** ciclo común + `npm audit` revisado (hallazgos en `docs/SECURITY.md`).

## L1 · Feature

**Objetivo:** una funcionalidad del MVP de punta a punta.

1. Si toca auth, dinero, IA, storage o invite codes → primero **L9**.
2. Si necesita tablas o políticas → primero **L4**.
3. Lógica en `lib/` con tests primero (TDD en `lib/splits` y `lib/game`).
4. UI: Server Components por defecto, `data-component` y `data-testid`, estados vacío/cargando/error, microcopy cozy.
5. API routes solo con `withGuard`.
6. Contar interacciones del flujo principal (split simple ≤ 3).
7. Flujo crítico (registrar gasto, smart split, saldar) → test Playwright.
8. `npm audit` si se agregaron dependencias.

**Terminado:** ciclo común + tests nuevos en verde + interacciones reportadas.

## L2 · Pase cozy

**Objetivo:** que la pantalla se sienta Cuentas Conmigo, sin cambiar comportamiento.

1. Capturas "antes" (dark y light, 375 px) con Playwright.
2. Aplicar CLAUDE.md §10 con componentes de `ui/` y `cozy/`, variantes cva, `cn()`.
3. Revisar contraste AA, focus visible y microcopy (cálido, nunca regañón).
4. Capturas "después" y comparación.

**Terminado:** ciclo común + capturas antes/después en el resumen + cero cambios en tests de lógica.

## L3 · Evals

**Objetivo:** ningún prompt de runtime cambia sin medir.

1. Dataset del prompt en `evals/bN/` (casos con golden JSON, incluidos adversariales).
2. Correr evals y guardar la línea base.
3. Proponer el cambio como versión nueva en `docs/PROMPTS.md` (texto + changelog); esperar OK.
4. Aplicar en `src/lib/ai/prompts/` y volver a correr; comparar caso por caso.
5. Aceptar solo si ninguna métrica bloqueante baja y la objetivo sube.

**Terminado:** ciclo común + tabla antes/después de métricas en el resumen + test de sincronía doc ↔ código en verde.
**Costo:** una corrida completa ≈ $0.25 USD; avisar antes de pasar de $2 USD en un día.

## L4 · Base de datos

**Objetivo:** esquema, políticas y funciones SQL seguras por construcción.

1. Migración nueva en `supabase/migrations/` (nunca editar una aplicada).
2. `group_id not null`, FKs compuestas, índices y `enable row level security` en la misma migración.
3. Políticas con `is_group_member` y tests pgTAP cruzados A/B.
4. `npx supabase db reset`, `npm run db:types`, `npx supabase test db`.
5. Si cambia el esquema de CLAUDE.md §6, actualizarlo primero.

**Terminado:** ciclo común + `supabase test db` en verde + tipos regenerados.
**Bloqueo conocido:** sin Docker no corre `supabase start`; en ese caso el ticket no se marca como hecho.

## L6 · Release

**Objetivo:** llevar `main` a producción sin sorpresas y aprender de la banda.

1. Precondiciones: L8 sin hallazgos altos abiertos, CI en verde en `main`.
2. Yerif aplica migraciones (`npx supabase db push`), revisa variables en Vercel, crons en `vercel.json` y el límite de gasto de Anthropic.
3. Smoke test en producción: registrar gasto, smart split, saldar.
4. Invitar a la banda y recoger feedback en `docs/FEEDBACK.md`.
5. Convertir feedback en tickets (con OK de Yerif).

**Terminado:** smoke test en verde documentado + feedback de la primera semana triado.

## L8 · Auditoría

**Objetivo:** encontrar lo que se nos pasó antes de que lo encuentre alguien más.

1. Correr el checklist de A14 completo (RLS, IDOR, invite codes, IA, secretos, headers, storage, dependencias).
2. Solo reportar: tabla de hallazgos con severidad, evidencia y fix propuesto en `docs/SECURITY.md`.
3. Tickets para lo que no se arregle de inmediato (con OK de Yerif).

**Cuándo:** obligatoria antes del primer release (L6) y después de cada épica con superficie sensible.

## L9 · Secure by design

**Objetivo:** pensar el abuso antes de escribir código.

1. Threat model exprés (A13): activos, actores, superficies, amenazas, controles, riesgos aceptados.
2. Registrar en `docs/SECURITY.md` (sección "Threat models").
3. Meter los tests de abuso al plan del L1/L4 que sigue.

**Terminado:** threat model registrado + tests de abuso listados en el plan.
