# SPRINTS — Cuentas Conmigo

> Plan de sprints del MVP. El backlog vive en Notion ("Backlog MVP"); aquí solo va qué entra en cada sprint, en qué orden y cuándo se da por cerrado.
> Sprints de 2 semanas. Orden de épicas: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 (la auditoría L8 va antes de invitar a la banda).

## Roadmap tentativo

| Sprint | Fechas | Meta | Épicas |
|---|---|---|---|
| 1 | 30 sep – 13 oct 2026 | Fundaciones: proyecto, identidad visual y base de datos multitenant segura | 0 · Setup, 1 · DB multitenant |
| 2 | 14 – 27 oct | Entrar y armar la banda | 2 · Auth, 3 · Grupos |
| 3 | 28 oct – 10 nov | Dividir y saldar sin IA | 4 · Gastos y splits |
| 4 | 11 – 24 nov | Smart Split | 5 · Smart Split IA |
| 5 | 25 nov – 8 dic | El juego y el resumen | 6 · Juego, 7 · IA ambiental |
| 6 | 9 – 22 dic | Pulido, auditoría y release | 8 · UI cozy, 9 · Seguridad y release |

Las fechas son una guía; se ajustan en cada cierre de sprint.

**Ajuste del 2026-10-02 (auditoría, `docs/AUDITORIA.md`):** la base de datos depende de que Yerif cree el proyecto de Supabase, así que el trabajo se separa en dos carriles que avanzan en paralelo:

- **Carril A — UAT-1** (no necesita Supabase): llegar a una ronda de pruebas con la banda sobre el prototipo. Ver "Camino a UAT-1" abajo.
- **Carril B — Supabase** (tickets 8–15 y el resto de las épicas 1–3): arranca cuando exista el proyecto. UAT-2 se hace al terminarlo.

---

## Sprint 1 · Fundaciones (30 sep – 13 oct 2026)

**Meta:** al cerrar el sprint, cualquier feature del MVP se puede construir encima sin tocar infraestructura: app con identidad cozy, CI en verde, herramientas de debug, y una base de datos multitenant con RLS probada.

### Prerrequisitos de Yerif (día 1)

Estos no los puede hacer Claude Code porque requieren tus cuentas:

- [ ] **Supabase:** pausar el proyecto de la quiniela y crear el proyecto de Cuentas Conmigo (free tier = 2 proyectos activos). *Pendiente; bloquea el carril B.*
- [x] **Vercel:** proyecto importado en plan Hobby; las previews por rama funcionan.
- [ ] **Anthropic:** crear la API key y fijar un **límite de gasto mensual** en la consola (sugerido $10 USD).
- [ ] Llaves en Vercel **solo en el scope Production** (nunca en Preview, ver CLAUDE.md §9) y en `.env.local`; nunca pegarlas en el chat.
- [ ] GitHub: proteger `main` y `develop` (PR obligatorio; CI requerido) y activar "Automatically delete head branches" (hay ~21 ramas remotas ya mergeadas).
- [x] Mergeadas a `develop` las ramas `chore/scaffold-nextjs` y `docs/prompts`.
- [x] Decididas D1–D9 de `docs/AUDITORIA.md` el 2026-10-02 (D10: `main` sigue sin merge hasta el PoC).

### Tickets, en orden

