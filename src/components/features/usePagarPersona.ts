"use client";

import { useCallback, useEffect, useState } from "react";
import { declararPagoDirecto } from "@/lib/game/pagarPlan";
import type { GrupoDemo } from "@/lib/mock/tipos";
import type { NuevoPago } from "@/lib/splits/confirmacion";
import { paresVigentes } from "@/lib/splits/confirmacion";
import { formatoMXN } from "@/lib/splits/formato";
import { repartirAbonoEntreGrupos } from "@/lib/splits/resumen";
import { nuevoId, usePagosDemo } from "./usePagosDemo";

const SEGUNDOS_PARA_DESHACER = 8;

/**
 * Pagarle a una persona (total o abono) repartiendo el pago entre los grupos donde se le debe — un pago por grupo, mismo
 * lote — y poder deshacerlo unos segundos. Compartido por el inicio y el detalle del grupo.
 */
export function usePagarPersona(grupos: GrupoDemo[], yo: string, nombres: Record<string, string>) {
  const pagos = usePagosDemo();
  const [toast, setToast] = useState<{ ids: string[]; texto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), SEGUNDOS_PARA_DESHACER * 1000);
    return () => clearTimeout(t);
  }, [toast]);

  const pagar = useCallback(
    (personaId: string, disponibles: { grupoId: string; centavos: number }[], centavos: number): boolean => {
      const loteId = nuevoId();
      const creadoIso = new Date().toISOString();
      const nuevos: NuevoPago[] = [];
      for (const tramo of repartirAbonoEntreGrupos(disponibles, centavos)) {
        const grupo = grupos.find((g) => g.id === tramo.grupoId);
        const r = grupo ? declararPagoDirecto(grupo.gastos, paresVigentes(pagos.registros, tramo.grupoId), yo, personaId, tramo.centavos) : null;
        if (!r || !r.ok) {
          setError("Ese pago ya no se puede hacer: puede que haya cambiado la deuda. Revisa y vuelve a intentarlo.");
          return false;
        }
        nuevos.push({ id: nuevoId(), loteId, grupoId: tramo.grupoId, deId: yo, aId: personaId, centavos: tramo.centavos, pares: r.pares, creadoIso });
      }
      setError(null);
      pagos.declarar(nuevos);
      setToast({ ids: nuevos.map((n) => n.id), texto: `Avisamos a ${nombres[personaId] ?? personaId} para que confirme tus ${formatoMXN(centavos)} ⏳` });
      return true;
    },
    [grupos, nombres, pagos, yo],
  );

  /** Pago "pagar menos veces": un solo pago con varios pares (lo confirman todas las personas implicadas). */
  const pagarPlan = useCallback(
    (grupoId: string, personaId: string, centavos: number, pares: NuevoPago["pares"]) => {
      const nuevo: NuevoPago = { id: nuevoId(), grupoId, deId: yo, aId: personaId, centavos, pares, creadoIso: new Date().toISOString() };
      setError(null);
      pagos.declarar([nuevo]);
      setToast({ ids: [nuevo.id], texto: `Avisamos a quienes participan para que confirmen tus ${formatoMXN(centavos)} ⏳` });
    },
    [pagos, yo],
  );

  const deshacer = useCallback(() => {
    if (!toast) return;
    pagos.cancelar(toast.ids, yo);
    setToast(null);
  }, [pagos, toast, yo]);

  /** Cancela todos los pagos pendientes o en disputa de `yo` hacia una persona. */
  const cancelarA = useCallback(
    (personaId: string) => {
      const ids = pagos.registros.filter((r) => r.deId === yo && r.aId === personaId && (r.estado === "pendiente" || r.estado === "rechazado")).map((r) => r.id);
      if (ids.length > 0) pagos.cancelar(ids, yo);
    },
    [pagos, yo],
  );

  return { registros: pagos.registros, toast, error, pagar, pagarPlan, deshacer, cancelarA, cerrarToast: () => setToast(null) };
}
