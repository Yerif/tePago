# CLAUDE.md — Cuentas Conmigo

> Contexto base para Claude Code. Vive en la **raíz del repo** y se carga en cada sesión.
> Prompts detallados: `docs/PROMPTS.md` · Workflows: `docs/LOOPS.md` — léelos cuando la tarea lo pida, no por default.
> Si una decisión de producto o arquitectura cambia, ESTE archivo se actualiza primero.
> Estado real y camino a UAT: §17 · `docs/AUDITORIA.md` · `docs/UAT.md`.

**Fase actual: FREE TIER** · Solo el developer (Yerif) cambia esta línea.

---

## 0. Reglas críticas (si solo lees una sección, que sea esta)

1. **Free tier primero.** Nada de servicios de pago, upgrades de plan ni dependencias con costo sin aprobación explícita del developer.
2. **Multitenant: `group_id` es la tenant key.** Toda tabla de dominio la lleva `NOT NULL`. Ninguna query cruza tenants.
3. **RLS es la frontera de seguridad**, no el frontend. Ninguna tabla sin RLS; ninguna política sin test cruzado A/B.
4. **Toda API route usa `lib/api/guard.ts`**: sesión → Zod → pertenencia al grupo → rate limit.
5. **Secretos solo en servidor.** Jamás `NEXT_PUBLIC_` para una clave.
6. **XP y badges solo server-side** (funciones `security definer`). El cliente nunca los escribe.
7. **Dinero en centavos enteros** en `lib/splits`; `numeric(12,2)` en Postgres. Nunca floats. La suma de las partes SIEMPRE iguala el total.
8. **La salida de la IA es dato no confiable**: Zod estricto, nunca se renderiza como HTML, nunca se ejecuta como instrucción.
9. **Lógica de negocio en `lib/` como TypeScript puro** (sin React ni Next) — se porta a React Native en v2 sin tocarla.
10. **Velocidad**: un split simple en ≤ 3 interacciones. Más que eso es un bug de producto.
11. **Plan antes de código** en tareas de más de un archivo. `lint + typecheck + test + build` en verde antes de declarar algo terminado (y `test:coverage` si tocaste `lib/splits`, `lib/game`, `lib/ai` o `lib/api`).

---

## 1. Producto

**Cuentas Conmigo** es una web app para dividir gastos entre amigos, gamificada con estética cozy (inspiración: la *vibra* de Animal Crossing — cero IP de Nintendo). Cada usuario tiene un personaje que evoluciona según cómo paga:

- Paga rápido → gana XP, sube de nivel, desbloquea skins.
- Debe dinero → su personaje se deteriora visualmente.
- Los badges de comportamiento son **públicos dentro del grupo** (reputación social con humor, nunca humillación).

**Diferenciador: la gamificación emocional-social. NO la IA.** SplitBill AI, Billy, Tab y SplitMyExpenses ya hacen split con foto de ticket; para nosotros es *table stakes*. La IA es invisible; el juego es el protagonista.

**Principio de velocidad:** ganarle a sacar la calculadora. Flujo objetivo: abrir → entrada (monto, texto o foto) → confirmar.

**Público:** amigos y viajes, México primero (español, MXN, tono cálido). Meta inicial < 100 usuarios, uso semanal. Familia NO es público del MVP.

---

## 2. Free tier y presupuesto

| Servicio | Límite relevante | Cómo nos mantenemos dentro |
|---|---|---|
| Supabase Free | 500 MB DB · 1 GB storage · 5 GB egress/mes · 50k MAU · 2 proyectos activos · pausa tras 7 días sin actividad | Fotos comprimidas a ~200 KB + retención de 90 días; el cron diario de retención también evita la pausa |
| Vercel Hobby | 100 GB bandwidth · crons con frecuencia máx. diaria · **solo uso no comercial** | Resumen semanal en cron de lunes. Monetizar = decisión de expansión (Pro) |
| Anthropic API | Sin free tier (pago por uso) — **único costo variable** | Haiku 4.5, rate limits, `max_tokens` acotado, prompt caching, límite de gasto mensual en la consola |
| GitHub Actions | 2,000 min/mes en repos privados | CI solo con lint + test + build |

**Proyección a 100 usuarios:** ~800 llamadas de IA/mes × ~$0.003–0.005 USD = **~$3–5 USD/mes** (Haiku 4.5: $1 input / $5 output por millón de tokens). Storage ≈ 160 MB/mes con retención. Todo lo demás: $0.

**Protocolo cuando algo amenaza el free tier:** detente → reporta el consumo → presenta la alternativa gratuita y la de pago con trade-offs → espera la decisión del developer. Nunca asumas el upgrade.

---

