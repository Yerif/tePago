"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import type { Accesorio, Apariencia, BaseSlug, Efecto } from "@/lib/game/apariencia";
import { BASES } from "@/lib/game/apariencia";
import { resumenFps } from "@/lib/game/rendimiento";
import { setDebug } from "@/lib/debug";
import { contraste } from "@/lib/contraste";
import { COLORES, tono } from "./paleta";

const OSCURO = "#2A2F45";
/** Disco bajo el personaje: el color suave del estado (radiante, nublado, bajo la lluvia). */
const COLOR_ESCENARIO = { clean: "#B8E3B6", mild: "#FFE985", rekt: "#FFB3C6" } as const;
const ORO = "#FFD84D";
/** Centra el personaje (con nube y accesorios) en el encuadre de la cámara. */
const BASE_Y = -0.95;

/** Todo se dibuja con geometrías de three: sin archivos ni licencias. Los modelos glTF definitivos reemplazan esta función. */
function Orejas({ base, color, detalle }: { base: BaseSlug; color: ReturnType<typeof tono>; detalle: ReturnType<typeof tono> }) {
  switch (base) {
    case "oso":
      return (
        <>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 1.55, 0]}>
              <sphereGeometry args={[0.24, 20, 16]} />
              <meshStandardMaterial color={detalle} />
            </mesh>
          ))}
        </>
      );
    case "zorro":
    case "gato":
      return (
        <>
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, 1.65, 0]} rotation={[0, 0, x > 0 ? -0.25 : 0.25]}>
              <coneGeometry args={[0.24, 0.5, 4]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </>
      );
    case "conejo":
      return (
        <>
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 1.95, 0]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
              <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </>
      );
    case "rana":
      return (
        <>
          {[-0.34, 0.34].map((x) => (
            <mesh key={x} position={[x, 1.58, 0.28]}>
              <sphereGeometry args={[0.2, 18, 14]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </>
      );
    case "buho":
      return (
        <>
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} position={[x, 1.6, 0]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
              <coneGeometry args={[0.16, 0.36, 4]} />
              <meshStandardMaterial color={detalle} />
            </mesh>
          ))}
        </>
      );
    default:
      // Personas: pelo como casquete sobre la cabeza.
      return (
        <mesh position={[0, 1.2, -0.04]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[0.76, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          <meshStandardMaterial color={detalle} />
        </mesh>
      );
  }
}

const CLARO = "#F6F2EA";
/** Debajo de este contraste (WCAG, 3:1 mínimo para elementos gráficos) la cara oscura se pierde en el cuerpo. */
const CONTRASTE_MINIMO_CARA = 3.5;

/**
 * Cara: ojos con un brillo, cejas y boca. Si el cuerpo es oscuro (o se oscurece al deteriorarse) los ojos llevan esclera
 * clara y las cejas y la boca se vuelven claras, para que la cara —el canal emocional— se lea en las 9 bases (PX-12).
 */
function Cara({ animo, fondo }: { animo: Apariencia["animo"]; fondo: string }) {
  const ojoY = animo === "triste" ? 1.0 : 1.06;
  const oscuro = contraste(OSCURO, fondo) < CONTRASTE_MINIMO_CARA;
  const trazo = oscuro ? CLARO : OSCURO;
  return (
    <group position={[0, 0, 0.62]}>
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          {oscuro ? (
            <mesh position={[x, ojoY, 0.03]} scale={[1, 1.15, 0.6]}>
              <sphereGeometry args={[0.115, 16, 12]} />
              <meshStandardMaterial color={CLARO} />
            </mesh>
          ) : null}
          <mesh position={[x, ojoY, 0.07]}>
            <sphereGeometry args={[oscuro ? 0.062 : 0.075, 14, 12]} />
            <meshStandardMaterial color={OSCURO} />
          </mesh>
          <mesh position={[x + 0.025, ojoY + 0.03, 0.125]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          {animo !== "contento" ? (
            // Cejas de pena: el extremo de adentro sube (más inclinadas si está triste).
            <mesh position={[x, ojoY + 0.19, 0.05]} rotation={[0, 0, (x > 0 ? -1 : 1) * (animo === "triste" ? 0.5 : 0.28)]}>
              <boxGeometry args={[0.2, 0.035, 0.03]} />
              <meshStandardMaterial color={trazo} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* Sonrisa si está contento; línea recta preocupado; ceño si está triste. */}
      <mesh
        position={[0, animo === "contento" ? 0.86 : 0.8, 0.05]}
        rotation={[0, 0, animo === "contento" ? Math.PI : 0]}
        scale={animo === "preocupado" ? [1, 0.2, 1] : [1, 1, 1]}
      >
        <torusGeometry args={[0.15, 0.028, 8, 20, Math.PI]} />
        <meshStandardMaterial color={trazo} />
      </mesh>
    </group>
  );
}

function PiezaAccesorio({ a }: { a: Accesorio }) {
  switch (a.slug) {
    case "sombrero-paja":
      return (
        <group position={[0, 1.78, 0]} rotation={[0.08, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.42, 0.5, 0.3, 24]} />
            <meshStandardMaterial color="#E8C77A" />
          </mesh>
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.06, 28]} />
            <meshStandardMaterial color="#D9B25F" />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.08, 24]} />
            <meshStandardMaterial color="#7DC67E" />
          </mesh>
        </group>
      );
    case "medalla":
      return (
        <group position={[0, 0.1, 0.5]}>
          <mesh position={[0, 0.12, -0.02]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.14, 0.4, 0.02]} />
            <meshStandardMaterial color="#C4A8E8" />
          </mesh>
          <mesh position={[0, -0.14, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.06, 24]} />
            <meshStandardMaterial color={ORO} metalness={0.4} roughness={0.35} emissive={ORO} emissiveIntensity={0.25} />
          </mesh>
        </group>
      );
    case "brujula":
      return (
        <group position={[0.78, 0.05, 0.25]} rotation={[0.9, 0, 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 22]} />
            <meshStandardMaterial color="#74C2E8" />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.03, 22]} />
            <meshStandardMaterial color="#FFFBF0" />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[0, 0.6, 0]}>
            <boxGeometry args={[0.04, 0.02, 0.28]} />
            <meshStandardMaterial color="#FF8FAB" />
          </mesh>
        </group>
      );
    case "corona":
      return (
        <group position={[0, 1.82, 0]}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.4, 0.2, 5]} />
            <meshStandardMaterial color={ORO} metalness={0.5} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.sin((i / 5) * Math.PI * 2) * 0.34, 0.2, Math.cos((i / 5) * Math.PI * 2) * 0.34]}>
              <coneGeometry args={[0.1, 0.24, 4]} />
              <meshStandardMaterial color={ORO} metalness={0.5} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
  }
}

/** Efectos animados del estado: brillos, gota, nubecita con lluvia y aura. */
function Efectos({ efectos, ritmo, base }: { efectos: Efecto[]; ritmo: number; base: BaseSlug }) {
  const gota = useRef<Group>(null);
  const brillos = useRef<Group>(null);
  const lluvia = useRef<Group>(null);
  const aura = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * ritmo;
    if (brillos.current) brillos.current.rotation.y = t * 1.2;
    if (aura.current) aura.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    // La gota de sudor resbala y vuelve a empezar (quieta con movimiento reducido).
    if (gota.current) gota.current.position.y = 1.3 - ((t * 0.5) % 1) * 0.28;
    lluvia.current?.children.forEach((gota, i) => {
      gota.position.y = 2.15 - ((t * 0.8 + i * 0.33) % 1) * 1.1;
    });
  });
  return (
    <>
      {efectos.includes("brillos") ? (
        <group ref={brillos} position={[0, 1.0, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[Math.cos((i / 4) * Math.PI * 2) * 1.25, 0.5 + (i % 2) * 0.5, Math.sin((i / 4) * Math.PI * 2) * 1.25]}
              scale={0.11}
            >
              <octahedronGeometry />
              <meshStandardMaterial color="#FFE566" emissive="#FFE566" emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      ) : null}
      {efectos.includes("gota") ? (
        <group ref={gota} position={[0.55, 1.3, 0.45]}>
          <mesh>
            <sphereGeometry args={[0.09, 14, 12]} />
            <meshStandardMaterial color="#74C2E8" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <coneGeometry args={[0.07, 0.15, 12]} />
            <meshStandardMaterial color="#74C2E8" />
          </mesh>
        </group>
      ) : null}
      {efectos.includes("nube") ? (
        <group position={[0, 0, 0]}>
          <group position={[base === "conejo" ? 0.85 : 0, base === "conejo" ? 2.05 : 2.3, 0]}>
            {[
              [-0.3, 0, 0.26],
              [0, 0.1, 0.34],
              [0.3, 0, 0.26],
            ].map(([x, y, r], i) => (
              <mesh key={i} position={[x ?? 0, y ?? 0, 0]}>
                <sphereGeometry args={[r ?? 0.3, 16, 12]} />
                <meshStandardMaterial color="#8C93AE" />
              </mesh>
            ))}
          </group>
          <group ref={lluvia} position={[base === "conejo" ? 0.85 : 0, 0, 0]}>
            {[-0.25, 0, 0.25].map((x) => (
              <mesh key={x} position={[x, 2, 0.05]} scale={[1, 1.8, 1]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#74C2E8" />
              </mesh>
            ))}
          </group>
        </group>
      ) : null}
      {efectos.includes("aura") ? (
        <group ref={aura} position={[0, 0.9, -0.5]}>
          <mesh>
            <torusGeometry args={[1.15, 0.09, 12, 48]} />
            <meshStandardMaterial color="#C4A8E8" emissive="#C4A8E8" emissiveIntensity={0.9} transparent opacity={0.85} />
          </mesh>
        </group>
      ) : null}
    </>
  );
}

/** Suaviza un número hacia su objetivo (ease-out): así el cambio de estado no es un salto. Con `ms` 0 es instantáneo. */
function useSuave(objetivo: number, ms: number): number {
  const actual = useRef(objetivo);
  const [valor, setValor] = useState(objetivo);
  useEffect(() => {
    const inicio = performance.now();
    const desde = actual.current;
    let raf = 0;
    const paso = (ahora: number) => {
      const k = ms <= 0 ? 1 : Math.min(1, (ahora - inicio) / ms);
      actual.current = desde + (objetivo - desde) * (1 - Math.pow(1 - k, 3));
      setValor(actual.current);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, ms]);
  return valor;
}

const DURACION_FESTEJO = 1.6;
const VUELTA_FESTEJO = 0.6;
const CONFETI = ["#FF8FAB", "#FFE566", "#7DDEC8", "#C4A8E8", "#74C2E8", "#FFB085"];

/** Confeti que sale hacia arriba y cae; se ve solo mientras dura el festejo. */
function Confeti({ inicio }: { inicio: React.RefObject<number | null> }) {
  const grupo = useRef<Group>(null);
  const clock = useThree((s) => s.clock);
  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    const dt = inicio.current === null ? Infinity : clock.getElapsedTime() - inicio.current;
    g.visible = dt < DURACION_FESTEJO;
    if (!g.visible) return;
    g.children.forEach((pieza, i) => {
      const ang = i * 2.4; // ángulo áureo: reparte las piezas sin que se alineen
      const rapidez = 0.5 + (i % 4) * 0.25;
      // Nace sobre la cabeza (y ≈ 2.0), sube y cae a los costados sin tapar la cara.
      pieza.position.set(Math.cos(ang) * (0.35 + rapidez) * (0.3 + dt * 1.4), 2.0 + 1.9 * dt - 3.6 * dt * dt, 0.9 + Math.sin(ang) * rapidez * dt * 0.6);
      pieza.rotation.set(dt * (3 + i), dt * 2, 0);
      pieza.scale.setScalar(Math.min(1, (1 - dt / DURACION_FESTEJO) / 0.4) * 0.22);
    });
  });
  return (
    <group ref={grupo} visible={false}>
      {CONFETI.concat(CONFETI, CONFETI, CONFETI).map((c, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 0.55, 0.12]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

function Modelo({ a, celebrar }: { a: Apariencia; celebrar: number }) {
  const raiz = useRef<Group>(null);
  const clock = useThree((s) => s.clock);
  const inicioFestejo = useRef<number | null>(null);
  const ms = a.ritmo === 0 ? 0 : 700;
  // Todo lo que cambia con el estado se mueve de forma gradual (clean ↔ mild ↔ rekt).
  const saturacion = useSuave(a.saturacion, ms);
  const ritmo = useSuave(a.ritmo, ms);
  const incX = useSuave(a.postura === "encorvado" ? 0.28 : 0, ms);
  const incZ = useSuave(a.postura === "ladeado" ? 0.2 : 0, ms);
  const alto = useSuave(a.postura === "encorvado" ? 0.9 : 1, ms);

  // El festejo arranca solo cuando sube `celebrar`: un cambio de estado (que cambia el ritmo) no lo vuelve a disparar.
  const ritmoActual = useRef(a.ritmo);
  ritmoActual.current = a.ritmo;
  useEffect(() => {
    if (celebrar > 0 && ritmoActual.current > 0) inicioFestejo.current = clock.getElapsedTime();
  }, [celebrar, clock]);

  const colores = COLORES[a.base];
  const cuerpo = tono(colores.cuerpo, saturacion);
  const panza = tono(colores.panza, saturacion);
  const detalle = tono(colores.detalle, saturacion);
  const esPersona = BASES[a.base].tipo === "persona";

  useFrame(() => {
    if (!raiz.current) return;
    const t = clock.getElapsedTime() * ritmo;
    // Contento brinca; preocupado y triste solo respiran.
    let brinco = a.animo === "contento" ? Math.abs(Math.sin(t * 2.4)) * 0.18 : Math.sin(t * 1.6) * 0.04;
    let giro = ritmo === 0 ? 0 : Math.sin(t * 0.8) * 0.25;
    // Festejo: tres saltos grandes y una vuelta, que se apagan solos.
    if (inicioFestejo.current !== null) {
      const dt = clock.getElapsedTime() - inicioFestejo.current;
      if (dt >= DURACION_FESTEJO) inicioFestejo.current = null;
      else {
        const k = 1 - dt / DURACION_FESTEJO;
        brinco += Math.abs(Math.sin(dt * Math.PI * 3)) * 0.5 * k;
        // Una vuelta completa y rápida (0.6 s, con frenado) y luego cara a cámara con la sonrisa.
        const t = Math.min(1, dt / VUELTA_FESTEJO);
        giro += (1 - Math.pow(1 - t, 3)) * Math.PI * 2;
      }
    }
    raiz.current.position.y = BASE_Y + brinco;
    raiz.current.rotation.y = giro;
  });

  return (
    <>
      {/* Escenario: un disco de contacto del color del estado ancla al personaje (y no brinca con él). */}
      <mesh position={[0, BASE_Y - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 36]} />
        <meshBasicMaterial color={COLOR_ESCENARIO[a.efectos.includes("nube") ? "rekt" : a.efectos.includes("gota") ? "mild" : "clean"]} transparent opacity={0.55} />
      </mesh>
      <group ref={raiz} position={[0, BASE_Y, 0]}>
        <group rotation={[incX, 0, incZ]} scale={[1, alto, 1]}>
          {/* Cuerpo y panza */}
          <mesh position={[0, 0.1, 0]} scale={[1, 0.95, 0.9]}>
            <sphereGeometry args={[0.62, 28, 22]} />
            <meshStandardMaterial color={cuerpo} />
          </mesh>
          <mesh position={[0, 0.05, 0.4]} scale={[0.9, 1, 0.5]}>
            <sphereGeometry args={[0.42, 22, 16]} />
            <meshStandardMaterial color={panza} />
          </mesh>
          {/* Manos */}
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.05, 0.1]}>
              <sphereGeometry args={[0.17, 16, 12]} />
              <meshStandardMaterial color={esPersona ? cuerpo : detalle} />
            </mesh>
          ))}
          {/* Cabeza */}
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.72, 32, 24]} />
            <meshStandardMaterial color={cuerpo} />
          </mesh>
          <Orejas base={a.base} color={cuerpo} detalle={detalle} />
          <Cara animo={a.animo} fondo={`#${cuerpo.getHexString()}`} />
          {a.accesorios.map((acc) => (
            <PiezaAccesorio key={acc.slug} a={acc} />
          ))}
        </group>
        <Efectos efectos={a.efectos} ritmo={ritmo} base={a.base} />
      </group>
      {/* Fuera del grupo que gira: el confeti sale hacia la cámara aunque el personaje dé la vuelta. */}
      <group position={[0, BASE_Y, 0]}>
        <Confeti inicio={inicioFestejo} />
      </group>
    </>
  );
}

