# AUDITORIA — Camino a UAT

> Auditoría del proyecto del **2026-10-02** (develop en `e8c2362`). Objetivo: llegar pronto a UAT con la banda.
> Reglas de esta auditoría: **no se tocó código**; todo hallazgo vive aquí, en los `.md` o en el backlog de Notion. La base de datos aún no está conectada y no se audita (salvo una nota sobre el esquema, al final).
> El plan de UAT está en [`docs/UAT.md`](./UAT.md).

## 1. Resumen

El código está sano; lo que falta para UAT es **producto y proceso**, no calidad técnica.

| Área | Estado | Evidencia |
|---|---|---|
| Calidad del código | 🟢 | 25 archivos de test, 372 tests en verde; `lint`, `typecheck` y `build` en verde; 0 `any`, 0 `console` fuera del logger, 0 `dangerouslySetInnerHTML`; `data-component` en todas las pantallas y componentes de `features/` |
| Rendimiento | 🟢 | First Load JS compartido 103 kB; páginas de 106 a 121 kB; FCP/LCP ≤ 668 ms y CLS 0 (medido con Playwright, build de producción, 375 px) |
| Accesibilidad | 🟡 | axe: 0 violaciones en las 6 pantallas. Pero 47 objetivos táctiles < 44 px y 4 < 24 px (falla WCAG 2.2 · 2.5.8) |
| Seguridad (lo que existe) | 🟡 | Headers y guard bien; CSP con `'unsafe-inline'` en scripts; 1 alta + 1 moderada de `npm audit` en `postcss` anidado en Next 15 (build-time, aceptada) |
| CI | 🟡 | Corre lint, typecheck, test y build. **No exige la cobertura 100 %** (ver CI-01) |
| Producto para UAT | 🔴 | En producción no hay nada que probar; el demo no deja vivir el juego (saldar → XP → personaje); no hay guion ni criterios de UAT (este PR agrega el guion) |
| Documentación | 🟡 | CLAUDE.md, PROMPTS.md, SPRINTS.md y MOVIL.md habían quedado atrás del código; corregidos en este PR |

**Lo más importante, en orden:**

1. **UAT-02 — el demo no deja probar el diferenciador.** Hoy se puede dividir y mirar, pero no *saldar* ni ver cómo el personaje gana XP o se deteriora. Es justo lo que queremos validar con la banda.
2. **UAT-01 — no hay entorno de UAT.** `/` en producción solo muestra un título y el toggle; `/dev/*` existe solo en previews, y las previews de Vercel pueden pedir login.
3. **CI-01 — la cobertura 100 % no se está exigiendo.** Los umbrales de `vitest.config.mts` solo corren con `npm run test:coverage`; el CI corre `npm run test`.
4. **IA-02 — el prompt B1 no cubre préstamos ni pagos** ("le presté 500 a Ferni"), lo primero que escribirá alguien en una app de cuentas.

## 2. Hallazgos

Prioridad = P0 antes de UAT-1 (prototipo) · P1 antes de UAT-2 (con Supabase y la banda real; en UAT-1 son deseables) · P2 mejora. Cada fila con ticket está en el backlog de Notion con el mismo ID en el título.

### Producto y UAT

