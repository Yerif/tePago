import { repartirItemizado, importeRenglon, type Ajuste, type RenglonAsignado, type ResultadoItemizado } from "./itemizado";

/**
 * Borrador de gasto: lo que la IA (o el formulario) propone y la persona revisa antes de guardar.
 * Es TS puro y no sabe nada de la IA: `lib/ai/aBorrador` traduce la salida de B1 a este formato.
 */
export interface RenglonBorrador {
  nombre: string;
  cantidad: number;
  precioUnitarioCentavos: number | null;
  importeCentavos: number | null;
  reparto: { userId: string; partes: number }[];
}

export interface BorradorGasto {
  descripcion: string;
  categoria: string;
  moneda: string;
  /** Total de la cuenta, sin propina ni impuestos; null si no se dijo. */
  totalCentavos: number | null;
  pagadorId: string | null;
  renglones: RenglonBorrador[];
  /** Entre quiénes se divide lo que no está en renglones (o todo, si no hay renglones). */
  restoEntre: string[] | null;
  propina: Ajuste | null;
  impuestos: Ajuste | null;
}

export type CodigoProblema =
  | "sin_monto"
  | "sin_participantes"
  | "resto_sin_asignar"
  | "renglon_sin_monto"
  | "renglon_sin_personas"
  | "items_exceden_total";

export interface ProblemaBorrador {
  codigo: CodigoProblema;
  /** Impide confirmar; si es false es solo un aviso y el cálculo sigue. */
  bloqueante: boolean;
  /** Centavos involucrados (p. ej. lo que falta por asignar). */
  centavos?: number;
  /** Índice del renglón afectado. */
  renglon?: number;
}

export interface CalculoBorrador {
  modo: "igual" | "itemizado";
  pagadorId: string;
  /** El pagador no venía en el texto y se propuso a quien escribe. */
  pagadorPropuesto: boolean;
  problemas: ProblemaBorrador[];
  /** null mientras haya un problema bloqueante. */
  resultado: ResultadoItemizado | null;
}

/**
 * Calcula el reparto de un borrador (PROMPTS.md B1, "Después de la IA"):
 * - Con renglones el modo es `itemizado`; sin ellos, `igual`.
 * - Lo que el total tiene de más sobre los renglones (`total − Σ renglones`) se divide en partes iguales entre `restoEntre`.
 * - Si los renglones suman más que el total se avisa y se usa la suma.
 * - Propina e impuestos se reparten proporcional al consumo (repartirItemizado).
 * - Si no se dijo quién pagó, se propone a `quienEscribeId`.
 */
export function calcularBorrador(b: BorradorGasto, quienEscribeId: string): CalculoBorrador {
  const problemas: ProblemaBorrador[] = [];
  const pagadorId = b.pagadorId ?? quienEscribeId;
  const modo = b.renglones.length > 0 ? "itemizado" : "igual";
  const renglones: RenglonAsignado[] = [];
  let sumaRenglones = 0;

  b.renglones.forEach((r, i) => {
    const importe = r.importeCentavos ?? (r.precioUnitarioCentavos === null ? null : importeRenglon(r.precioUnitarioCentavos, r.cantidad));
    if (importe === null) problemas.push({ codigo: "renglon_sin_monto", bloqueante: true, renglon: i });
    if (r.reparto.length === 0) problemas.push({ codigo: "renglon_sin_personas", bloqueante: true, renglon: i });
    if (importe === null || r.reparto.length === 0) return;
    sumaRenglones += importe;
    renglones.push({ importeCentavos: importe, reparto: r.reparto });
  });

  const participantes = b.restoEntre ?? [];
  const lineaResto = (centavos: number): RenglonAsignado => ({
    importeCentavos: centavos,
    reparto: participantes.map((userId) => ({ userId, partes: 1 })),
  });
  // Un total en 0 o negativo equivale a "no se dijo".
  const total = b.totalCentavos !== null && b.totalCentavos > 0 ? b.totalCentavos : null;

  if (modo === "igual") {
    if (total === null) problemas.push({ codigo: "sin_monto", bloqueante: true });
    else if (participantes.length === 0) problemas.push({ codigo: "sin_participantes", bloqueante: true, centavos: total });
    else renglones.push(lineaResto(total));
  } else {
    if (total === null && sumaRenglones === 0 && !problemas.some((p) => p.bloqueante)) {
      problemas.push({ codigo: "sin_monto", bloqueante: true });
    }
    if (total !== null) {
      const resto = total - sumaRenglones;
      if (resto < 0) problemas.push({ codigo: "items_exceden_total", bloqueante: false, centavos: -resto });
      else if (resto > 0 && participantes.length === 0) problemas.push({ codigo: "resto_sin_asignar", bloqueante: true, centavos: resto });
      else if (resto > 0) renglones.push(lineaResto(resto));
    }
  }

  const ajustes = [b.propina, b.impuestos].filter((a): a is Ajuste => a !== null);
  const bloqueado = problemas.some((p) => p.bloqueante);
  return {
    modo,
    pagadorId,
    pagadorPropuesto: b.pagadorId === null,
    problemas,
    resultado: bloqueado ? null : repartirItemizado(renglones, ajustes, pagadorId),
  };
}
