/** Una persona y sus partes enteras de un renglón: "3 chelas mías y 1 de Ferni" → partes 3 y 1. */
export interface Reparto {
  userId: string;
  partes: number;
}

export interface RenglonAsignado {
  /** precio × cantidad del renglón, en centavos (ver `importeRenglon`). */
  importeCentavos: number;
  reparto: readonly Reparto[];
}

/** Propina, impuestos u otro cargo que se reparte proporcional al consumo de cada quien. */
export type Ajuste =
  | { tipo: "porcentaje"; /** 1000 = 10.00 % */ puntosBase: number }
  | { tipo: "monto"; centavos: number };

export interface DesglosePersona {
  consumoCentavos: number;
  ajustesCentavos: number;
  totalCentavos: number;
}

export interface ResultadoItemizado {
  subtotalCentavos: number;
  /** Monto en centavos de cada ajuste, en el orden recibido. */
  ajustesCentavos: number[];
  totalCentavos: number;
  porPersona: Record<string, DesglosePersona>;
}

const MAX_PUNTOS_BASE = 10_000;

/** precio unitario × cantidad, en centavos enteros. */
export function importeRenglon(precioUnitarioCentavos: number, cantidad: number): number {
  validarEnteroNoNegativo(precioUnitarioCentavos, "precioUnitarioCentavos");
  if (!Number.isSafeInteger(cantidad) || cantidad < 1) throw new RangeError("cantidad debe ser un entero >= 1");
  const importe = precioUnitarioCentavos * cantidad;
  validarEnteroNoNegativo(importe, "importe");
  return importe;
}

/**
 * Reparte un ticket itemizado (CLAUDE.md §7), todo en centavos enteros:
 * 1. Cada renglón se reparte según las partes; el residuo de redondeo del renglón lo absorbe el pagador.
 * 2. Cada ajuste se calcula sobre el subtotal (los porcentajes redondean a la mitad hacia arriba) y se reparte
 *    proporcional al consumo de cada persona, nunca en partes iguales; su residuo también es del pagador.
 * Σ totales por persona = subtotal + Σ ajustes, siempre. Si el pagador no consumió nada, aparece solo con residuos.
 */
export function repartirItemizado(
  renglones: readonly RenglonAsignado[],
  ajustes: readonly Ajuste[],
  pagadorId: string,
): ResultadoItemizado {
  const consumo: Record<string, number> = {};
  let subtotal = 0;

  for (const renglon of renglones) {
    validarEnteroNoNegativo(renglon.importeCentavos, "importeCentavos");
    const totalPartes = validarReparto(renglon.reparto);
    let asignado = 0;
    for (const { userId, partes } of renglon.reparto) {
      const cuota = Number((BigInt(renglon.importeCentavos) * BigInt(partes)) / BigInt(totalPartes));
      consumo[userId] = (consumo[userId] ?? 0) + cuota;
      asignado += cuota;
    }
    const residuo = renglon.importeCentavos - asignado;
    if (residuo > 0) consumo[pagadorId] = (consumo[pagadorId] ?? 0) + residuo;
    subtotal += renglon.importeCentavos;
    validarEnteroNoNegativo(subtotal, "subtotal");
  }

  const montos = ajustes.map((a) => montoDeAjuste(a, subtotal));
  const ajustePorPersona: Record<string, number> = {};
  for (const monto of montos) {
    if (monto === 0) continue;
    if (subtotal === 0) throw new RangeError("No hay consumo sobre el cual repartir el ajuste");
    let asignado = 0;
    for (const [userId, c] of Object.entries(consumo)) {
      const cuota = Number((BigInt(monto) * BigInt(c)) / BigInt(subtotal));
      ajustePorPersona[userId] = (ajustePorPersona[userId] ?? 0) + cuota;
      asignado += cuota;
    }
    const residuo = monto - asignado;
    if (residuo > 0) ajustePorPersona[pagadorId] = (ajustePorPersona[pagadorId] ?? 0) + residuo;
  }

  const porPersona: Record<string, DesglosePersona> = {};
  for (const userId of new Set([...Object.keys(consumo), ...Object.keys(ajustePorPersona)])) {
    const consumoCentavos = consumo[userId] ?? 0;
    const ajustesCentavos = ajustePorPersona[userId] ?? 0;
    porPersona[userId] = { consumoCentavos, ajustesCentavos, totalCentavos: consumoCentavos + ajustesCentavos };
  }

  return {
    subtotalCentavos: subtotal,
    ajustesCentavos: montos,
    totalCentavos: subtotal + montos.reduce((s, m) => s + m, 0),
    porPersona,
  };
}

function montoDeAjuste(ajuste: Ajuste, subtotal: number): number {
  if (ajuste.tipo === "monto") {
    validarEnteroNoNegativo(ajuste.centavos, "centavos");
    return ajuste.centavos;
  }
  if (!Number.isSafeInteger(ajuste.puntosBase) || ajuste.puntosBase < 0 || ajuste.puntosBase > MAX_PUNTOS_BASE) {
    throw new RangeError("puntosBase debe ser un entero entre 0 y 10000");
  }
  return Number((BigInt(subtotal) * BigInt(ajuste.puntosBase) + 5000n) / 10000n);
}

function validarReparto(reparto: readonly Reparto[]): number {
  if (reparto.length === 0) throw new RangeError("Cada renglón necesita al menos una persona");
  const vistos = new Set<string>();
  let total = 0;
  for (const { userId, partes } of reparto) {
    if (!Number.isSafeInteger(partes) || partes < 1) throw new RangeError("partes debe ser un entero >= 1");
    if (vistos.has(userId)) throw new RangeError("Persona repetida en un renglón");
    vistos.add(userId);
    total += partes;
  }
  return total;
}

function validarEnteroNoNegativo(valor: number, nombre: string): void {
  if (!Number.isSafeInteger(valor) || valor < 0) throw new RangeError(`${nombre} debe ser un entero >= 0`);
}
