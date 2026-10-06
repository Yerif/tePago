"use client";

import { useRef, useState } from "react";
import type { Scene } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import Personaje3D from "@/components/personaje/Personaje3D";
import { Button } from "@/components/ui/Button";
import { apariencia, baseValida } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";

declare global {
  interface Window {
    /** Para el script de exportación (Playwright): devuelve el .glb en base64. */
    __exportarGlb?: () => Promise<string>;
  }
}

export interface ExportadorGlbProps {
  base: string;
  estado: EstadoAvatar;
}

/**
 * SPIKE (PX-17, solo dev/preview): convierte el modelo procedural de una base en un archivo .glb para medir peso y probar el
 * camino "modelo como archivo" (que alguien con Blender podría refinar). No se usa en producción.
 */
export function ExportadorGlb({ base, estado }: ExportadorGlbProps) {
  const escena = useRef<Scene | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const a = { ...apariencia({ base: baseValida(base), estado, skin: "clasico", nivel: 1 }), ritmo: 0 };

  async function exportar(): Promise<ArrayBuffer> {
    if (!escena.current) throw new Error("La escena aún no está lista");
    const resultado = await new GLTFExporter().parseAsync(escena.current, { binary: true });
    const buffer = resultado as ArrayBuffer;
    setBytes(buffer.byteLength);
    return buffer;
  }

  if (typeof window !== "undefined") {
    window.__exportarGlb = async () => {
      const buffer = await exportar();
      let binario = "";
      new Uint8Array(buffer).forEach((b) => (binario += String.fromCharCode(b)));
      return btoa(binario);
    };
  }

  return (
    <section data-component="ExportadorGlb" className="flex flex-col gap-3">
      <div className="size-64 rounded-3xl border-[2.5px] border-border">
        <Personaje3D apariencia={a} onEscena={(s) => (escena.current = s)} />
      </div>
      <Button data-testid="exportar-glb" onClick={() => void exportar()}>
        Exportar .glb
      </Button>
      <p data-testid="glb-bytes" className="text-sm text-muted-foreground">
        {bytes === null ? "Sin exportar" : `${(bytes / 1024).toFixed(1)} KB`}
      </p>
    </section>
  );
}
