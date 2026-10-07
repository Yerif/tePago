# Auditoría UX/UI 2 — prototipo en `develop` antes de UAT-1

> Fecha: 2026-10-07 · Build `develop` @ `b1e0a68` en modo preview. Solo análisis: no cambia código.
> Continúa a `docs/UX.md` (pagos, UX-01…UX-10) y `docs/UX-PERSONAJE.md` (personaje, PX-01…PX-17). Lo que esos documentos ya señalaron solo se repite aquí si **sigue roto o regresó** (se marca "sigue").
> Lo que cambia una regla de producto lo dice explícitamente: requiere actualizar CLAUDE.md primero y aprobación de Yerif.

## 1. Resumen ejecutivo

- **Lo esencial funciona y es rápido en el caso base.** Pagar a la persona que más urge son **2 toques sin scroll** (primer "Pagar" en y = 582 a 375×800 y a 375×667), confirmar un pago recibido es **1 toque** y está arriba, y un gasto parejo son **3 interacciones**. Todo el texto pasa AA (mínimo 4.99:1), hay **0 objetivos táctiles < 44 px en 30 estados** (incluye hoja, toast, plegables abiertos y bandeja), CLS = 0 y el movimiento reducido se respeta.
- **Registrar un gasto (T1, la métrica principal de UAT-1) se siente roto aunque cuente 3 toques:** el reparto por persona queda **tapado** por el botón fijo y la barra inferior (resultado en y = 684, botón en 656–712, barra desde 736), y al confirmar el formulario se vacía, el aviso "¡Listo!" queda fuera de la pantalla (y = 872), el gasto **no aparece en el grupo** y la XP no se mueve aunque el aviso promete "+10 XP".
- **Cuando hay novedades, "Pagar" se va de la pantalla.** Con la revelación de XP, el aviso de "X confirmó tu pago" (dos tarjetas para el mismo evento, ambas "+80 XP") y un pago por confirmar, el primer "Pagar" baja a **y = 1,166 (1.6 pantallas)**. A 320×568 ya está fuera aun sin avisos (y = 642).
- **"Pagar menos veces" daña la confianza con el dinero:** de 18 ofertas en 6 grupos, **2 fallan** al tocarlas ("Este pago todavía no se puede hacer así") y en varias el plan **no reduce** los pagos de esa persona (Ana en *Peda*: 3 pagos del plan contra 2 directos) o cambia la cifra sin razón visible (Sofi en *Oficina*: $75 contra $375). Revive el H1 de `docs/UX.md` ("dos números para el mismo pago") detrás de un plegable.
- **Varias tareas del guion fallan por diseño:** la skin elegida en Yo **no se guarda** (T13), cambiar a tema claro (T7) no está en Inicio, Dividir, Grupos, Yo ni Detalle (sigue, PJ-H14), y "Cuéntalo con tus palabras" devuelve **otro gasto** con otros nombres y otras cifras.
- **El criterio de salida "0 textos cortados en 375 px" (UAT §6) hoy no se cumple:** 6 títulos de gasto truncados en Home y Detalle; además, a zoom 200 % hay scroll horizontal en 5 de 6 pantallas.
- **Onboarding y lenguaje:** la bienvenida explica el personaje pero **no qué hace la app** (dividir, pagar, confirmar); no existe una persona nueva sin deudas ni grupos para probar estados vacíos; y la portada dice "nada se guarda" cuando los pagos, el perfil y la bienvenida sí persisten en el navegador. Quedan "sin Supabase", "sin llamadas a la API", `evals/` y "(demo)" en el camino del producto.
- **Veredicto: listo para UAT-1 con condiciones.** No hay pantallas rotas ni problemas de seguridad, pero T1, T11 (con avisos), T13 y el criterio de textos cortados fallarían por causas de la UI y no de las personas. Recomiendo cerrar los **7 P0 del backlog (≈ 4–5 días, la mayoría S)** y ajustar el guion de `docs/UAT.md` antes de invitar.

## 2. Metodología

- **Build y servidor:** `VERCEL_ENV=preview npm run build` y `next start -p 3531`. Chromium preinstalado con Playwright (`--use-gl=swiftshader`, WebGL por software), táctil, DPR 2.
- **Viewports:** 375×800 (base), 375×667, 320×568, 320×640, 768×1024, 375×460 (teclado abierto simulado) y 188×400 (equivale a zoom 200 % en 375 px).
- **Temas:** dark (default) y light (`localStorage["cc-theme"]`); `reducedMotion: "reduce"`; CPU ×4 + 1.6 Mbps para tiempos.
- **Pantallas y estados:** portada `/`, Inicio (Ana, Beto, Ferni, Luis, Nico, Dani), Dividir (vacío, con monto, Montos, Por producto, guardado), Grupos, Home y Detalle de Oaxaca y Playa (con plegables abiertos y "Pagar menos veces"), Yo, Confirmar gasto (`/dev/demo/ia`, con y sin frase), bienvenida forzada y de primera vez, hoja de pago, toast, por confirmar, rechazo, aviso al pagador y revelación.
- **Mediciones:** toques reales con Playwright y posición (y) de cada objetivo; contraste WCAG calculado con colores computados y fondo efectivo (mezclando capas y opacidades) sobre **1,160 nodos de texto por tema**; contraste no-texto con los tokens de `globals.css`; tamaños de fuente computados; objetivos táctiles en 30 estados; orden de foco con Tab; landmarks y encabezados; truncados (`text-overflow: ellipsis` con desborde real); CLS, FCP y LCP con `PerformanceObserver`.
- **Capturas:** revisadas una por una; viven en el scratchpad de la sesión, no en el repo.
- **No medido:** celulares reales, Safari/iOS, lectores de pantalla reales, teclado virtual real y la reacción de personas (eso lo mide UAT-1).

