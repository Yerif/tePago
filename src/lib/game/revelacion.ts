import type { EstadoAvatar } from "./avatar";
import { progresoNivel } from "./levels";

/** Lo último que la persona vio de su personaje: se compara con lo actual al abrir la app. */
export interface InstantaneaPersonaje {
  estado: EstadoAvatar;
  xpTotal: number;
}

export interface Revelacion {
  estadoAntes: EstadoAvatar;
  estadoDespues: EstadoAvatar;
  xpGanada: number;
  nivelAntes: number;
  nivelDespues: number;
  subioNivel: boolean;
  /** El estado mejoró (más cerca de Radiante). */
  mejoro: boolean;
  /** El estado empeoró (p. ej. una deuda envejeció): se muestra con tono suave, sin festejo. */
  empeoro: boolean;
  /** Hay algo que festejar: XP ganada, nivel nuevo o mejor estado. */
  festejar: boolean;
}

const RANGO: Record<EstadoAvatar, number> = { clean: 0, mild: 1, rekt: 2 };

/**
 * Qué cambió desde la última vez que se vio el personaje (estado, nivel, XP), para revelarlo al abrir el Inicio sin
 * depender de otra pantalla (CLAUDE.md §7). null si no cambió nada o si la XP bajó (p. ej. se reinició el demo): en ese
 * caso quien llama debe volver a tomar la instantánea actual como referencia.
 */
export function revelacion(visto: InstantaneaPersonaje, actual: InstantaneaPersonaje): Revelacion | null {
  const xpGanada = actual.xpTotal - visto.xpTotal;
  if (xpGanada < 0) return null;
  if (xpGanada === 0 && visto.estado === actual.estado) return null;
  const nivelAntes = progresoNivel(visto.xpTotal).nivel;
  const nivelDespues = progresoNivel(actual.xpTotal).nivel;
  const mejoro = RANGO[actual.estado] < RANGO[visto.estado];
  const subioNivel = nivelDespues > nivelAntes;
  return {
    estadoAntes: visto.estado,
    estadoDespues: actual.estado,
    xpGanada,
    nivelAntes,
    nivelDespues,
    subioNivel,
    mejoro,
    empeoro: RANGO[actual.estado] > RANGO[visto.estado],
    festejar: xpGanada > 0 || mejoro || subioNivel,
  };
}
