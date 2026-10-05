import type { GastoCalculable } from "./tipos";

/** Un pago (total o abono) de `deudorId` a `acreedorId`, en centavos enteros. */
export interface Pago {
  deudorId: string;
  acreedorId: string;
  centavos: number;
}

type ConFecha = { fecha: string };

/**
 * Aplica los pagos a las deudas, primero a las más viejas (PEPS) y solo en la dirección deudor → acreedor.
 * Devuelve la vista de lo PENDIENTE: cada parte baja a lo que aún falta y queda `saldado` al llegar a 0.
 * Así `balancesNetos`, `deudasEntrePersonas` y `situacionEnGrupo` aceptan abonos sin cambiar. Un pago mayor
 * que la deuda en esa dirección se ignora en el excedente (la UI no debería permitirlo).
 */
export function aplicarPagos<T extends GastoCalculable & ConFecha>(gastos: readonly T[], pagos: readonly Pago[]): T[] {
  const restante = new Map<string, number>(); // "deudor>acreedor" -> centavos por aplicar
  for (const pago of pagos) {
    if (!Number.isSafeInteger(pago.centavos) || pago.centavos <= 0) throw new RangeError("centavos del pago debe ser un entero > 0");
    const llave = `${pago.deudorId}>${pago.acreedorId}`;
    restante.set(llave, (restante.get(llave) ?? 0) + pago.centavos);
  }

  const nuevaParte = new Map<string, { centavos: number; saldado: boolean }>(); // "idGasto>userId"
  const masViejosPrimero = [...gastos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  for (const gasto of masViejosPrimero) {
    for (const parte of gasto.partes) {
      if (parte.saldado || parte.userId === gasto.pagadoPor) continue;
      const llave = `${parte.userId}>${gasto.pagadoPor}`;
      const disponible = restante.get(llave) ?? 0;
      const aplicado = Math.min(disponible, parte.centavos);
      if (aplicado === 0) continue;
      restante.set(llave, disponible - aplicado);
      const falta = parte.centavos - aplicado;
      nuevaParte.set(`${gasto.id}>${parte.userId}`, { centavos: falta, saldado: falta === 0 });
    }
  }

  return gastos.map((gasto) => ({
    ...gasto,
    partes: gasto.partes.map((parte) => ({ ...parte, ...nuevaParte.get(`${gasto.id}>${parte.userId}`) })),
  }));
}

export interface ParteSaldada {
  gastoId: string;
  userId: string;
  /** Fecha del gasto: de ahí sale la antigüedad de la deuda para el XP. */
  fecha: string;
}

/** Las deudas (partes de un gasto) que `pago` termina de saldar por completo, dados los pagos previos. */
export function partesQueSeSaldan<T extends GastoCalculable & ConFecha>(gastos: readonly T[], previos: readonly Pago[], pago: Pago): ParteSaldada[] {
  const antes = aplicarPagos(gastos, previos);
  const despues = aplicarPagos(gastos, [...previos, pago]);
  const saldadas: ParteSaldada[] = [];
  despues.forEach((gasto, i) => {
    for (const parte of gasto.partes) {
      const previa = antes[i]?.partes.find((p) => p.userId === parte.userId);
      if (parte.saldado && previa && !previa.saldado) saldadas.push({ gastoId: gasto.id, userId: parte.userId, fecha: gasto.fecha });
    }
  });
  return saldadas;
}