## 3. Objetivo vs. toques

Ana salvo que se diga otra cosa; 375×800, dark. "Toques" = interacciones desde abrir la app en Inicio (escribir en un campo cuenta como 1). La barra inferior tapa los últimos 64 px.

| Trabajo | Ruta | Toques medidos | Scroll | Meta | Veredicto |
|---|---|---|---|---|---|
| Ver cuánto debo y a quién | Inicio | 0 | 0 ("Debes" en y = 310; primera fila en y ≈ 400) | Visible sin scroll | ✅ |
| Pagar a quien más urge (T9/T11) | Inicio → Pagar → Ya le pagué | 2 | 0 en 375×800 y 375×667 · **sí** en 320×568 (y = 642) · **1.6 pantallas** con revelación + aviso + por confirmar (y = 1,166) | ≤ 2 toques, < 10 s, sin scroll | ⚠️ Solo en el caso base |
| Confirmar un pago recibido (T10) | Inicio → "Sí, me llegó" | 1 | 0 (tarjeta en y = 364–608) | ≤ 2 | ✅ |
| Ver que mi pago se confirmó | Inicio | 0–2 (cerrar "¡Genial!" y "Entendido") | 0 | 1 aviso | ⚠️ Dos tarjetas del mismo evento |
| Registrar gasto parejo (T1) | Inicio → Dividir → monto → Confirmar | 3 | El reparto por persona está tapado; tras confirmar, el aviso queda en y = 872 | ≤ 3 y < 15 s, entendiendo qué pasó | ⚠️ Cumple el número, no la comprensión |
| Gasto en otro grupo | + cambiar el select de grupo | 4–5 | 0 | ≤ 3 | ❌ Siempre arranca en el primer grupo |
| Quitar a alguien (T2) | + tocar su chip | 4 | 0 | Sin ayuda | ✅ |
| Otro modo: "Por producto" (T8) | Dividir → monto → Otras formas → Por producto → nombre → precio → quién → Agregar → Confirmar | 9 | ≈ 1 pantalla | Sin ayuda | ⚠️ Largo pero claro |
| Contarlo con palabras | Dividir → frase (y = 918) → Entender → Confirmar (y = 1,403) | 4 | ≈ 2 pantallas | — | ❌ Devuelve otro gasto con otros nombres |
| Pagar menos veces | Grupos → grupo → "Ver quién le debe a quién" (y = 1,587) → plegable (y = 1,148) → Pagar así → Ya le pagué | 6 | ≈ 3 pantallas | Opcional | ❌ 2 de 18 ofertas fallan |
| Ver el grupo y la banda (T4) | Grupos → grupo | 2 | ≈ 1 pantalla hasta "La banda" (y ≈ 1,030) | Sin calculadora | ⚠️ Neto y directo no cuadran a simple vista |
| Entender nivel y próxima skin (T6) | Yo | 1 | 0 ("Próxima meta" en y = 349) | Responde con número | ✅ |
| Cambiar de personaje | Yo → elegir base | 2 | ≈ 1 pantalla (y ≈ 930) | < 30 s | ✅ |
| Cambiar skin y verla en el grupo (T13) | Yo → skin | 2 | ≈ 1.5 pantallas (y ≈ 1,400) | Se ve en todas partes | ❌ No se guarda |
| Cambiar nombre | Yo → campo (y = 2,115) → Guardar | 3 | 2.6 pantallas | < 30 s | ⚠️ Al fondo |
| Cambiar a tema claro (T7) | Grupos → grupo → toggle | 3 | 0 | Sin ayuda | ❌ No hay toggle en Inicio, Dividir, Grupos, Yo ni Detalle |
| Crear o unirse a un grupo | — | No existe en el demo | — | UAT-2 | n/a (fuera de UAT-1) |

## 4. Hallazgos

Severidad: **Alta** = hace fallar una tarea del guion o daña la confianza con el dinero · **Media** = fricción o confusión notable · **Baja** = pulido.

### A. Velocidad y flujo

**H2-01. Dividir: el reparto queda tapado justo cuando importa (Alta).** Con el monto escrito, la tarjeta "cuánto le toca a cada quien" (`dividir-resultado`) empieza en y = 684, el botón fijo "Confirmar gasto" ocupa 656–712 y la barra inferior empieza en 736: a 375×800 se ve **0 px** del reparto; detrás del botón semitransparente se transparenta el texto de la tarjeta. La pregunta de la pantalla ("¿cuánto le toca a cada quien?", `docs/UX.md` §3) solo se responde con scroll. Dónde: `DividirRapido.tsx` (bloque `sticky bottom-20`). Importa porque se confirma a ciegas un gasto que le genera deuda a otras personas.

**H2-02. Tras "Confirmar gasto" no hay confirmación visible ni consecuencia (Alta).** Medido en T1: el formulario se vacía, `scrollY` queda en 0, el aviso "¡Listo! Guardado en Viaje a Oaxaca · +10 XP 🌻 (demo)" aparece en y = 872 (fuera de la pantalla, debajo del botón), el Home de Oaxaca no muestra ningún gasto de $850 (0 coincidencias) y la XP del Inicio sigue en 120 / 250. Lo mismo pasa en Confirmar gasto (`ConfirmarGasto.tsx:95`). Dónde: `DividirRapido.tsx` (`confirmar`, `aviso`), `ConfirmarGasto.tsx`. Importa porque T1 es la métrica de velocidad de UAT-1 y la reacción esperable es "¿se guardó?" (y volver a capturarlo); además la app promete XP que no llega, lo que contradice al héroe.

**H2-03. Los avisos empujan "Pagar" fuera de la pantalla y el mismo evento sale dos veces (Alta).** Cuando Luis confirma el pago de Ana, el Inicio muestra **dos tarjetas** con "+80 XP": "¡Ganaste XP! ⚡" (`RevelacionPersonaje`) y "¡Luis confirmó tu pago de $1,360.00! 🎉" (`BandejaPagos`), cada una con su botón de cerrar ("¡Genial!" y "Entendido"). Con un pago por confirmar, el primer "Pagar" baja a y = 1,166 (1.6 pantallas). A 320×568, sin avisos, ya está en y = 642. Dónde: `ResumenInicio.tsx` (orden héroe → revelación → "Debes" → bandeja → filas), `BandejaPagos.tsx`. Importa porque rompe la meta de T11 (≤ 2 toques y < 10 s, sin scroll) justo en la semana de UAT, cuando habrá más avisos.

**H2-04. "Pagar menos veces" ofrece rutas que fallan o que no ahorran pagos (Alta).** Probé las 18 ofertas de los 6 grupos con deudas:
- **Fallan al tocar "Pagar así"** (en lugar de la hoja sale "Este pago todavía no se puede hacer así. Paga la deuda directa."): Ana → Nico en *Casa en la playa* y Rafa → Sofi en *Casa en la playa*.
- **No reducen los pagos de esa persona:** Ana en *Cumple de la abuela* (3 directos = 3 del plan, mismas cifras); Beto en *Oaxaca* (3 = 3, con cifras distintas: Ana $1,200 → $1,080); Ana en *Peda* (**3 del plan contra 2 directos**: "menos veces" son más).
- **Mismo número de pagos, otra cifra:** Ana → Luis en *Roomies* ($400 directo, $218.04 en el plan); Sofi → Ana en *Oficina* ($375 contra $75).

CLAUDE.md §7 dice "Si no hay cadena de deudas, no se ofrece". El plan se calcula para todo el grupo y se filtra por persona (`DetalleGrupoInteractivo.tsx`: `planDePagos(balances).filter(t => t.deId === yo)`), así que lo que ve cada quien no siempre le ahorra nada. Importa porque es dinero: un botón que promete simplificar y falla, o que cambia la cifra, es lo que `docs/UX.md` H1 llamó "destruye la confianza".

**H2-05. Dividir siempre arranca en el primer grupo de la lista (Media).** Desde la barra inferior, `dividir/page.tsx` usa `grupos[0]` (Oaxaca). CLAUDE.md §4 prevé recordar el último grupo (`cc_last_group`). Registrar en cualquier otro grupo suma el select (2 toques en móvil): 4–5 interacciones. T1 pasa solo porque el guion usa Oaxaca. Desde el Home del grupo sí se pasa `?g=`.

**H2-06. "Cuéntalo con tus palabras" está lejos y devuelve otro gasto (Media).** El campo está en y = 918 (bajo el pliegue, después del botón fijo) y en Confirmar gasto el botón final está en y = 1,403. Escribí como Beto "pizza 600 entre 3, pagó caro": la revisión mostró **Carolina $300 y Ana $300** (otro ejemplo de `evals/`, con nombres que no son de su grupo). Aunque un texto lo advierte, la persona ve cifras que no escribió. El enlace "← Dividir" pierde `?u=` (regresa como Ana) y la pantalla muestra "Ejemplos de prueba · sin llamadas a la API", "Cada ejemplo sale de los casos de `evals/`" y 20 chips numerados sin pista. Dónde: `EscribirGasto.tsx`, `app/dev/demo/ia/page.tsx`, `ConfirmarGasto.tsx`.

**H2-07. La skin elegida no se guarda ni se ve en la banda (Alta).** Ferni elige "Jardinero": la pill dice "Jardinero"; al recargar vuelve a "Explorador" y en La banda sigue 🧭. No hay aviso de "¡Listo!" (sí lo hay al cambiar de base o de nombre). Dónde: `PerfilYo.tsx` (`onElegir={setSkinActiva}`: estado local, no pasa por `usePerfilesDemo`). Importa porque T13 ("ponte la skin de Explorador y dime cómo te ve tu grupo") fallaría para todas las personas, y contradice CLAUDE.md §7 ("el cambio se ve en todo el demo").

**H2-08. Cambiar de tema no está donde se busca (Media, sigue PJ-H14).** El toggle existe solo en el Home del grupo y en la portada; hay 0 en Inicio, Dividir, Grupos, Yo y Detalle. T7 = Grupos → grupo → toggle (3 toques) sin ninguna pista.

**H2-09. El Home del grupo no deja pagar y gasta la parte de arriba en navegación (Media, sigue PJ-H11).** Siete pills de grupos ocupan el encabezado (duplican la pestaña Grupos), la tarjeta del personaje empieza en y = 436, la pill "Datos de ejemplo · sin Supabase" sigue ahí, y para pagar hay que bajar a "Ver quién le debe a quién →" (y = 1,587, 2 pantallas), un texto que no coincide con el título de destino ("Detalle"). Dónde: `g/[groupId]/page.tsx`, `HomeGrupoVivo.tsx`.

