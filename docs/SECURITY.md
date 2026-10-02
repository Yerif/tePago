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
| 2026-09-29 | Info | `lib/api/guard.ts` (política de toda API route, con dependencias inyectadas): sesión → Zod → pertenencia → rate limit → handler. Threat model en la sección siguiente. Falta conectar las dependencias reales (Supabase y tabla `rate_limits`). | Lógica hecha; conexión pendiente |
| 2026-10-02 | Alta/Moderada (solo build) | `npm audit`: 1 alta + 1 moderada, 4 avisos de `postcss` anidado en `next@15` (XSS por `</style>` al serializar y lectura de `.map` por `sourceMappingURL`). Solo procesa CSS propio en build, sin input de usuarios. El fix fuerza Next 16 (`middleware.ts` pasa a `proxy.ts`). | Aceptado hasta después de UAT; ticket P2 |
| 2026-10-02 | Moderada | SEC-02: las previews de Vercel muestran `/dev/*` y el DebugPanel (incluye la última respuesta cruda de la IA). Si una preview recibe llaves reales, cualquiera con la URL las usa. Regla nueva: llaves reales solo en el scope Production (CLAUDE.md §9.7). | Regla documentada; Yerif verifica en Vercel antes de cada ronda (A18) |
| 2026-10-02 | Moderada | SEC-01: la CSP permite `'unsafe-inline'` en scripts (Next sin nonce). | Aceptado para UAT-1 (sin datos reales); revisar en L8 |
| 2026-10-02 | Moderada | SEC-03: UAT-2 maneja datos reales (nombre, email, avatar) sin aviso de privacidad. | Ticket; antes de invitar a la banda |
| 2026-10-02 | Moderada (diseño) | D7: `on delete cascade` al borrar una cuenta borraría gastos y deudas de otras personas. | Decisión pendiente antes de A5 (propuesta: anonimizar) |
| 2026-10-02 | Baja | CI-01: el CI no exige la cobertura 100 % de `lib/api`, `lib/game`, `lib/splits` y `lib/ai`; una regresión en dinero o en el guard podría pasar en verde. | Ticket P0 (S) |

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

### Guard de API (`lib/api/guard.ts`) — 2026-09-29
- **Activos:** los datos de cada grupo (tenant), el costo variable de la IA, la disponibilidad del servicio y los secretos (`CRON_SECRET`).
- **Actores:** anónimo; usuario autenticado de OTRO grupo; miembro que abusa de su cuota; tercero que llama a `/api/cron/*`; contenido malicioso en el body.
- **Superficies:** toda ruta de `src/app/api/**` (todas obligadas a pasar por `withGuard` o `withCronGuard`).
- **Amenazas → control → test de abuso** (`src/lib/api/guard.test.ts`):
  - Leer o escribir datos de otro grupo cambiando ids (IDOR) → pertenencia verificada en cada request, antes del handler → "no miembro: 404 … sin llegar al handler".
  - Enumerar qué grupos existen (403 vs 404) → mismo 404 y mismo cuerpo para "ajeno" e "inexistente" → mismo test, compara los dos cuerpos.
  - Gastar cuota o costo de IA sin ser miembro o sin sesión → el rate limit va DESPUÉS de sesión, validación y pertenencia → tests de orden ("sin sesión…", "no miembro…").
  - Abuso de costo por spam → límites por usuario, por grupo (compartido entre sus miembros) y por IP, con `Retry-After` → tests de "rate limit".
  - Body gigante → tope de 100 KB por defecto, por `content-length` y por bytes reales (incluye multibyte) → test "413".
  - Filtrar detalles o valores en errores → los errores solo llevan `code`, mensaje genérico y `requestId`; lo inesperado es 500 genérico; el detalle queda en el log del servidor → tests "no filtran el detalle" y "500 genérico".
  - Llamar a un cron sin ser Vercel → `Authorization: Bearer ${CRON_SECRET}` en tiempo constante; sin secreto configurado, nadie entra → tests de `withCronGuard`.
  - Datos de usuarios en logs → se registra método, ruta, status y ms; nunca el body → test "registra cada request sin body".
  - Un id de grupo absurdo llegando a la base de datos → 400 si pasa de 128 caracteres → test "grupo".
- **Riesgos aceptados / pendientes:**
  1. **IP del cliente:** se confía en `x-real-ip`/`x-forwarded-for`, que en Vercel fija la plataforma. Detrás de otro proxy sin sanear, el límite por IP se puede evadir. Revisar si se cambia de hosting.
  2. **Rate limit no atómico:** el limitador en memoria es solo para pruebas y desarrollo. El real (tabla `rate_limits`) debe consumir la cuota con una sola operación atómica en Postgres; queda como requisito del ticket de esa tabla.
  3. **Body leído completo antes de medir** si `content-length` miente: acotado por el límite de la plataforma (~4.5 MB en Vercel).
  4. **Sin probar contra Supabase real:** las dependencias (`obtenerSesion`, `esMiembro`, `consumirLimite`) son las de las pruebas; los tests A/B de RLS (Épica 1) siguen siendo la frontera real de datos.

### Entornos y previews (UAT) — 2026-10-02
- **Activos:** llaves de producción (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`), datos de la banda y el costo de la IA.
- **Actores:** cualquiera con la URL de una preview; persona probando en UAT-1; miembro curioso en UAT-2.
- **Superficies:** `/dev/*`, DebugPanel, variables de entorno por scope de Vercel, Deployment Protection.
- **Amenazas → control → test:**
  - Preview con llaves reales usada por un desconocido → llaves reales solo en Production → revisión manual del scope en Vercel (A18, punto 3).
  - `/dev/*` accesible en producción → `esEntornoDev()` + `notFound()` en el layout → `src/lib/entorno.test.ts` y `curl` a producción esperando 404 (A18).
  - DebugPanel filtra datos → solo fuera de producción, y en preview no hay datos reales → mismo chequeo.
  - Gasto de IA desde una preview → la preview no tiene `ANTHROPIC_API_KEY` → A18.
- **Riesgos aceptados:** en UAT-1 la preview puede ser pública (sin login de Vercel) porque solo contiene datos de ejemplo. En cuanto una preview reciba cualquier llave, se vuelve a activar la protección.

## Auditorías (L8)

| Fecha | Alcance | Hallazgos (C/A/M/B) | Resultado |
|---|---|---|---|
| 2026-10-02 | Auditoría de proyecto y preparación de UAT (`docs/AUDITORIA.md`); **no** es la L8 completa: sin base de datos, sin RLS ni IDOR reales | 0 / 0 / 4 / 1 (SEC-01, SEC-02, SEC-03, D7 · CI-01) | Registrada; nada bloquea UAT-1 |
| — | Primera auditoría completa (L8), antes de invitar a la banda a UAT-2 | — | Pendiente |

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
