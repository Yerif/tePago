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

---

## Sprint 1 · Fundaciones (30 sep – 13 oct 2026)

**Meta:** al cerrar el sprint, cualquier feature del MVP se puede construir encima sin tocar infraestructura: app con identidad cozy, CI en verde, herramientas de debug, y una base de datos multitenant con RLS probada.

### Prerrequisitos de Yerif (día 1)

Estos no los puede hacer Claude Code porque requieren tus cuentas:

- [ ] **Supabase:** pausar el proyecto de la quiniela y crear el proyecto de Cuentas Conmigo (free tier = 2 proyectos activos).
- [ ] **Vercel:** importar `Yerif/tePago` en plan Hobby; rama de producción `main`, previews por PR.
- [ ] **Anthropic:** crear la API key y fijar un **límite de gasto mensual** en la consola (sugerido $10 USD).
- [ ] Llenar `.env.local` con `.env.example` como guía (nunca pegar llaves en el chat) y las mismas variables en Vercel.
- [ ] GitHub: proteger `main` y `develop` (PR obligatorio; CI requerido cuando exista).
- [ ] Mergear a `develop` las ramas `chore/scaffold-nextjs` y `docs/prompts`.

### Tickets, en orden

| # | Ticket (Notion) | Épica | Prio | Est. | Loop | Prompt | Depende de | Estado |
|---|---|---|---|---|---|---|---|---|
| 1 | Crear repo + proyecto Vercel + proyecto Supabase | 0 | P0 | S | L0 | — (Yerif) | — | Repo listo; resto pendiente |
| 2 | Scaffold Next.js 15 + TS estricto + Tailwind + estructura | 0 | P0 | M | L0 | A1 | — | ✅ Hecho |
| 3 | `lib/logger.ts` con namespaces + regla ESLint no-console | 0 | P0 | S | L0 | A3 | 2 | ✅ PR #3 |
| 4 | `lib/errors.ts` con códigos tipados + requestId | 0 | P0 | S | L0 | A3 | 3 | ✅ PR #4 |
| 5 | CI en GitHub Actions: lint + test + build por PR | 0 | P1 | S | L0 | A4 | 2 | PR #5 (falta verlo correr en GitHub) |
| 6 | shadcn/ui con tokens cozy como CSS variables (dark default) | 0 | P0 | M | L0 | A2 | 2 | ✅ PR #6 |
| 7 | Toggle dark/light persistente (dark por default) | 8 | P0 | S | L1 | A2 | 6 | ✅ PR #6 |
| 8 | Migración inicial: tablas de dominio con `group_id` + índices | 1 | P0 | L | L4, L9 | A13 → A5 | 1 | |
| 9 | Script npm de generación de tipos desde Supabase | 1 | P0 | S | L0 | A5 | 8 | |
| 10 | RLS por membresía en todas las tablas + tests A/B | 1 | P0 | L | L4, L9 | A6 | 8 | |
| 11 | Tabla `rate_limits` (ventana deslizante) | 1 | P0 | S | L4 | A5 | 8 | |
| 12 | Funciones security definer: `otorgar_xp` y `evaluar_badges` | 1 | P0 | M | L4 | A7 | 10 | |
| 13 | `lib/api/guard.ts`: sesión → Zod → pertenencia → rate limit | 0 | P0 | M | L0, L9 | A8 | 4, 10, 11 | |
| 14 | DebugPanel con `?debug=1` (solo dev/preview) | 0 | P1 | S | L0 | A3 | 3 | |
| 15 | Seed: 4 usuarios, 2 grupos, 6 gastos variados | 1 | P1 | S | L4 | A5 | 10 | |
| 16 | Crear docs/SECURITY.md y docs/FEEDBACK.md | 9 | P2 | S | L8, L6 | — | — | ✅ Hecho |

Carga: 5 × S + 4 × M + 2 × L (sin contar los ya hechos). Si el sprint se aprieta, lo primero que sale es el #15 y después el #14 (P1, no bloquean al Sprint 2).

Extra adelantado (rama `feat/demo-mock`): demo con datos de ejemplo para probar la UI sin Supabase (`/dev/demo`, ver `docs/MOVIL.md`) y `lib/splits` modo igual, formato y balances con cobertura 100 % (ticket del Sprint 3).

Fuera del Sprint 1 a propósito: Storage multitenant (va con el modo foto en el Sprint 4) y borrar cuenta (P2).

### Paralelismo

- Los tickets 3 → 4, 5 y 6 → 7 no dependen de Supabase: se pueden hacer mientras Yerif termina los prerrequisitos.
- Todo lo de la Épica 1 (8–15) necesita el proyecto de Supabase y Docker para el stack local.

### Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El entorno de Claude Code en la nube no tiene el daemon de Docker corriendo (verificado el 29 sep: CLI instalado, daemon apagado) → no corre `npx supabase start` | Los tickets 8–15 no se pueden cerrar en la nube | Intentar levantar `dockerd` en la sesión; si no, correr L4 en la máquina de Yerif o validar contra un proyecto Supabase de desarrollo |
| `npm audit`: postcss en Next 15 | Bajo (solo build) | Registrado en SECURITY.md; reevaluar al salir un parche |
| El esquema cambia a mitad del sprint | Retrabajo en RLS y tipos | Revisar CLAUDE.md §6 antes del ticket 8; cualquier cambio va primero a CLAUDE.md |

### Definición de terminado del sprint

- [ ] Tickets P0 en "Hecho" en Notion.
- [ ] `develop` con lint, typecheck, test y build en verde en CI.
- [ ] `npx supabase test db` en verde con tests A/B de todas las tablas.
- [ ] `/dev/ui` muestra los componentes cozy en dark y light.
- [ ] Threat model del esquema (A13) registrado en `docs/SECURITY.md`.
- [ ] CLAUDE.md actualizado si algo del esquema o de los comandos cambió.

### Cierre (se llena al terminar)

- Hecho:
- No entró y por qué:
- Aprendizajes:
- Ajustes al Sprint 2:
