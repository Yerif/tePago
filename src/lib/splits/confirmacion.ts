import type { Pago } from "./pagos";

export type EstadoPago = "pendiente" | "confirmado" | "rechazado" | "cancelado";
export type Respuesta = "confirmado" | "rechazado";

/**
 * Un pago declarado por quien debe (`deId`) y que solo salda algo cuando lo confirman todas las personas requeridas
 * (CLAUDE.md §7, "Confirmación de pagos"). `pares` es la descomposición en pagos por pares (un pago directo tiene uno;
 * "pagar menos veces" puede tener varios) y `requeridos` son los acreedores de esos pares.
 */
export interface PagoRegistrado {
  id: string;
  /** Un solo gesto de pago puede abarcar varios grupos (un pago por grupo); comparten `loteId` y se responden juntos. */
  loteId: string;
  grupoId: string;
  deId: string;
  aId: string;
  centavos: number;
  pares: Pago[];
  requeridos: string[];
  respuestas: Record<string, Respuesta>;
  estado: EstadoPago;
  /** Cuándo declaró el pago quien debe (ISO): de aquí sale la antigüedad de la deuda para el XP. */
  creadoIso: string;
  /** XP que ganó quien pagó al confirmarse; 0 mientras no esté confirmado o si fue un abono. */
  xp: number;
  /** Si a quien pagó ya se le avisó el último resultado (confirmado o rechazado). */
  avisado: boolean;
}

export type NuevoPago = Pick<PagoRegistrado, "id" | "grupoId" | "deId" | "aId" | "centavos" | "pares" | "creadoIso"> & { loteId?: string };

const porAntiguedad = (a: PagoRegistrado, b: PagoRegistrado) => a.creadoIso.localeCompare(b.creadoIso);

/** Pagos por pares que ya saldan deudas: solo los confirmados de ese grupo. */
export function paresConfirmados(registros: readonly PagoRegistrado[], grupoId: string): Pago[] {
  return registros.filter((r) => r.grupoId === grupoId && r.estado === "confirmado").flatMap((r) => r.pares);
}

/** Confirmados + pendientes + en disputa: lo que ya está "en camino"; sirve para no pagar dos veces lo mismo. */
export function paresVigentes(registros: readonly PagoRegistrado[], grupoId: string): Pago[] {
  return registros.filter((r) => r.grupoId === grupoId && r.estado !== "cancelado").flatMap((r) => r.pares);
}

function sumaDe(registros: readonly PagoRegistrado[], grupoId: string, deId: string, aId: string, estado: EstadoPago): number {
  return registros.filter((r) => r.grupoId === grupoId && r.deId === deId && r.aId === aId && r.estado === estado).reduce((suma, r) => suma + r.centavos, 0);
}

/** Centavos que `deId` declaró pagarle a `aId` y siguen esperando confirmación. */
export function centavosPendientes(registros: readonly PagoRegistrado[], grupoId: string, deId: string, aId: string): number {
  return sumaDe(registros, grupoId, deId, aId, "pendiente");
}

/** Centavos de pagos que alguien rechazó pero que siguen reservados hasta que se resuelvan o se cancelen. */
export function centavosEnDisputa(registros: readonly PagoRegistrado[], grupoId: string, deId: string, aId: string): number {
  return sumaDe(registros, grupoId, deId, aId, "rechazado");
}

/** Pagos pendientes en los que `yo` es una de las personas que deben responder y aún no ha respondido. */
export function porConfirmar(registros: readonly PagoRegistrado[], yo: string): PagoRegistrado[] {
  return registros.filter((r) => r.estado === "pendiente" && r.requeridos.includes(yo) && r.respuestas[yo] === undefined).sort(porAntiguedad);
}

/** Pagos que `yo` rechazó y que todavía puede aprobar más tarde. */
export function porRevisar(registros: readonly PagoRegistrado[], yo: string): PagoRegistrado[] {
  return registros.filter((r) => r.estado === "rechazado" && r.respuestas[yo] === "rechazado").sort(porAntiguedad);
}

/** Resultados (confirmado / rechazado) de pagos de `yo` que todavía no se le han avisado. */
export function avisosParaPagador(registros: readonly PagoRegistrado[], yo: string): PagoRegistrado[] {
  return registros.filter((r) => r.deId === yo && (r.estado === "confirmado" || r.estado === "rechazado") && !r.avisado).sort(porAntiguedad);
}