/** Mide el primer cuadro y, con `medir`, el FPS, los draw calls y los triángulos durante 3 s (`?debug=1`, PX-06). */
function Sensor({ t0, onListo, medir }: { t0: number; onListo?: () => void; medir: boolean }) {
  const gl = useThree((s) => s.gl);
  const primero = useRef<number | null>(null);
  const deltas = useRef<number[]>([]);
  const publicado = useRef(false);
  useFrame((_, delta) => {
    if (primero.current === null) {
      primero.current = Math.round(performance.now() - t0);
      onListo?.();
      return;
    }
    if (!medir || publicado.current) return;
    deltas.current.push(delta);
    if (deltas.current.length >= 180 || performance.now() - t0 > 6000) {
      publicado.current = true;
      setDebug({ personaje: { modo: "3d", primerCuadroMs: primero.current, ...resumenFps(deltas.current), drawCalls: gl.info.render.calls, triangulos: gl.info.render.triangles } });
    }
  });
  return null;
}

export interface Personaje3DProps {
  /** Se llama una vez cuando se dibuja el primer cuadro: el respaldo PNG se desvanece solo entonces. */
  onListo?: () => void;
  /** Activa el medidor de rendimiento (`?debug=1`). */
  medir?: boolean;
  apariencia: Apariencia;
  /** Distancia de la cámara: más chica = más cerca (las miniaturas usan 5.8: así la nube de la lluvia no se corta). */
  distancia?: number;
  /** Cada vez que sube este número, el personaje festeja (pago, nivel nuevo). Con movimiento reducido no hace nada. */
  celebrar?: number;
}