### B. Comprensión

**H2-10. Por grupo hay dos cifras: el balance neto y las deudas directas (Media).** En Grupos, *Roomies* dice "Debes $218.04"; en su Detalle, "Mis cuentas" dice "Luis $400.00" (la diferencia es lo que otra persona de la casa le debe a Ana). En *Casa en la playa*, la tarjeta dice "Debes $2,083.35" y las filas suman $2,591.68 menos $508.33 de Dani. Las dos son correctas (neto contra directo), pero ninguna pantalla dice "neto" ni explica la resta. Dónde: `ListaGrupos.tsx`, `DetalleGrupoInteractivo.tsx`. T4 ("¿cuánto te debe Ferni y tú le debes a alguien?") depende de esto.

**H2-11. La misma persona aparece en "Te toca pagar" y en "Te van a pagar" (Baja).** Ana le debe a Nico $1,291.67 y Nico le debe a Ana en otro grupo; por regla no se netea entre grupos (CLAUDE.md §7), pero la fila no lo explica ("también te debe $X en Oficina"). Además se repite `data-testid="cuenta-nico"` en el mismo documento (rompe selectores en modo estricto).

**H2-12. El estado del personaje es global pero se ve dentro de cada grupo sin contexto (Media, decisión).** En *Viaje a Oaxaca*, La banda muestra a Ana "Bajo la lluvia" junto a "$1,080.00 · le deben": la lluvia viene de deudas en **otros** grupos. Para la banda de Oaxaca es confuso ("¿por qué está en la lluvia si le debemos?") y deja inferir que debe en otro lado. Es la regla actual (§7: se suma entre grupos); ver decisión 3.

**H2-13. Un pago "en disputa" no dice qué hacer después (Media).** Tras "No me llegó", la fila dice "⚠️ Nico dice que no le llegó $1,291.67" + "Cancelar pago", y el aviso dice que Nico "puede aprobarlo más tarde, o puedes cancelarlo". No hay sugerencia de siguiente paso ("platícalo con Nico"), y la frase del personaje para ese caso existe pero **no se usa** (`FRASES_REACCION.rechazado` tiene 0 referencias en `src/components`). "Cancelar pago" no pide confirmación ni se puede deshacer, y en la hoja "Cancelar" significa otra cosa ("no pagar todavía").

**H2-14. Los plegables no parecen plegables (Media).** Todos los `<summary>` usan `display: flex` y pierden el triángulo nativo: "Te van a pagar $3,050.29" parece un encabezado con un total, no algo que se toca (y en el Inicio de Ferni es lo único que hay), lo mismo que "Pagar menos veces 🪄", "Todas las deudas del grupo", "Herramientas de prueba" y los 6 gastos del Detalle. Solo "Ver desglose" tiene subrayado.

**H2-15. Jerga de desarrollo y una promesa falsa en el camino del producto (Media).** "Datos de ejemplo · sin Supabase" (Home del grupo), "Ejemplos de prueba · sin llamadas a la API" y `evals/` (Confirmar gasto), "(demo)" en los mensajes de éxito, "← Demo" y, en Herramientas, "IA de ejemplo" (CLAUDE.md §15.14 pide no vender IA; en el panel de pruebas es tolerable, en el producto no). La portada dice "nada se guarda y al recargar todo vuelve a empezar", pero los pagos, el perfil y la bienvenida **sí** persisten en `localStorage` (y `docs/UAT.md` §1 dice "Se guarda algo: No"). En UAT eso produce justo la falsa alarma que el documento quiere evitar.

**H2-16. Las filas del Inicio son altas y repiten el monto (Media).** Cada fila mide 152–204 px: el monto sale dos veces (a la derecha y dentro de "Pagar $1,291.67") y la meta se parte en dos líneas ("hace 4 días · 2 / grupos"). A 375×800 se ve una fila completa y parte de la segunda; a 320 px, ninguna.

### C. Onboarding y estados vacíos

**H2-17. La bienvenida explica el personaje, no la app (Media).** Sus 3 pasos son personaje → XP y skins → qué ve la banda. Nada dice "aquí divides gastos con tu banda, pagas y confirmas", ni que la persona está jugando como "Ana" con datos de ejemplo. Termina en un Inicio con "Debes $5,631.68" sin contexto. Al abrirse, el foco se queda en `BODY` (no entra al diálogo).

**H2-18. No hay estado vacío de persona nueva (Media).** El mock no tiene a nadie sin grupos ni deudas. El caso más cercano (Ferni, sin deudas) ve "Debes $0.00", un plegable sin indicador y ningún llamado ("Divide tu primer gasto"). La portada manda a "Elige tu banda" (Home de un grupo, no el Inicio) y en producción solo dice "Muy pronto". Grupos no tiene ni un "Crear / unirse (pronto)". Para UAT-1 basta con la persona nueva de ejemplo; crear y unirse son de UAT-2.

### D. Color y contraste

**H2-19. El texto pasa AA; fallan placeholders, el CTA deshabilitado y los requisitos de skins (Media).** Mínimo medido en texto normal: 4.99:1 (botón primario en dark) y 5.21:1 en light. Fallas:
- Placeholders: **2.91:1 en light** y 4.42:1 en dark ("0.00" del monto, "Tacos, Uber, súper…", "Cena 840, pagué yo, somos 4", "10% o $200" y los montos por persona).
- Requisito de las skins bloqueadas: 12 px a **3.17:1 (light) / 3.73:1 (dark)** por el `opacity-70` del botón deshabilitado. Es la respuesta de T6.
- "Confirmar gasto" deshabilitado: 2.66:1 (dark) / 3.33:1 (light). WCAG lo exime, pero es el CTA principal de la pantalla y parece roto.