## 3. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | Next.js 15+ (App Router) + TypeScript estricto | Server Components por defecto; `"use client"` solo con interactividad |
| Estilos | Tailwind CSS + tokens como CSS variables | Dark mode es el DEFAULT (`next-themes`, `defaultTheme="dark"`) |
| UI kit | shadcn/ui (Radix) + cva + `cn()` | Componentes propios al estilo shadcn, sin CLI. Hoy solo `@radix-ui/react-slot`; otra primitiva Radix entra cuando un componente la necesite |
| Backend | Supabase: Postgres + RLS, Auth, Storage | Realtime solo cuando una feature lo justifique |
| IA | Anthropic API — Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Solo desde el servidor. Verificar string vigente en docs.claude.com. SDK aún no instalado (A11) |
| Validación | Zod | Inputs de API, salidas de IA, formularios |
| Tests | Vitest (`lib/`) · Playwright (E2E) · pgTAP (`supabase test db`) para RLS | Vitest y Playwright (smoke E2E del demo) ya están; pgTAP llega con Supabase |
| Hosting | Vercel Hobby | Preview deploy por PR |
| v2 | React Native (Expo) | Reutiliza `lib/game`, `lib/splits`, tipos y queries |

**Versiones hoy:** Node ≥ 22 · Next 15.5 · React 19 · TypeScript 6 · Tailwind 4 · Zod 4 · Vitest 5. **Instaladas:** `next`, `react`, `zod`, `next-themes`, `cva`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `@playwright/test` (dev). **Pendientes** (cada una se justifica en el PR que la trae): `@anthropic-ai/sdk`, `@supabase/supabase-js` y `@supabase/ssr`, `nanoid`, Promptfoo.

### Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # o publishable key si el proyecto usa las llaves nuevas
SUPABASE_SERVICE_ROLE_KEY=         # o secret key — SOLO server
ANTHROPIC_API_KEY=                 # SOLO server
CRON_SECRET=                       # Vercel lo manda en Authorization a las rutas de cron
DEBUG=                             # opcional: namespaces con logs de debug en el servidor
```

---

## 4. Arquitectura multitenant

- **Tenant = grupo.** Usuarios globales (un perfil), datos por tenant. Patrón workspace-switcher tipo Slack.
- **El tenant vive en la URL**: `/g/[groupId]/...` es la fuente de verdad. La cookie `cc_last_group` solo recuerda el último grupo para redirigir. Nunca localStorage para esto.
- **`group_id` denormalizado** en tablas hijas (`expense_items`, `item_assignments`, `expense_shares`) para que cada política RLS sea un check simple sin joins.
- **Integridad entre tenants** con FKs compuestas: `(expense_id, group_id) → expenses(id, group_id)`. Es imposible que un item apunte a un gasto de otro grupo.
- **Un solo helper para RLS**: `is_group_member(gid uuid)` (`security definer`, `stable`, `search_path = ''`). Todas las políticas lo usan. En políticas, `auth.uid()` va envuelto en `(select auth.uid())` por rendimiento.
- **Índices** `(group_id, created_at desc)` en toda tabla de tenant (en `group_members` y `user_badges`, sobre `joined_at` y `earned_at`); `group_members(user_id)` para listar mis grupos.
- **Storage por tenant**: `tickets/{group_id}/{expense_id}.webp`; la política valida el primer segmento de la ruta contra la membresía.
- **Rate limits** con llave por usuario, por tenant y por IP (invite codes).
- **Crecimiento futuro sin re-arquitectura**: una tabla `orgs` encima de `groups` para espacios/white-label; particionar por `group_id` si un tenant crece mucho.

---

## 5. Estructura de carpetas

```
CLAUDE.md                     # este archivo (raíz)
docs/                         # PROMPTS · LOOPS · SPRINTS · SECURITY · FEEDBACK · MOVIL · AUDITORIA · UAT
src/                          # "· pendiente" = aún no existe
  app/
    page.tsx                  # HOY: portada mínima (título + toggle; en dev/preview, botón al demo)
    manifest.ts icon.svg apple-icon.png opengraph-image.png   # "agregar a pantalla de inicio" y vista previa al compartir; íconos de tamaño fijo en public/icons/
    dev/                      # SOLO dev/preview (404 en producción): demo/ (datos mock) y ui/ (sistema de diseño)
    (auth)/                   # login, callback · pendiente
    (app)/                    # pendiente (necesita Supabase)
      page.tsx                # redirige al último grupo o a onboarding
      g/[groupId]/            # TODO lo de un tenant vive aquí
        page.tsx              # Home del grupo: tu personaje + la banda
        gastos/[expenseId]/
      dividir/                # modo rápido (sin grupo) + "guardar en grupo"
      grupos/                 # lista, crear, unirse
      unirse/[code]/
      yo/                     # personaje, skins, badges (global)
    api/                      # pendiente
      smart-split/route.ts
      categorizar/route.ts
      cron/resumen-semanal/route.ts
      cron/retencion-tickets/route.ts
  middleware.ts               # HOY: corta /dev/* con 404 en producción. Después: sesión de Supabase (en Next 16+ se llama proxy.ts)
  components/
    ui/                       # Button, Card (más Dialog… cuando se necesiten)
    cozy/                     # Avatar, XPBar, GrassDivider, Pill, ThemeToggle
    features/                 # ConfirmarGasto, DividirRapido, ExpenseCard, FriendRow, GastoDetalle, SkinSelector
    theme/                    # ThemeProvider (next-themes)
    dev/                      # DebugPanel (solo dev/preview)
  lib/
    supabase/                 # clients: browser, server, middleware · pendiente
    api/                      # guard.ts (plantilla obligatoria de API routes) + limitador.ts
    tenant.ts                 # getActiveGroup, assertMember · pendiente
    ai/                       # prompts/ (versionados), schemas/ (Zod), validadores, sanitizar, flujo, evals. client.ts pendiente
    game/                     # XP, niveles, badges, skins, estados — TS PURO
    splits/                   # cálculo en centavos — TS PURO, 100% testeado
    mock/                     # datos de ejemplo del demo; solo dev/preview
    categorias.ts             # catálogo único de categorías (UI, DB, IA)
    entorno.ts debug.ts tiempo.ts contraste.ts utils.ts
    logger.ts
    errors.ts
  types/database.ts           # generado por Supabase, no editar a mano · pendiente