| # | Ticket (Notion) | Épica | Prio | Est. | Loop | Prompt | Depende de | Estado |
|---|---|---|---|---|---|---|---|---|
| 1 | Crear repo + proyecto Vercel + proyecto Supabase | 0 | P0 | S | L0 | — (Yerif) | — | Repo y Vercel listos; Supabase pendiente |
| 2 | Scaffold Next.js 15 + TS estricto + Tailwind + estructura | 0 | P0 | M | L0 | A1 | — | ✅ Hecho |
| 3 | `lib/logger.ts` con namespaces + regla ESLint no-console | 0 | P0 | S | L0 | A3 | 2 | ✅ Hecho |
| 4 | `lib/errors.ts` con códigos tipados + requestId | 0 | P0 | S | L0 | A3 | 3 | ✅ Hecho |
| 5 | CI en GitHub Actions: lint + test + build por PR | 0 | P1 | S | L0 | A4 | 2 | ✅ Corriendo (lint, typecheck, test, build); falta exigir cobertura (CI-01) |
| 6 | shadcn/ui con tokens cozy como CSS variables (dark default) | 0 | P0 | M | L0 | A2 | 2 | ✅ Hecho |
| 7 | Toggle dark/light persistente (dark por default) | 8 | P0 | S | L1 | A2 | 6 | ✅ Hecho |
| 8 | Migración inicial: tablas de dominio con `group_id` + índices | 1 | P0 | L | L4, L9 | A13 → A5 | 1 | |
| 9 | Script npm de generación de tipos desde Supabase | 1 | P0 | S | L0 | A5 | 8 | |
| 10 | RLS por membresía en todas las tablas + tests A/B | 1 | P0 | L | L4, L9 | A6 | 8 | |
| 11 | Tabla `rate_limits` (ventana deslizante) | 1 | P0 | S | L4 | A5 | 8 | |
| 12 | Funciones security definer: `otorgar_xp` y `evaluar_badges` | 1 | P0 | M | L4 | A7 | 10 | |
| 13 | `lib/api/guard.ts`: sesión → Zod → pertenencia → rate limit | 0 | P0 | M | L0, L9 | A8 | 4, 10, 11 | 🟡 Lógica hecha (PR #16); falta conectar Supabase |
| 14 | DebugPanel con `?debug=1` (solo dev/preview) | 0 | P1 | S | L0 | A3 | 3 | ✅ Hecho |
| 15 | Seed: 4 usuarios, 2 grupos, 6 gastos variados | 1 | P1 | S | L4 | A5 | 10 | |
| 16 | Crear docs/SECURITY.md y docs/FEEDBACK.md | 9 | P2 | S | L8, L6 | — | — | ✅ Hecho |

Carga: 5 × S + 4 × M + 2 × L (sin contar los ya hechos). Si el sprint se aprieta, lo primero que sale es el #15 y después el #14 (P1, no bloquean al Sprint 2).

Extra adelantado (ya en `develop`, sin Supabase): demo con datos de ejemplo (`/dev/demo`, ver `docs/MOVIL.md`); `lib/splits` completo (igual, itemizado, borrador, deudas); `lib/game` completo (XP, niveles, estado del avatar, 6 badges, 5 skins); base de `lib/ai` (prompts B1–B5, schemas, validadores, flujo con retry y fallback) con datasets de evals; pantalla de confirmar gasto; detalle de grupo con "quién le debe a quién". Todo con cobertura 100 % en los módulos críticos.

Fuera del Sprint 1 a propósito: Storage multitenant (va con el modo foto en el Sprint 4) y borrar cuenta (P2).

### Camino a UAT-1 (carril A) — estado al 2026-10-05

Meta: una ronda de pruebas con 3–5 personas sobre el prototipo antes de terminar el Sprint 1 (13 oct). Detalle, guion y criterios en `docs/UAT.md`.

| Orden | ID | Ticket | Estado |
|---|---|---|---|
| 1 | CI-01 | El CI exige la cobertura 100 % | ✅ PR #27 |
| 2 | UAT-02 | Saldar en el demo (total o por abonos) con XP, nivel y personaje | ✅ PR #28 |
| 3 | UAT-06 | Objetivos táctiles ≥ 44 px | ✅ PR #29 |
| 4 | UAT-01 | Entorno de UAT-1 (preview estable, protección, llaves por scope) | ⏳ **Yerif**: desactivar la protección de Vercel solo para previews y revisar que Preview no tenga llaves reales |
| 5 | UAT-04 | Error Boundary, not-found y "copiar reporte" | ✅ PR #30 (y #32: `/dev/*` 404 real en producción) |
| 6 | UAT-05 | Metadatos móviles: ícono, manifest, themeColor, OG | ✅ PR #31 |
| 7 | UAT-03 | Pantalla de entrada "Elige tu banda" | ✅ PR #33 |
| 8 | CI-03 | Smoke E2E con Playwright | ✅ PR #34 (workflow `e2e.yml`: lanzarlo a mano una vez) |

Extras ya hechos: D5 anti-farming de XP en `lib/game` (#35), SDK de Anthropic verificado con Zod 4 y test de categorías (#36), `npm run check:secrets` en CI (#37), capa de llamada a la IA con cliente inyectable (#39). En revisión: esquema de datos de CLAUDE.md §6 (#38, necesita tu OK).

**Lo único que falta para invitar a UAT-1 es de Yerif:** UAT-01 (Vercel), el mensaje de `docs/UAT.md` §8 con la URL estable de `develop` y probar tú mismo T1–T7 desde el celular.

### Paralelismo

- Los tickets 3 → 4, 5 y 6 → 7 no dependen de Supabase: se pueden hacer mientras Yerif termina los prerrequisitos.
- Todo lo de la Épica 1 (8–15) necesita el proyecto de Supabase y Docker para el stack local.

### Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El entorno de Claude Code en la nube no tiene el daemon de Docker corriendo (verificado el 29 sep: CLI instalado, daemon apagado) → no corre `npx supabase start` | Los tickets 8–15 no se pueden cerrar en la nube | Intentar levantar `dockerd` en la sesión; si no, correr L4 en la máquina de Yerif o validar contra un proyecto Supabase de desarrollo |
| `npm audit`: postcss en Next 15 | Bajo (solo build) | Registrado en SECURITY.md; reevaluar al salir un parche |
| El esquema cambia a mitad del sprint | Retrabajo en RLS y tipos | Revisar CLAUDE.md §6 antes del ticket 8 (puntos de `docs/AUDITORIA.md` §6); cualquier cambio va primero a CLAUDE.md |
| El carril B (Supabase) depende de acciones de Yerif | La DB no avanza y UAT-2 se retrasa | UAT-1 corre en paralelo sobre el prototipo; crear el proyecto de Supabase es el primer pendiente de Yerif |
| UAT-1 con datos de ejemplo no valida lo persistente ni la IA real | Falsa confianza en el flujo completo | `docs/UAT.md` §1 lista qué NO se valida; UAT-2 lo cubre |

### Definición de terminado del sprint

- [ ] Tickets P0 en "Hecho" en Notion.
- [ ] `develop` con lint, typecheck, test, **cobertura** y build en verde en CI.
- [ ] `npx supabase test db` en verde con tests A/B de todas las tablas.
- [ ] `/dev/ui` muestra los componentes cozy en dark y light.
- [ ] Threat model del esquema (A13) registrado en `docs/SECURITY.md`.
- [ ] CLAUDE.md actualizado si algo del esquema o de los comandos cambió.

### Cierre (se llena al terminar)

- Hecho:
- No entró y por qué:
- Aprendizajes:
- Ajustes al Sprint 2:
