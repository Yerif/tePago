"use client";

import { useSyncExternalStore } from "react";

/**
 * Pequeño almacén en `localStorage` para el demo (solo dev/preview): lee con tolerancia a datos viejos o dañados, devuelve
 * siempre la misma referencia mientras nada cambie (requisito de `useSyncExternalStore`) y avisa a todas las pantallas.
 * Si el almacenamiento falla (modo privado), sigue funcionando en memoria durante la sesión.
 */
export function crearAlmacenDemo<T>(llave: string, vacio: T, limpiar: (datos: unknown) => T) {
  const evento = `cc-demo-${llave}`;
  let enMemoria: T | null = null;
  let crudo: string | null = null;
  let analizado: T = vacio;

  function leer(): T {
    if (enMemoria !== null) return enMemoria;
    let texto: string | null = null;
    try {
      texto = window.localStorage.getItem(llave);
    } catch {
      return vacio;
    }
    if (texto === crudo) return analizado;
    crudo = texto;
    try {
      analizado = texto ? limpiar(JSON.parse(texto)) : vacio;
    } catch {
      analizado = vacio;
    }
    return analizado;
  }

  function escribir(siguiente: T) {
    enMemoria = siguiente;
    try {
      window.localStorage.setItem(llave, JSON.stringify(siguiente));
      enMemoria = null;
    } catch {
      /* sin almacenamiento: queda en memoria */
    }
    window.dispatchEvent(new Event(evento));
  }

  function suscribir(avisar: () => void) {
    window.addEventListener(evento, avisar);
    window.addEventListener("storage", avisar);
    return () => {
      window.removeEventListener(evento, avisar);
      window.removeEventListener("storage", avisar);
    };
  }

  function useAlmacen() {
    const valor = useSyncExternalStore(suscribir, leer, () => vacio);
    return { valor, escribir, leer };
  }
  return { useAlmacen };
}