function estadoDesde(requeridos: readonly string[], respuestas: Readonly<Record<string, Respuesta>>): "pendiente" | "confirmado" | "rechazado" {
  if (requeridos.some((q) => respuestas[q] === "rechazado")) return "rechazado";
  return requeridos.every((q) => respuestas[q] === "confirmado") ? "confirmado" : "pendiente";
}

export function declararPago(registros: readonly PagoRegistrado[], nuevo: NuevoPago): PagoRegistrado[] {
  if (!Number.isSafeInteger(nuevo.centavos) || nuevo.centavos <= 0) throw new RangeError("centavos debe ser un entero > 0");
  if (nuevo.deId === nuevo.aId) throw new RangeError("No se puede pagar a uno mismo");
  if (nuevo.pares.length === 0) throw new RangeError("El pago necesita al menos un par");
  if (registros.some((r) => r.id === nuevo.id)) throw new RangeError("Ya existe un pago con ese id");
  const requeridos = [...new Set(nuevo.pares.map((p) => p.acreedorId))];
  return [...registros, { ...nuevo, loteId: nuevo.loteId ?? nuevo.id, requeridos, respuestas: {}, estado: "pendiente", xp: 0, avisado: false }];
}

/**
 * Una persona requerida confirma o rechaza. Es reversible: quien rechazó puede aprobar más tarde; lo que ya
 * confirmó no se puede cambiar. Cuando todas confirman el pago queda confirmado (con el XP que calcula quien llama
 * con `xpAlConfirmar`) y si alguien rechaza queda en disputa. A quien pagó se le vuelve a avisar solo si el estado cambia.
 */
export function responderPago(
  registros: readonly PagoRegistrado[],
  id: string,
  quien: string,
  decision: Respuesta,
  xp = 0,
): PagoRegistrado[] {
  const pago = registros.find((r) => r.id === id);
  if (!pago) throw new RangeError("No existe ese pago");
  if (!pago.requeridos.includes(quien)) throw new RangeError("Solo las personas a las que se les pagó pueden confirmarlo o rechazarlo");
  if (pago.estado === "cancelado") throw new RangeError("Ese pago fue cancelado");
  if (pago.estado === "confirmado" || pago.respuestas[quien] === "confirmado") throw new RangeError("Ese pago ya se confirmó");
  if (!Number.isSafeInteger(xp) || xp < 0) throw new RangeError("xp debe ser un entero >= 0");
  const respuestas = { ...pago.respuestas, [quien]: decision };
  const estado = estadoDesde(pago.requeridos, respuestas);
  return registros.map((r) =>
    r.id === id ? { ...r, respuestas, estado, xp: estado === "confirmado" ? xp : 0, avisado: estado === r.estado || estado === "pendiente" ? r.avisado : false } : r,
  );
}

/** Quien pagó retira su pago mientras esté pendiente o en disputa; libera el monto. */
export function cancelarPago(registros: readonly PagoRegistrado[], id: string, quien: string): PagoRegistrado[] {
  const pago = registros.find((r) => r.id === id);
  if (!pago) throw new RangeError("No existe ese pago");
  if (pago.deId !== quien) throw new RangeError("Solo quien pagó puede cancelar su pago");
  if (pago.estado === "confirmado") throw new RangeError("Ese pago ya se confirmó");
  if (pago.estado === "cancelado") throw new RangeError("Ese pago ya estaba cancelado");
  return registros.map((r) => (r.id === id ? { ...r, estado: "cancelado" as const, xp: 0 } : r));
}

export function marcarAvisado(registros: readonly PagoRegistrado[], ids: readonly string[]): PagoRegistrado[] {
  return registros.map((r) => (ids.includes(r.id) ? { ...r, avisado: true } : r));
}

/** XP total que `yo` ganó con pagos ya confirmados. */
export function xpPorPagosConfirmados(registros: readonly PagoRegistrado[], yo: string): number {
  return registros.filter((r) => r.deId === yo && r.estado === "confirmado").reduce((suma, r) => suma + r.xp, 0);
}

/** Responde varios pagos de golpe (un lote) con el XP de cada uno; todo o nada: si uno no se puede, no se cambia ninguno. */
export function responderVarios(
  registros: readonly PagoRegistrado[],
  items: readonly { id: string; xp: number }[],
  quien: string,
  decision: Respuesta,
): PagoRegistrado[] {
  return items.reduce((acumulados, { id, xp }) => responderPago(acumulados, id, quien, decision, xp), registros as PagoRegistrado[]);
}
