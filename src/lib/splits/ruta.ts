import type { DeudaEntre } from "./deudas";
import type { Pago } from "./pagos";

export interface RutaDePago {
  /** Pagos por pares que, juntos, equivalen a que `de` le pague `centavos` a `a`. */
  pagos: Pago[];
  /** Lo que no se pudo cubrir por falta de una cadena de deudas entre ambos. */
  sobranteCentavos: number;
}

/**
 * Convierte un pago del plan de pagos (de → a) en pagos por pares sobre las deudas existentes.
 * Si A le debe a B y B le debe a C, "A le paga a C" equivale a que A pague a B y B pague a C (triangular):
 * se busca el camino más corto en el grafo "quién le debe a quién" y se aplica el cuello de botella, hasta cubrir
 * el monto o quedarse sin camino. Los saldos netos de todos quedan exactamente como si la transferencia fuera directa.
 */
export function rutaDePago(deudas: readonly DeudaEntre[], de: string, a: string, centavos: number): RutaDePago {
  if (!Number.isSafeInteger(centavos) || centavos <= 0) throw new RangeError("centavos debe ser un entero > 0");
  if (de === a) throw new RangeError("No se puede pagar a uno mismo");

  const resta = new Map<string, number>(); // "deudor>acreedor" -> centavos
  for (const d of deudas) resta.set(`${d.deudorId}>${d.acreedorId}`, (resta.get(`${d.deudorId}>${d.acreedorId}`) ?? 0) + d.centavos);

  const aplicados = new Map<string, number>();
  let falta = centavos;
  while (falta > 0) {
    const camino = caminoMasCorto(resta, de, a);
    if (!camino) break;
    const tramo = Math.min(falta, ...camino.map((llave) => resta.get(llave) as number));
    for (const llave of camino) {
      resta.set(llave, (resta.get(llave) as number) - tramo);
      aplicados.set(llave, (aplicados.get(llave) ?? 0) + tramo);
    }
    falta -= tramo;
  }

  const pagos: Pago[] = [...aplicados].map(([llave, c]) => {
    const [deudorId, acreedorId] = llave.split(">") as [string, string];
    return { deudorId, acreedorId, centavos: c };
  });
  return { pagos, sobranteCentavos: falta };
}

function caminoMasCorto(resta: ReadonlyMap<string, number>, de: string, a: string): string[] | null {
  const previo = new Map<string, string>(); // nodo -> llave de la arista con la que se llegó
  const visitados = new Set([de]);
  const cola = [de];
  for (let i = 0; i < cola.length; i++) {
    const nodo = cola[i] as string;
    for (const [llave, monto] of resta) {
      if (monto <= 0) continue;
      const [origen, destino] = llave.split(">") as [string, string];
      if (origen !== nodo || visitados.has(destino)) continue;
      visitados.add(destino);
      previo.set(destino, llave);
      if (destino === a) {
        const camino: string[] = [];
        for (let actual = a; actual !== de; ) {
          const arista = previo.get(actual) as string;
          camino.unshift(arista);
          actual = arista.split(">")[0] as string;
        }
        return camino;
      }
      cola.push(destino);
    }
  }
  return null;
}
