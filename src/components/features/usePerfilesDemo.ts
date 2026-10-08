"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { BaseSlug } from "@/lib/game/apariencia";
import type { SkinSlug } from "@/lib/game/skins";
import { aplicarPerfiles, limpiarPerfiles, type PerfilesEditados } from "@/lib/mock/perfiles";

/**
 * Nombre, personaje y skin que cada persona eligió en el demo, compartidos entre pantallas con `localStorage` (solo
 * dev/preview). Con Supabase será un `update` de la fila de `profiles` de la propia persona.
 */
const LLAVE = "cc_demo_perfiles_v1";
const EVENTO = "cc-demo-perfiles";
const VACIO: PerfilesEditados = {};

let enMemoria: PerfilesEditados | null = null;
let crudo: string | null = null;
let analizado: PerfilesEditados = VACIO;

function leer(): PerfilesEditados {
  if (enMemoria) return enMemoria;
  let texto: string | null = null;
  try {
    texto = window.localStorage.getItem(LLAVE);
  } catch {
    return VACIO;
  }
  if (texto === crudo) return analizado; // misma referencia mientras nada cambie (requisito de useSyncExternalStore)
  crudo = texto;
  try {
    analizado = texto ? limpiarPerfiles(JSON.parse(texto)) : VACIO;
  } catch {
    analizado = VACIO;
  }
  return analizado;
}

function escribir(siguientes: PerfilesEditados) {
  enMemoria = siguientes;
  try {
    window.localStorage.setItem(LLAVE, JSON.stringify(siguientes));
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

export function usePerfilesDemo() {
  const perfiles = useSyncExternalStore(suscribir, leer, () => VACIO);
  const cambiar = useCallback((id: string, cambio: { nombre?: string; base?: BaseSlug; skin?: SkinSlug }) => escribir({ ...leer(), [id]: { ...leer()[id], ...cambio } }), []);
  const reiniciar = useCallback(() => escribir({}), []);
  return { perfiles, cambiar, reiniciar };
}

/** Los grupos del demo con el nombre y el personaje que cada persona eligió. */
export function useGruposConPerfiles<G extends { miembros: { id: string; nombre: string; base: string; emoji?: string }[] }>(grupos: G[]): G[] {
  const { perfiles } = usePerfilesDemo();
  return useMemo(() => aplicarPerfiles(grupos, perfiles), [grupos, perfiles]);
}