supabase/
  migrations/                 # SQL versionado; nunca editar una migración aplicada (vacío hoy)
  tests/                      # pgTAP: tests RLS cruzados (vacío hoy)
  seed.sql
tests/e2e/                    # Playwright: smoke.spec.ts (demo), produccion.spec.ts (/dev da 404) y selectors.ts
evals/                        # datasets (b1, b3, b4, b5; b2 espera fotos) y README; runner Promptfoo pendiente
```

---

## 6. Esquema de datos

```sql
-- GLOBALES (por usuario)
profiles       (id uuid PK → auth.users, username unique, display_name,
                avatar_base, skin_activo, xp int, created_at)   -- el nivel se deriva de xp (progresoNivel)
user_skins     (user_id, skin_slug, unlocked_at)          -- PK (user_id, skin_slug)

-- TENANT (group_id NOT NULL en todas)
groups         (id, nombre, icono, invite_code unique, invite_revoked_at,
                created_by, created_at)                    -- el tenant en sí
group_members  (group_id, user_id, rol check in ('owner','member'), joined_at)
expenses       (id, group_id, descripcion, total numeric(12,2), moneda default 'MXN',
                pagado_por, categoria, split_mode check in ('igual','itemizado'),
                receipt_path, created_by, created_at)      -- unique (id, group_id)
expense_items  (id, group_id, expense_id, nombre, precio numeric(12,2), cantidad int, created_at)
item_assignments (group_id, item_id, user_id, partes int check (partes >= 1), created_at)   -- fracción = partes / Σ partes
expense_shares (group_id, expense_id, user_id, monto numeric(12,2), created_at)           -- lo que cada quien debe del gasto
settlements    (id, group_id, de_user, a_user, monto numeric(12,2) check (monto > 0), created_at)
                                                            -- pagos y abonos: ÚNICA fuente de verdad de lo saldado
user_badges    (group_id, user_id, badge_slug, earned_at, revoked_at)

-- SISTEMA
xp_events      (id, user_id, group_id null, cantidad int, razon, ref_id, created_at)
                                                            -- unique (user_id, razon, ref_id): el mismo evento nunca da XP dos veces
