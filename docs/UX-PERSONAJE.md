# Análisis UX/UI de la sección del personaje — "¿dónde está mi personaje cuando decido pagar?"

> **Estado (2026-10-06): decisiones de §5 aprobadas por Yerif** (1 héroe en el Inicio: sí · 2 etiquetas de clima: sí · 3 recompensas recomendadas · 4 skins visibles y probar: sí · 5 explorar modelos finales hechos por nosotros). **Hechos: PX-01 a PX-12 (salvo la pausa de render fuera de pantalla y el equipo por ranura, que son de después de UAT-1) y las etiquetas de clima.** Los demás tickets de §6 siguen en el backlog. Completa **UX-07** de `docs/UX.md` (personaje y XP en el inicio, festejo al confirmarse), que está marcado como hecho pero quedó a medias.
> Fecha: 2026-10-06 · Medido sobre el build de la rama `docs/analisis-ux-personaje` (desde `develop`) en modo preview: 375×812 px (también 360×740, 414×896 y 320×568), dark y light, con las personas del demo. Chromium con WebGL **por software** (SwiftShader, sin GPU): sirve para comparar y encontrar fallas, **no** reemplaza la prueba en un celular real (PJ-02, pendiente de Yerif).
> Las propuestas de §4 no cambian reglas del juego; lo que sí las toca está en §5, con la parte de CLAUDE.md que cambiaría. Las referencias a otras apps (§3.1) son conocimiento general, solo inspiración: no se copian assets ni personajes.

## 1. Veredicto

El personaje **ya es lo mejor del producto** —el modelo es simpático, los tres estados se leen en grande y el render es ligero—, pero hoy **es un invitado en tres pantallas, no el protagonista**. En el Inicio, donde se decide pagar, es una miniatura de 56 px; en Yo está a 1.3 pantallas del tope (y el nivel a 2.3); y el festejo, que es el momento "wow" del juego, solo ocurre si quien pagó entra al detalle del grupo **sin** haber tocado "Entendido". Además, las pantallas no cuentan la misma historia: lo que editas en Yo no llega a Home y lo que ganas al pagar no llega a Yo. En 10 minutos de UAT-1 la persona verá un osito triste del tamaño de un botón mientras mira cuánto debe, y lo más probable es que no vea celebrarse nada.

Lo que sí funciona y hay que conservar: 9 bases y 3 estados legibles a 224 px (nube + lluvia, gota de sudor, chispas), una paleta del modelo tomada de los acentos cozy, skins como accesorios, respaldo 2D sin WebGL, movimiento reducido respetado, 0 objetivos táctiles < 44 px y texto AA en ambos temas. El camino de recuperación ya existe y funciona (verificado con Beto: Deteriorado $1,845.12 → paga a Ana → sigue Deteriorado $645.12 → paga a Ferni → Apagado $335.12 → paga a Caro → Radiante $0.00).

Mediciones (Ana, Beto y Ferni en el demo; 375×812, dark salvo que se diga):

| Medida | Hoy | Meta |
|---|---|---|
| Tamaño del personaje en el Inicio | 56 px (15 % del ancho), miniatura 2D | 128 px (34 %), PNG al instante y 3D después |
| Pantallas de producto con 3D | 3 de 8 (Home, Detalle, Yo); no en raíz, Inicio, Dividir, Grupos ni Confirmar gasto | 4 (+ Inicio) |
| Yo: dónde quedan el 3D y el nivel | y = 1,050 (0 % visible al abrir) y y = 1,855, de 2,081 px | 3D y nivel visibles al abrir |
| Home: 3D visible sin scroll a 375×812 / 360×740 / 320×568 | 100 % / 97 % / 0 % | 100 % en los tres |
| Detalle del grupo: tamaño del 3D | 112 px (30 %) | ≥ 128 px y con festejo visible |
| Hueco vacío entre el respaldo y el 3D (sin límite / CPU ×4 + 1.6 Mbps) | 0.30 s / 1.6–1.7 s (el 3D llega a los 0.5 s / 3.5–3.8 s) | 0 s: el respaldo es la misma figura hasta el primer cuadro |
| JS extra por el 3D (gzip) | +243 kB (152 → 395–408 kB por pantalla) | Igual de peso, pero fuera de la ruta crítica |
| Render del personaje | 14–25 draw calls, 6.2–8.6 mil triángulos, 60 fps sin GPU (48–59 con CPU ×4) | ≥ 30 fps en el celular más modesto (PJ-02) |
| ¿Quien pagó ve el festejo cuando se confirma? | Solo en el detalle de ese grupo y si no tocó "Entendido" (verificado: con "Entendido" 0, sin él 1); al subir de nivel, nunca | Siempre, al abrir la app |
| Consistencia tras editar el perfil o ganar XP | Home y Confirmar ignoran nombre y personaje; Detalle dice Nivel 2 · 50/175 XP y Yo dice Nivel 1 · 30/100 XP | Una sola fuente |
| Aro de estado vs card (WCAG 1.4.11, ≥ 3:1) | dark 4.3–11.2 (cumple); light 2.05 / **1.26** / 2.15 (grass / lemon / rose) | ≥ 3:1 en ambos temas |
| Ojos vs piel/pelaje (≥ 3:1) | persona-nube 2.3 / 2.0 / 1.8 (clean / mild / rekt); búho y oso < 3 en deteriorado | ≥ 3:1 en las 9 bases |
| Diferencia de color clean → rekt (ΔE76, ≥ 20) | 12.8 conejo · 13.0 gato · 17.9 luna; 24–40 en las demás | ≥ 20 o una señal extra |
| Objetivos táctiles < 44 px | 0 (6 pantallas a 375×812; Inicio, Home, Yo y Detalle también a 360, 414 y 320) | 0 |
| Texto AA | ≥ 4.99:1 (botón primario en dark) | Se mantiene |

Dónde aparece hoy el personaje y dónde debería:

| Pantalla | Hoy | Debería |
|---|---|---|
| Raíz "Elige tu banda" | Nada | Tu miniatura y un saludo (o entrar directo al Inicio) |
| Inicio | Miniatura de 56 px y miniaturas de 44 px en las filas; sin 3D | Héroe de 128 px con globo, nivel y "si pagas…" |
| Hoja de pago, toast y avisos | Nada de **tu** personaje | Reacción del héroe (esperando, abono, rechazo) y revelación al confirmarse |
| Grupos | Nada | Opcional: caras de la banda por grupo |
| Home del grupo | 3D de 224 px (y = 458), con los datos fijos de Ana | Igual, con datos vivos |
| Detalle del grupo | 3D de 112 px | ≥ 128 px y festejo visible |
| Yo | Miniatura de 56 px arriba; 3D de 224 px en y = 1,050 | Héroe arriba, con nivel y próxima meta |
| Dividir y Confirmar gasto | Miniaturas de 32-36 px con aro de estado | Miniaturas neutras |
| Barra inferior, "Yo" | 🐻 fijo | Tu miniatura |

## 2. Hallazgos (con evidencia)

Prioridad: **P0** rompe el momento "wow" o la comprensión del personaje en UAT-1 (tareas T5, T6, T10) · **P1** reduce el impacto o el riesgo social · **P2** pulido.

### P0

