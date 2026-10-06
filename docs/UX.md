# Análisis UX/UI — "doy mil vueltas para pagar o ver a quién le debo"

> Fecha: 2026-10-06 · Medido sobre la preview de `develop` (demo de 7 grupos, 375×812 px, dark). Solo análisis: no cambia código.
> Las propuestas de §4 no son MVP nuevo, son la **forma** de las pantallas que ya existen; las que cambian una regla de producto (§5) esperan decisión de Yerif.

## 1. Veredicto

La app **calcula bien, pero la pantalla no está organizada alrededor de la pregunta de quien paga**: *"¿a quién le debo, cuánto, y cómo lo pago ya?"*. Hoy esa respuesta está enterrada: el inicio mide **3,828 px (4.7 pantallas)**, el primer renglón accionable empieza pasado el 80 % de la primera pantalla y hay **dos secciones que muestran la misma deuda con números distintos**. Para una app de pagos, ese es el problema de fondo, no un detalle de estilo.

Mediciones (Ana, inicio y detalle del demo):

| Tarea | Hoy | Meta |
|---|---|---|
| Ver cuánto debo en total | 1 vista, pero tras ~560 px de andamiaje de demo | Visible sin scroll, arriba de todo |
| Ver a quién le debo | Scroll de ~2,000 px entre 12 renglones mezclados (debo / me deben / 3 grupos) | ≤ 1 pantalla, ordenado por urgencia |
| Pagar a una persona | 1 toque en "Pagar" **si** encuentras el renglón (scroll de 2–4 pantallas); si entras al detalle, otros 3,238 px | ≤ 2 toques desde que abres la app |
| Dividir un gasto | 3 interacciones, pero el botón "Confirmar" queda en y≈1,370 (> 1.6 pantallas) | Botón siempre visible |
| Confirmar que me pagaron | Tarjeta arriba del resumen (bien), pero tras el andamiaje del demo | Lo primero que se ve |

## 2. Hallazgos (con evidencia)

Prioridad: **P0** bloquea la tarea principal o genera desconfianza con dinero · **P1** fricción fuerte · **P2** pulido.

### P0

**H1. Dos números distintos para pagarle a la misma persona.** En *Casa en la playa* (como Ana): "¿Quién le debe a quién?" dice *"Le debes $991.67 a Nico"* y "Cómo pagarse" dice *"Ana → Nico $2,083.35"*. Los dos son correctos (el segundo reencamina las deudas con Pau, Rafa y Sofi a través de Nico), pero la persona ve **dos cifras para el mismo pago**, una mayor a lo que le debe a Nico. En una app de dinero eso destruye la confianza. Además Nico recibe dinero "que no era suyo" y solo Nico confirma: Pau, Rafa y Sofi no participan.

**H2. El inicio no es una pantalla de pagos.** Orden actual: título demo → aviso → texto → chips de "probar como" → botón de reiniciar → saludo → totales → 12 renglones → lista de grupos → Dividir → Confirmar → Perfil → Sistema de diseño. Lo que importa (totales y qué hacer) arranca en y≈560 y el primer renglón se corta en el borde de la pantalla. El andamiaje de pruebas convive con el producto.

**H3. Los renglones están organizados por grupo, no por persona.** "Págale a Nico" aparece dos veces (playa y peda), Luis dos veces (Roomies y abuela), y Rafa y Dani también; "Dani te paga" y "Págale a Dani" conviven. La pregunta mental es *a quién*, y hoy hay que leer el nombre del grupo para saber cuál renglón es cuál.

**H4. "Pagar" no pide revisión ni se puede deshacer.** Un toque declara el pago completo y le manda una solicitud a otra persona. Un toque accidental (el botón mide 36 px de alto) genera una confirmación falsa para el receptor, y el único aviso es un banner arriba, fuera de la vista si estabas scrolleado.

### P1

**H5. El detalle del grupo mezcla lo mío con lo de todos.** "¿Quién le debe a quién?" lista 7 relaciones de las cuales 3 son mías; "Pau le debe a Nico" no es accionable para Ana. Mis cuentas deberían ir primero y lo demás, plegado.

**H6. Falta navegación persistente.** No hay barra inferior ni acceso fijo a Inicio / Dividir / Grupos / Yo: Dividir está a ~3,500 px del inicio y para llegar a "Yo" o a un grupo hay que volver al índice del demo. En móvil, las acciones más frecuentes (pagar y dividir) deben estar al alcance del pulgar.

**H7. El inicio ignora lo que hace distinta a la app.** El personaje y el XP no aparecen donde se decide pagar, así que el juego no empuja a pagar ("si pagas hoy recuperas a tu personaje / +50 XP"). Las filas tampoco muestran la **antigüedad**, que es lo que define el estado (`rekt` pasadas 72 h) y el XP.

