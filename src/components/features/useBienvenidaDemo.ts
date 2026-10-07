"use client";

import { useCallback } from "react";
import { crearAlmacenDemo } from "./almacenDemo";

/** Quién ya vio la bienvenida "Conoce a tu personaje" (solo dev/preview; con Supabase será una marca del perfil). */
export type BienvenidaVista = Readonly<Record<string, true>>;

const VACIO: BienvenidaVista = {};

function limpiar(datos: unknown): BienvenidaVista {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return VACIO;
  return Object.fromEntries(Object.entries(datos).filter(([, v]) => v === true).map(([id]) => [id, true as const]));
}

const almacen = crearAlmacenDemo<BienvenidaVista>("cc_demo_bienvenida_v1", VACIO, limpiar);

export function useBienvenidaDemo() {
  const { valor: vista, escribir, leer } = almacen.useAlmacen();
  const marcar = useCallback((id: string) => escribir({ ...leer(), [id]: true }), [escribir, leer]);
  const reiniciar = useCallback(() => escribir({}), [escribir]);
  return { vista, marcar, reiniciar };
}