**PJ-H1. El personaje no está donde se decide pagar.** El Inicio (`ResumenInicio.tsx:58`) muestra un `Avatar` compacto de 56 px junto al saludo; la nube del estado deteriorado sale recortada. No hay 3D en el Inicio: vive en Home (`g/[groupId]/page.tsx:84`), Detalle (`DetalleGrupoInteractivo.tsx:117`, 112 px) y Yo (dentro de "Skins"). En el viaje de pago —fila, `HojaPago`, `ToastPago`, avisos de `BandejaPagos`— **tu** personaje no aparece: la fila muestra la miniatura de la otra persona y todo lo demás es texto. La única liga entre "debo $X" y "mi personaje" es una frase (`ResumenInicio.tsx:75`: "al pagar, tu personaje se recupera 🌱") que además no siempre es cierta: Beto necesita 2 de 3 pagos para cambiar de estado. Y la persona que **más** debería lucirse, Ferni (radiante, sin deudas), ve un Inicio casi vacío: "Debes $0.00" en rosa, "Te van a pagar $1,100.00" plegado y casi la mitad de la pantalla útil (≈ 350 px) en blanco (captura `inicio?u=ferni`). Para una app de uso semanal (CLAUDE.md §1), esa es también la pantalla que debería dar una razón para volver aunque no haya nada que pagar (un saludo, una meta, novedades de la banda); hoy, si no debes, la app no tiene nada que decirte. `docs/UX.md` H7 ya lo señaló; UX-07 sigue a medias: hoy hay una miniatura y una frase, sin XP ni festejo en el Inicio.

**PJ-H2. El festejo y la recompensa casi nunca los ve quien los ganó.** El festejo se dispara solo en el Detalle del grupo de ese pago (`DetalleGrupoInteractivo.tsx:64-69`: pago confirmado, `xp > 0`, mismo grupo y `!avisado`). Verificado: si Beto abre su Inicio y toca "Entendido" antes de entrar al detalle, `data-celebraciones` queda en 0; si entra directo, en 1. En el Inicio el resultado es una tarjeta de texto (`BandejaPagos.tsx:116-121`: "¡Ferni confirmó tu pago de $310.00! 🎉 +50 XP ⚡") sin personaje, sin barra de XP y sin cambio visible. Con Supabase la confirmación ocurrirá cuando quien pagó **no** está en la app (push y email están fuera del MVP), así que el momento solo puede existir **al abrirla**. Subir de nivel (CLAUDE.md §7: festejo "al saldar una deuda completa o subir de nivel") no festeja en ninguna pantalla: no hay detección de nivel en la UI. Pagar, abonar, cancelar y rechazar no tienen reacción del personaje. El cambio de estado sí se refleja (miniatura y pill del Inicio: verificado Deteriorado → Apagado → Radiante), pero sin "antes → después": el 3D se monta ya en el estado nuevo (`useSuave` arranca en el objetivo, `Personaje3D.tsx:262-264`; verificado: la crominancia es la misma desde el primer cuadro), así que la transición de 0.7 s que promete CLAUDE.md §7 solo se ve si el estado cambia con el personaje en pantalla (el laboratorio), nunca al volver de otra pantalla. Caso T5: Beto termina en nivel 2 (30 → 150 XP en sus tres pagos) y, con suerte, ve **un** festejo de 1.6 s en un personaje de 112 px (el contador queda en 1 aunque hayan sido tres pagos).

**PJ-H3. Las pantallas no cuentan la misma historia.** (a) Home es un Server Component con los datos fijos de Ana (`g/[groupId]/page.tsx:33,84,119`): tras cambiar el nombre a "Anita" y el personaje a Gato, Inicio, Detalle y Dividir lo muestran, pero Home sigue en "Ana" + Oso (`aria-label` "Personaje Oso", miniatura `oso-rekt.png` en La banda) y Confirmar gasto también; contradice CLAUDE.md §7 ("el cambio se ve en todo el demo") y `tests/e2e/perfil.spec.ts` no lo cubre. (b) XP: tras pagar a los tres, el Detalle muestra Nivel 2 · 50/175 XP y Yo "Nivel 1 · 30/100 XP" (`PerfilYo` recibe la XP fija del mock). (c) Estado: Home y Yo usan `yo.estado` fijo; solo Inicio y Detalle lo derivan de los pagos confirmados. (d) La barra inferior pinta 🐻 en "Yo" para todos (`NavInferior.tsx:30`): Ferni (zorro) ve un oso. (e) "Debes $0.00" sale en rosa (`ResumenInicio.tsx:69`, `text-rose-text` fijo) al lado de "Radiante", y en light `rose-text` y `grass-text` son el mismo café `#3D2B1F` (`globals.css:36-42`): "Debes" y "Te deben" no se distinguen por color. Efecto: la persona cambia su personaje y en la pantalla del 3D "no pasa nada".

**PJ-H4. Carga: emoji → hueco → 3D; y sin WebGL el protagonista es un emoji.** `Personaje` arranca en "2d" (`Personaje.tsx:42`), pasa a "3d" en un efecto (`:46`) y el chunk (`dynamic` sin `loading`, `:29`) llega después. Cronología medida en Home: respaldo a 65 ms → contenedor vacío a 267 ms → canvas a 568 ms (hueco de 0.30 s); con CPU ×4 y 1.6 Mbps: 514 ms / 2.1 s / 3.8 s (hueco de 1.7 s; en Yo y Detalle igual, 1.6–1.7 s). El CLS es 0.000 (el contenedor mide 224×224 desde el SSR): no hay salto de layout, hay parpadeo de contenido (secuencia de capturas con red lenta: emoji 🐻 con ✨ → tarjeta vacía → osito con sombrero). El respaldo dibuja el **emoji** del animal (`Personaje.tsx:20-25`) y no la miniatura PNG de la misma figura que ya existe (8 KB, `rutaMiniatura`). Sin WebGL (probado: modo "2d", 0 canvas) el personaje es un emoji de 96 px en un aro. El 3D pesa +243 kB gzip (3 chunks de three/r3f: 100 + 88 + 51 kB).

**PJ-H5. Yo, la pantalla de "mi personaje", pone al personaje y al nivel al final.** Para Ana: chips "Probar como" (11 personas, 200 px) en y = 128 (`yo/page.tsx:29-37`), formulario en y = 522, selector de personajes en y = 738, el 3D dentro de "Skins" en y = 1,050 (hay que bajar ≥ 526 px para verlo completo) y XP, nivel y badges al fondo (y = 1,855 y 1,911 de 2,081). Arriba solo hay un avatar de 56 px. Al elegir un personaje no cambia nada a la vista: con el botón tocado centrado en pantalla, el 3D se ve 0 % (fila 1), 35 % (fila 2) u 83 % (fila 3), y lo seguro es solo el aviso "¡Listo! Ahora eres Gato 🐱". La tarea T6 y la sensación de "mi personaje" dependen de esta pantalla.

### P1

**PJ-H6. No se ve qué falta.** La barra de XP aparece en Home (y = 779: tapada por la barra inferior en 375×812), Detalle y Yo (al fondo); no en el Inicio. Las skins bloqueadas dicen solo el requisito ("Llega al nivel 5", `skins.ts:60-65`), sin XP faltante; no existen contadores de Jardinero (5 pagos a tiempo), Alcalde (10) ni Rayo (5 en < 24 h), y las reglas de los badges (`BADGES[…].descripcion`) no se muestran en ninguna pantalla: la skin dice "Gana el badge Alcalde 🏅" y nadie explica cómo se gana. Ana (395 XP, nivel 3) necesita 850 XP para Explorador: faltan 455, unos 10 pagos de +50; el dato sale de `lib/game/levels.ts` y no se muestra. Ritmo (supuesto: 2 pagos rápidos + 2 gastos con ≥ 2 personas + semana limpia ≈ 145 XP por semana): nivel 2 ≈ 1 semana, nivel 5 ≈ 6 semanas, nivel 10 (3,600 XP) ≈ 25 semanas; Jardinero ≈ 2-3 semanas. En UAT-1 (demo, 10 minutos por persona) la subida de nivel más a la mano es la de Beto en T5 (30 → 150 XP, nivel 2) y hoy no tiene festejo; en UAT-2 (2 semanas) habrá, como mucho, nivel 2 o 3 y quizá Jardinero. Faltan micro-recompensas **dentro de una sesión**.

