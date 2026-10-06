import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { aplicarPagos, partesQueSeSaldan, type Pago } from "@/lib/splits/pagos";
import type { GastoCalculable } from "@/lib/splits/tipos";
import { rutaDePago } from "@/lib/splits/ruta";
import { xpPorPago } from "./xp";

export type ResultadoPagoPlan = { ok: true; pagos: Pago[]; xp: number } | { ok: false };

/**
 * Pago de una transferencia del plan (`yo` → `acreedorId`) convertido en pagos por pares y el XP que da:
 * solo cuentan las deudas de `yo` que quedan saldadas por completo (las de otros no dan XP).
 * `ok: false` si no hay cadena de deudas que cubra el monto (se debe pagar la deuda directa).
 */
export function pagarDelPlan<T extends GastoCalculable & { fecha: string }>(
  gastos: readonly T[],
  previos: readonly Pago[],
  yo: string,
  acreedorId: string,
  centavos: number,
  ahora: Date,
): ResultadoPagoPlan {
  const pendientes = aplicarPagos(gastos, previos);
  const ruta = rutaDePago(deudasEntrePersonas(pendientes), yo, acreedorId, centavos);
  if (ruta.sobranteCentavos > 0) return { ok: false };
  let acumulados: readonly Pago[] = previos;
  let xp = 0;
  for (const pago of ruta.pagos) {
    const saldadas = partesQueSeSaldan(gastos, acumulados, pago).filter((s) => s.userId === yo);
    xp += xpPorPago(saldadas, ahora);
    acumulados = [...acumulados, pago];
  }
  return { ok: true, pagos: ruta.pagos, xp };
}
