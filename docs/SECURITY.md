# SECURITY — Hallazgos y decisiones

> Registro con fecha y severidad (ver `CLAUDE.md` §9).

| Fecha | Severidad | Hallazgo / decisión | Estado |
|---|---|---|---|
| 2026-09-29 | Info | Repo inicial: `.env*` ignorados por `.gitignore`; solo `.env.example` versionado. | Hecho |
| 2026-09-29 | Moderada/Alta (build-time) | `npm audit`: `postcss <=8.5.22` anidado en `next@15`. El fix forzado sube a Next 16 (breaking). Solo procesa CSS propio en build, sin input de usuarios. Se mantiene Next 15 y se reevalúa al migrar a Next 16 o cuando Next 15 publique parche. | Aceptado, revisar |
