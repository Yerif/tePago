import { repartirIgual } from "./igual";
import { repartirItemizado, type Ajuste } from "./itemizado";

/** Cuánto le toca a cada persona, en centavos enteros. Σ valores + `sinAsignarCentavos` = total. */
export interface ResultadoModo {
  partes: Record<string, number>;
  /** Solo en "montos": lo que no se asignó y se queda con el pagador como deuda sin pagador actual (CLAUDE.md §7). */
  sinAsignarCentavos: number;
}

const PUNTOS_TOTAL = 10_000;

function validarTotal(totalCentavos: number): void {
  if (!Number.isSafeInteger(totalCentavos) || totalCentavos < 0) throw new RangeError("totalCentavos debe ser un entero >= 0");
}

function validarEntero(valor: number, nombre: string, minimo = 0): void {
  if (!Number.isSafeInteger(valor) || valor < minimo) throw new RangeError(`${nombre} debe ser un entero >= ${minimo}`);
}

/** Cuánto falta o sobra frente al objetivo (total, 10 000 puntos base…). Siempre uno de los dos es 0. */
export function diferencia(objetivo: number, asignado: number): { faltan: number; sobran: number } {
  return { faltan: Math.max(objetivo - asignado, 0), sobran: Math.max(asignado - objetivo, 0) };
}

function sumar(valores: Iterable<number>): number {
  let suma = 0;
  for (const v of valores) suma += v;
  return suma;
}

/**
 * Montos exactos: cada quien dice cuánto debe. Si no llegan al total, lo que falta NO bloquea: queda en
 * `sinAsignarCentavos` (con el pagador). Si se pasan del total, es un error.
 */
export function repartirPorMontos(totalCentavos: number, montos: Readonly<Record<string, number>>): ResultadoModo {
  validarTotal(totalCentavos);
  const partes: Record<string, number> = {};
  for (const [id, monto] of Object.entries(montos)) {
    validarEntero(monto, `monto de ${id}`);
    partes[id] = monto;
  }
  const asignado = sumar(Object.values(partes));
  if (asignado > totalCentavos) throw new RangeError("Los montos exceden el total");
  return { partes, sinAsignarCentavos: totalCentavos - asignado };
}

/**
 * Porcentajes en puntos base (10 000 = 100 %): deben sumar exactamente 100 %. Se redondea hacia abajo y el
 * residuo de centavos lo absorbe el pagador.
 */
export function repartirPorPorcentajes(
  totalCentavos: number,
  puntosBase: Readonly<Record<string, number>>,
  pagadorId: string,
): ResultadoModo {
  validarTotal(totalCentavos);
  for (const [id, p] of Object.entries(puntosBase)) validarEntero(p, `porcentaje de ${id}`);
  if (sumar(Object.values(puntosBase)) !== PUNTOS_TOTAL) throw new RangeError("Los porcentajes deben sumar 100 %");
  const partes: Record<string, number> = {};
  let asignado = 0;
  for (const [id, p] of Object.entries(puntosBase)) {
    const cuota = Number((BigInt(totalCentavos) * BigInt(p)) / BigInt(PUNTOS_TOTAL));
    partes[id] = cuota;
    asignado += cuota;
  }
  if (totalCentavos > asignado) partes[pagadorId] = (partes[pagadorId] ?? 0) + (totalCentavos - asignado);
  return { partes, sinAsignarCentavos: 0 };
}

/** Por partes enteras (3 noches / 2 / 2; una pareja = 2): `partes / Σ partes` del total. Residuo al pagador. */
export function repartirPorPartes(totalCentavos: number, partesPorPersona: Readonly<Record<string, number>>, pagadorId: string): ResultadoModo {
  validarTotal(totalCentavos);
  for (const [id, p] of Object.entries(partesPorPersona)) validarEntero(p, `partes de ${id}`);
  const totalPartes = sumar(Object.values(partesPorPersona));
  if (totalPartes === 0) throw new RangeError("Se necesita al menos una parte");
  const partes: Record<string, number> = {};
  let asignado = 0;
  for (const [id, p] of Object.entries(partesPorPersona)) {
    if (p === 0) continue;
    const cuota = Number((BigInt(totalCentavos) * BigInt(p)) / BigInt(totalPartes));
    partes[id] = cuota;
    asignado += cuota;
  }
  if (totalCentavos > asignado) partes[pagadorId] = (partes[pagadorId] ?? 0) + (totalCentavos - asignado);
  return { partes, sinAsignarCentavos: 0 };
}

/**
 * Igual + ajustes: a cada quien se le suma su ajuste (puede ser negativo: "Beto +$60", "Ana −$30") y lo demás
 * se divide parejo entre los participantes. Los ajustes deben ser de participantes y nadie puede quedar en negativo.
 */
export function repartirConAjustes(
  totalCentavos: number,
  participantes: readonly string[],
  ajustesCentavos: Readonly<Record<string, number>>,
  pagadorId: string,
): ResultadoModo {
  validarTotal(totalCentavos);
  let sumaAjustes = 0;
  for (const [id, a] of Object.entries(ajustesCentavos)) {
    if (!Number.isSafeInteger(a)) throw new RangeError(`ajuste de ${id} debe ser un entero`);
    if (!participantes.includes(id)) throw new RangeError(`${id} tiene un ajuste pero no participa`);
    sumaAjustes += a;
  }
  const resto = totalCentavos - sumaAjustes;
  if (resto < 0) throw new RangeError("Los ajustes exceden el total");
  const partes = repartirIgual(resto, participantes, pagadorId);
  for (const [id, a] of Object.entries(ajustesCentavos)) partes[id] = (partes[id] as number) + a;
  for (const [id, c] of Object.entries(partes)) {
    if (c < 0) throw new RangeError(`El ajuste de ${id} lo deja en negativo`);
  }
  return { partes, sinAsignarCentavos: 0 };
}

/**
 * Suma propina, impuestos u otros cargos encima de un reparto, proporcional a lo que le toca a cada quien
 * (nunca en partes iguales; CLAUDE.md §7). El residuo de centavos es del pagador.
 */
export function agregarCargos(partes: Readonly<Record<string, number>>, cargos: readonly Ajuste[], pagadorId: string): Record<string, number> {
  const renglones = Object.entries(partes).map(([userId, importeCentavos]) => ({ importeCentavos, reparto: [{ userId, partes: 1 }] }));
  if (renglones.length === 0) return {};
  const { porPersona } = repartirItemizado(renglones, cargos, pagadorId);
  return Object.fromEntries(Object.entries(porPersona).map(([id, d]) => [id, d.totalCentavos]));
}
