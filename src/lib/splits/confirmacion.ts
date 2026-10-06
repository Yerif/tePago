import type { Pago } from "./pagos";

export type EstadoPago = "pendiente" | "confirmado" | "rechazado";

/**
 * Un pago declarado por quien debe (`deId`) y que solo salda algo cuando lo confirma quien recibe (`aId`).
 * `pares` es la descomposición en pagos por pares (un pago directo tiene un solo par; uno del plan puede tener varios).
 */
export interface PagoRegistrado {
  id: string;
  grupoId: string;
  deId: string;
  aId: string;
  centavos: number;
  pares: Pago[];
  estado: EstadoPago;
  /** Cuándo declaró el pago quien debe (ISO): de aquí sale la antigüedad de la deuda para el XP. */
  creadoIso: string;
  /** XP que ganó quien pagó al confirmarse; 0 mientras no esté confirmado o si fue un abono. */
  xp: number;
  /** Si a quien pagó ya se le avisó el resultado (confirmado o rechazado). */
  avisado: boolean;
}

export type NuevoPago = Pick<PagoRegistrado, "id" | "grupoId" | "deId" | "aId" | "centavos" | "pares" | "creadoIso">;

/** Pagos por pares que ya saldan deudas: solo los confirmados de ese grupo. */
export function paresConfirmados(registros: readonly PagoRegistrado[], grupoId: string): Pago[] {
  return registros.filter((r) => r.grupoId === grupoId && r.estado === "confirmado").flatMap((r) => r.pares);
}

/** Confirmados + pendientes: lo que ya está "en camino"; sirve para no pagar dos veces lo mismo. */
export function paresVigentes(registros: readonly PagoRegistrado[], grupoId: string): Pago[] {
  return registros.filter((r) => r.grupoId === grupoId && r.estado !== "rechazado").flatMap((r) => r.pares);
}

/** Centavos que `deId` ya declaró pagarle a `aId` en ese grupo y siguen esperando confirmación. */
export function centavosPendientes(registros: readonly PagoRegistrado[], grupoId: string, deId: string, aId: string): number {
  return registros
    .filter((r) => r.grupoId === grupoId && r.deId === deId && r.aId === aId && r.estado === "pendiente")
    .reduce((suma, r) => suma + r.centavos, 0);
}

/** Pagos que `yo` tiene que confirmar o rechazar, del más viejo al más nuevo. */
export function porConfirmar(registros: readonly PagoRegistrado[], yo: string): PagoRegistrado[] {
  return registros.filter((r) => r.aId === yo && r.estado === "pendiente").sort((a, b) => a.creadoIso.localeCompare(b.creadoIso));
}

/** Resultados (confirmado / rechazado) de pagos de `yo` que todavía no se le han avisado. */
export function avisosParaPagador(registros: readonly PagoRegistrado[], yo: string): PagoRegistrado[] {
  return registros.filter((r) => r.deId === yo && r.estado !== "pendiente" && !r.avisado).sort((a, b) => a.creadoIso.localeCompare(b.creadoIso));
}

export function declararPago(registros: readonly PagoRegistrado[], nuevo: NuevoPago): PagoRegistrado[] {
  if (!Number.isSafeInteger(nuevo.centavos) || nuevo.centavos <= 0) throw new RangeError("centavos debe ser un entero > 0");
  if (nuevo.deId === nuevo.aId) throw new RangeError("No se puede pagar a uno mismo");
  if (nuevo.pares.length === 0) throw new RangeError("El pago necesita al menos un par");
  if (registros.some((r) => r.id === nuevo.id)) throw new RangeError("Ya existe un pago con ese id");
  return [...registros, { ...nuevo, estado: "pendiente", xp: 0, avisado: false }];
}

/**
 * Quien recibe confirma o rechaza. Solo `aId` puede resolver y solo un pago pendiente; el XP (solo al confirmar)
 * lo calcula quien llama con `xpAlConfirmar`.
 */
export function resolverPago(
  registros: readonly PagoRegistrado[],
  id: string,
  quien: string,
  decision: "confirmar" | "rechazar",
  xp = 0,
): PagoRegistrado[] {
  const pago = registros.find((r) => r.id === id);
  if (!pago) throw new RangeError("No existe ese pago");
  if (pago.aId !== quien) throw new RangeError("Solo quien recibe el pago puede confirmarlo o rechazarlo");
  if (pago.estado !== "pendiente") throw new RangeError("Ese pago ya se resolvió");
  if (!Number.isSafeInteger(xp) || xp < 0) throw new RangeError("xp debe ser un entero >= 0");
  return registros.map((r) => (r.id === id ? { ...r, estado: decision === "confirmar" ? "confirmado" : "rechazado", xp: decision === "confirmar" ? xp : 0 } : r));
}

export function marcarAvisado(registros: readonly PagoRegistrado[], ids: readonly string[]): PagoRegistrado[] {
  return registros.map((r) => (ids.includes(r.id) ? { ...r, avisado: true } : r));
}

/** XP total que `yo` ganó con pagos ya confirmados. */
export function xpPorPagosConfirmados(registros: readonly PagoRegistrado[], yo: string): number {
  return registros.filter((r) => r.deId === yo && r.estado === "confirmado").reduce((suma, r) => suma + r.xp, 0);
}