**H8. Dividir tiene el botón lejos y demasiadas decisiones a la vista.** Con 7 grupos los chips ocupan 7 renglones, "¿Cómo lo dividimos?" otros 3, y "Confirmar gasto" queda bajo el pliegue (con el teclado abierto, más). El caso común (monto → confirmar) paga el costo de los casos raros.

**H9. Tarjetas de grupo apretadas.** Con la píldora de saldo ("Debes $2,083.35") el nombre del grupo se parte en 3 líneas ("Casa / en la / playa") y la meta ("6 personas · 6 gastos") en 2.

**H10. El feedback de "pendiente" y de confirmaciones está lejos del dedo.** El aviso "Avisamos a Luis…" aparece arriba de la lista; si pagaste desde el renglón 9, no lo ves. La confirmación a quien paga ("¡Luis confirmó tu pago!") es solo una tarjeta; no hay badge ni indicador cuando estás en otra pantalla.

### P2

- **H11. Objetivos táctiles < 44 px:** `Button size="sm"` mide 36 px (Pagar, Entendido, Reiniciar, Abonar). CLAUDE.md §11 pide ≥ 44 px. Los enlaces de grupo dentro de la tarjeta de deuda también son pequeños.
- **H12. Íconos de grupo en lugar de la persona.** El renglón empieza con el emoji del grupo; a quien se le paga es una persona (el Avatar compacto ya existe).
- **H13. Color y jerarquía:** el verde es a la vez "dinero que me deben" y botón primario "Pagar", y el rojo es "debo" pero también estados negativos; los totales "Debes" y "Te deben" pesan igual. Pagar debería ser la acción más prominente de la pantalla cuando hay deuda.
- **H14. Textos largos del demo** ("Los pagos se guardan solo en este navegador…") empujan el contenido; deberían vivir en un panel de herramientas de prueba.
- **H15. Sin acciones del lado de quien cobra:** "Dani te paga $960" no ofrece nada (recordar con un toque, ver desde cuándo).

## 3. Principios que propongo

1. **Una pregunta por pantalla.** Inicio responde *¿qué hago con mi dinero hoy?*; Grupo, *¿cómo va la banda?*; Dividir, *¿cuánto le toca a cada quien?*
2. **Una sola cifra por pago.** Lo que ves en el renglón es lo que pagas y lo que le llega a esa persona.
3. **Persona primero, grupo después.** Se agrupa por persona; el grupo es el detalle del desglose.
4. **Lo urgente arriba:** orden por antigüedad (lo que está por volverse `rekt` primero), luego por monto.
5. **Pagar = revisar → confirmar → poder deshacer.** Nunca un toque directo con consecuencias para otra persona.
6. **Lo que hace distinta a la app va donde se decide pagar:** personaje, XP en juego y antigüedad.
7. **El andamiaje de pruebas no es producto:** las herramientas de demo van en un panel aparte.

## 4. Propuesta de pantallas

### 4.1 Navegación: barra inferior (4 destinos)

```
┌────────────────────────────────┐
│                                │
│        (contenido)             │
│                                │
├────────────────────────────────┤
│ 🏠 Inicio  ➕ Dividir  👥 Grupos  🐻 Yo │   ← badge rojo en Inicio si hay pagos por confirmar
└────────────────────────────────┘
```

"Dividir" va al centro y destacado (la acción más frecuente). El badge de Inicio cuenta pagos por confirmar + resultados sin ver.

### 4.2 Inicio ("¿qué hago con mi dinero?")

```
┌────────────────────────────────┐
│ Hola, Ana          🐻 (Deteriorado)   ← el personaje reacciona a tu deuda
│ ┌────────────────────────────┐ │
│ │ Debes     $4,821.39        │ │   ← una cifra grande
│ │ a 8 personas · la más vieja hace 4 días │
│ │ ⚡ Pagar hoy: hasta +110 XP │ │   ← gancho del juego
│ └────────────────────────────┘ │
│ ⏳ Por confirmar (1)           │   ← SOLO si existe; siempre arriba
│ ┌ Luis dice que ya te pagó $218.04 ┐
│ │ [Sí, me llegó]  [No me llegó]    │
│ └──────────────────────────────┘ │
│ Te toca pagar                  │
│ ┌ 🐱 Nico        $2,283.35  [Pagar] ┐  ← una fila por PERSONA
│ │   Playa $991.67 · Peda $300 · hace 4 d │   (el desglose se abre al tocar)
│ ├ 🦉 Rafa …                          │
│ └─ ver las 9 personas ▾          │
│ Te van a pagar   $2,240.00     │
│ ┌ 🐱 Dani  $960 · hace 5 d  [Recordar] ┐
│ └──────────────────────────────┘ │
└────────────────────────────────┘
```