**PJ-H7. Capa social: se apilan señales negativas y se exhibe el estado donde no viene al caso.** `FriendRow.tsx:21-39` junta avatar con aro de estado, pill de estado, badges y monto en rojo: Beto en La banda es "Deteriorado" + "El Fantasma 👻" + "$1,845.12 debe", tres señales negativas en una fila que ve todo el grupo; lo positivo (Generoso, Rayo) pesa igual que lo negativo. El aro de estado también aparece donde no se habla de reputación: chips de "Entre quiénes (toca para quitar)" en Dividir (`DividirRapido.tsx:230`), Confirmar gasto (`ConfirmarGasto.tsx:173,193`) y el selector de personaje (`PerfilYo.tsx:115`): riesgo de que alguien excluya al "deteriorado". "Deteriorado" es lenguaje de objeto: sobre una persona suena a diagnóstico, y aparece en el propio saludo ("Hola, Ana — Deteriorado"). No hay aviso previo de qué ve la banda ni forma de verlo; el Fantasma se revoca al saldar pero la UI no lo dice. CLAUDE.md §1 pide humor "nunca humillación" y `docs/UAT.md` §6 exige que nadie se sienta exhibido.

**PJ-H8. El estado se lee mal en miniatura, en light y sin color.** Contraste del aro vs la card (WCAG 1.4.11): dark 4.3–11.2 (bien); light grass 2.05, rose 2.15 y **lemon 1.26** (mal; `src/lib/contraste.test.ts` solo prueba texto). Entre sí, grass y rose miden 1.05:1 en light (misma luminancia): no se distinguen en monocromo ni con daltonismo. La pista sin color es el dibujo (nube, gota, chispas) de 3-6 px a 44 px, y el sticker ✨/😓/🌧️ solo existe en avatares no compactos (`Avatar.tsx:57`); filas de cuentas, Inicio, Dividir y selector usan compacto. ΔE76 del cuerpo clean → rekt: zorro 40, rana 32, sol 30, oso 26, nube 25, búho 24, luna 18, **gato 13, conejo 13**; clean → mild es 4.9 y 6.7 en gato y conejo (casi iguales): en las bases más "monas" el estado depende de cara y efectos. Las 9 miniaturas de deteriorado salen con la nube **cortada** arriba (36 px opacos en la fila y = 0; la captura usa cámara a 5.2 y el héroe a 6, `CapturaPersonaje.tsx:17`): se ve como una banda gris pegada al aro.

**PJ-H9. Personalizar no tiene vista previa y las skins no las ve la banda.** El selector dibuja las 9 bases **en el estado actual** (`PerfilYo.tsx:115`): para Ana (deteriorada) son 9 personajes grises (la rana ni se ve verde). Las skins son tarjetas con emoji (👒 🔒 🧭) en lugar del personaje con la skin y las bloqueadas están `disabled` (`SkinSelector.tsx:48`): no se pueden probar. Alcalde (10 pagos a tiempo) es el accesorio menos visible: una raya dorada de ~20 × 3 px sobre la panza, porque el disco de la medalla queda de canto (`Personaje3D.tsx:136-148`). Las miniaturas no llevan accesorio (`apariencia.ts:88-95`): la skin que ganaste solo la ves tú. Límites: 9 bases, un accesorio a la vez (aunque `Apariencia.accesorios` es arreglo y hay tres ranuras), nombre de 24 caracteres, sin color.

**PJ-H10. El festejo en sí es flojo.** Frames cada ~110 ms en el laboratorio: el confeti nace en la cara (`Personaje3D.tsx:297`, y = 1.0 y z = 0.8) y no pasa de y ≈ 1.4, así que nunca sube sobre la cabeza y al principio tapa los ojos; son 12 piezas de escala 0.3, que miden ~18 px a 224 px y ~9 px a 112 px (Detalle). "Una vuelta de 1.6 s" (CLAUDE.md §7) es en realidad un giro de máx. 90° (`:349`, (dt/1.6)·2π·(1 − dt/1.6)) que da el costado justo cuando debería verse la sonrisa. Nada sale del canvas: sin overlay, sin XP que suba, sin háptico. Y el efecto que lo inicia depende de `a.ritmo` (`:326-328`): después del primer festejo, cada cambio de estado lo vuelve a disparar (visto en el laboratorio al pasar de deteriorado a radiante tras "Festejar").

**PJ-H11. Primera impresión: nadie explica que este es "tu personaje".** La raíz `/` es "Elige tu banda" (`page.tsx:20-35`: 7 tarjetas, las primeras 4 con "Debes $…" en rosa), sin personaje; la invitación (`docs/UAT.md:117-119`) y el paso 4 de §2 hablan de un botón "Ver demo con datos de ejemplo" que ya no existe. Nada dice "este es tu personaje y cambia según cómo pagas" (T5 y T6 lo dan por sabido). Home gasta 280 px (35 % de la pantalla) en 7 pills de grupos antes del personaje (y = 458); a 320×568 el personaje queda fuera de la primera pantalla (y = 618). "Datos de ejemplo · sin Supabase" aparece en las pantallas del personaje: jerga de desarrollo frente a quien prueba.

### P2

**PJ-H12. Caras ilegibles en bases oscuras y el deterioro cambia el tono de piel.** Ojos y cejas (`#2A2F45`) contra el cuerpo: persona-nube 2.30 / 2.04 / 1.77 (clean / mild / rekt), búho 3.79 / 3.25 / 2.64, oso 4.13 / 3.57 / 2.90: bajo 3:1 en deteriorado, justo cuando la cara es el canal emocional; a 44-56 px la cara de persona-nube deteriorada es una mancha (captura en dark y light). `tono()` (`paleta.ts:25-30`) desatura y **oscurece el tono de piel** de las personitas: la de piel oscura pasa a casi negro y, junto al nombre "Nube" y la nube de lluvia del estado, puede leerse mal. Contra la card, persona-nube mide 2.5 a 1.9:1 en dark; conejo 1.2-1.8:1 y luna 1.5-2.2:1 en light (pálidos sobre blanco): silueta débil sin aro.

**PJ-H13. "Vivo" y detalles del modelo.** El idle es respiración (±0.04) o brinco y un giro de ±14°; sin parpadeo, mirada, reacción al toque (cero handlers), globos de diálogo ni vibración. La gota del estado apagado es estática (`Personaje3D.tsx:213-224`). Las manos son esferas flotantes, no hay pies ni sombra de contacto: el personaje flota. En conejo deteriorado la nube (y = 2.3) choca con las orejas (≈ 2.4) y se corta arriba (`Orejas`, `Personaje3D.tsx:41-50`). El aura de nivel 10 es un anillo delgado (0.045) y la medalla casi no se ve. Las 9 bases comparten cuerpo (la silueta cambia solo en orejas o pelo). En 128 px el personaje del encuadre actual mide ≈ 80 px (63 % del canvas): hace falta encuadre propio para el héroe.

