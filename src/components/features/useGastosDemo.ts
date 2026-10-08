"use client";

import { useCallback, useMemo } from "react";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { aplicarGastosGuardados, crearGastoGuardado, limpiarGastosGuardados, type EntradaGastoGuardado, type GastoGuardado } from "@/lib/mock/gastosGuardados";
import { crearAlmacenDemo } from "./almacenDemo";

/**
 * Los gastos que se registran en Dividir, guardados en `localStorage` (solo dev/preview) para que aparezcan en el Home y el
 * detalle del grupo y den su XP. Con Supabase serán filas de `expenses`/`expense_shares` y la XP la otorga el servidor.
 */
const VACIO: GastoGuardado[] = [];
const almacen = crearAlmacenDemo<GastoGuardado[]>("cc_demo_gastos_v1", VACIO, limpiarGastosGuardados);

export function useGastosDemo() {
  const { valor: guardados, escribir, leer } = almacen.useAlmacen();
  const agregar = useCallback(
    (entrada: EntradaGastoGuardado): GastoGuardado => {
      const nuevo = crearGastoGuardado(entrada, leer());
      escribir([...leer(), nuevo]);
      return nuevo;
    },
    [escribir, leer],
  );
  const reiniciar = useCallback(() => escribir([]), [escribir]);
  return { guardados, agregar, reiniciar };
}

/** Los grupos del demo con los gastos que se guardaron en Dividir. */
export function useGruposConGastos(grupos: GrupoDemo[]): GrupoDemo[] {
  const { guardados } = useGastosDemo();
  return useMemo(() => aplicarGastosGuardados(grupos, guardados), [grupos, guardados]);
}