| ID | Prio | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| UAT-01 | P0 | No hay entorno donde la banda pueda probar | `src/app/page.tsx` en producción: título + toggle; `esEntornoDev()` oculta `/dev/*` en producción; las previews de Vercel pueden estar protegidas con login | Decidir (D8). Recomendado: UAT-1 sobre la URL estable de la rama `develop` sin llaves reales (ver `docs/UAT.md` §2) |
| UAT-02 | P0 | El demo no permite *saldar* ni ver la reacción del personaje | Ningún componente de `features/` tiene acción de saldar; "Saldar" solo existe en `/dev/ui` como botón de muestra | Ticket: saldar en el demo (en memoria) con XP, nivel y estado del avatar derivados con `lib/game` |
| UAT-03 | P1 | Sin onboarding ni selector de grupo | CLAUDE.md §16.2; el índice del demo hace de selector | Ticket: entrada con "elige tu banda" y selector de grupo en el demo |
| UAT-04 | P1 | Sin Error Boundary, `not-found` ni `loading` por pantalla | `find src/app -name error.tsx` → vacío; CLAUDE.md §12 lo exige | Ticket: `error.tsx` con el `data-component` que falló y "copiar reporte" (funciona en producción: solo requestId y componente, sin PII) |
| UAT-05 | P1 | Sin metadatos de app móvil | `layout.tsx` solo tiene `title` y `description`; no existe `public/` (sin favicon, manifest ni ícono) | Ticket: viewport, `themeColor`, favicon, manifest y OG para "agregar a pantalla de inicio" |
| UAT-06 | P0 | Objetivos táctiles chicos | Scan a 375 px: 47 < 44 px, 4 < 24 px. En producción: ThemeToggle 53×36. En demo: pills de grupo 28 px, "Ver quién le debe a quién →" 24 px, enlaces "← Demo" 20 px | Ticket L2: mínimo 44×44 px en móvil |
| UAT-07 | P2 | Feedback manual | `docs/FEEDBACK.md` depende de que Yerif transcriba | Ticket: enlace "Dar feedback" a un formulario gratuito (Notion o Google Forms) |
| UAT-08 | P0 | Reglas de producto implementadas sin confirmar | Ver §3 y CLAUDE.md §7 ("Reglas derivadas") | Decisiones D1–D5 de Yerif antes de UAT-1 (no es ticket: es tu OK) |

### Calidad y CI

| ID | Prio | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| CI-01 | P0 | La cobertura 100 % no se exige en CI | `package.json`: `"test": "vitest run"`; los umbrales viven en `coverage.thresholds` y solo se evalúan con `--coverage`; `ci.yml` corre `npm run test` | Ticket (S): el CI corre `npm run test:coverage`. Hasta entonces CLAUDE.md §11 documenta que se corre a mano |
| CI-02 | P1 | `main` y `develop` sin protección; PRs #18, #19 y #20 sin mergear (CI verde) | Pendiente de Yerif | Branch protection + "Automatically delete head branches" (hay ~21 ramas remotas ya mergeadas) |
| CI-03 | P1 | Sin Playwright | `tests/e2e/` vacío; CLAUDE.md §11 lo pide para flujos críticos | Ticket (M): smoke E2E sobre el demo (dividir, confirmar, saldar). En CI solo en PR a `main` o manual, por el presupuesto de minutos |
| CI-04 | P2 | `check:secrets` no existe aunque CLAUDE.md §9 y §14 lo citan | `package.json` scripts | Ya está en el backlog (A14); no se duplica |
| CI-05 | P2 | `npm audit`: 1 alta + 1 moderada, 4 avisos de `postcss` dentro de `next@15` | `npm audit` el 2026-10-02; el fix fuerza Next 16 | Ticket P2 post-UAT: migrar a Next 16 (`middleware.ts` → `proxy.ts`). Riesgo hoy: bajo, solo procesa CSS propio en build |

### Seguridad

| ID | Prio | Hallazgo | Acción |
|---|---|---|---|
| SEC-01 | P2 | CSP con `script-src 'unsafe-inline'` (Next sin nonce) | Aceptado para UAT-1 (sin datos reales). CSP con nonce requiere middleware y vuelve dinámicas las páginas: decidir en la auditoría L8 |
| SEC-02 | P1 | Las previews muestran `/dev/*` y el DebugPanel (incluye la última respuesta cruda de la IA). Si una preview recibe llaves reales, cualquiera con la URL las usa | Regla nueva en CLAUDE.md §9: las llaves reales viven **solo en el scope Production** de Vercel; Preview sin `ANTHROPIC_API_KEY` o con proyecto de desarrollo |
| SEC-03 | P1 | UAT-2 maneja datos reales de personas (nombre, email, avatar) | Ticket: aviso de privacidad mínimo y de qué se guarda (México, LFPDPPP). No es asesoría legal: Yerif decide si lo revisa alguien |
| SEC-04 | — | Lo ya registrado en `docs/SECURITY.md` (IP del cliente, rate limit en memoria, body) sigue vigente | Sin cambios |

### IA y prompts (revisión de `docs/PROMPTS.md`)