/** Un solo canvas 3D por pantalla (CLAUDE.md §7). Con ritmo 0 no anima: dibuja a demanda y no gasta batería. */
export default function Personaje3D({ apariencia, distancia = 6, celebrar = 0, onListo, medir = false }: Personaje3DProps) {
  const t0 = useRef(performance.now());
  // Mientras festeja hay que dibujar cada cuadro aunque el resto del tiempo esté quieto (ritmo 0 = a demanda).
  const [festejando, setFestejando] = useState(false);
  useEffect(() => {
    if (celebrar === 0 || apariencia.ritmo === 0) return;
    setFestejando(true);
    const id = setTimeout(() => setFestejando(false), (DURACION_FESTEJO + 0.2) * 1000);
    return () => clearTimeout(id);
  }, [celebrar, apariencia.ritmo]);
  return (
    <Canvas
      data-testid="personaje-canvas"
      dpr={[1, 2]}
      frameloop={apariencia.ritmo === 0 && !festejando ? "demand" : "always"}
      camera={{ position: [0, 0, distancia], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      aria-label="Personaje"
    >
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#ffffff", "#8C93AE", 0.7]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <Modelo a={apariencia} celebrar={celebrar} />
      <Sensor t0={t0.current} onListo={onListo} medir={medir} />
    </Canvas>
  );
}
