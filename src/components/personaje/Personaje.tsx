"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/cozy/Avatar";
import type { Apariencia } from "@/lib/game/apariencia";
import { BASES } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { cn } from "@/lib/utils";

export interface PersonajeProps {
  apariencia: Apariencia;
  /** Estado del juego: el respaldo 2D lo usa para su borde y su sticker. */
  estado: EstadoAvatar;
  /** Sube cada vez que hay algo que festejar (pago, nivel nuevo). */
  celebrar?: number;
  className?: string;
}

function Respaldo({ apariencia, estado }: Pick<PersonajeProps, "apariencia" | "estado">) {
  return (
    <div data-testid="personaje-respaldo" className="flex h-full w-full items-center justify-center">
      <Avatar emoji={BASES[apariencia.base].emoji} accesorio={apariencia.accesorios[0] ? "✨" : undefined} estado={estado} size="lg" />
    </div>
  );
}

// El 3D se baja solo donde hay personaje; mientras tanto (y sin WebGL) se ve el avatar 2D.
const Personaje3D = dynamic(() => import("./Personaje3D"), { ssr: false });

function hayWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Personaje del juego: 3D con carga diferida, respaldo 2D y respeto a `prefers-reduced-motion`. */
export function Personaje({ apariencia, estado, celebrar = 0, className }: PersonajeProps) {
  const [modo, setModo] = useState<"2d" | "3d">("2d");
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    setModo(hayWebGL() ? "3d" : "2d");
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setReducido(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const final = reducido ? { ...apariencia, ritmo: 0 } : apariencia;
  return (
    <div data-component="Personaje" data-testid="personaje" data-modo={modo} data-celebraciones={celebrar} className={cn("relative h-56 w-56", className)} role="img" aria-label={`Personaje ${BASES[apariencia.base].nombre}`}>
      {modo === "3d" ? <Personaje3D apariencia={final} celebrar={celebrar} /> : <Respaldo apariencia={apariencia} estado={estado} />}
    </div>
  );
}