**H2-20. Contraste no-texto por debajo de 3:1 (Media).** Borde de los campos contra la card: **1.46:1 (dark) / 1.52:1 (light)**; fondo del campo contra la card: 1.16 / **1.03**. En light los campos casi no se ven (WCAG 1.4.11). Barra de XP en light: relleno contra pista 1.86:1. Barra inferior: activo contra inactivo **1.15 (dark) / 1.07 (light)** de luminancia, así que la pestaña activa solo se distingue por el tono. El botón central "Dividir" es un ➕ gris sobre una pill verde oscuro y no destaca como acción principal.

**H2-21. El verde significa cuatro cosas (Baja, sigue `docs/UX.md` H13).** Es el botón primario ("Pagar"), el dinero que te deben, "Al corriente" y el chip seleccionado. `grass-text` y `rose-text` tienen la misma luminancia (1.05:1 en dark, 1.11:1 en light): sin color, la dirección de un monto depende de palabras de 12 px ("debe" / "le deben", `FriendRow.tsx`). UX-09 quedó a medias en este punto.

### E. Botones y objetivos táctiles

**H2-22. Objetivos ≥ 44 px en todo; jerarquía y nombres inconsistentes (Baja).** 0 objetivos < 44 px en 30 estados (bien: `tactil.spec.ts` lo cuida, y lo verifiqué también en hoja, toast, bandeja, plegables abiertos, modos de Dividir y "Pagar menos veces"). Inconsistencias: "Entender" es un botón propio sin la sombra del sistema (`EscribirGasto.tsx`); "Otras formas de dividir" es fantasma con `-ml-4`; "Cancelar" (hoja, fantasma) y "Cancelar pago" (fila, outline) usan el mismo verbo para cosas distintas; no hay estados de carga (hoy no hacen falta, sí con Supabase).

**H2-23. Hoja de pago: el monto se escribe distinto de como se lee (Media).** La fila dice "$1,291.67" y la hoja "1291.67" sin "$" ni separador de miles. Además el campo tiene `autoFocus`: en Android abre el teclado aunque el caso común es pagar todo, y con 460 px de alto útil "Ya le pagué" queda pegado al teclado. Dónde: `HojaPago.tsx`.

### F. Tipografía y layout

**H2-24. Mucho texto chico (Media).** De 1,160 nodos de texto medidos (dark, todos los estados), **625 son de 14 px (54 %)** y 84 de 12 px, entre ellos textos con información: etiquetas de la barra inferior, "debe / le deben", "Se esfuma al pagar 🌬️" y los requisitos de las skins. "Nivel 3" va en serif bold de 14 px (Georgia se lee mal a ese tamaño). El cuerpo principal sí va a 16 px.

**H2-25. Textos cortados a 375 px: incumple el criterio de salida de UAT-1 (Alta).** Home de Oaxaca: "Cena en Casa Oaxaca" y "Desayuno en el mercado". Detalle de Playa: "Cena de mariscos", "Kayaks y snorkel", "Gasolina y casetas" y "Renta de la casa (3 noches)". A 320 px se cortan los 5 títulos del Home y "Hola, Ana 👋". `docs/UAT.md` §6 exige "0 textos cortados en 375 px". Dónde: `ExpenseCard.tsx`, `GastoDetalle.tsx` (`truncate`).

**H2-26. Zoom 200 %: scroll horizontal y héroe cortado (Media).** A 188 px de ancho CSS (zoom 200 % en un celular de 375): scroll horizontal en Inicio (248 px), Dividir (297), Home (206), Detalle (241) y Yo (207). Solo Grupos reacomoda. El héroe no se apila: "Bajo la lluvia" y "Nivel 3" quedan cortados a la derecha (WCAG 1.4.10).

### G. Accesibilidad, motion y rendimiento

**H2-27. Diálogos sin manejo de foco y encabezados incompletos (Media).**
- Foco en los diálogos: la bienvenida no lo recibe (queda en `BODY`). En la hoja de pago, Tab sale a la página de atrás (hoja-confirmar → hoja-cerrar → SUMMARY → nav-inicio…) y el fondo no queda inerte.
- Toast: "Deshacer" desaparece a los 8 s sin pausa al enfocarlo (WCAG 2.2.1; lo mitiga que se pueda "Cancelar pago" después).
- Encabezados: Yo no tiene `h1` (empieza en el `h2` "Ana") y el `h1` del Detalle es "Detalle", sin el nombre del grupo.
- Lector de pantalla: en las filas del Inicio, la miniatura de cada acreedor se anuncia como "Personaje bajo la lluvia", así que su reputación se lee en una lista de dinero.

**H2-28. Lo que está bien (no tocar).** Con movimiento reducido no hay animaciones activas (0 elementos con `animation`). CLS = 0.000 en Inicio, Home, Yo, Dividir y bienvenida. FCP de 80–136 ms en local y de 616 ms con CPU ×4 + 1.6 Mbps. Un solo canvas por pantalla. Landmarks `main` y `nav` con nombre. Toda la barra inferior y los controles con nombre accesible. Microcopy cálido y sin regaños ("Avisé a Nico ⏳ Te cuento cuando confirme.", "¡Buen abono!").

