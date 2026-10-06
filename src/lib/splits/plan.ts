export interface Transferencia {
  deId: string;
  aId: string;
  /** Centavos, siempre > 0. */
  centavos: number;
}

/**
 * Plan de pagos más sencillo para todos: a partir del saldo neto de cada persona (positivo = le deben,
 * negativo = debe; Σ = 0) devuelve pocas transferencias que dejan a todos en cero (≤ personas − 1).
 * Cada vez, quien más debe le paga a quien más le deben. Orden estable (monto desc, luego ids).
 */
export function planDePagos(saldosNetos: Readonly<Record<string, number>>): Transferencia[] {
  const deudores: { id: string; resta: number }[] = [];
  const acreedores: { id: string; resta: number }[] = [];
  let suma = 0;
  for (const [id, saldo] of Object.entries(saldosNetos)) {
    if (!Number.isSafeInteger(saldo)) throw new RangeError(`El saldo de ${id} debe ser un entero`);
    suma += saldo;
    if (saldo < 0) deudores.push({ id, resta: -saldo });
    else if (saldo > 0) acreedores.push({ id, resta: saldo });
  }
  if (suma !== 0) throw new RangeError("Los saldos deben sumar 0");

  const orden = (a: { id: string; resta: number }, b: { id: string; resta: number }) => b.resta - a.resta || a.id.localeCompare(b.id);
  const plan: Transferencia[] = [];
  while (deudores.length > 0 && acreedores.length > 0) {
    deudores.sort(orden);
    acreedores.sort(orden);
    const d = deudores[0] as { id: string; resta: number };
    const a = acreedores[0] as { id: string; resta: number };
    const centavos = Math.min(d.resta, a.resta);
    plan.push({ deId: d.id, aId: a.id, centavos });
    d.resta -= centavos;
    a.resta -= centavos;
    if (d.resta === 0) deudores.shift();
    if (a.resta === 0) acreedores.shift();
  }
  return plan;
}
