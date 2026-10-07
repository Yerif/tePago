"use client";

import Personaje3D from "@/components/personaje/Personaje3D";
import { apariencia, baseValida } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";

export interface CapturaPersonajeProps {
  base: string;
  estado: EstadoAvatar;
}

/** Un personaje quieto en un cuadro de 256 px, para generar su miniatura (`npm run personajes:miniaturas`). */
export function CapturaPersonaje({ base, estado }: CapturaPersonajeProps) {
  const a = { ...apariencia({ base: baseValida(base), estado, skin: "clasico", nivel: 1 }), ritmo: 0 };
  return (
    <div data-component="CapturaPersonaje" data-testid="captura" className="size-64">
      <Personaje3D apariencia={a} distancia={5.8} />
    </div>
  );
}