## 5. Backlog de mejoras

Prioridad: **P0** bloquea o daña UAT-1 · **P1** fricción fuerte · **P2** pulido. Estimación: **S** ≤ ½ día · **M** 1–2 días · **L** ≥ 3 días. ⚡ = quick win (S y alto impacto). Toda lógica nueva va en `lib/` con cobertura 100 % y cada cambio de UI con su E2E (`data-testid`), según CLAUDE.md §11.

| ID | Mejora | Resuelve | Prio | Est. | Archivos probables | ¿Toca reglas de producto? |
|---|---|---|---|---|---|---|
| UX2-01 ⚡ | Dividir: mostrar el reparto **pegado al botón** (p. ej. "Confirmar · $212.50 c/u" o una línea de resumen dentro de la barra fija) y que el botón deshabilitado diga qué falta ("Escribe el monto") | H2-01, H2-19 | **P0** | S | `DividirRapido.tsx` | No |
| UX2-02 | Confirmación tras guardar: aviso visible (toast sobre la barra, con "Ver en el grupo") y, en el demo, que el gasto se guarde en el almacén local y aparezca en el Home y Detalle del grupo con su XP (`xpPorRegistrarGasto`, anti-farming D5); si no se otorga, no prometer "+10 XP" | H2-02 | **P0** | M | `DividirRapido.tsx`, `ConfirmarGasto.tsx`, `almacenDemo.ts`, `usePersonajeVivo.ts`, `HomeGrupoVivo.tsx` | No (usa D5 tal cual); ver decisión 2 |
| UX2-03 | Un solo aviso por evento: fusionar la revelación con "X confirmó tu pago" en una tarjeta compacta; los avisos van en una sola tira plegable y nunca empujan la primera fila de "Te toca pagar" fuera de la pantalla (también a 320×568) | H2-03 | **P0** | M | `ResumenInicio.tsx`, `BandejaPagos.tsx`, `RevelacionPersonaje.tsx` | No |
| UX2-04 | "Pagar menos veces" solo cuando **reduce los pagos de esa persona** y nunca con un botón que falla: filtrar en `lib/` (función pura, p. ej. `planQueAhorra`) antes de ofrecer; si no hay ahorro, no se muestra | H2-04 | **P0** | M | `lib/splits/plan.ts` o `lib/game/pagarPlan.ts` (+ tests), `DetalleGrupoInteractivo.tsx` | **Sí, precisa §7 ("Pagar menos veces"): requiere actualizar CLAUDE.md y aprobación de Yerif** (decisión 1) |
| UX2-05 ⚡ | Guardar la skin elegida en el perfil del demo, verla en Inicio, Home y La banda, y avisar "¡Listo! Ahora llevas…" | H2-07 | **P0** | S | `PerfilYo.tsx`, `usePerfilesDemo.ts`, `usePersonajeVivo.ts`, `tests/e2e/perfil.spec.ts` | No |
| UX2-06 ⚡ | Títulos de gasto en 2 líneas (`line-clamp-2`) y metadatos sin cortes; agregar un E2E que falle con cualquier elipsis a 375 px en las pantallas del guion | H2-25 | **P0** | S | `ExpenseCard.tsx`, `GastoDetalle.tsx`, `tests/e2e/` | No |
| UX2-07 ⚡ | Quitar la jerga del camino del producto ("sin Supabase", "sin llamadas a la API", `evals/`, "(demo)", "← Demo") y moverla a Herramientas; corregir la portada ("tus pagos de prueba se guardan en este navegador; «Reiniciar» empieza de cero"); actualizar `docs/UAT.md` §1, T3 ("Cuéntalo con tus palabras" en Dividir), T7 y T8 ("Pagar menos veces") | H2-15 | **P0** | S | `app/page.tsx`, `HomeGrupoVivo.tsx`, `app/dev/demo/ia/page.tsx`, `DividirRapido.tsx`, `ConfirmarGasto.tsx`, `docs/UAT.md` | No |
| UX2-08 ⚡ | Plegables con indicador visible (▾/▴ y texto "Ver") en un componente `Plegable` propio | H2-14 | P1 | S | `components/ui/` (nuevo), `ResumenInicio.tsx`, `DetalleGrupoInteractivo.tsx`, `GastoDetalle.tsx`, páginas del demo | No |
| UX2-09 ⚡ | Toggle de tema en Yo (sección "Ajustes", con texto "Tema claro / oscuro") | H2-08 | P1 | S | `PerfilYo.tsx` o `yo/page.tsx` | No (decisión 6) |
| UX2-10 | Filas del Inicio compactas: monto una sola vez (dentro de "Pagar"), meta en una línea ("hace 4 d · 2 grupos"), ≤ 96 px por fila | H2-16, H2-03 | P1 | S–M | `FilaCuenta.tsx` | No |
| UX2-11 ⚡ | Dividir recuerda el último grupo usado (en el demo, cookie `cc_last_group` o `localStorage`) | H2-05 | P1 | S | `dividir/page.tsx`, `DividirRapido.tsx` | No (ya está en §4) |
| UX2-12 | "Cuéntalo": acceso visible bajo el monto ("o cuéntalo con tus palabras"), revisión con los **miembros reales** del grupo (mapear alias del ejemplo), botón final fijo, "← Dividir" con `?u=` y sin jerga | H2-06 | P1 | M | `EscribirGasto.tsx`, `app/dev/demo/ia/page.tsx`, `ConfirmarGasto.tsx`, `lib/ai/aBorrador.ts` | No |
| UX2-13 | Disputa con siguiente paso: frase del personaje (`FRASES_REACCION.rechazado`), "Platícalo con Nico" en la fila y confirmación al "Cancelar pago"; renombrar "Cancelar" de la hoja a "Ahora no" | H2-13, H2-22 | P1 | S | `FilaCuenta.tsx`, `BandejaPagos.tsx`, `usePagarPersona.ts`, `HojaPago.tsx` | No |
| UX2-14 | Neto y directo explicados: "Balance neto en el grupo" en Grupos y Detalle, con una línea que muestre la resta (p. ej. "le debes $400 a Luis − te deben $X = $218.04"); "También te debe $X en…" cuando alguien está en las dos listas; `data-testid` únicos por lista | H2-10, H2-11 | P1 | S | `ListaGrupos.tsx`, `DetalleGrupoInteractivo.tsx`, `FilaCuenta.tsx`, `ResumenInicio.tsx` | No |
| UX2-15 | Bienvenida con el dinero: primer paso "Divide, paga y confirma con tu banda" + "Juegas como Ana, con datos de ejemplo"; foco al diálogo | H2-17, H2-27 | P1 | S | `Bienvenida.tsx` | No |
| UX2-16 | Persona nueva de ejemplo (sin grupos ni deudas) y estado vacío útil: CTA "Divide tu primer gasto", "Te van a pagar" abierto si es lo único; portada que lleve al Inicio | H2-18 | P1 | M | `lib/mock/datos.ts`, `ResumenInicio.tsx`, `app/page.tsx`, E2E | No (mock y UI) |
| UX2-17 | Contraste no-texto: token `--input-border` ≥ 3:1 en ambos temas, placeholders AA, pista de XP ≥ 3:1 en light, pestaña activa con indicador no cromático (barra o peso) y un ➕ legible en "Dividir"; test de contraste no-texto en `lib/contraste.test.ts` | H2-19, H2-20 | P1 | S | `globals.css`, `XPBar.tsx`, `NavInferior.tsx`, campos de `DividirRapido`/`ConfirmarGasto`/`HojaPago`/`PerfilYo`, `lib/contraste` | No (tokens nuevos dentro de §10) |
| UX2-18 | Home del grupo: "Mis cuentas en este grupo" con Pagar arriba de La banda, selector de grupo compacto (1 pill + "cambiar") y enlace "Ver detalle y gastos" | H2-09 | P1 | M | `g/[groupId]/page.tsx`, `HomeGrupoVivo.tsx` | No |
| UX2-19 | Diálogos accesibles: `<dialog>` nativo o foco atrapado + fondo inerte + devolver el foco; toast que se pausa al enfocar; `h1` en Yo y Detalle con nombre del grupo | H2-27 | P1 | M | `HojaPago.tsx`, `Bienvenida.tsx`, `ToastPago.tsx`, `yo/page.tsx`, `DetalleGrupoInteractivo.tsx` | No |
| UX2-20 ⚡ | Hoja de pago: prefijo "$" y separador de miles en el monto; sin `autoFocus` (o seleccionar el texto solo si se toca) | H2-23 | P2 | S | `HojaPago.tsx`, `lib/splits/formato.ts` | No |
| UX2-21 ⚡ | Tipografía mínima de 14 px para información ("debe / le deben", "Se esfuma al pagar", requisitos de skins sin opacidad, etiquetas de la barra a 13 px); "Nivel N" en sans | H2-24, H2-19 | P2 | S | `FriendRow.tsx`, `SkinSelector.tsx`, `NavInferior.tsx`, `XPBar.tsx` | No |
| UX2-22 | Reflow a 200 %: héroe que se apila bajo ~360 px, `min-w-0`/`flex-wrap` en filas, chips y campos | H2-26 | P2 | S–M | `HeroPersonaje.tsx`, `DividirRapido.tsx`, `FriendRow.tsx`, `FilaCuenta.tsx` | No |
| UX2-23 | Botones consistentes: "Entender" con `Button`, "Otras formas" sin margen negativo, un solo verbo por acción | H2-22 | P2 | S | `EscribirGasto.tsx`, `DividirRapido.tsx` | No |
| UX2-24 | Separar el color de acción del de "te deben" (o acompañar siempre el monto con la palabra) | H2-21 | P2 | M | `Button.tsx`, `globals.css`, `FilaCuenta.tsx`, `FriendRow.tsx` | Toca §10 (lenguaje visual): **aprobación de Yerif** (decisión 5) |
| UX2-25 | Estado del personaje en el contexto de un grupo y avatares neutros en las filas de dinero del Inicio | H2-12, H2-27 | P2 | S | `FriendRow.tsx`, `lib/game/reputacion.ts`, `FilaCuenta.tsx` | **Sí, §7 "Reputación pública": requiere actualizar CLAUDE.md y aprobación de Yerif** (decisiones 3 y 4) |

