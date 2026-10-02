# UAT — Pruebas de aceptación con la banda

> Cómo y cuándo probamos Cuentas Conmigo con personas reales. Contexto de por qué existe: [`docs/AUDITORIA.md`](./AUDITORIA.md).
> El feedback que salga se registra en [`docs/FEEDBACK.md`](./FEEDBACK.md); los bugs y mejoras se convierten en tickets el viernes.

## 1. Dos rondas

| | **UAT-1 · Prototipo** | **UAT-2 · Con datos reales** |
|---|---|---|
| Qué se prueba | Sensaciones: velocidad, claridad, tono, personaje, reputación | Todo el MVP de punta a punta |
| Entorno | Preview estable de `develop`, datos de ejemplo, sin Supabase | Producción (`main`) con Supabase y Anthropic reales |
| Gente | 3–5 personas de confianza, en su celular | La banda (≤ 15) en un plan real (tacos, viaje) |
| Se guarda algo | No: al recargar vuelve todo a como estaba | Sí |
| Cuándo | En cuanto estén UAT-01 y UAT-02 del backlog | Tras la auditoría L8 y los tickets de Supabase |
| Duración | 1 semana | 2 semanas (el juego necesita días: pagar, deber, que pase el tiempo) |

UAT-1 **no** valida: login, grupos reales, invitaciones, persistencia, IA real, resumen semanal ni que el XP se otorgue en el servidor. Eso es UAT-2. Decirlo a las personas probando evita falsas alarmas ("¿por qué no se guardó?").

## 2. Entorno de UAT-1

