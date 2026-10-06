# Modelos finales del personaje — spike PX-17

> Fecha: 2026-10-06 · Pedido de Yerif: "me gustaría ver la posibilidad de invertir en modelos finales, aunque sea hechos por nosotros". Este documento responde **qué caminos hay, qué cuesta cada uno y qué probamos de verdad**. No cambia reglas del juego ni agrega costos: cualquier gasto externo se aprueba antes (CLAUDE.md §0.1 y §7).

## 1. Dónde estamos

El personaje de hoy es **procedural**: se arma en código con esferas, conos y cilindros de three (`Personaje3D.tsx`), 9 bases que comparten cuerpo (cambian orejas, pelo y colores) y accesorios por socket. Ventajas: cero archivos, cero licencias, peso mínimo, estados y festejo animados por código. Límites: las 9 bases comparten silueta, no hay manos ni pies modelados, y el "look" depende de lo que se pueda decir con primitivas.

Con las mejoras de PX-01 a PX-12 (disco de contacto, caras legibles, festejo, miniaturas de 256 px) el look procedural ya da para UAT-1. La pregunta es qué viene **después**.

## 2. Qué probamos (spike, solo dev/preview)

Para saber si "modelo como archivo" es viable sin gastar nada, construimos el camino completo:

1. **Exportador** (`/dev/personaje/exportar?base=oso`): convierte el modelo procedural de cualquier base en un `.glb` (formato estándar que abren Blender, three y cualquier visor) con `GLTFExporter`.
2. **Visor** (`/dev/personaje/glb?url=/modelos/oso.glb`): carga un `.glb` con `GLTFLoader` y lo dibuja con las mismas luces y cámara del personaje. El resultado se ve idéntico al procedural (verificado a ojo con capturas).
3. **Optimización** con `gltf-transform optimize --compress meshopt` (herramienta gratuita de línea de comandos).

Medido sobre las 9 bases (estado radiante):

| Medida | Resultado |
|---|---|
| `.glb` exportado tal cual | 151–192 KB por base (49–62 KB con gzip) |
| `.glb` optimizado (meshopt) | **36–42 KB por base (17–19 KB con gzip)**, 4–5× menos |
| Las 9 bases optimizadas | ≈ 350 KB en total; se descarga **una por pantalla** (≈ 18 KB gzip cada una) |
| Peso extra del cargador de `.glb` en la ruta | ≈ +9 KB de JS (pantalla del visor 364 kB vs 355 kB de la captura) |
| Carga + primer dibujo del visor (WebGL por software, sin GPU) | ≈ 0.5 s |
| Triángulos del modelo procedural | 6.2–8.6 mil (medido en PX-06 y el análisis del personaje) |

Conclusión técnica: **es viable y barato**. Un modelo final de ~40 KB optimizado pesa menos que el JS que hoy hace falta para dibujar el procedural, y quien lo haga puede reemplazar el modelo sin tocar `lib/game` (el descriptor `Apariencia` sigue mandando).

## 3. Caminos posibles

| | Qué es | Costo | Tiempo (estimación de analista) | Calidad esperada | Riesgo |
|---|---|---|---|---|---|
| **A. Procedural mejorado** | Seguir en código: siluetas distintas por base, manos y pies, ropa, ojos más expresivos, sombreado "toon" con contorno | $0 | 1–2 días por tanda de mejoras | Buena para PoC; techo "cozy simple" | Bajo; ya es el camino que usamos |
| **B. Código → glb → pulido** | Exportar el modelo actual a `.glb` (ya funciona) y que alguien con Blender lo **refine** (esculpir orejas, hocico, ropa) sin partir de cero | $0 (Blender es gratis) | 1 día de pipeline + modelado de quien lo pula | Buena–muy buena | Medio: necesita a alguien que sepa Blender |
| **C. Blender desde cero, hecho por nosotros** | Modelos nuevos con la especificación de §4 (por Yerif o por quien se sume) | $0 en herramientas; costa tiempo | Días por base (aprendizaje incluido) | La mejor "marca propia" | Medio–alto: depende del tiempo y la habilidad |
| **D. Encargo externo** | Ilustrador/modelador 3D que entregue `.glb` según la especificación | **Costo externo: no cotizado, requiere aprobación explícita de Yerif** | Semanas | La más alta | Costo y dependencia de un tercero; hay que cuidar licencias (derechos de uso y modificación) |

