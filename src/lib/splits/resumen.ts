import { deudasEntrePersonas } from "./deudas";
import type { GastoCalculable } from "./tipos";

type GastoConFecha = GastoCalculable & { fecha: string };

export interface GrupoParaResumen {
  id: string;
  nombre: string;
  icono: string;
  gastos: readonly GastoConFecha[];
}

export interface DesgloseGrupo {
  grupoId: string;
  nombre: string;
  icono: string;
  /** Deuda directa con esa persona en ese grupo (ya neteada con lo que ella le debe a `yo` en el mismo grupo). */
  centavos: number;
}

export interface CuentaConPersona {
  personaId: string;
  /** Suma de las deudas directas por grupo. Nunca se netea entre grupos (CLAUDE.md §7). */
  centavos: number;
  /** Antigüedad (h) de la deuda sin saldar más vieja de la relación. */
  masViejaHoras: number;
  porGrupo: DesgloseGrupo[];
}

export interface ResumenPorPersona {
  debesCentavos: number;
  teDebenCentavos: number;
  /** Personas a las que `yo` les debe, de la deuda más vieja a la más nueva y luego de mayor a menor monto. */
  debes: CuentaConPersona[];
  /** Personas que le deben a `yo`, con el mismo orden. */
  teDeben: CuentaConPersona[];
  /** Antigüedad (h) de la deuda más vieja de `yo`; null si no debe nada. */
  masViejaHoras: number | null;
}

/** Horas de la deuda sin saldar más vieja de `deudorId` con `acreedorId` (una deuda directa siempre tiene al menos una). */
function horasDeLaMasVieja(gastos: readonly GastoConFecha[], deudorId: string, acreedorId: string, ahora: Date): number {
  const horas = gastos
    .filter((g) => g.pagadoPor === acreedorId && g.partes.some((p) => p.userId === deudorId && !p.saldado))
    .map((g) => (ahora.getTime() - new Date(g.fecha).getTime()) / 3_600_000);
  return Math.max(0, ...horas);
}

const ordenar = (a: CuentaConPersona, b: CuentaConPersona) =>
  b.masViejaHoras - a.masViejaHoras || b.centavos - a.centavos || a.personaId.localeCompare(b.personaId);

/**
 * Pantalla de inicio: una fila por PERSONA (no por grupo) con lo que le debes o te debe, sumando sus deudas directas de
 * cada grupo, con el desglose por grupo. Cada cifra es exactamente lo que se paga: la deuda directa neteada de dos en dos
 * dentro de cada grupo; los grupos no se compensan entre sí.
 */
export function resumenPorPersona(grupos: readonly GrupoParaResumen[], yo: string, ahora: Date): ResumenPorPersona {
  const debe = new Map<string, CuentaConPersona>();
  const loDeben = new Map<string, CuentaConPersona>();

  const sumar = (mapa: Map<string, CuentaConPersona>, personaId: string, g: GrupoParaResumen, centavos: number, horas: number) => {
    const cuenta = mapa.get(personaId) ?? { personaId, centavos: 0, masViejaHoras: 0, porGrupo: [] };
    cuenta.centavos += centavos;
    cuenta.masViejaHoras = Math.max(cuenta.masViejaHoras, horas);
    cuenta.porGrupo.push({ grupoId: g.id, nombre: g.nombre, icono: g.icono, centavos });
    mapa.set(personaId, cuenta);
  };

  for (const g of grupos) {
    for (const d of deudasEntrePersonas(g.gastos)) {
      if (d.deudorId === yo) sumar(debe, d.acreedorId, g, d.centavos, horasDeLaMasVieja(g.gastos, yo, d.acreedorId, ahora));
      else if (d.acreedorId === yo) sumar(loDeben, d.deudorId, g, d.centavos, horasDeLaMasVieja(g.gastos, d.deudorId, yo, ahora));
    }
  }

  const debes = [...debe.values()].sort(ordenar);
  const teDeben = [...loDeben.values()].sort(ordenar);
  return {
    debesCentavos: debes.reduce((s, c) => s + c.centavos, 0),
    teDebenCentavos: teDeben.reduce((s, c) => s + c.centavos, 0),
    debes,
    teDeben,
    masViejaHoras: debes.length === 0 ? null : Math.max(...debes.map((c) => c.masViejaHoras)),
  };
}

/**
 * Reparte un pago a una persona entre los grupos donde se le debe, empezando por el primero del desglose (el de la deuda
 * más vieja si viene ordenado así). Cada tramo no pasa de la deuda de ese grupo; Σ tramos = `centavos`.
 * Lanza si `centavos` es inválido o excede el total.
 */
export function repartirAbonoEntreGrupos(desglose: readonly Pick<DesgloseGrupo, "grupoId" | "centavos">[], centavos: number): { grupoId: string; centavos: number }[] {
  if (!Number.isSafeInteger(centavos) || centavos <= 0) throw new RangeError("centavos debe ser un entero > 0");
  if (centavos > desglose.reduce((s, d) => s + d.centavos, 0)) throw new RangeError("El pago excede lo que se debe");
  const tramos: { grupoId: string; centavos: number }[] = [];
  let falta = centavos;
  for (const d of desglose) {
    if (falta === 0) break;
    const tramo = Math.min(falta, d.centavos);
    tramos.push({ grupoId: d.grupoId, centavos: tramo });
    falta -= tramo;
  }
  return tramos;
}