1. Vercel → proyecto → **Settings → Deployment Protection**: si "Vercel Authentication" aplica a previews, la banda tendría que iniciar sesión con Vercel. Como el demo no tiene datos sensibles, se puede desactivar **solo para previews**. Si no se quiere, UAT-1 se hace con cuentas de Vercel invitadas (peor).
2. **Ninguna llave real en el scope Preview** (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`). Las llaves reales viven solo en Production (CLAUDE.md §9).
3. La URL estable es la de la rama: Vercel → Deployments → rama `develop` → "Domains". Mandar esa, no la de un commit.
4. Entrar por `/dev/demo` (la raíz `/` en preview muestra el botón "Ver demo con datos de ejemplo").
5. Pedir que la abran en el celular y la agreguen a la pantalla de inicio (cuando UAT-05 esté listo).

## 3. Criterios de entrada

**UAT-1** (todo en `develop`):

- [ ] UAT-02 hecho: se puede saldar (total o con abonos) en el demo y ver XP, nivel y estado del personaje.
- [ ] UAT-01 resuelto: URL estable y probada desde un celular que no es el tuyo.
- [ ] UAT-06 hecho: objetivos táctiles ≥ 44 px (se prueba con el dedo).
- [ ] CI-01 hecho: el CI exige la cobertura 100 % (el código de UAT-02 toca `lib/game`).
- [ ] D1–D5 de `docs/AUDITORIA.md` decididas (o aceptadas por defecto) y reflejadas en CLAUDE.md.
- [ ] `lint`, `typecheck`, `test`, `build` en verde en `develop`; PRs de dependencias resueltos.
- Deseable: UAT-04 (Error Boundary con "copiar reporte") y UAT-05 (agregar a la pantalla de inicio).

**UAT-2** (además):

- [ ] UAT-03, UAT-04 y UAT-05 hechos (onboarding y selector de grupo, Error Boundary, metadatos móviles).
- [ ] Proyecto de Supabase con RLS y tests A/B en verde; auth (magic link) y grupos con invite code.
- [ ] Auditoría L8 sin hallazgos altos abiertos (`docs/SECURITY.md`).
- [ ] Anthropic con límite de gasto mensual y llaves solo en Production.
- [ ] Evals de B1, B3 y B5 sobre el dataset con casos reales; golden revisados por Yerif.
- [ ] Existe un smoke E2E de los 3 flujos críticos (CI-03).
- [ ] Aviso de privacidad mínimo (SEC-03).

## 4. Guion de tareas (UAT-1)

Se le da a cada persona **solo la tarea**, sin explicar la pantalla. Se cronometra y se anota dónde duda. Todo desde el celular, primero en dark y luego en light.

| # | Tarea (lo que se le dice) | Qué observamos | Éxito |
|---|---|---|---|
| T1 | "Estás en un viaje a Oaxaca. Pagaste $850 de tacos entre los 4. Regístralo." | Interacciones y segundos desde abrir | ≤ 3 interacciones y < 15 s |
| T2 | "Ahora, un gasto donde Ferni no participó." | ¿Encuentra cómo quitar a alguien? | Sin ayuda |
| T3 | "Imagina que escribiste *cena 1,240 + 10% de propina, pagué yo*; elige ese mensaje en la pantalla Confirmar y revisa lo que entendió la app. Corrígelo si algo no cuadra." (en UAT-1 se eligen mensajes de ejemplo; en UAT-2 se escribe libre) | ¿Entiende lo que se "entendió"? ¿Corrige sin miedo? | Corrige monto o persona sin ayuda |
| T4 | "Ferni te debe dinero. ¿Cuánto? Y tú, ¿le debes a alguien?" | ¿Lee el detalle del grupo? | Responde bien sin tocar la calculadora |
| T5 | "Paga lo que debes: primero un abono y luego el resto." (requiere UAT-02; el saldado parcial está aprobado) | ¿Entiende qué cambió en su personaje? | Dice con sus palabras qué ganó o recuperó |
| T6 | "Mira tu perfil. ¿Qué te falta para la siguiente skin?" | Claridad de nivel, badges y skins | Responde bien |
| T7 | "Cambia a modo claro." | Toggle | Sin ayuda |

## 5. Preguntas al final (5 minutos)

Mismas que `docs/FEEDBACK.md`, más:

1. ¿Más rápido o más lento que la calculadora? ¿Por qué?
2. ¿Te dio gusto o risa algo del personaje o los badges? ¿Algo te incomodó (por ejemplo, que otros vieran tu badge)?
3. ¿Qué esperabas ver y no estaba?
4. Del 0 al 10, ¿la usarías en tu próximo plan?

## 6. Métricas y criterios de salida

| Métrica | Cómo se mide | UAT-1 se aprueba si |
|---|---|---|
| Velocidad (T1) | Interacciones y segundos | Mediana ≤ 3 interacciones y < 15 s |
| Tareas sin ayuda | T1–T7 | ≥ 80 % sin ayuda; ninguna tarea en la que fallen todos |
| Comprensión del juego | T5 y T6 | ≥ 4 de 5 explican qué cambió en su personaje |
| Reputación | Pregunta 2 | **Nadie** reporta sentirse exhibido |
| Voluntad de uso | Pregunta 4 | Mediana ≥ 7 |
| Errores | Reportes de "copiar reporte" y observación | 0 pantallas rotas; 0 textos cortados en 375 px |

UAT-2 añade: semana 2 con ≥ 60 % de la banda activa (≥ 1 gasto o pago por semana), tiempo mediano a saldar y 0 incidentes de datos entre grupos.

**Regla:** durante UAT no se agregan features. Solo bugs y feedback con ticket (triage del viernes). Todo lo demás espera al cierre.

## 7. Registro de rondas

| Ronda | Fechas | Gente | Resultado | Decisión |
|---|---|---|---|---|
| UAT-1 | — | — | — | — |
| UAT-2 | — | — | — | — |

## 8. Mensaje para invitar a UAT-1

> ¡Hola! Estoy armando **Cuentas Conmigo**, una app para dividir gastos donde tu personaje brilla si pagas rápido 🌻
> Todavía es un prototipo con datos de ejemplo (no se guarda nada), y quiero ver qué tan natural se siente. ¿Me das 10 minutos desde tu celular?
> Abre este enlace: {{URL}} y toca "Ver demo con datos de ejemplo". Te voy a pedir hacer unas 6 cosas chiquitas; no hay respuestas malas. 🙌