**Orden sugerido.** Primero los quick wins P0: UX2-01, UX2-05, UX2-06 y UX2-07 (≈ 2 días). Después UX2-03 y UX2-02 (≈ 2–3 días), y UX2-04 cuando Yerif decida (o, como mínimo para UAT-1, ocultar "Pagar menos veces" cuando no ahorra). Si sobra tiempo antes de UAT-1: UX2-08, UX2-09, UX2-11, UX2-17 (todos S). Lo demás puede esperar a la ronda (sin features nuevas: CLAUDE.md §15.20; estos son bugs y ajustes de forma, con ticket).

## 6. Decisiones que necesita Yerif

1. **¿"Pagar menos veces" se ofrece solo si reduce los pagos de esa persona?** Hoy se ofrece aunque no ahorre nada (o tenga más pagos) y a veces falla. *Recomendación:* sí, mostrarlo solo cuando el plan tenga **menos pagos** para quien mira y nunca con un botón que no puede completarse; si no, ocultarlo. Para UAT-1, si no da tiempo, ocultarlo por completo (T8 pregunta por él: ajustar la tarea). Toca CLAUDE.md §7.
2. **En el demo, ¿un gasto guardado en Dividir debe aparecer en el grupo y dar XP como los pagos?** *Recomendación:* sí, guardarlo en el almacén local del demo (igual que los pagos) y aplicar D5 (+10 solo con ≥ 2 participantes, máx. 5 al día). Sin esto, T1 deja a la persona con la duda de si se guardó. Alternativa barata: no prometer "+10 XP" y llevar a la persona al grupo con un aviso visible.
3. **¿Cómo se ve el estado global dentro de un grupo?** Hoy la banda de Oaxaca ve a Ana "Bajo la lluvia" aunque en Oaxaca le deben. *Recomendación:* conservar el estado global (es el juego), pero en La banda mostrar la pill de estado **solo en tu propia fila**; a los demás, solo la figura (el dibujo ya comunica el clima). Baja la exhibición y la confusión. Toca §7 "Reputación pública".
4. **¿Avatares neutros en las filas de dinero del Inicio?** Hoy cada acreedor muestra su aro y su nube ("Personaje bajo la lluvia" para el lector de pantalla). *Recomendación:* neutros, igual que en Dividir: ahí se habla de lo que tú debes, no de cómo va la otra persona. Toca la lista de §7.
5. **¿El verde sigue siendo a la vez "acción" y "te deben"?** *Recomendación:* mantener el verde para la acción principal (marca) y acompañar siempre los montos con la palabra ("te debe", "le debes"); pasar "te deben" a otro acento solo si UAT-1 muestra confusión. Toca §10 si se cambia el color.
6. **¿Dónde vive el cambio de tema?** *Recomendación:* en Yo, sección "Ajustes", y quitarlo del encabezado del Home del grupo; T7 se vuelve "Yo → tema" (2 toques).
7. **¿Qué se le dice a la banda sobre lo que se guarda?** *Recomendación:* "Tus pagos de prueba se guardan en este navegador; «Reiniciar» empieza de cero" en la portada, la invitación y `docs/UAT.md` §1, en lugar de "nada se guarda".
8. **¿Se actualiza el guion de UAT-1 a la UI actual antes de invitar?** *Recomendación:* sí: T3 entra por "Cuéntalo con tus palabras" en Dividir, T8 dice "Pagar menos veces" (o se quita, según la decisión 1), T7 según la decisión 6, y se agregan T12–T14 de `docs/UX-PERSONAJE.md` §7 si no están.