**PJ-H14. Consistencia de microcopy y color.** Además de PJ-H3 (e): "Probar como" arriba de Yo (en el Inicio ya está plegado en "Herramientas de prueba"); el toggle de tema solo está en Home y raíz; "Bloqueada" duplica el 🔒; "Deteriorado" en el saludo. Bien: tokens, tipografía y radios coherentes; 0 elementos < 44 px; texto AA.

**PJ-H15. Rendimiento y batería.** El render es liviano (14–25 draw calls, 6.2–8.6 mil triángulos, buffer de 448×448 para un canvas de 224×224 CSS; 60 fps sin GPU, 48–59 con CPU ×4, p95 ≤ 33 ms, 0 tareas > 50 ms, también durante festejo y transición). Pero `frameloop="always"` no se pausa cuando el canvas sale de pantalla (no hay `IntersectionObserver`); verificado en Yo: con scroll 0, el canvas (y = 1,050) sigue dibujando ≈ 61 cuadros por segundo aunque no se ve. (Con la pestaña oculta el propio navegador pausa los cuadros.) `useSuave` hace `setState` por cuadro durante 0.7 s. El tope `dpr` 2 deja el personaje suave (no nítido) en pantallas 3×. Estimación (no medición): con ~25 draw calls y ~9 mil triángulos a 448×448 px, un celular de gama media con GPU real debería sostener 30-60 fps; el riesgo está en el JS (+243 kB: 1-2 s de red y parseo en 4G lento, medido con throttling), en la animación continua (batería) y en los visores integrados. Nada de esto está medido en un celular real.

**PJ-H16. Accesibilidad.** `role="img"` con "Personaje Oso" (`Personaje.tsx:56`) sin estado ni skin; el estado accesible está en las pills de texto de las vistas grandes y en el `aria-label` del `Avatar`. Respeta `prefers-reduced-motion` (ritmo 0, `frameloop` a demanda). El festejo no tiene equivalente textual, aunque el aviso de XP sí.

## 3. Principios que propongo

1. **El personaje vive donde está el dinero**: Inicio, hoja de pago y avisos; no en un museo de tres pantallas.
2. **Muestra, no expliques**: cada cambio de dinero tiene un cambio visible (antes → después), su causa y el siguiente paso.
3. **Una sola historia**: base, nombre, skin, nivel, XP y estado salen de una fuente y se ven igual en todas las pantallas.
4. **La recompensa llega a quien la ganó cuando abre la app**, no cuando navega a una pantalla concreta ni si toca "Entendido".
5. **La meta siempre es visible y en números**: qué falta para el siguiente estado, nivel o skin.
6. **Humor sobre el personaje, nunca sobre la persona**: una señal negativa pública a la vez y la salida siempre a la vista.
7. **El 3D se gana su lugar**: primero la figura (PNG), luego el 3D; sin WebGL, con ahorro de datos o con movimiento reducido sigue siendo bonito, no un emoji.
8. **Velocidad primero**: el héroe nunca empuja "Pagar" fuera de la primera pantalla (≤ 2 toques desde que abres la app).
9. **Cozy no es castigo**: sin ranking de deudores, sin pérdidas que no se recuperen, sin culpa.

### 3.1 Referencias (conocimiento general, solo inspiración; sin cifras ni citas)

| Patrón | Dónde se ve en general | ¿Encaja aquí? |
|---|---|---|
| Mascota que celebra un logro con confeti y número que sube | Apps de idiomas y hábitos | **Sí**: al confirmarse un pago y al subir de nivel. No copiar su insistencia con notificaciones |
| Mascota de autocuidado que nunca castiga | Apps de bienestar tipo "mascota que crece con tus hábitos" | **Sí**: estados siempre recuperables; el tono es "está nublado", no "fallaste" |
| Tamagotchi: la mascota se deteriora si la descuidas | Juguetes y apps de crianza virtual | **Parcial**: el deterioro visible sí; la "muerte" o pérdida permanente no (es dinero entre amigos) |
| Juegos cozy: rituales de 10-20 s, feedback suave, sin fallos duros | Juegos de vida tranquila | **Sí**: al abrir, el personaje saluda, dice una frase y muestra una meta |
| Rachas con llama | Apps de idiomas | **Con cuidado**: racha de "pagos a tiempo" derivada de Jardinero/Alcalde, sin "perdiste tu racha" en rojo |
| RPG de hábitos donde el grupo sufre por quien falla | Apps de hábitos con grupos | **No**: castigar a la banda por el rezago de una persona avergüenza |
| Rankings y leaderboards | Apps competitivas | **No** para deudas. Sí reconocimientos positivos ("El Generoso del mes") |
| Feed público de pagos | Apps de pagos sociales | **No**: lo público por defecto debe ser lo simpático (personaje y badges), no lo incómodo |
| Asistente fintech con humor mordaz ("roast") | Apps de finanzas con chatbot | **No**: B4 ya prohíbe sarcasmo con el dinero |

## 4. Propuesta de pantallas e interacciones

### 4.1 Inicio con héroe ("¿qué hago con mi dinero?", ahora con cara)

Héroe de **128 px a la izquierda** y la cifra a la derecha. El bloque mide ≈ 250 px (hoy, encabezado + "Debes" miden ≈ 230: de y = 26 a y = 256), así que el primer "Pagar" (hoy en y = 394) sigue visible sin scroll, también en 375×667 (≈ 415 contra 600 útiles).

Las cifras de los wireframes son ilustrativas, salvo las de Beto (verificadas en §1 y §2).

```
┌────────────────────────────────────┐
│ ┌──────────┐  Hola, Ana 👋         │
│ │  ☁️ 💧    │  Debes                │  ← héroe de 128 px: PNG al
│ │  🐻👒    │  $5,631.68            │    instante, 3D después;
│ │ (PNG→3D) │  a 7 personas         │    tocarlo = reacciona
│ └──────────┘  la más vieja: 4 días │
│ "Llueve por aquí… ¿un pago?" ☁️    │  ← globo de 1 frase según el estado
│ Nivel 3 ▓▓▓▓▓░░░░░ 120/250 XP      │  ← XP también en el Inicio
│ 🌦️ Paga a Nico y Pau → «Nublado»   │  ← el vínculo deuda → personaje
│ ⚡ Hasta +90 XP si pagas hoy        │
└────────────────────────────────────┘
  ⏳ Por confirmar / 🎉 Resultados      ← aquí se monta la revelación (§4.2)
  Te toca pagar
  ┌ 🐱 Nico · hace 4 d  [Pagar $1,291.67] ┐
```

- **PNG primero, 3D después**: el héroe pinta la miniatura de la misma figura (hoy 128 px; para el héroe, 256 px con el mismo script) y reemplaza por el 3D con un fundido solo cuando hay WebGL, hay idle, no hay ahorro de datos y llegó el primer cuadro. Sin 3D, el PNG se mueve con CSS (respiración).
- **Encuadre propio**: distancia ≈ 5.0 y la nube más baja/chica, para que el personaje no encoja a ≈ 80 px.
- **"Si pagas a X pasas a Y"** sale de `lib/game` (nuevo `estadoTrasPagar`, TS puro y 100 % cobertura): simula los pagos con `aplicarPagos` + `estadoAvatar`, ordenados por antigüedad. Para Beto: "Paga a Ana y a Ferni → Apagado; todo → Radiante".
- Con **Radiante y sin deudas** (Ferni) el héroe ocupa el lugar de la tarjeta vacía: salta, brilla, "¡Todo en orden! Hoy brillo gracias a ti 🌻" y "Debes $0.00" va en neutro, no en rosa.