| ID | Prio | Hallazgo | Acción |
|---|---|---|---|
| IA-01 | — | PROMPTS.md citaba como existentes cosas que son plan: `src/lib/ai/client.ts`, `conciliarTicket`, `estimarCostoUsd` | **Hecho en este PR:** marcadas como pendientes con su ticket |
| IA-02 | P1 | **B1 no cubre préstamos ni pagos directos.** "Le presté 500 a Ferni", "le pagué 200 a Ferni" o "pagué la entrada de Ferni" no son un gasto compartido: con las reglas 5–6 el modelo repartiría entre quien escribe y Ferni. Tampoco hay casos así en `evals/b1/` | Propuesta B1 v2 en `docs/PROMPTS.md` (no es el bloque canónico); ticket de evals (L3) |
| IA-03 | P1 | B1 no distingue "propina incluida" de "+ propina" ni "entre los 4" cuando el grupo tiene 6 | Misma propuesta B1 v2 |
| IA-04 | P1 | Riesgo abierto: `zodOutputFormat` del SDK con Zod 4 (el SDK aún no está instalado) | Se verifica en A11 al instalar el SDK; plan B documentado en PROMPTS.md |
| IA-05 | P1 | Los golden de `evals/` los escribió Claude; no los has revisado, y son 100 % sintéticos | Ticket: Yerif revisa los golden y aporta ≥ 5 mensajes reales (UAT-1 es una buena fuente) |
| IA-06 | P1 | B2 sin fotos de evals | Yerif aporta ≥ 15 fotos reales sin tarjetas ni caras (ver `evals/b2/README.md`) |
| IA-07 | P2 | La lista de categorías está copiada en los prompts B1, B2 y B5; `sync.test.ts` compara prompt ↔ doc, pero nada compara prompt ↔ `CATEGORIAS` | Ticket: test que verifique que cada categoría de `lib/categorias.ts` aparece en B1, B2 y B5 |

## 3. Reglas de producto implementadas que CLAUDE.md no definía

El código tuvo que decidir estas cosas; CLAUDE.md §7 ahora las lista como **"implementado, por confirmar"**. Si alguna no te convence, se cambia primero en CLAUDE.md y luego en el código.

| # | Regla | Dónde vive | Por qué importa en UAT |
|---|---|---|---|
| D1 | "A tiempo" = saldada en ≤ 72 h (Jardinero y Alcalde); coincide con el umbral de `rekt` | `lib/game/badges.ts` | Define cuántos pagos cuentan para las skins |
| D2 | Skins: Clásico (siempre), Jardinero y Alcalde (por badge), **Explorador (nivel 5) y Leyenda (nivel 10)** — las dos últimas son propuesta, CLAUDE.md solo fija las de badge | `lib/game/skins.ts` | CLAUDE.md §16 promete 5 skins |
| D3 | Generoso: gana quien pagó más gastos en el mes (hora de CDMX); empate → más dinero; empate → comparten. Mecenas: el gasto más grande de todo el historial; ambos se pueden perder | `lib/game/badges.ts` | Reputación pública: probar que no se siente injusto |
| D4 | Propina e impuestos se suman **encima** del total capturado (no incluidos). "IVA incluido" = sin ajuste | `lib/splits`, B1 | Un 10 % mal interpretado cambia cuánto debe cada quien |
| D5 | Anti-farming de XP: **no definido.** +10 por gasto permite gastos falsos; +25 por "semana sin deudas", leído literal, también se daría a quien no hizo nada en la semana | `lib/game/xp.ts` (solo la tabla) | Con 5 amigos no es un riesgo real; con la banda y competencia por badges, sí. Propuesta: +10 solo si el gasto tiene ≥ 2 personas y máx. 5 por día; +25 solo si hubo al menos un gasto o pago esa semana |

Otras decisiones implícitas ya verificadas contra el código: el avatar suma lo que debes **entre grupos** (≥ $500 total = `rekt`); lo que te deben en un grupo no compensa lo que debes en otro; $500 exactos es `rekt` y 72 h exactas sigue siendo `mild`; el Fantasma exige una deuda activa de más de 7 días; pasados 7 días saldar da 0 XP.

## 4. Decisiones que necesito de Yerif