Un camino mixto es razonable: **A ahora, B/C como piloto con una sola base** y D solo si el feedback de UAT pide "más calidad" que A/B/C no alcanzan.

## 4. Especificación para cualquier modelo final (B, C o D)

Pensada para que el modelo **no rompa el sistema de estados** y se pueda cambiar sin tocar las reglas:

- **Presupuesto:** ≤ 6,000 triángulos por personaje y ≤ 45 KB ya optimizado (meshopt), un solo archivo `.glb` por base.
- **Sin texturas:** colores por material, con **nombres fijos** (`cuerpo`, `panza`, `detalle`, `ojos`, `trazo`) para que el código los tiña según el estado (`tono()` desatura y oscurece: así radiante/nublado/bajo la lluvia se aplican a cualquier modelo).
- **Partes rígidas con nombre** en lugar de huesos: `cabeza`, `cuerpo`, `mano_izq`, `mano_der`, `orejas`/`cola`. El código las mueve (respiración, brinco, postura encorvada o ladeada) como hoy; **no hace falta rig ni animaciones esqueléticas**.
- **Sockets** como nodos vacíos (`socket_cabeza`, `socket_pecho`, `socket_mano`) donde se enganchan las skins (accesorios).
- **Cara legible:** ojos con esclera o brillo y trazo con buen contraste en bases oscuras (ya resuelto en el procedural; mantener).
- **Origen y escala** iguales a las del modelo procedural (el exportador del spike da la referencia exacta).
- **Licencia clara:** si lo hace un tercero, derechos de uso, modificación y redistribución para la app; nada de IP de terceros (ni Nintendo/Animal Crossing).

## 5. Cómo se integraría (cuando se decida)

1. Archivos en `public/modelos/{base}.glb`, servidos con caché larga; el cargador (`GLTFLoader` + decodificador meshopt) en el mismo chunk diferido del 3D.
2. `Personaje3D` usa el `.glb` si existe para esa base y cae al procedural si no: **migración base por base**, sin big bang.
3. Las **miniaturas PNG se regeneran con el mismo script** (`npm run personajes:miniaturas`) desde el modelo nuevo; un test ya exige que existan las 27.
4. Los accesorios de skin siguen siendo del procedural hasta que el modelo traiga sockets (o se modelan igual y se cargan por socket).
5. Evals y UI no cambian: lo único nuevo son los archivos y el cargador.

Esfuerzo de integración (estimación): **S–M** (1–2 días) una vez que exista el primer `.glb` que cumpla la especificación.

## 6. Recomendación

1. **Para UAT-1**: dejar el procedural (ya con las mejoras de PX-01 a PX-12). No gastar antes de validar.
2. **Piloto después de UAT-1 (gratis)**: una sola base (oso) por el camino B o C: el exportador del spike entrega la referencia, Blender es gratis y la especificación de §4 evita sorpresas. Se mide peso y se compara en UAT con las otras 8.
3. **Decidir D (externo) solo con evidencia**: si ≥ 4 de 5 personas piden "más mío/más bonito" y A/B/C no alcanzan. Antes se cotiza y se aprueba.

**Lo que necesito de Yerif:** ¿quién modelaría el piloto (tú, alguien del equipo o lo exploramos juntos) y con cuánto tiempo? Y confirmar que cualquier costo externo (herramientas de pago, assets, encargo) se aprueba antes, como ya dice CLAUDE.md §7.

## 7. Qué quedó en el repo (solo dev/preview, `/dev/*` da 404 en producción)

- `src/components/personaje/ExportadorGlb.tsx` y `/dev/personaje/exportar?base=…&estado=…`: exporta el modelo a `.glb` (botón y `window.__exportarGlb()` para scripts).
- `src/components/personaje/VisorGlb.tsx` y `/dev/personaje/glb?url=/modelos/…`: visor de prueba (los `.glb` de muestra **no** se versionan).
- `Personaje3D` entrega su escena con `onEscena` (solo lo usa el exportador).
- E2E `tests/e2e/modelos-glb.spec.ts`: cada base exporta un glTF binario válido y de peso razonable; `/dev/personaje/*` nuevos dan 404 en producción.

Para repetir las mediciones: `VERCEL_ENV=preview npm run build && VERCEL_ENV=preview npx next start`, exportar con la página y optimizar con `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt`.
