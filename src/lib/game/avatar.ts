import { balancesNetos } from "@/lib/splits/balances";
import type { GastoCalculable } from "@/lib/splits/tipos";

/** Estado del avatar: siempre DERIVADO de las deudas, nunca almacenado (CLAUDE.md §7). */
export type EstadoAvatar = "clean" | "mild" | "rekt";

export const UMBRAL_REKT_CENTAVOS = 50_000; // $500 MXN
export const UMBRAL_REKT_HORAS = 72;

export interface SituacionGrupo {
  /** Saldo neto de la persona en el grupo, en centavos: negativo = debe. */
  balanceCentavos: number;
  /** Antigüedad (h) de su deuda sin saldar más vieja en ese grupo; null si no tiene. */
  deudaMasAntiguaHoras: number | null;
}

/**
 * - clean: saldo ≥ 0 en todos sus grupos.
 * - rekt: debe ≥ $500 en total, o alguna deuda con más de 72 h.
 * - mild: cualquier otra deuda.
 *
 * Bordes: $500 exactos es rekt; exactamente 72 h sigue siendo mild (rekt es estrictamente > 72 h).
 * Lo que se le debe en un grupo no compensa lo que debe en otro, y una deuda vieja en un grupo
 * donde su saldo es a favor no cuenta. Una persona nueva (sin grupos) es clean.
 */
export function estadoAvatar(grupos: readonly SituacionGrupo[]): EstadoAvatar {
  let debeTotal = 0;
  let deudaVencida = false;
  for (const g of grupos) {
    if (!Number.isSafeInteger(g.balanceCentavos)) throw new RangeError("balanceCentavos debe ser un entero");
    if (g.balanceCentavos >= 0) continue;
    debeTotal += -g.balanceCentavos;
    if (g.deudaMasAntiguaHoras !== null && g.deudaMasAntiguaHoras > UMBRAL_REKT_HORAS) deudaVencida = true;
  }
  if (debeTotal === 0) return "clean";
  return debeTotal >= UMBRAL_REKT_CENTAVOS || deudaVencida ? "rekt" : "mild";
}

/** Situación de `userId` en un grupo a partir de sus gastos. */
export function situacionEnGrupo(
  gastos: readonly (GastoCalculable & { fecha: string })[],
  userId: string,
  ahora: Date,
): SituacionGrupo {
  let masAntigua: number | null = null;
  for (const gasto of gastos) {
    for (const parte of gasto.partes) {
      if (parte.userId !== userId || parte.userId === gasto.pagadoPor || parte.saldado) continue;
      const horas = (ahora.getTime() - new Date(gasto.fecha).getTime()) / 3_600_000;
      if (masAntigua === null || horas > masAntigua) masAntigua = horas;
    }
  }
  return { balanceCentavos: balancesNetos(gastos)[userId] ?? 0, deudaMasAntiguaHoras: masAntigua };
}
