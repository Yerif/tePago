"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { EstadoAvatar } from "@/lib/game/avatar";
import type { InstantaneaPersonaje } from "@/lib/game/revelacion";

/**
 * Lo último que cada persona vio de su personaje (estado y XP), en `localStorage` (solo dev/preview). Con Supabase será
 * algo como `profiles.last_seen_*` o los `xp_events` sin ver (anotado en docs/UX-PERSONAJE.md §4.2 para decidirlo en A5).
 */
export type VistoPorPersona = Readonly<Record<string, InstantaneaPersonaje>>;

const LLAVE = "cc_demo_visto_v1";
const EVENTO = "cc-demo-visto";
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

let enMemoria: VistoPorPersona | null = null;
let crudo: string | null = null;
let analizado: VistoPorPersona = VACIO;

function leer(): VistoPorPersona {
  if (enMemoria) return enMemoria;
  let texto: string | null = null;
  try {
    texto = window.localStorage.getItem(LLAVE);
  } catch {
    return VACIO;
  }
  if (texto === crudo) return analizado;
  crudo = texto;
  try {
    analizado = texto ? limpiar(JSON.parse(texto)) : VACIO;
  } catch {
    analizado = VACIO;
  }
  return analizado;
}

function escribir(siguiente: VistoPorPersona) {
  enMemoria = siguiente;
  try {
    window.localStorage.setItem(LLAVE, JSON.stringify(siguiente));
    enMemoria = null;
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function useVistoDemo() {
  const visto = useSyncExternalStore(suscribir, leer, () => VACIO);
  const marcar = useCallback((id: string, instantanea: InstantaneaPersonaje) => escribir({ ...leer(), [id]: instantanea }), []);
  const reiniciar = useCallback(() => escribir({}), []);
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
