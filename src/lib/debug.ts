import type { EstadoAvatar } from "@/lib/game/avatar";

/**
 * Estado del panel `?debug=1` (CLAUDE.md §12). Solo lo que ayuda a depurar; nada de secretos ni tokens.
 * Cualquier pantalla o handler de cliente lo alimenta con `setDebug`; el panel lo lee.
 */
export interface DatosDebug {
  usuario?: string;
  grupo?: string;
  estadoAvatar?: EstadoAvatar;
  xp?: { total: number; nivel: number };
  /** Medidor del personaje 3D (PX-06): sirve para cerrar la prueba de rendimiento en celulares reales. */
  personaje?: { modo: "3d" | "2d"; primerCuadroMs: number; fpsMediana: number; fpsP5: number; drawCalls: number; triangulos: number };
  /** Última llamada a la IA: prompt y versión, latencia y la respuesta cruda. */
  ia?: { prompt: string; latenciaMs: number; respuesta: string; ts: string };
}

const MAX_RESPUESTA = 2000;

let datos: DatosDebug = {};
const oyentes = new Set<() => void>();

/** Mezcla `parche` con lo que ya hay. La respuesta cruda de la IA se recorta a 2,000 caracteres. */
export function setDebug(parche: DatosDebug): void {
  const ia = parche.ia ? { ...parche.ia, respuesta: parche.ia.respuesta.slice(0, MAX_RESPUESTA) } : datos.ia;
  datos = { ...datos, ...parche, ...(ia ? { ia } : {}) };
  for (const avisar of oyentes) avisar();
}

/** Devuelve siempre el mismo objeto mientras no haya cambios (requisito de `useSyncExternalStore`). */
export function getDebug(): DatosDebug {
  return datos;
}

export function subscribeDebug(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Solo para tests. */
export function reiniciarDebug(): void {
  datos = {};
  oyentes.clear();
}
