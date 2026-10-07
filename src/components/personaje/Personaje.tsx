"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { setDebug } from "@/lib/debug";
import { BASES, rutaMiniatura } from "@/lib/game/apariencia";
import type { Apariencia } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { cn } from "@/lib/utils";

export interface PersonajeProps {
  apariencia: Apariencia;
  /** Estado del juego: la miniatura PNG que se ve mientras carga (o sin WebGL) es la de este estado. */
  estado: EstadoAvatar;
  /** Sube cada vez que hay algo que festejar (pago, nivel nuevo). */
  celebrar?: number;
  /** Sube con cada saludo o toque: el personaje da un brinquito (también la miniatura PNG, con CSS). */
  saludar?: number;
  className?: string;
}

/**
 * Lo que se ve mientras llega el 3D (y siempre que no hay WebGL o el celular pidió ahorrar datos): la miniatura PNG de la
 * MISMA figura, con una respiración suave en CSS. Así nunca hay un hueco ni un emoji (PX-02).
 */
function Respaldo({ apariencia, estado, visible, saludar }: Pick<PersonajeProps, "apariencia" | "estado"> & { visible: boolean; saludar: number }) {
  return (
    <div
      data-testid="personaje-respaldo"
      className={cn("pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}
    >
      {/* `key` reinicia la animación CSS en cada saludo; sin movimiento reducido solamente (ver globals.css). */}
      <div key={saludar} className={cn("flex size-full items-center justify-center", saludar > 0 && "brincar")}>
      <Image
        src={rutaMiniatura(apariencia.base, estado)}
        alt=""
        width={256}
        height={256}
        unoptimized
        priority
        className="respirar size-full scale-[0.97] object-contain"
      />
      </div>
    </div>
  );
}

// El 3D se baja solo donde hay personaje; mientras tanto (y sin WebGL) se ve la miniatura PNG.
const Personaje3D = dynamic(() => import("./Personaje3D"), { ssr: false });

function hayWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Con "ahorro de datos" activo no se descarga el 3D: la miniatura PNG basta. */
function ahorroDeDatos(): boolean {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return conexion?.saveData === true;
}

/**
 * Personaje del juego: la miniatura PNG al instante y el 3D después (fundido cuando llega su primer cuadro), con
 * respeto a `prefers-reduced-motion` y al ahorro de datos.
 */
export function Personaje({ apariencia, estado, celebrar = 0, saludar = 0, className }: PersonajeProps) {
  const [modo, setModo] = useState<"2d" | "3d">("2d");
  const [listo, setListo] = useState(false);
  const [reducido, setReducido] = useState(false);
  const [medir, setMedir] = useState(false);
  const [enPantalla, setEnPantalla] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const con3d = hayWebGL() && !ahorroDeDatos();
    setModo(con3d ? "3d" : "2d");
    const depurando = new URLSearchParams(window.location.search).get("debug") === "1";
    setMedir(depurando);
    if (depurando && !con3d) setDebug({ personaje: { modo: "2d", primerCuadroMs: 0, fpsMediana: 0, fpsP5: 0, drawCalls: 0, triangulos: 0 } });
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setReducido(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  // Fuera de pantalla el canvas no dibuja (batería). Sin IntersectionObserver se queda dibujando.
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(([e]) => setEnPantalla(e?.isIntersecting ?? true));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const final = reducido ? { ...apariencia, ritmo: 0 } : apariencia;
  return (
    <div
      ref={raiz}
      data-component="Personaje"
      data-testid="personaje"
      data-modo={modo}
      data-listo={modo === "3d" ? listo : false}
      data-celebraciones={celebrar}
      data-saludos={saludar}
      data-pausado={modo === "3d" && !enPantalla}
      className={cn("relative h-56 w-56", className)}
      role="img"
      aria-label={`Personaje ${BASES[apariencia.base].nombre}`}
    >
      <Respaldo apariencia={apariencia} estado={estado} visible={modo === "2d" || !listo} saludar={saludar} />
      {modo === "3d" ? (
        <div className={cn("absolute inset-0 transition-opacity duration-300", listo ? "opacity-100" : "opacity-0")}>
          <Personaje3D apariencia={final} celebrar={celebrar} saludar={saludar} pausado={!enPantalla} onListo={() => setListo(true)} medir={medir} />
        </div>
      ) : null}
    </div>
  );
}