## 7. Cómo validar en UAT-1

**Preparar estados** (con `?u=` y Herramientas de prueba) para no medir solo el caso fácil: Ana con un pago confirmado + uno por confirmar (para T11 con avisos), Beto para T5 y Ferni para "sin deudas".

| Qué | Cómo | Meta |
|---|---|---|
| T1 con comprensión | Cronometrar y luego preguntar: "¿Cuánto le tocó a Ferni?" y "¿Se guardó? ¿Dónde lo ves?" | Mediana ≤ 3 interacciones y < 15 s; **5 de 5** responden ambas sin volver a capturar |
| T1 en otro grupo | "Ahora registra $300 de súper en Roomies" | ≤ 4 interacciones y sin ayuda |
| T11 con avisos | Inicio de Ana con revelación y por confirmar: "¿A quién le debes más? Págale" | < 10 s y ≤ 2 toques **sin scroll**; 0 dudas sobre la cantidad |
| Disputa | "Nico dice que no le llegó: ¿qué haces?" | ≥ 4 de 5 proponen un siguiente paso sin ayuda (platicar, cancelar o esperar) |
| T4 neto vs directo | "¿Cuánto debes en Roomies y a quién se lo pagas?" | ≥ 4 de 5 explican por qué la tarjeta y la fila no dicen lo mismo (o, tras UX2-14, no lo preguntan) |
| Pagar menos veces | "¿Este botón te ahorra pagos?" | 5 de 5 dicen que sí cuando aparece; 0 errores al tocarlo |
| T13 skin | "Ponte una skin y dime cómo te ve tu banda" | 5 de 5 la ven en La banda |
| T7 tema | "Cambia a modo claro" | < 20 s sin ayuda |
| Primera impresión (5 s) | Mostrar el Inicio 5 s: "¿Para qué es esta app?" | ≥ 4 de 5 mencionan dividir o pagar gastos (no solo "un juego") |
| Legibilidad en light | Observar si encuentran dónde escribir en Dividir en modo claro | 0 personas preguntan "¿dónde escribo?" |
| Textos cortados | Revisión en 375 px de cada pantalla del guion | 0 (criterio de salida §6) |
| Letra grande | Una persona con texto grande del sistema o zoom del navegador | Sin scroll horizontal ni textos cortados en Inicio y Dividir |

**Preguntas de cierre nuevas:** "¿En algún momento no supiste si algo se había guardado o enviado?" (meta: nadie) y "¿Algo te sonó a lenguaje de programador?" (meta: nadie).
