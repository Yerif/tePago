"use client";

import { useCallback, useSyncExternalStore } from "react";
import { cancelarPago, declararPago, marcarAvisado, responderVarios, type NuevoPago, type PagoRegistrado, type Respuesta } from "@/lib/splits/confirmacion";

/**
 * Pagos del demo, compartidos entre pantallas y entre personas (`?u=`) con `localStorage` — solo dev/preview, sin
 * backend. Con Supabase serán filas de `settlements` con `estado`. Si el almacenamiento falla (modo privado), el
 * demo sigue funcionando en memoria durante la sesión.
 */
const LLAVE = "cc_demo_pagos_v2";
const EVENTO = "cc-demo-pagos";
const VACIO: readonly PagoRegistrado[] = [];

let enMemoria: readonly PagoRegistrado[] | null = null;
let crudo: string | null = null;
let analizado: readonly PagoRegistrado[] = VACIO;

function esRegistro(x: unknown): x is PagoRegistrado {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.loteId === "string" &&
    Array.isArray(r.requeridos) &&
    typeof r.respuestas === "object" &&
    r.respuestas !== null &&
    typeof r.grupoId === "string" &&
    typeof r.deId === "string" &&
    typeof r.aId === "string" &&
    typeof r.centavos === "number" &&
    Array.isArray(r.pares) &&
    (r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "rechazado" || r.estado === "cancelado") &&
    typeof r.creadoIso === "string" &&
    typeof r.xp === "number" &&
    typeof r.avisado === "boolean"
  );
}

function leer(): readonly PagoRegistrado[] {
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
    const datos: unknown = texto ? JSON.parse(texto) : [];
    analizado = Array.isArray(datos) ? datos.filter(esRegistro) : VACIO;
  } catch {
    analizado = VACIO;
  }
  return analizado;
}

function escribir(siguientes: readonly PagoRegistrado[]) {
  enMemoria = siguientes;
  try {
    window.localStorage.setItem(LLAVE, JSON.stringify(siguientes));
    enMemoria = null; // el almacenamiento funciona: vuelve a ser la fuente de verdad
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

export function usePagosDemo() {
  const registros = useSyncExternalStore(suscribir, leer, () => VACIO);

  /** Declara uno o varios pagos de un mismo gesto (uno por grupo); comparten lote. */
  const declarar = useCallback((nuevos: readonly NuevoPago[]) => escribir(nuevos.reduce((acum, n) => declararPago(acum, n), leer() as PagoRegistrado[])), []);
  /** La persona requerida responde uno o varios pagos de un lote, cada uno con su XP. */
  const responder = useCallback((items: readonly { id: string; xp: number }[], quien: string, decision: Respuesta) => escribir(responderVarios(leer(), items, quien, decision)), []);
  /** Quien pagó cancela (o deshace) uno o varios de sus pagos. */
  const cancelar = useCallback((ids: readonly string[], quien: string) => escribir(ids.reduce((acum, id) => cancelarPago(acum, id, quien), leer() as PagoRegistrado[])), []);
  const avisado = useCallback((ids: readonly string[]) => escribir(marcarAvisado(leer(), ids)), []);
  const reiniciar = useCallback(() => escribir([]), []);

  return { registros, declarar, responder, cancelar, avisado, reiniciar };
}

/** Id corto para un pago nuevo (el demo no necesita UUID). */
export function nuevoId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
