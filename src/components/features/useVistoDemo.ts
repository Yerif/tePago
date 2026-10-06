"use client";

import { useCallback, useSyncExternalStore } from "react";
import { crearAlmacenDemo } from "./almacenDemo";
import type { EstadoAvatar } from "@/lib/game/avatar";
import type { InstantaneaPersonaje } from "@/lib/game/revelacion";

/**
 * Lo último que cada persona vio de su personaje (estado y XP), en `localStorage` (solo dev/preview). Con Supabase será
 * algo como `profiles.last_seen_*` o los `xp_events` sin ver (anotado en docs/UX-PERSONAJE.md §4.2 para decidirlo en A5).
 */
export type VistoPorPersona = Readonly<Record<string, InstantaneaPersonaje>>;

const LLAVE = "cc_demo_visto_v1";
const VACIO: VistoPorPersona = {};
const ESTADOS: readonly EstadoAvatar[] = ["clean", "mild", "rekt"];

function limpiar(datos: unknown): VistoPorPersona {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return VACIO;
  const limpio: Record<string, InstantaneaPersonaje> = {};
  for (const [id, v] of Object.entries(datos)) {
    const { estado, xpTotal } = (v ?? {}) as { estado?: unknown; xpTotal?: unknown };
    if (ESTADOS.includes(estado as EstadoAvatar) && Number.isSafeInteger(xpTotal) && (xpTotal as number) >= 0) limpio[id] = { estado: estado as EstadoAvatar, xpTotal: xpTotal as number };
  }
  return limpio;
}

const almacen = crearAlmacenDemo<VistoPorPersona>(LLAVE, VACIO, limpiar);

export function useVistoDemo() {
  const { valor: visto, escribir, leer } = almacen.useAlmacen();
  const marcar = useCallback((id: string, instantanea: InstantaneaPersonaje) => escribir({ ...leer(), [id]: instantanea }), [escribir, leer]);
  const reiniciar = useCallback(() => escribir({}), [escribir]);
  return { visto, marcar, reiniciar };
}

/** `false` en el servidor y durante la hidratación; `true` cuando ya se pueden leer los datos del navegador. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