### 4.2 Reacciones del personaje en el viaje de pago

```
1) Ya le pagué (pendiente)           2) Al abrir la app tras confirmarse
┌────────────────────────┐          ┌──────────────────────────────────┐
│ 🐸 (se sienta, ⏳)      │          │ 🎉 ¡Ferni confirmó tu pago!      │
│ "Avisé a Ferni. Te     │          │ ┌──────┐  +50 XP ⚡ (40 → 90)    │
│  cuento cuando         │          │ │ 🐸✨ │  ▓▓▓▓▓▓▓▓▓░ Nivel 1      │
│  confirme"  [Deshacer] │          │ │ salta│  Deteriorado → Apagado    │
└────────────────────────┘          │ └──────┘  Faltan $335.12 para      │
                                    │           brillar de nuevo         │
3) "No me llegó" (en disputa)       │ [Seguir pagando]  [Ver mi camino] │
┌────────────────────────┐          └──────────────────────────────────┘
│ 🐸 (ladea la cabeza)   │
│ "Ferni dice que no le  │          4) Subir de nivel (al confirmar Caro,
│  llegó. Platícalo con  │             90 → 150 XP): el mismo momento con
│  él, ¡sin pena!"       │             "¡Nivel 2!" y la próxima meta
└────────────────────────┘             ("🧭 Explorador: faltan 700 XP").
```

- **La revelación se calcula al abrir el Inicio**: compara lo último visto (estado, nivel, XP) con lo actual; si cambió algo, el héroe hace la transición de estado (0.7 s, ya existe), festeja, la XP sube contando y la barra se llena. No depende de "Entendido" ni del Detalle. Confeti a pantalla completa en DOM/CSS (no es un segundo canvas 3D y no agrega ninguna dependencia).
- **Pagar = reacción pequeña, no festejo**: pendiente (⏳), abono ("¡buen abono! faltan $X"), cancelar (neutro) y rechazo (sin cambiar el estado ni culpar). CLAUDE.md §7 se respeta: un abono no festeja.
- Demo: lo último visto vive en `localStorage`. Con Supabase hay que decidir de dónde sale (p. ej. `profiles.last_seen_at` o los `xp_events` sin ver); conviene anotarlo en `docs/AUDITORIA.md` §6 **antes** de la migración A5.

### 4.3 Progreso y bucles de juego

```
┌ Tu camino ───────────────────────────┐
│ Nivel 3 ▓▓▓▓▓░░░░░ 120/250 XP        │
│ → faltan 130 XP ≈ 3 pagos en < 48 h  │
│ 🧭 Explorador (nivel 5): faltan 455 XP │
│ 🎖️ Alcalde: 7/10 pagos a tiempo (ej.) │
│ ⚡ Rayo: 1/5 pagos en < 24 h (ej.)     │
│ 🌤️ Camino a Radiante: Nico y Pau → «Nublado»; todo → «Radiante»
│ 🧹 Semana limpia: faltan 2 deudas (+25 XP)
└──────────────────────────────────────┘
```

Va en el Inicio (resumida, una línea) y completa en Yo. Los contadores de badges se derivan de los pagos ya registrados (en el mock hay que agregarlos).

| Bucle para el PoC | Qué ve la persona | Regla que usa | ¿Dentro del MVP (§16)? |
|---|---|---|---|
| Pagar y recuperarse | El héroe cambia de estado, sube la XP, festeja | §7 estados y XP (ya existen) | Sí |
| Camino a Radiante | "Paga a Nico y Pau → Nublado" | Derivado de `estadoAvatar` | Sí (solo visibilidad) |
| Próxima meta | "Faltan 455 XP para Explorador"; "Jardinero 3/5" | `levels`, `skins`, `badges` | Sí (solo visibilidad) |
| Semana limpia | "Faltan 2 deudas para tu semana limpia (+25 XP)" | `xpSemanaSinDeudas` ya existe | Sí |
| Racha de pagos a tiempo | "🌱 4 seguidos" (sin castigo al romperla) | Derivable de pagos ≤ 72 h | **No: nueva**; decisión D3 |
| Reto de la banda | "Cierren el viaje antes del domingo y hay confeti de grupo" | Nueva, colaborativa | **No** |
| Logros de primera vez | "Tu primer pago confirmado 🎖️" (sin XP) | Nueva, cosmética | **No** |

### 4.4 Yo: personaje, skins y personalización

```
┌ Yo ────────────────────────────────┐
│         ☁️                          │
│        🐻👒   (héroe 3D, 200 px)    │  ← arriba, sin scroll
│  Ana · Nivel 3 · Nublado           │
│  ▓▓▓▓▓░░░░░ 120/250 XP             │
│  Próxima meta: 🧭 Explorador (455 XP)
├ Tu personaje ──────────────────────┤
│ [🐻][🦊][🐰][🐸][🐱][🦉][🧑][🧑][🧑] │  ← siempre radiantes; al tocar, brinca
│ ☐ Verlos como estoy ahora          │
├ Skins ─────────────────────────────┤
│ [✓ Clásico] [✓ 👒 Jardinero]       │
│ [🔒 🧭 Explorador · 455 XP · Probar]│  ← "Probar": 3 s sobre tu personaje
│ [🔒 🎖️ Alcalde · 7/10 (ej.) · Probar]│
│ [🔒 👑 Leyenda · 3,205 XP]         │
├ Mi nombre ─────────────────────────┤
│ [Ana            ] [Guardar]        │
├ Así te ve tu banda ────────────────┤
│ 🐻 Ana · Nivel 3 · 🌱 Jardinero     │
└────────────────────────────────────┘
```

- Orden: **personaje → progreso → skins → perfil**. "Probar como" pasa a "Herramientas de prueba".
- El héroe de Yo es el único canvas de la pantalla; al elegir un animal se actualiza ahí mismo (brinco + "¡Ahora eres Gato!").
- Una skin bloqueada se puede **probar 3 s** (con candado visible): aumenta el deseo sin cambiar la regla de que "se ganan".
- **Acceso directo**: un botón ✎ de 44 px en la esquina del héroe (Inicio y Home) abre Yo en el selector; hoy la única entrada es la pestaña Yo.
- Después de UAT-1: equipo por **ranura** (cabeza, pecho, mano) en vez de una sola skin; y color, que exige resolver las miniaturas (una por variante o generadas en el cliente; ver D5).

### 4.5 La banda (vista social)

```
┌ La banda (4) ──────────────────────┐
│ 🌻 Al corriente                     │
│  [🦊🧭 Ferni 🌻] [🐰✨ Caro]         │  ← miniaturas con su skin (overlay)
│ ⛅ Con nubes                         │
│  [🐻👒 Ana (tú)] [🐸 Beto]          │  ← una sola señal: el dibujo
├────────────────────────────────────┤
│ Toca a alguien                      │
│ ┌ 🐸 Beto · Nivel 1 ──────────────┐ │
│ │ 👻 El Fantasma (se esfuma al pagar)│
│ │ Contigo: te debe $1,200.00        │
│ │ [Recordar en privado]  (UX-10)    │
│ └──────────────────────────────────┘ │
```

