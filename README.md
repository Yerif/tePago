# Cuentas Conmigo 🌻

Web app para dividir gastos entre amigos, gamificada con estética cozy.
Cada quien tiene un personaje que evoluciona según qué tan rápido paga.

> Contexto completo de producto, arquitectura y reglas: [`CLAUDE.md`](./CLAUDE.md).

## Stack

Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + RLS, Auth, Storage) · Anthropic API (Claude Haiku 4.5, solo servidor) · Vercel Hobby.

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
| `feat/*`, `fix/*`, `chore/*` | Trabajo puntual; se abren desde `develop` y vuelven por PR. |

Commits en [Conventional Commits](https://www.conventionalcommits.org/es/) en español: `feat: split por voz`, `fix: redondeo en itemizado`.

## Definición de terminado

```bash
npm run lint && npm run test && npm run build
```