rate_limits    (key text, window_start timestamptz, count int)
weekly_summaries (id, user_id, week_start date, contenido jsonb, created_at)   -- unique (user_id, week_start)
```

- Los **catálogos** de badges y skins viven como constantes en `lib/game/` (versionados con el código); la DB solo guarda lo ganado.
- `xp_events`, `user_badges` y `user_skins`: escritura SOLO vía funciones `security definer` (`otorgar_xp`, `evaluar_badges`).
- **Saldado:** no hay `settled_at`. Lo pendiente de cada deuda se deriva aplicando `settlements` a `expense_shares` (PEPS, `lib/splits/pagos.ts`), igual que en el demo.
- Borrar cuenta = borrar datos: cascadas definidas desde el esquema inicial. **Decisión (D7, Yerif 2026-10-02):** al borrar una cuenta desaparecen sus deudas (y las que otros tenían con ella); los balances del resto se recalculan. La UI de borrar cuenta debe avisarlo con claridad antes de confirmar.
- **Estado:** el esquema aún no está migrado; el prototipo corre con `lib/mock`. Antes de la primera migración (A5) se resuelven los 7 puntos de `docs/AUDITORIA.md` §6 (partes enteras en lugar de `fraccion`, saldado parcial con `settlements` como fuente de verdad, idempotencia de XP, `created_at` e índices). Las cascadas ya están decididas (D7).

---

## 7. Reglas de negocio (fuente de verdad)

### Estados del avatar (derivados, nunca almacenados)

| Estado | Condición | Visual |
|---|---|---|
| `clean` | balance ≥ 0 en todos sus grupos | Radiante |
| `mild` | debe > 0 y (< $500 MXN y ≤ 72 h) | Apagado, preocupado |
| `rekt` | debe ≥ $500 MXN o alguna deuda > 72 h | Deteriorado |

Lo que debes se suma **entre grupos**; lo que te deben en un grupo no compensa lo que debes en otro. $500 exactos es `rekt`; 72 h exactas sigue siendo `mild`. Persona nueva (sin grupos) = `clean`. Implementado en `lib/game/avatar.ts`.

### XP (solo server-side)

| Evento | XP |
|---|---|
| Registrar un gasto | +10 |
| Saldar deuda en < 24 h | +50 |
| Saldar deuda en < 48 h | +30 |
| Saldar deuda en < 7 días | +10 |
| Semana completa sin deudas | +25 |

La antigüedad de una deuda cuenta desde la fecha del gasto. Pasados 7 días, saldar da 0 XP. Nivel n requiere `100 + (n-1) * 75` XP (se guarda la XP total y el nivel se deriva). Fórmula única en `lib/game/levels.ts`.

**Anti-farming (D5, aprobado por Yerif 2026-10-02):** +10 por gasto solo si participan ≥ 2 personas y máximo 5 gastos con XP por día; +25 por "semana sin deudas" solo si hubo al menos un gasto o pago esa semana. Implementado en `lib/game/xp.ts` (`xpPorRegistrarGasto`, `xpSemanaSinDeudas`, `contarDelDia`); falta replicarlo en la función SQL `otorgar_xp`.

### Badges (públicos en el grupo)

| Slug | Nombre | Regla |
|---|---|---|
| `rayo` | Rayo ⚡ | 5 deudas saldadas en < 24 h |
| `generoso` | El Generoso 🌻 | Quien más gastos pagó en el grupo este mes |
| `fantasma` | El Fantasma 👻 | Deuda activa > 7 días (se revoca al saldar) |
| `jardinero` | Jardinero 🌱 | 5 pagos a tiempo (desbloquea skin) |
| `alcalde` | Alcalde 🏅 | 10 pagos a tiempo (desbloquea skin) |
| `mecenas` | El Mecenas 🎩 | Pagó la cuenta más grande del grupo |

Definiciones (implementadas en `lib/game/badges.ts` y confirmadas, ver "Reglas derivadas" abajo): "a tiempo" = saldada en ≤ 72 h; el mes de Generoso es el de `America/Mexico_City`; Rayo, Jardinero y Alcalde son permanentes; Fantasma, Generoso y Mecenas se pueden perder.

### Categorías de gasto

`comida` 🌮 · `super` 🛒 · `fiesta` 🍻 · `transporte` 🚗 · `hospedaje` 🏡 · `entretenimiento` 🎟️ · `hogar` 🧺 · `regalos` 🎁 · `otros` 📦. Fuente única en `lib/categorias.ts`; qué cubre cada una en `docs/PROMPTS.md` (B0). Cambiarlas implica nueva versión de los prompts B1, B2 y B5.

### Skins

Se ganan, no se compran (monetización ≠ MVP). Nombres propios, sin referencias a Nintendo. El deterioro visual aplica sobre cualquier skin activo. Las skins son globales (cuentan los badges y el nivel de cualquier grupo).

| Skin | Cómo se gana |
|---|---|
| Clásico | Viene con el personaje (sin accesorio) |
| Jardinero 👒 | Badge Jardinero |
| Alcalde 🎖️ | Badge Alcalde |
| Explorador 🧭 | Nivel 5 |
| Leyenda 👑 | Nivel 10 |

### Cálculo de splits (`lib/splits/`, 100% testeado)

- Todo en **centavos enteros**. Conversión a pesos solo al mostrar (`formatoMXN`).
- **Igual**: `total / n`; el residuo de redondeo lo absorbe el pagador.
- **Itemizado**: cada renglón (precio × cantidad) se reparte por **partes enteras** (`partes / Σ partes`, nunca decimales): "3 chelas mías y 1 de Ferni" = partes 3 y 1. El residuo de cada renglón lo absorbe el pagador. Impuestos y propina se reparten **proporcionalmente al consumo** de cada quien, nunca en partes iguales; su residuo también es del pagador.
- **Propina e impuestos se suman encima del total capturado**; "IVA incluido" no genera ajuste.
- **Saldado parcial (D6, aprobado 2026-10-02):** se puede pagar una parte de una deuda. El XP por saldar se calcula sobre la antigüedad de la deuda y se otorga al quedar saldada por completo (regla por definir con el ticket de saldar: no dar XP por cada abono para evitar farming).
- **Deudas entre personas**: se netean de dos en dos (A↔B). La simplificación en cadena (A→B→C) sigue siendo post-MVP.
- **Invariante con test obligatorio**: Σ partes = total, en cada modo, con casos de borde (1 persona, fracciones de 1/3, propina 0, montos de 1 centavo).

### Reglas derivadas (implementadas; D1–D4 confirmadas por Yerif el 2026-10-02)

El código tuvo que decidir esto; si alguna deja de convencer, se cambia **primero aquí** y luego en el código. Detalle en `docs/AUDITORIA.md` §3.

| # | Regla | Estado |
|---|---|---|
| D1 | "A tiempo" = saldada en ≤ 72 h (igual que el umbral de `rekt`) | Implementada y confirmada |
| D2 | Skins Explorador (nivel 5) y Leyenda (nivel 10) | Implementada y confirmada |
| D3 | Generoso: más gastos pagados en el mes; empate → más dinero; empate → comparten. Mecenas: el gasto más grande de todo el historial del grupo | Implementada y confirmada |
| D4 | Propina e impuestos encima del total; "IVA incluido" sin ajuste | Implementada y confirmada |
| D5 | Anti-farming de XP | Aprobada e implementada en `lib/game`; falta en SQL |

---

## 8. IA en runtime

```
Cliente → POST /api/smart-split → guard → Haiku 4.5 → Zod → cliente
```

- **Estado:** `lib/ai` ya tiene prompts B1–B5 v1, schemas, validadores, sanitizado, flujo con retry/fallback y evals puros (cobertura 100 %). Faltan `client.ts` (SDK) y las rutas: ticket A11. Al instalar el SDK, verificar que `zodOutputFormat` acepta Zod 4; plan B: `z.toJSONSchema()` y `output_config.format` a mano.
- **Split igualitario = JavaScript puro, nunca IA.** La IA solo entra donde agrega valor (texto libre, foto de ticket, categorización, resumen semanal).
- Prompts versionados en `lib/ai/prompts/` (fuente: `docs/PROMPTS.md` Parte B). Ningún cambio de prompt sin correr sus evals (Loop 3).
- Salida JSON: usar structured outputs de la API si el modelo lo soporta; **validar con Zod siempre**. Si falla: 1 retry con el error de validación; si falla otra vez, fallback a entrada manual. Si el modelo se niega (`refusal`) o se corta (`max_tokens`), fallback directo sin retry: se repetiría igual.
- `max_tokens`: smart-split ≤ 1024 · resumen ≤ 300 · categorización ≤ 50.
- Prompt caching: `cache_control` en los system prompts, pero en Haiku 4.5 solo cachea desde 4,096 tokens y los prompts actuales no llegan (sin costo extra). No inflar prompts para alcanzarlo: con tráfico bajo la escritura (1.25×) casi nunca se reutiliza.
- Fotos: comprimir en el cliente a WebP, ≤ 1568 px lado largo y ≤ ~1.2 MP (arriba de eso Haiku 4.5 reescala), ~200 KB, antes de subir.
- Log por llamada (namespace `ai`): requestId, modelo, tokens in/out, latencia, costo estimado. **Nunca** loguear la imagen ni el texto completo del usuario.

---

## 9. Seguridad

| Amenaza | Vector | Control principal |
|---|---|---|
| Ver datos de otro grupo (IDOR) | Cambiar ids en requests | RLS con `is_group_member` + tests cruzados pgTAP |
| Cheating de XP/badges | Escribir desde el cliente | Solo funciones `security definer` |
| Abuso de costo de IA | Spam a `/api/smart-split` o `/api/categorizar` | Rate limit 10/h/usuario en smart-split y 60/h/usuario en categorizar + tamaño máx. de imagen + `max_tokens` |
| Prompt injection | Texto o ticket con instrucciones | Salida solo JSON validado; la salida de la IA es dato, no instrucción |
| Entrar a grupos ajenos | Adivinar invite codes | nanoid ≥ 12 chars + rate limit 5/h/IP + códigos revocables |
| Fuga de secretos | Bundle del cliente / repo | Keys solo server + `npm run check:secrets` |
| Crons invocados por terceros | Llamar `/api/cron/*` | Verificar `Authorization: Bearer ${CRON_SECRET}` |
| XSS | Contenido de usuarios o de la IA | React escapa; prohibido `dangerouslySetInnerHTML` |

Reglas:
1. Toda tabla nueva nace con RLS + test cruzado (usuario A no lee ni escribe datos del grupo de B).
2. Storage: bucket privado, signed URLs de 1 h, subida máx. 5 MB, solo `image/*`.
3. Headers en `next.config`: CSP básica, `X-Frame-Options: DENY`, `Referrer-Policy`.
4. `npm audit` en cada Loop 1; Dependabot activo; toda dependencia nueva se justifica en el PR.
5. PII mínima: nombre, email, avatar. Nada de datos bancarios reales en el MVP.
6. Hallazgos y decisiones en `docs/SECURITY.md` con fecha y severidad.
7. **Llaves reales solo en el scope Production de Vercel.** Preview y desarrollo: sin llaves, o las de un proyecto de desarrollo. Las previews muestran `/dev/*` y el DebugPanel; nada sensible debe vivir ahí.
8. CSP: hoy permite `'unsafe-inline'` en scripts (Next sin nonce). Aceptado hasta la auditoría L8; el nonce exige middleware y páginas dinámicas.
9. Datos reales de personas (UAT-2 en adelante) requieren un aviso de privacidad mínimo antes de invitar a la banda.

---

## 10. Diseño

Dark mode es el **default** (preferencia explícita del developer); toggle disponible.

### Tokens (CSS variables en `globals.css`, consumidas por shadcn)

```
DARK (default)  background #1A1F2E · card #242B3D · border #3A4460
                foreground #E8EAF2 · muted #A0A8C8 · subtle #606880
LIGHT           background #FFFBF0 · card #FFFFFF · border #E8CF99
                foreground #3D2B1F · muted #7A5C44 · subtle #B89880
ACENTOS         grass #7DC67E (dark #4A9E6A) · peach #FFB085 · rose #FF8FAB
                lemon #FFE566 · mint #7DDEC8 · lavender #C4A8E8 · water #74C2E8
FONDOS SUAVES   light: pastel (rose-soft #FFD6E0) · dark: profundo (rose-soft #3D1828)
                en dark, el texto de acento usa el color vivo
```

`subtle` no llega ni a 3:1 (≈ 3.0:1 en dark y ≈ 2.6:1 en light): solo elementos decorativos, **nunca** texto con información, ni siquiera grande.

### Lenguaje visual

- Cards: radio 24 px (16 en elementos chicos), borde 2.5 px, sombra sólida `0 4px 0` + sombra difusa suave.
- Botones con sombra sólida del color del borde; al presionar se hunden (`translateY` + sombra 0).
- Pills redondeadas para badges y estados. Emojis como iconografía del MVP.
- Tipografía: serif display (Georgia o similar) para números y títulos; system-ui para cuerpo.
- Header del Home: cielo con nubes (light) o luna y estrellas (dark) + divisor de pasto.
- Microcopy: español mexicano, cálido, humor ligero, nunca regañón. "¡Todo en orden! 🌻", "Le debes a Ferni 😬".

### shadcn/ui

- Variantes con cva (`variant="grass" | "peach" | "rose"...`); prohibidos los ternarios de clases regados en el JSX.
- Clases condicionales siempre con `cn()`.
- Los componentes de `components/ui/` son nuestros: se editan directo; no existe "actualizar la librería".

---

## 11. Convenciones de código

- TypeScript estricto; prohibido `any` (usar `unknown` + narrowing).
- Un componente por archivo, PascalCase, props con interface local. Export default solo en `page.tsx`/`layout.tsx`.
- Los componentes orquestan, no calculan: lógica → `lib/`.
- Tests: Vitest obligatorio en `lib/splits` y `lib/game`; Playwright para flujos críticos (registrar gasto, smart split, saldar). Smoke E2E del demo: `npm run test:e2e` (levanta el build; en CI corre solo hacia `main` o a mano, `.github/workflows/e2e.yml`).
- Cobertura: 100 % de líneas, ramas y funciones en `lib/splits`, `lib/game`, `lib/ai`, `lib/api` y `lib/tiempo.ts` (umbrales en `vitest.config.mts`). Se evalúan con `npm run test:coverage`, que es lo que corre el CI. Nunca se baja un umbral para pasar.
- Commits: Conventional Commits en español (`feat: split por voz`, `fix: redondeo en itemizado`).
- Accesibilidad mínima: focus visible, labels en inputs, contraste AA en ambos temas, objetivos táctiles ≥ 44×44 px en móvil (nunca < 24 px, WCAG 2.5.8).

### Estilos ≠ identificación ≠ selectores

1. **Estilos** → solo Tailwind + variantes cva.
2. **Identificación** → `data-component="NombreDelComponente"` en la raíz de todo componente de `features/` y de cada pantalla.
3. **Selectores JS/tests** → `data-testid="elemento-en-kebab"` en interactivos y valores verificables; los de E2E centralizados en `tests/e2e/selectors.ts`.

Prohibido estilizar vía `data-*` y prohibido seleccionar por clases de Tailwind o jerarquía del DOM.

```tsx
<article data-component="ExpenseCard" className="rounded-3xl border-[2.5px] ...">
  <span data-testid="expense-amount">{formatoMXN(montoCentavos)}</span>
  <button data-testid="expense-settle" onClick={onSettle}>Saldar</button>
</article>
```

---

## 12. Debugging humano (sin depender de la IA)

- **Logger** `lib/logger.ts` con namespaces (`split`, `game`, `ai`, `db`, `tenant`). En el navegador: `localStorage.setItem('debug', 'split,ai')`. ESLint `no-console` con excepción única en el logger.
- **Errores tipados**: `{ error: { code, message, requestId } }`. Códigos en `lib/errors.ts` (un solo enum); el `requestId` acompaña cada log de esa request.
- **Panel `?debug=1`** (solo dev/preview): usuario, grupo activo, estado del avatar, XP, última respuesta cruda de la IA con latencia.
- **Error Boundary**: `app/error.tsx` y `global-error.tsx` (componente `ErrorPantalla`) con "Intentar de nuevo" y "Copiar reporte". El reporte (`lib/reporte.ts`) lleva ruta, mensaje recortado, `digest` de Next (para buscar en los logs de Vercel), hora y navegador; nunca ids de usuario ni cookies. Funciona también en producción. `not-found.tsx` cozy en la raíz. **No pongas `loading.tsx` en la raíz de `app/`**: mete todo en un Suspense y el `notFound()` de `app/dev/layout.tsx` deja de dar 404 en producción (responde 200). Aun con 404, Next manda el árbol de la página en el cuerpo: por eso `middleware.ts` corta `/dev/*` antes de renderizar. Pendiente: boundaries por segmento cuando existan las pantallas reales.
- **Orden fijo al depurar**: consola con namespace → panel `?debug=1` → Network (`code` + `requestId`) → Vercel logs por requestId → Supabase Studio (¿es RLS?) → solo entonces Claude Code, con la evidencia.

---

## 13. Cómo trabajar en este repo (instrucciones para Claude Code)

1. **Plan primero** en toda tarea de más de un archivo: lista de archivos, decisiones y riesgos. Espera aprobación antes de implementar.
2. **Una sesión = una tarea.** No mezcles feature y refactor.
3. **Definición de terminado**: `npm run lint && npm run typecheck && npm run test:coverage && npm run build` en verde (es lo que corre el CI; la cobertura 100 % de `lib/splits`, `lib/game`, `lib/ai`, `lib/api` y `lib/tiempo.ts` se exige ahí). Si tocaste la DB: migración nueva + `gen types` + tests RLS en verde. Un cambio solo de docs no necesita `build`, pero sí `npm run test`: el test de sincronía lee `docs/PROMPTS.md`.
4. **Si una instrucción contradice este archivo**, detente y pregunta; no elijas por tu cuenta.
5. **Si la mejor solución cuesta dinero**, presenta la alternativa gratuita con trade-offs y espera la decisión.
6. **Features con superficie sensible** (auth, dinero, IA, storage, invite codes): threat model exprés antes del plan (prompt A13, Loop 9) y tests de abuso junto a los felices.
7. **Al cerrar**: resume qué cambió, qué debe probar el developer a mano (dark y light, viewport móvil) y si este archivo necesita actualizarse.

---

## 14. Comandos

```bash
npm run dev                  # desarrollo local
npm run lint                 # ESLint (bloquea console.log sueltos)
npm run typecheck            # tsc --noEmit
npm run test                 # Vitest (lib/)
npm run test:coverage        # Vitest + umbrales de cobertura (100 % en módulos críticos)
npm run build                # build de producción
npm run test:e2e             # Playwright: levanta el build en modo preview y en modo producción
# Pendientes (aún no existen en package.json):
npm run check:secrets        # scan del bundle + gitleaks
npm run db:types             # envoltorio del gen types de abajo
npx supabase start           # stack local
npx supabase db reset        # recrea la DB local con migraciones + seed
npx supabase db diff -f <nombre>
npx supabase test db         # tests RLS (pgTAP)
npx supabase db push         # aplicar migraciones al remoto
npx supabase gen types typescript --local > src/types/database.ts
```

---

## 15. Qué NO hacer

1. Exponer `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` o `CRON_SECRET` al cliente.
2. Crear tablas sin RLS o sin `group_id` si son de dominio.
3. Otorgar XP, badges o skins desde el cliente.
4. Usar floats para dinero.
5. Crear API routes fuera de `lib/api/guard.ts`.
6. Editar migraciones ya aplicadas o cambiar el esquema desde Supabase Studio.
7. Usar Sonnet u Opus en runtime; Haiku alcanza y el costo importa.
8. Cambiar un prompt de runtime sin correr sus evals.
9. Introducir servicios de pago, upgrades o dependencias con costo sin aprobación.
10. Instalar librerías de UI cerradas (MUI, Ant, Chakra).
11. Seleccionar por clases de Tailwind o estilizar vía `data-*`.
12. Dejar `console.log` sueltos.
13. Usar nombres, personajes o assets de Nintendo/Animal Crossing.
14. Vender la app como "AI-powered" en copy o UI.
15. Romper el principio de velocidad.
16. Agregar features fuera del MVP sin actualizar este archivo primero.
17. Mergear a `main` sin OK explícito de Yerif. Hoy `develop` es la rama de integración; `main` espera a que el PoC esté listo.
18. Bajar un umbral de cobertura, saltarse o desactivar un test para pasar el CI.
19. Poner llaves reales en el scope Preview de Vercel.
20. Agregar features durante una ronda de UAT (solo bugs y feedback con ticket).

---

## 16. Alcance del MVP (cerrado)

1. Auth (magic link + Google) y perfil con personaje.
2. Grupos (tenants) con invite code y selector de grupo.
3. Gasto modo igual (sin IA) y modo itemizado; saldar deudas.
4. Pantalla Dividir con modo rápido ≤ 3 interacciones.
5. Smart Split: texto primero, foto de ticket después.
6. XP, niveles, 6 badges, 5 skins, 3 estados de avatar.
7. Home del grupo: personaje + estado de la banda + balances.
8. Resumen semanal cozy generado por IA, entregado in-app.
9. Categorización automática de gastos.
10. Dark/light mode (dark por default).

**Fuera del MVP:** pagos reales, modo familia, simplificación de deudas multi-persona, predicciones, email/push, monetización, app nativa.

---

## 17. Estado y camino a UAT

Auditoría completa en `docs/AUDITORIA.md`; guion, entornos y criterios en `docs/UAT.md`. **Esta tabla se actualiza al cerrar cada ticket.**

| # | Ítem del MVP (§16) | Hecho (prototipo, sin Supabase) | Falta |
|---|---|---|---|
| 1 | Auth y perfil | Perfil con personaje, skins y badges en el demo | Supabase Auth |
| 2 | Grupos | Home y detalle del grupo en el demo | Invite codes, selector, onboarding |
| 3 | Gasto igual, itemizado y saldar | `lib/splits` (igual, itemizado, deudas) con cobertura 100 %; Dividir y Confirmar en el demo | Persistencia. Saldar (total o por abonos) ya funciona en el demo, en memoria (`/dev/demo/g/oaxaca/detalle?u=beto`) |
| 4 | Dividir ≤ 3 interacciones | Modo rápido en el demo | Medirlo con personas (UAT-1) |
| 5 | Smart Split | Prompts B1–B3, validadores, flujo y pantalla de confirmación (con mensajes de ejemplo) | `client.ts`, rutas (A11), foto |
| 6 | XP, badges, skins, estados | `lib/game` completo y UI (Avatar, XPBar, SkinSelector) | Funciones `security definer`; D5 |
| 7 | Home del grupo | En el demo | Datos reales |
| 8 | Resumen semanal | Prompt B4 y evals | Cron y almacenamiento |
| 9 | Categorización | Catálogo y emojis en `lib/categorias`, prompt B5 y su dataset | Diccionario local y ruta `/api/categorizar` |
| 10 | Dark/light | Toggle persistente, dark por default | — |

**Dos rondas de UAT.** UAT-1 (prototipo con datos de ejemplo, en la preview estable de `develop`, decidido por Yerif el 2026-10-02) y UAT-2 (producción con Supabase y la banda real). Criterios de entrada y salida en `docs/UAT.md`. Durante una ronda no se agregan features: solo bugs y feedback con ticket, triados los viernes en `docs/FEEDBACK.md`.