- Una fila por persona, con el desglose por grupo plegado; orden por antigüedad y luego por monto.
- Máximo 3–4 filas a la vista y "Ver todas". Los grupos pasan a la pestaña **Grupos**.
- "Te van a pagar" va abajo y colapsado; "Recordar" (post-MVP) es la acción de quien cobra.
- Las cifras por persona **suman renglones, no netean entre grupos** (CLAUDE.md §7: lo que te deben en un grupo no compensa lo que debes en otro).

### 4.3 Pagar: hoja inferior (bottom sheet)

```
┌────────────────────────────────┐
│ Pagarle a Nico                 │
│ $2,283.35                      │   ← editable (otro monto = abono)
│ Playa $991.67 · Peda $300 …    │
│ ¿Cómo le pagaste?              │   ← efectivo / transferencia (informativo, sin dinero real)
│ [ Ya le pagué ]                │   ← botón grande, 56 px
└────────────────────────────────┘
→ el renglón cambia a "⏳ Esperando a Nico" y aparece "Deshacer" 8 s
```

- Dos toques: **Pagar** → **Ya le pagué**. El deshacer cubre el toque accidental (H4); la confirmación del receptor sigue siendo la barrera real.
- Al confirmarse: toast/badge y festejo del personaje (hoy solo si entras al detalle).

### 4.4 Detalle del grupo

Orden propuesto: ① **Mis cuentas** (lo mío, mismas filas que el inicio, filtradas al grupo) → ② Cómo va la banda (balances con personajes) → ③ Gastos → ④ "Todas las deudas del grupo" plegado. Se elimina la sección duplicada (H1, H5).

### 4.5 Dividir

- Monto en grande y **botón "Confirmar" fijo abajo** (pegado sobre el teclado).
- Grupo: selector compacto (un chip con el último grupo + "cambiar"), no 7 chips.
- "¿Entre quiénes?" y "Pagó" ya resueltos por defecto (todos / yo).
- "¿Cómo lo dividimos?": un solo botón "Otras formas de dividir ▾" que abre los 6 modos; "Igual" sigue siendo el predeterminado y no cuenta como interacción.

### 4.6 Grupos

Tarjetas con ícono + nombre completo en una línea y el estado en una píldora *debajo* del nombre cuando falta espacio (H9); orden por lo que requiere acción.

## 5. Decisiones que necesito de Yerif

1. **¿El plan "más sencillo" (pagos reencaminados) es el predeterminado o es opcional?** Mi recomendación: **predeterminado = deudas directas** (lo que debo a cada persona, sin sorpresas) y el plan reencaminado como botón *"Pagar menos veces"*, con explicación ("Nico se lo pasará a Pau, Rafa y Sofi") y confirmación de los intermediarios. Toca CLAUDE.md §7 ("Cómo pagarse") y resuelve H1.
2. **Agrupar por persona en el inicio** (sin netear entre grupos; solo se juntan los renglones para mostrarlos, con desglose).
3. **Barra de navegación inferior** con 4 destinos y Dividir al centro.
4. **Hoja de pago con "Deshacer"** (y, más adelante, cancelar pendiente): agrega una interacción a pagar (de 1 a 2 toques) a cambio de eliminar pagos accidentales.

## 6. Plan de tickets (en este orden)

| ID | Qué | Prio |
|---|---|---|
| UX-01 | Una sola cifra por pago: unificar "¿Quién le debe a quién?" y "Cómo pagarse" (según decisión 1) | **P0** |
| UX-02 | Inicio de pagos: totales + por confirmar + filas por persona con desglose y antigüedad; herramientas de demo a un panel aparte | **P0** |
| UX-03 | Hoja de pago con revisión y "Deshacer" | **P0** |
| UX-04 | Barra de navegación inferior con badge de pendientes | P1 |
| UX-05 | Dividir: botón fijo, selector de grupo compacto y "Otras formas de dividir" plegado | P1 |
| UX-06 | Detalle: "Mis cuentas" primero y el resto plegado | P1 |
| UX-07 | Personaje y XP en juego en el inicio; festejo al confirmarse (toast global) | P1 |
| UX-08 | Objetivos táctiles ≥ 44 px (`Button sm`, enlaces de tarjeta) y tarjetas de grupo sin cortes | P2 |
| UX-09 | Avatar de la persona en cada fila; jerarquía de color (primario de pagar vs. verde de "me deben") | P2 |
| UX-10 | "Recordar" para quien cobra (post-MVP, necesita notificaciones) | P2 |

## 7. Cómo validar (UAT-1)

Tareas T9 (ver qué debo y pagar) y T10 (confirmar un pago) de `docs/UAT.md`, cronometradas: *"Abre la app. ¿A quién le debes más y cuánto? Págale."* Meta: **< 10 s y ≤ 2 toques**. Pregunta de cierre nueva: *"¿Alguna vez dudaste de la cantidad que ibas a pagar?"* (debe ser "no" para todos).
