# Cuentas Conmigo 🌻

Web app para dividir gastos entre amigos, gamificada con estética cozy.
Cada quien tiene un personaje que evoluciona según qué tan rápido paga.

> Contexto completo de producto, arquitectura y reglas: [`CLAUDE.md`](./CLAUDE.md).

## Documentación

| Archivo | Para qué |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Fuente de verdad: producto, arquitectura, reglas |
| [`docs/SPRINTS.md`](./docs/SPRINTS.md) | Plan de sprints y sprint actual |
| [`docs/MOVIL.md`](./docs/MOVIL.md) | Cómo ver la app y avanzar desde el celular |
| [`docs/AUDITORIA.md`](./docs/AUDITORIA.md) | Auditoría del 2026-10-02: hallazgos, decisiones pendientes y camino a UAT |
| [`docs/UAT.md`](./docs/UAT.md) | Rondas de pruebas con la banda: entornos, guion, métricas |
| [`docs/LOOPS.md`](./docs/LOOPS.md) | Workflows por tipo de tarea (L0–L9) |
| [`docs/PROMPTS.md`](./docs/PROMPTS.md) | Prompts de desarrollo (A) y de runtime de IA (B) |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Hallazgos, threat models y controles |
| [`docs/FEEDBACK.md`](./docs/FEEDBACK.md) | Feedback de la banda y pruebas manuales |

## Stack

Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + RLS, Auth, Storage) · Anthropic API (Claude Haiku 4.5, solo servidor) · Vercel Hobby.

## Estado

Prototipo con datos de ejemplo (sin Supabase todavía). Con `npm run dev`, abre `/dev/demo` para recorrer Home, Dividir, Confirmar gasto y Perfil; esas rutas solo existen en desarrollo y previews de Vercel. El estado por ítem del MVP está en `CLAUDE.md` §17.

## Primeros pasos

```bash
cp .env.example .env.local   # rellena las variables (nunca se versiona)
npm install
npm run dev
```

## Ramas

| Rama | Uso |
|---|---|
| `main` | Producción. Solo recibe merges desde `develop` vía PR. |
| `develop` | Integración. Base de todas las ramas de trabajo. |
| `feat/*`, `fix/*`, `chore/*`, `docs/*` | Trabajo puntual; se abren desde `develop` y vuelven por PR. |

Commits en [Conventional Commits](https://www.conventionalcommits.org/es/) en español: `feat: split por voz`, `fix: redondeo en itemizado`.

## Definición de terminado

```bash
npm run lint && npm run typecheck && npm run test && npm run build   # lo que corre el CI
npm run test:coverage   # además, si tocaste lib/splits, lib/game, lib/ai o lib/api (exige 100 %)
```
