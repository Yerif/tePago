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
4. Entrar por `/dev/demo`: abre directo en el inicio de pagos de Ana. Pedir que lo abran en **Chrome o Safari**, no en el visor integrado de WhatsApp o Instagram (puede cambiar WebGL y `localStorage`, donde el demo guarda los pagos).
5. Pedir que la abran en el celular y la agreguen a la pantalla de inicio (cuando UAT-05 esté listo).

## 3. Criterios de entrada

**UAT-1** (todo en `develop`):

- [ ] UAT-02 hecho: se puede saldar (total o con abonos) en el demo y ver XP, nivel y estado del personaje.
- [ ] UAT-01 resuelto: URL estable y probada desde un celular que no es el tuyo.
- [ ] UAT-06 hecho: objetivos táctiles ≥ 44 px (se prueba con el dedo).
- [ ] Personaje 3D (PJ-01) en Home del grupo, Yo y detalle, con sus 3 estados, fluido en un celular de gama media (decisión de Yerif del 2026-10-06: UAT-1 sale con todo).
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
| T5 | "Eres Beto y le debes a tres amigos. Paga lo que debes: primero un abono y luego el resto." (en el detalle del grupo Oaxaca, `?u=beto` o la pill de Beto) | ¿Entiende qué cambió en su personaje? | Dice con sus palabras qué ganó o recuperó |
| T6 | "Mira tu perfil. ¿Qué te falta para la siguiente skin?" | Claridad de nivel, badges y skins | Responde bien |
| T8 | "Fueron 4 y uno pidió un postre de $200 que nadie más comió. Divide los $1,000 para que se lo cobren solo a él." Luego: "¿Cuál es la forma más sencilla de que se paguen todos en el grupo de Oaxaca?" | ¿Encuentra "Por producto" y "Cómo pagarse"? | Sin ayuda |
| T9 | "Abre la app como Ana. ¿Cuánto debes y a quién le tienes que pagar? Págalo." (inicio del demo, `?u=ana`) | ¿Encuentra qué pagar sin navegar? | Sin ayuda y en ≤ 3 toques |
| T11 | "Abre la app como Ana. ¿A quién le debes más y cuánto? Págale." (cronometrar: meta < 10 s y ≤ 2 toques) · Después: "Nico dice que no le llegó: ¿qué haces?" | ¿Encuentra la fila, la hoja y el Deshacer? ¿Entiende "en disputa"? | Sin ayuda; 0 dudas sobre la cantidad a pagar |
| T10 | En dos celulares (o cambiando de persona con `?u=`): "Ana le paga a Luis y avisa en la app. Luis: confirma el pago." Después: "Ana, ¿qué pasó con tu deuda y tus puntos?" | ¿Entiende que el pago queda pendiente hasta que se confirma? ¿Encuentra la confirmación en el inicio? | Sin ayuda; Ana explica que los puntos llegaron al confirmarse |
| T7 | "Cambia a modo claro." | Toggle | Sin ayuda |

### Datos del demo para probar a fondo

7 grupos y 11 personas de ejemplo (`lib/mock/datos.ts`). Entra a `/dev/demo?u=<persona>` para ver el inicio como esa persona. Los pagos del demo se guardan en el navegador (para probar los dos lados); «Reiniciar pagos del demo» en el inicio los borra. Como **Ana** (`?u=ana`): el inicio suma sus deudas directas por persona: debe $5,631.68 a 7 personas y le deben $3,050.29 (4 personas).

| Grupo | Para probar |
|---|---|
| Viaje a Oaxaca | Beto debe a 3 personas (flujo T5: abonos y pagar todo); Ana es acreedora |
| Roomies | Cadena de deudas (Mari → Luis, Ana → Luis) y reparto con residuo de centavos |
| Casa en la playa | 6 personas con deudas cruzadas, repartos desiguales, deudas de hasta 100 h; Ana debe a Nico, Pau, Rafa y Sofi |
| Peda del viernes | Deudas recientes (< 24 h) y pares que se compensan (Ana ↔ Dani) |
| Oficina | Ana es acreedora de 3 personas; Sofi y Nico en `mild` |
| Clases de cocina | Todo saldado: "Todo en orden" |
| Cumple de la abuela | Ana le debe a 3 personas distintas a la vez (Caro, Ferni, Luis) |

Estados del personaje: Ana, Beto, Mari, Pau, Rafa y Dani `rekt`; Nico y Sofi `mild`; Ferni, Caro y Luis `clean`.

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
> Abre este enlace en Chrome o Safari: {{URL}}/dev/demo. Te voy a pedir hacer unas 6 cosas chiquitas; no hay respuestas malas. 🙌
