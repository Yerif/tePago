import type { GastoCalculable } from "./tipos";

/**
 * Saldo neto por persona en centavos, contando solo lo no saldado.
 * Positivo = le deben; negativo = debe. La suma de todos los saldos es siempre 0.
 */
export function balancesNetos(gastos: readonly GastoCalculable[]): Record<string, number> {
  const neto: Record<string, number> = {};
  for (const gasto of gastos) {
    neto[gasto.pagadoPor] ??= 0;
    for (const parte of gasto.partes) {
      neto[parte.userId] ??= 0;
      if (parte.saldado || parte.userId === gasto.pagadoPor) continue;
      neto[parte.userId] = (neto[parte.userId] as number) - parte.centavos;
      neto[gasto.pagadoPor] = (neto[gasto.pagadoPor] as number) + parte.centavos;
    }
  }
  return neto;
}