| # | Decisión | Recomendación |
|---|---|---|
| D8 | Entorno de UAT-1 | Preview estable de `develop`, con la protección de Vercel desactivada **solo para previews** y sin ninguna llave real en Preview (no hay nada sensible: es el demo) |
| D1–D5 | Reglas de §3 | Aceptar D1–D4 tal cual; D5 aceptar la propuesta |
| D6 | ¿Se puede saldar **parcialmente**? Afecta al modelo de datos (`settled_at` vs `settlements`) y al guion de UAT | Para UAT-1, solo saldar completo; decidir parciales con lo que diga la banda |
| D7 | Al borrar una cuenta con deudas pendientes, ¿qué pasa con lo que otros le deben o le deben a la persona? `on delete cascade` borraría la deuda de los demás | Anonimizar ("Persona eliminada") en lugar de borrar los gastos del grupo; decidir antes de A5 |
| D9 | PRs #18 (menos dependencias), #19 y #20 (Dependabot) con CI verde; este PR de docs | Mergear a `develop` tras revisarlos (esta auditoría no los tocó por la regla de no cambiar código) |
| D10 | `main`/producción de Vercel | Sin merge hasta que el PoC esté listo, como ya decidiste; mientras tanto el deploy de producción no es parte de UAT-1 |

## 5. Qué cambió en los documentos

| Archivo | Cambio |
|---|---|
| `CLAUDE.md` | Estado real del stack y de la estructura (marcando lo pendiente), §7 con las reglas derivadas, §8–§9 con riesgos y la regla de llaves por entorno, §10 corrige la regla de `subtle`, §11 cobertura y objetivos táctiles, §14 scripts reales, §15 merges a `main`, §17 nuevo: camino a UAT. No se tocó la línea "Fase actual" |
| `docs/PROMPTS.md` | "Última revisión", estado de A1–A17, mapa backlog → prompts al día, referencias a lo que aún no existe, riesgo Zod 4 y propuesta B1 v2. **Ningún bloque ` ```text <ID>@vN ` cambió** (sin cambiar código no se puede subir de versión sin romper `sync.test.ts`) |
| `docs/UAT.md` | Nuevo: entornos, criterios de entrada y salida, guion de tareas, métricas y registro |
| `docs/SPRINTS.md` | Estado real del Sprint 1 y "Sprint 0.5: camino a UAT" |
| `docs/MOVIL.md` | Checklist actualizado y orden real de merges |
| `docs/SECURITY.md` | Hallazgos de esta auditoría con fecha y severidad |
| `docs/FEEDBACK.md` | Enlace al guion de UAT y preguntas ligadas a métricas |
| `README.md` | Definición de terminado con typecheck y cobertura; tabla de documentos |

## 6. Nota sobre el esquema de datos (CLAUDE.md §6, antes de A5)

La base de datos no está conectada, así que no se audita. Pero antes de escribir la primera migración conviene resolver estos puntos; van en un solo ticket P2 ("Revisar esquema §6 antes de A5"):

1. `item_assignments.fraccion numeric`: el código y B3 usan **partes enteras**; guardar una fracción reintroduce decimales. Mejor `partes int`.
2. `expense_shares.settled_at` y `settlements` modelan lo mismo de dos formas; definir cuál es la fuente de verdad (ver D6).
3. `profiles.nivel` se deriva de `xp` (`progresoNivel`); almacenarlo rompe el principio de "derivado, nunca almacenado".
4. `xp_events` sin llave de idempotencia; A7 la exige (por ejemplo `unique (user_id, razon, ref_id)`).
5. Varias tablas de tenant no tienen `created_at`, pero §4 pide el índice `(group_id, created_at desc)` en todas.
6. `weekly_summaries` sin `unique (user_id, week_start)`: el cron podría duplicar resúmenes.
7. Cascadas al borrar cuenta (ver D7).

## 7. Cómo se hizo

- `git grep` de convenciones (CLAUDE.md §11 y §15) sobre `src/`.
- `npm run test`, `npm run build`, `npm audit` el 2026-10-02.
- axe-core en las 6 pantallas (375 px, build de producción en modo preview), medición de objetivos táctiles y de FCP/LCP/CLS con Playwright. Lighthouse no puede lanzar Chrome en este entorno.
- Lectura completa de CLAUDE.md, PROMPTS.md, LOOPS.md, SPRINTS.md, MOVIL.md, SECURITY.md, FEEDBACK.md y de `lib/game`, `lib/splits` y `lib/ai` para contrastar docs y código.
- Backlog de Notion: conteo por épica y estado, y revisión de los tickets que no están en "Backlog".