- **Una señal negativa por fila**: estado (el dibujo) o Fantasma, nunca "Deteriorado" + Fantasma + monto rojo. Lo positivo primero.
- Los montos de terceros pasan a neutro (sin rojo) y los de **tu** relación son los que llevan color y acción. No cambia la regla de visibilidad del grupo, solo el peso visual.
- Avatares **neutros** (sin aro de estado ni nube) en Dividir, Confirmar gasto y selector de personaje.
- "Así te ve tu banda" en Yo, y un aviso de una línea en la bienvenida (§4.8): "Tu banda ve tu personaje, tu nivel, tus badges y tu saldo del grupo".
- Lenguaje: la broma es del personaje ("Beto anda con nubes ☁️"), no de la persona.

### 4.6 Microcopy (español de México, cálido; mismas reglas que B4)

| Momento | Línea de ejemplo |
|---|---|
| Radiante | "¡Todo en orden! Hoy brillo gracias a ti 🌻" |
| Apagado (propuesto: Nublado) | "Ando un poquito nublado ☁️ Un pago más y vuelvo a brillar." |
| Deteriorado (propuesto: Bajo la lluvia) | "Llueve por aquí 🌧️ ¿Me ayudas con un pago para que salga el sol?" |
| Ya le pagué | "Avisé a Nico ⏳ Te cuento cuando confirme." |
| Abono | "¡Buen abono! Faltan $335.12 para saldar con Nico." |
| Confirmado | "¡Nico confirmó! +50 XP ⚡ Pasaste de «Bajo la lluvia» a «Nublado»." |
| Subir de nivel | "¡Nivel 2! Te faltan 130 XP para el nivel 3." |
| No me llegó | "Nico dice que no le llegó. Platícalo con él, ¡sin pena!" |
| Para la banda | "Beto anda con nubes ☁️" (sin "Deteriorado") |

### 4.7 Ajustes al modelo 3D (gratis, sin assets externos)

1. **Escenario**: un disco/sombra de contacto del color del estado (`grass-soft`, `lemon-soft`, `rose-soft`) bajo el personaje: lo ancla, une héroe y miniaturas (que ya tienen aro) y arregla la silueta débil de los pálidos en light.
2. **Encuadre por tamaño** (128, 168, 224 px) y nube más baja o al costado en el conejo.
3. **Festejo**: confeti que nace sobre la cabeza (y ≈ 2.2) y cae, ≥ 24 piezas y escala según el tamaño del canvas; vuelta completa y rápida (0.6 s) al inicio y luego cara a cámara con la sonrisa; separar "transición" de "festejo" para que `ritmo` no lo re-dispare.
4. **Cara**: ojos con brillo blanco y cejas más claras en bases oscuras; parpadeo cada 3-5 s.
5. **Medalla** 2.5× y **aura** más gruesa (≈ 0.09) con brillo; gota de sudor animada.
6. **Miniaturas**: regenerar con margen para la nube (cámara ≈ 5.8) y con overlay del accesorio de la skin.
7. **Deterioro sin tocar el tono de piel** de las personitas: desaturar panza y pelo; el estado se lee por nube, postura y cara.
8. **Pausa** del render cuando el canvas no está en pantalla (`IntersectionObserver`).

### 4.8 Bienvenida ("Conoce a tu personaje")

Una sola vez (y desde "Herramientas de prueba"), omitible, 3 pasos: **(1)** "Este es tu personaje: cambia según cómo pagas" con un carrusel automático de sus tres estados; **(2)** "Paga rápido y gana XP, niveles y skins"; **(3)** "Tu banda ve tu personaje, tu nivel, tus badges y tu saldo". Termina en el selector de personaje y luego en el Inicio. Nunca aparece en el camino de Dividir (≤ 3 interacciones).

## 5. Decisiones que necesito de Yerif

1. **¿El Inicio tiene héroe del personaje?** *Toca CLAUDE.md §7 "Rendimiento" (lista de pantallas con 3D) y "Inicio".* Recomendación: **sí**, 128 px, con PNG primero y 3D después (WebGL + idle + sin ahorro de datos). Trade-off: +243 kB gzip de JS en la pantalla más visitada (fuera de la ruta crítica y cacheado después), un canvas más (sigue siendo uno por pantalla) y más batería (se mitiga pausando fuera de pantalla). Alternativa: héroe 2D (PNG + CSS) en el Inicio y 3D solo en Home, Yo y Detalle: cero JS extra, pero sin transición ni festejo 3D justo en la pantalla clave (se compensa con fundido + confeti DOM). Si PJ-02 sale mal, esta es la salida.
2. **¿Cómo se llaman y cómo se exhiben los estados ante la banda?** *Toca CLAUDE.md §1 (reputación), §7 (tabla de estados y badges públicos) y B4.* Recomendación: conservar las claves `clean/mild/rekt` y cambiar solo las etiquetas visibles a clima ("Radiante", "Nublado", "Bajo la lluvia"), más tres reglas: una señal negativa por fila (estado o Fantasma, nunca ambos), avatares neutros fuera de reputación y "se esfuma al pagar" en el Fantasma. Trade-off: "Deteriorado" comunica urgencia y se pierde algo de presión (que pasa al héroe y a la XP); B4 y `docs/PROMPTS.md` usan "radiante/apagado/deteriorado": hay que subir la versión de B4 y correr sus evals (CLAUDE.md §15.8) o aceptar vocabularios distintos un tiempo.
3. **¿Qué recompensas entran a UAT-1?** *Solo toca CLAUDE.md §7 y §16 si se aceptan reglas nuevas.* Recomendación: solo visibilidad y festejo con reglas que ya existen (revelación al abrir, festejo de nivel, camino a Radiante, próxima meta, semana limpia visible); rachas, retos de la banda y logros de primera vez, a UAT-2 con datos reales. Trade-off: una sesión de 10 minutos con pocos "premios" nuevos (se compensa con feedback más rico por cada pago). Si prefieres meterlos ya, antes se actualiza CLAUDE.md (§15.16: no agregar features fuera del MVP sin actualizarlo primero; y §15.20: durante una ronda no se agregan features).
4. **¿Las skins se ven en la banda y se pueden probar bloqueadas?** *Toca CLAUDE.md §7 "Rendimiento" (miniaturas "sin accesorio") y no cambia "las skins se ganan".* Recomendación: overlay 2D del accesorio en las miniaturas (sin PNG nuevos) y "Probar" 3 s con el candado visible; equipo por ranura después de UAT-1. Trade-off: el overlay es una aproximación hasta tener miniaturas por skin (135 PNG ≈ 1.2 MB a 128 px, estimado); probar podría restar misterio (lo esperado es lo contrario: aumenta el deseo; se valida en UAT-1).
5. **¿Se invierte ya en modelos finales o personalización de color?** *Toca CLAUDE.md §7 "Modelos" y §0.1 (free tier): cualquier costo de diseño se aprueba antes.* Recomendación: **no antes de UAT-1**; hacer las mejoras procedurales gratis de §4.7 y decidir con feedback: si ≥ 4 de 5 piden "más mío" (color, ropa, más animales), se encarga (Blender o ilustrador) usando las referencias de estilo de PJ-03. Trade-off: el look procedural puede limitar el "wow" con quien espere calidad de juego; a cambio no se gasta antes de validar.

## 6. Plan de tickets

