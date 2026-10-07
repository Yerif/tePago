"use client";

import { useEffect, useState } from "react";
import { ETIQUETA_ESTADO } from "@/lib/game/avatar";
import type { Revelacion } from "@/lib/game/revelacion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Cuenta de 0 a `objetivo` en ~0.9 s (de golpe con movimiento reducido): la XP "sube" al revelarse. */
function useContador(objetivo: number): number {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || objetivo === 0) {
      setValor(objetivo);
      return;
    }
    const inicio = performance.now();
    let id = 0;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / 900);
      setValor(Math.round(objetivo * (1 - (1 - t) ** 3)));
      if (t < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [objetivo]);
  return valor;
}

export interface RevelacionPersonajeProps {
  revelacion: Revelacion;
  onCerrar: () => void;
}

/**
 * La recompensa al abrir la app (PX-04): qué cambió en tu personaje desde la última vez — estado, XP y nivel — sin depender
 * de otra pantalla. Con un empeoramiento el tono es suave y sin festejo.
 */
export function RevelacionPersonaje({ revelacion: r, onCerrar }: RevelacionPersonajeProps) {
  const xp = useContador(r.xpGanada);
  const titulo = r.subioNivel ? `¡Nivel ${r.nivelDespues}! 🎊` : r.mejoro ? "¡Tu personaje mejoró! 🎉" : r.xpGanada > 0 ? "¡Ganaste XP! ⚡" : "Tu personaje cambió ☁️";
  return (
    <Card size="sm" role="status" data-testid="revelacion" className="flex flex-col gap-2 border-grass">
      <p className="font-display text-xl font-bold">{titulo}</p>
      {r.estadoAntes !== r.estadoDespues && (
        <p data-testid="revelacion-estado" className="font-semibold">
          {ETIQUETA_ESTADO[r.estadoAntes]} → {ETIQUETA_ESTADO[r.estadoDespues]}
        </p>
      )}
      {r.xpGanada > 0 && (
        <p data-testid="revelacion-xp" className="text-grass-text">
          +{xp} XP ⚡
        </p>
      )}
      {r.subioNivel && (
        <p data-testid="revelacion-nivel" className="text-sm text-muted-foreground">
          Nivel {r.nivelAntes} → Nivel {r.nivelDespues}
        </p>
      )}
      {r.empeoro && <p className="text-sm text-muted-foreground">Un pago y vuelves a brillar 🌱</p>}
      <Button size="md" variant="outline" className="self-start" data-testid="revelacion-ok" onClick={onCerrar}>
        ¡Genial!
      </Button>
    </Card>
  );
}
