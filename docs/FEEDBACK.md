# FEEDBACK — La banda y pruebas manuales

> Lo que dicen los usuarios y lo que encontramos probando a mano. Se llena desde el primer release (L6 en `docs/LOOPS.md`).
> Regla: el feedback se registra tal cual; la interpretación y los tickets van aparte.

## Cómo recogerlo

- Canal: el chat de la banda. Yerif pasa aquí cada comentario relevante.
- Una fila por comentario; sin nombres completos ni datos sensibles (iniciales bastan).
- Cada viernes se hace el triage: cada fila termina en ticket, en "no por ahora" o en "duplicado".

## Mensaje para invitar a la banda

> ¡Hola! Estoy probando **Cuentas Conmigo**, una app para dividir gastos donde tu personaje brilla si pagas rápido 🌻
> Úsala en su próximo plan (tacos, viaje, lo que sea) y cuéntame:
> 1. ¿Qué fue lo más fácil?
> 2. ¿En qué momento te atoraste o te dio flojera?
> 3. ¿Te dio risa o gusto algo del personaje o los badges?
> 4. Si mañana desapareciera, ¿la extrañarías?
> Todo sirve, hasta lo que parezca menor. ¡Gracias! 🙌

## Preguntas que queremos responder en el MVP

| Pregunta | Señal que buscamos |
|---|---|
| ¿Es más rápido que la calculadora? | Split simple en ≤ 3 interacciones, sin dudas |
| ¿El juego motiva a pagar? | Menciones espontáneas del personaje, badges o XP; tiempo a saldar |
| ¿La reputación social es divertida, no incómoda? | Nadie reporta sentirse exhibido por el Fantasma 👻 |
| ¿El smart split se siente confiable? | Pocas correcciones en la pantalla de confirmación |
| ¿Vuelven cada semana? | Uso semanal sostenido tras el primer plan |

## Registro

| Fecha | Quién (iniciales) | Pantalla / flujo | Comentario (literal) | Tipo | Triage |
|---|---|---|---|---|---|
| — | — | — | — | bug / fricción / idea / elogio | ticket / no por ahora / duplicado |

## Pruebas manuales

Checklist antes de cada release (dark y light, móvil 375 px y desktop):

- [ ] Registrar gasto modo igual en ≤ 3 interacciones.
- [ ] Smart split por texto con un nombre fuera del grupo.
- [ ] Smart split por foto con propina sugerida impresa.
- [ ] Saldar una deuda y ver XP y estado del personaje.
- [ ] Unirse a un grupo con código; código revocado rechazado.
- [ ] Toggle de tema persiste al recargar.

| Fecha | Versión / commit | Resultado | Notas |
|---|---|---|---|
| — | — | — | — |
