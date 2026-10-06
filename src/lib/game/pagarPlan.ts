import { deudasEntrePersonas } from "@/lib/splits/deudas";
import type { PagoRegistrado } from "@/lib/splits/confirmacion";
import { aplicarPagos, partesQueSeSaldan, type Pago } from "@/lib/splits/pagos";
import { rutaDePago } from "@/lib/splits/ruta";
import type { GastoCalculable } from "@/lib/splits/tipos";
import { xpPorPago } from "./xp";

export type ResultadoDeclaracion = { ok: true; pares: Pago[] } | { ok: false };
export type ResultadoPagoDirecto = { ok: true; pares: Pago[] } | { ok: false; disponibleCentavos: number };

/**
 * Pago directo de `yo` a `acreedorId` por `centavos` (total o abono) sobre la deuda directa que todavía no está en camino
 * (`vigentes` = confirmados + pendientes + en disputa). Nunca deja pagar más de lo que se debe: devuelve cuánto queda por pagar.
 */
export function declararPagoDirecto<T extends GastoCalculable & { fecha: string }>(
  gastos: readonly T[],
  vigentes: readonly Pago[],
  yo: string,
  acreedorId: string,
  centavos: number,
): ResultadoPagoDirecto {
  const deuda = deudasEntrePersonas(aplicarPagos(gastos, vigentes)).find((d) => d.deudorId === yo && d.acreedorId === acreedorId);
  const disponibleCentavos = deuda?.centavos ?? 0;
  if (!Number.isSafeInteger(centavos) || centavos <= 0 || centavos > disponibleCentavos) return { ok: false, disponibleCentavos };
  return { ok: true, pares: [{ deudorId: yo, acreedorId, centavos }] };
}

/**
 * Convierte "yo le pago `centavos` a `acreedorId`" (una transferencia del plan) en pagos por pares sobre las deudas
 * que todavía no están en camino (`vigentes` = confirmados + pendientes). Solo describe el pago: no salda nada hasta que
 * quien recibe lo confirma. `ok: false` si no hay cadena de deudas que cubra el monto.
 */
export function declararPagoPlan<T extends GastoCalculable & { fecha: string }>(
  gastos: readonly T[],
  vigentes: readonly Pago[],
  yo: string,
  acreedorId: string,
  centavos: number,
): ResultadoDeclaracion {
  const ruta = rutaDePago(deudasEntrePersonas(aplicarPagos(gastos, vigentes)), yo, acreedorId, centavos);
  return ruta.sobranteCentavos > 0 ? { ok: false } : { ok: true, pares: ruta.pagos };
}

/**
 * XP que gana quien pagó cuando se confirma su pago: solo cuentan sus deudas que quedan saldadas por completo y la
 * antigüedad se mide al momento en que declaró el pago (`creadoIso`), no al de la confirmación.
 */
export function xpAlConfirmar<T extends GastoCalculable & { fecha: string }>(
  gastos: readonly T[],
  confirmadosPrevios: readonly Pago[],
  pago: Pick<PagoRegistrado, "deId" | "pares" | "creadoIso">,
): number {
  let acumulados: readonly Pago[] = confirmadosPrevios;
  let xp = 0;
  for (const par of pago.pares) {
    const saldadas = partesQueSeSaldan(gastos, acumulados, par).filter((s) => s.userId === pago.deId);
    xp += xpPorPago(saldadas, new Date(pago.creadoIso));
    acumulados = [...acumulados, par];
  }
  return xp;
}
