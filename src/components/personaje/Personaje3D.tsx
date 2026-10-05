"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Accesorio, Apariencia, BaseSlug, Efecto } from "@/lib/game/apariencia";
import { BASES } from "@/lib/game/apariencia";
import { COLORES, tono } from "./paleta";

const OSCURO = "#2A2F45";
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

function Cara({ animo }: { animo: Apariencia["animo"] }) {
  const ojoY = animo === "triste" ? 1.0 : 1.06;
  return (
    <group position={[0, 0, 0.62]}>
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          <mesh position={[x, ojoY, 0.05]}>
            <sphereGeometry args={[0.075, 14, 12]} />
            <meshStandardMaterial color={OSCURO} />
          </mesh>
          {animo !== "contento" ? (
            // Cejas de pena: el extremo de adentro sube (más inclinadas si está triste).
            <mesh position={[x, ojoY + 0.17, 0.05]} rotation={[0, 0, (x > 0 ? -1 : 1) * (animo === "triste" ? 0.5 : 0.28)]}>
              <boxGeometry args={[0.2, 0.035, 0.03]} />
              <meshStandardMaterial color={OSCURO} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* Sonrisa si está contento; línea recta preocupado; ceño si está triste. */}
      <mesh position={[0, animo === "contento" ? 0.86 : 0.8, 0.05]} rotation={[0, 0, animo === "contento" ? Math.PI : 0]} scale={animo === "preocupado" ? [1, 0.2, 1] : [1, 1, 1]}>
        <torusGeometry args={[0.15, 0.028, 8, 20, Math.PI]} />
        <meshStandardMaterial color={OSCURO} />
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
          <mesh position={[0, -0.12, 0.02]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, 20]} />
            <meshStandardMaterial color={ORO} metalness={0.4} roughness={0.35} />
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
function Efectos({ efectos, ritmo }: { efectos: Efecto[]; ritmo: number }) {
  const brillos = useRef<Group>(null);
  const lluvia = useRef<Group>(null);
  const aura = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * ritmo;
    if (brillos.current) brillos.current.rotation.y = t * 1.2;
    if (aura.current) aura.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    lluvia.current?.children.forEach((gota, i) => {
      gota.position.y = 2.15 - (((t * 0.8 + i * 0.33) % 1) * 1.1);
    });
  });
  return (
    <>
      {efectos.includes("brillos") ? (
        <group ref={brillos} position={[0, 1.0, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 1.25, 0.5 + (i % 2) * 0.5, Math.sin((i / 4) * Math.PI * 2) * 1.25]} scale={0.11}>
              <octahedronGeometry />
              <meshStandardMaterial color="#FFE566" emissive="#FFE566" emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      ) : null}
      {efectos.includes("gota") ? (
        <group position={[0.55, 1.3, 0.45]}>
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
          <group position={[0, 2.3, 0]}>
            {[[-0.3, 0, 0.26], [0, 0.1, 0.34], [0.3, 0, 0.26]].map(([x, y, r], i) => (
              <mesh key={i} position={[x ?? 0, y ?? 0, 0]}>
                <sphereGeometry args={[r ?? 0.3, 16, 12]} />
                <meshStandardMaterial color="#8C93AE" />
              </mesh>
            ))}
          </group>
          <group ref={lluvia}>
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
            <torusGeometry args={[1.15, 0.045, 10, 48]} />
            <meshStandardMaterial color="#C4A8E8" emissive="#C4A8E8" emissiveIntensity={0.6} transparent opacity={0.8} />
          </mesh>
        </group>
      ) : null}
    </>
  );
}

function Modelo({ a }: { a: Apariencia }) {
  const raiz = useRef<Group>(null);
  const colores = COLORES[a.base];
  const cuerpo = tono(colores.cuerpo, a.saturacion);
  const panza = tono(colores.panza, a.saturacion);
  const detalle = tono(colores.detalle, a.saturacion);
  const esPersona = BASES[a.base].tipo === "persona";

  // Postura: erguido, ladeado (cabeza inclinada) o encorvado (cuerpo hacia adelante y más bajo).
  const inclinacion = a.postura === "ladeado" ? { z: 0.2, x: 0 } : a.postura === "encorvado" ? { z: 0, x: 0.28 } : { z: 0, x: 0 };
  const alto = a.postura === "encorvado" ? 0.9 : 1;

  useFrame(({ clock }) => {
    if (!raiz.current) return;
    const t = clock.getElapsedTime() * a.ritmo;
    // Contento brinca; preocupado y triste solo respiran.
    const brinco = a.animo === "contento" ? Math.abs(Math.sin(t * 2.4)) * 0.18 : Math.sin(t * 1.6) * 0.04;
    raiz.current.position.y = BASE_Y + brinco;
    raiz.current.rotation.y = a.ritmo === 0 ? 0 : Math.sin(t * 0.8) * 0.25;
  });

  return (
    <group ref={raiz} position={[0, BASE_Y, 0]}>
      <group rotation={[inclinacion.x, 0, inclinacion.z]} scale={[1, alto, 1]}>
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
        <Cara animo={a.animo} />
        {a.accesorios.map((acc) => (
          <PiezaAccesorio key={acc.slug} a={acc} />
        ))}
      </group>
      <Efectos efectos={a.efectos} ritmo={a.ritmo} />
    </group>
  );
}

export interface Personaje3DProps {
  apariencia: Apariencia;
  /** Distancia de la cámara: más chica = más cerca (las miniaturas usan 5.2). */
  distancia?: number;
}

/** Un solo canvas 3D por pantalla (CLAUDE.md §7). Con ritmo 0 no anima: dibuja a demanda y no gasta batería. */
export default function Personaje3D({ apariencia, distancia = 6 }: Personaje3DProps) {
  return (
    <Canvas
      data-testid="personaje-canvas"
      dpr={[1, 2]}
      frameloop={apariencia.ritmo === 0 ? "demand" : "always"}
      camera={{ position: [0, 0, distancia], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      aria-label="Personaje"
    >
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#ffffff", "#8C93AE", 0.7]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <Modelo a={apariencia} />
    </Canvas>
  );
}
