import type { GastoCalculable } from "./tipos";

export interface DeudaEntre {
  deudorId: string;
  acreedorId: string;
  /** Centavos que `deudorId` le debe a `acreedorId`, ya compensando lo que este le deba a él. Siempre > 0. */
  centavos: number;
}

/**
 * "Quién le debe a quién": para cada par de personas suma lo que cada una le debe a la otra (partes sin
 * saldar de gastos que pagó la otra) y deja solo la diferencia. No simplifica cadenas entre 3 o más personas
 * (A→B→C): eso es post-MVP (CLAUDE.md §7). Orden estable: de mayor a menor monto, y por ids en empate.
 */
export function deudasEntrePersonas(gastos: readonly GastoCalculable[]): DeudaEntre[] {
  const debe = new Map<string, number>(); // "deudor>acreedor" -> centavos
  for (const gasto of gastos) {
    for (const parte of gasto.partes) {
      if (parte.saldado || parte.userId === gasto.pagadoPor) continue;
      const llave = `${parte.userId}>${gasto.pagadoPor}`;
      debe.set(llave, (debe.get(llave) ?? 0) + parte.centavos);
    }
  }

  const deudas: DeudaEntre[] = [];
  for (const [llave, centavos] of debe) {
    const [deudorId, acreedorId] = llave.split(">") as [string, string];
    const inverso = debe.get(`${acreedorId}>${deudorId}`) ?? 0;
    // Cada par se procesa una sola vez: lo hace el lado que debe más (o el de menor id si empatan, que se anulan).
    if (centavos > inverso) deudas.push({ deudorId, acreedorId, centavos: centavos - inverso });
  }
  return deudas.sort((a, b) => b.centavos - a.centavos || a.deudorId.localeCompare(b.deudorId) || a.acreedorId.localeCompare(b.acreedorId));
}