Estimación de analista, sin spikes: **S** ≤ ½ día · **M** 1-2 días · **L** ≥ 3 días. Todo `lib/game` nuevo lleva su test con cobertura 100 % (CLAUDE.md §11) y cada ticket de UI, su E2E con `data-testid` (§11). Hasta que PJ-01…PJ-04 se registren en `docs/SPRINTS.md` (hoy solo aparece PJ-01 en `docs/UAT.md` §3 y PJ-04 en el historial de git), conviene anotarlos junto con estos PX.

**Corte A: imprescindible para que UAT-1 impacte** (≈ 6-10 días; si solo hay 3-4: PX-02, PX-01 y PX-03, con el festejo del héroe al abrir como versión mínima de PX-04)

| ID | Qué | Prio | Est. | Depende de | Hallazgos |
|---|---|---|---|---|---|
| PX-01 | Una sola fuente del personaje: Home, Yo y Confirmar leen perfil editado, XP, nivel y estado derivados de los pagos confirmados; ícono de "Yo" = tu miniatura; "Debes $0.00" neutro y color semántico también en light. E2E: cambiar a Gato y verlo en Home y La banda | P0 | M | — | H3 |
| PX-02 | Carga sin parpadeo: el respaldo es la miniatura PNG (no el emoji) hasta el primer cuadro 3D, con fundido; precarga del chunk en idle; sin WebGL o con ahorro de datos, PNG grande (el script de miniaturas a 256 px: +27 PNG ≈ 0.7 MB, estimado) con respiración CSS | P0 | S-M | — | H4 |
| PX-03 | Héroe del Inicio: 128 px junto a "Debes", globo de 1 frase, línea de nivel/XP, "si pagas a X pasas a Y" (`estadoTrasPagar`), toque = reacción | P0 | M | PX-01, PX-02, D1 | H1 |
| PX-04 | Revelación al abrir la app (estado, nivel, XP contando, festejo y festejo de nivel), sin depender de "Entendido"; confeti DOM; reacciones a pagar, abonar, rechazar y cancelar | P0 | M-L | PX-03 | H2, H10 |
| PX-05 | Yo reordenada: héroe → nivel, XP y próxima meta → skins → perfil → "Así te ve tu banda"; "Probar como" a herramientas; selector siempre radiante con vista previa viva | P0 | M | PX-01 | H5, H6, H9 |
| PX-06 | Medidor en `?debug=1` (ms hasta el primer cuadro 3D, FPS mediana y p5, draw calls) para poder cerrar PJ-02 en celulares reales | P1 | S | — | H15 |

Hecho cuando (Corte A):
- **PX-01**: tras renombrar a "Anita" y elegir Gato, Home (3D y La banda), Confirmar gasto, los chips de Yo y la barra inferior muestran lo mismo; tras pagar a los tres, Yo y Detalle dicen el mismo nivel y XP; E2E que lo prueba.
- **PX-02**: con CPU ×4 y 1.6 Mbps siempre hay una figura visible (hueco = 0 s); sin WebGL se ve el PNG de la base, no el emoji; sin regresión de FCP/LCP del Inicio.
- **PX-03**: el primer "Pagar" se ve sin scroll en 375×667; el héroe muestra estado, nivel/XP y "si pagas…"; un solo canvas por pantalla; E2E con `data-testid="personaje"` en el Inicio.
- **PX-04**: Beto (T5) abre el Inicio después de las confirmaciones y ve la revelación aunque no entre al Detalle; el festejo de nivel sale al cruzar 100 XP; "Reiniciar" la deja repetible.
- **PX-05**: el 3D y el nivel de Yo se ven sin scroll (también en 375×667); al tocar un animal el héroe cambia y brinca; "Probar como" no aparece en el flujo del producto.
- **PX-06**: `?debug=1` muestra ms hasta el primer cuadro 3D, FPS (mediana y p5) y draw calls, y "Copiar reporte" los incluye.

Corte A y B no agregan servicios ni dependencias de pago: todo sale de three, CSS y DOM que ya están.

**Corte B: si hay tiempo (sube el "wow" y baja el riesgo social)**

| ID | Qué | Prio | Est. | Depende de | Hallazgos |
|---|---|---|---|---|---|
| PX-07 | Salvaguardas sociales: una señal negativa por fila, avatares neutros en Dividir/Confirmar/selector, lo positivo primero, "se esfuma al pagar", etiquetas según D2, "Así te ve tu banda" | P1 | S-M | D2 | H7 |
| PX-08 | "Tu camino": nivel, próxima skin con XP o pagos faltantes, contadores de Jardinero/Alcalde/Rayo, camino a Radiante y semana limpia | P1 | M | PX-05 | H6 |
| PX-09 | Skins visibles: overlay del accesorio en miniaturas (FriendRow, Inicio) y "Probar" en las bloqueadas; miniaturas regeneradas con margen (nube sin cortar) | P1 | S-M | D4 | H8, H9 |
| PX-10 | Pulido del festejo y del modelo (§4.7 puntos 1-5 y 7): confeti, vuelta, separar festejo de `ritmo`, escenario/sombra, medalla y aura, nube del conejo | P1 | M | — | H10, H13 |
| PX-11 | Bienvenida "Conoce a tu personaje" y actualizar `docs/UAT.md` (§2 paso 4, §4 datos del demo, §8 mensaje) | P1 | S | — | H11 |
| PX-12 | Legibilidad: ojos con brillo y cejas claras en bases oscuras, aros ≥ 3:1 en light y glifo de estado donde importa, y test de contraste **no texto** junto al de `lib/contraste` | P2 | S-M | — | H8, H12 |

**Después de UAT-1 (sin costo externo)**

| ID | Qué | Prio | Est. | Depende de | Hallazgos |
|---|---|---|---|---|---|
| PX-13 | "Vivo": parpadeo, saludo al abrir, reacción al toque con globo (§4.6), háptico opcional en Android, pausa de render cuando el canvas no está en pantalla | P2 | M | PX-03 | H13, H15 |
| PX-14 | Equipo por ranura (cabeza, pecho, mano) en lugar de una sola skin. **Toca CLAUDE.md §7 (Skins)** | P2 | S-M | D4 | H9 |
| PX-15 | Rachas de pagos a tiempo, retos de la banda y logros de primera vez. **Reglas nuevas: actualizar CLAUDE.md §7 y §16 primero** | P2 | M-L | D3 | H6 |
| PX-16 | Resumen semanal contado por el personaje (globo) con B4 | P2 | M | A11, D2 | — |

**Cuestan dinero o assets externos (requieren aprobación explícita de Yerif)**

| ID | Qué | Est. | Depende de |
|---|---|---|---|
| PX-17 | Modelos glTF finales, más bases y color personalizable (Blender o ilustrador), y cualquier audio o animación comprada. Costo de diseño externo (CLAUDE.md §0.1 y §7 "Modelos") | L | D5, PJ-03 |

## 7. Cómo validar (UAT-1)

Ajustes a `docs/UAT.md` §4 (T5 y T6) y §6, más tareas nuevas. Todo en el celular, primero dark y luego light, **abierto en Chrome o Safari** (no en el visor integrado de WhatsApp o Instagram: puede cambiar WebGL y `localStorage`, y el demo guarda ahí los pagos).

| Tarea | Qué se le dice | Qué observamos | Meta |
|---|---|---|---|
| T5′ (ajustada) | "Eres Beto y le debes a tres amigos. Paga lo que debes empezando por quien quieras y cuéntame en voz alta qué ves que cambia." Después, con las confirmaciones hechas (`?u=`): "Abre la app otra vez como Beto." | ¿Dice qué ganó o recuperó sin ayuda? ¿Reacciona al festejo? ¿Dónde mira primero? | **≥ 4 de 5** explican qué cambió (ya existe) y **≥ 3 de 5** reaccionan sin que se les pregunte (sonrisa, risa, comentario) |
| T6′ (ajustada) | "Abre tu perfil. ¿Qué te falta para la siguiente skin y más o menos cuántos pagos son?" | ¿Responde con número sin hacer cuentas? | ≥ 4 de 5 con el número correcto ±1 |
| T12 (nueva, 5 segundos) | Mostrar el Inicio de Ana 5 s y ocultarlo: "¿Qué recuerdas? ¿Qué es esa figura? ¿Cómo está?" | ¿Nombra al personaje y su estado sin que se le pregunte por él? | ≥ 4 de 5 |
| T13 (nueva) | "Quieres ser un zorro con la skin de Explorador. Hazlo y dime cómo se ve tu personaje en tu grupo." | Tiempo y ayuda; ¿lo ve reflejado en Home y en La banda? | < 30 s sin ayuda; 5 de 5 lo ven en todas partes |
| T14 (nueva, reputación) | Enseñar la fila de Beto en La banda: "Si fueras Beto, ¿cómo te sentirías si tu banda ve esto? 1 (muy incómodo) a 5 (me da risa)". Si hay ≤ 2: "¿qué le quitarías?" | Comodidad y qué cambiarían | **Nadie ≤ 2**; mediana ≥ 4 |

Preguntas finales nuevas (5 min): **0-10** "¿qué tanto te dieron ganas de pagar rápido por tu personaje?" (mediana ≥ 7); **0-10** "¿qué tan vivo se sintió?" (mediana ≥ 7); "¿qué le cambiarías?" (abierta); y, si existe PX-13, "¿lo tocaste?, ¿qué esperabas que hiciera?".

Medidas técnicas (observación + `?debug=1` con PX-06): **0 de 5** ven un hueco vacío > 1 s; el 3D aparece en < 2 s con WiFi o 4G; FPS p5 ≥ 30 en el celular más modesto del grupo (cierra PJ-02); T11 no empeora con el héroe presente (mediana < 10 s hasta el primer "Pagar").

Criterio de entrada nuevo para `docs/UAT.md` §3: PX-01 a PX-05 hechos y PJ-02 cerrado con PX-06 en al menos un celular de gama baja (durante la ronda no se agregan features). Filas nuevas para `docs/UAT.md` §6: "Comprensión del progreso (T6′)", "Reacción al festejo (T5′)", "Exhibición (T14)" y "Carga del personaje". Dos detalles del guion: §4 "Datos del demo" dice que Ana debe $4,821.39 en 4 grupos y que le deben $2,240.00, pero desde UX-02 el Inicio suma deudas directas por persona ($5,631.68 a 7 personas y $3,050.29); y el mensaje de invitación (§8) menciona un botón que ya no está.

## 8. Riesgos y supuestos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **No medí FPS, batería, temperatura ni estabilidad del contexto WebGL en un celular real** (PJ-02) | Un celular modesto podría ir a < 30 fps o perder el contexto (visores integrados, iOS en ahorro de energía) | PX-06 y probar en 2 celulares (uno de gama baja) antes de invitar; si falla, héroe 2D (D1, alternativa) |
| El héroe en el Inicio agrega 243 kB al flujo más usado | LCP y datos en redes lentas | PNG primero, 3D en idle, `saveData`, caché inmutable de `_next/static` |
| Abrir el enlace desde WhatsApp o Instagram | WebGL o `localStorage` distintos; se pierde el estado del demo | Pedir "ábrelo en Chrome o Safari"; respaldo PNG decente (PX-02) |
| Probar con 3-5 amigos cercanos subestima la incomodidad de un grupo grande | Falsa confianza sobre la reputación pública | T14 con el peor caso (Beto) y escala 1-5; repetir en UAT-2 con la banda real |
| Renombrar estados toca B4, PROMPTS y CLAUDE.md | Vocabularios distintos en UI y resumen semanal | D2: subir B4 a v2 con evals, o aceptar el desfase un tiempo |
| Mucho alcance para una semana | UAT-1 se retrasa o se agregan features durante la ronda (CLAUDE.md §15.20) | Corte A (con la versión de 3-4 días si aprieta); Corte B solo si sobra tiempo |
| El demo depende de `localStorage` | Si la persona limpia datos o cambia de navegador pierde sus pagos y su personaje | Decirlo en la invitación; "Reiniciar" en herramientas de prueba |
| Mediciones con SwiftShader | La GPU real cambia tiempos de render; el throttling de CPU de Chromium no afecta el proceso de GPU | Tomarlas como orden de magnitud y comparar entre pantallas, no como cifras de celular |

**Supuestos:** UAT-1 corre sobre la preview de `develop` con 3-5 personas en su celular; las cifras de XP por semana (≈ 145) son un supuesto de uso, no una medición; los números del demo son los del build de hoy (cambian respecto de `docs/UAT.md`); la estimación de esfuerzo es de analista.

**Lo que no pude medir ni verificar:** FPS, batería y temperatura en celular real; Safari/iOS y visores integrados; render con GPU real (colores y antialiasing); lectores de pantalla reales (VoiceOver y TalkBack); tiempos de red de las personas; y, sobre todo, la **reacción humana**: el impacto emocional, el humor y la incomodidad social son juicios de analista hasta que UAT-1 los mida.

## 9. Anexo: cómo se midió (reproducible)

- **Build y servidor:** `VERCEL_ENV=preview NEXT_TELEMETRY_DISABLED=1 npm run build` y `VERCEL_ENV=preview npx next start -p 3470`.
- **Navegador:** Chromium con `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, viewports 375×812 (DPR 2, táctil, móvil); sin WebGL con `--disable-gpu --disable-webgl`; movimiento reducido con `reducedMotion: "reduce"`; tema con `localStorage["cc-theme"]`.
- **Rutas:** `/dev/demo?u=ana|beto|ferni`, `/dev/demo/yo?u=…`, `/dev/demo/g/oaxaca`, `/dev/demo/g/oaxaca/detalle?u=beto`, `/dev/demo/dividir?u=ana`, `/dev/demo/grupos?u=ana`, `/dev/personaje`.
- **Carga:** CDP `Network.loadingFinished` (bytes en la red, gzip), `Emulation.setCPUThrottlingRate` = 4 y `Network.emulateNetworkConditions` a 1.6 Mbps y 150 ms; `MutationObserver` sobre `[data-testid="personaje"]` para la cronología respaldo → vacío → canvas; `PerformanceObserver` para paint, `layout-shift` y `longtask`.
- **Render:** conteo de `drawElements`/`drawArrays` por cuadro (parche del contexto WebGL) y rAF durante 3 s.
- **Contraste y color:** fórmula WCAG con los tokens de `src/app/globals.css` y los colores de `paleta.ts` (incluye `tono()`), y ΔE76 en Lab entre `tono(cuerpo, 1 | 0.7 | 0.3)`; análisis de las 27 miniaturas con la caja opaca y la fila superior.
- **Flujos:** Beto paga a Ferni y Ferni confirma (con y sin "Entendido" antes de entrar al detalle); Beto paga a Ana, Ferni y Caro y se mira el estado tras cada confirmación; edición de nombre y personaje de Ana y revisión de Inicio, Home, Detalle, Dividir, Yo y Confirmar.
