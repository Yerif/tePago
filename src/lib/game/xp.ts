import { ZONA_HORARIA } from "./badges";

/** Tabla de XP (CLAUDE.md §7). La función SQL `otorgar_xp` la replica y un test compara ambas. */
export const XP = {
  REGISTRAR_GASTO: 10,
  SALDAR_MENOS_24H: 50,
  SALDAR_MENOS_48H: 30,
  SALDAR_MENOS_7D: 10,
  SEMANA_SIN_DEUDAS: 25,
} as const;

/** XP por saldar una deuda según lo que tardó (en horas, puede ser fraccionaria). Pasados 7 días no da XP. */
export function xpPorSaldar(horasDesdeLaDeuda: number): number {
  if (!Number.isFinite(horasDesdeLaDeuda) || horasDesdeLaDeuda < 0) {
    throw new RangeError("horasDesdeLaDeuda debe ser un número >= 0");
  }
  if (horasDesdeLaDeuda < 24) return XP.SALDAR_MENOS_24H;
  if (horasDesdeLaDeuda < 48) return XP.SALDAR_MENOS_48H;
  if (horasDesdeLaDeuda < 24 * 7) return XP.SALDAR_MENOS_7D;
  return 0;
}

/**
 * XP de un pago: suma `xpPorSaldar` de cada deuda que ese pago deja saldada por completo, según su antigüedad.
 * Un abono que no termina de saldar nada no da XP (D6: así no se hace farming abonando de a poquito).
 */
export function xpPorPago(saldadas: readonly { fecha: string }[], ahora: Date): number {
  return saldadas.reduce((total, { fecha }) => total + xpPorSaldar(Math.max(0, (ahora.getTime() - new Date(fecha).getTime()) / 3_600_000)), 0);
}

/** Anti-farming de XP (D5, aprobado el 2026-10-02): un gasto da XP solo si lo comparten ≥ 2 personas y hasta 5 por día. */
export const MIN_PARTICIPANTES_XP = 2;
export const MAX_GASTOS_CON_XP_POR_DIA = 5;

/** Cuántas de las fechas (ISO) caen en el mismo día calendario que `ahora`, en la zona horaria del grupo. */
export function contarDelDia(fechasIso: readonly string[], ahora: Date, zonaHoraria: string = ZONA_HORARIA): number {
  const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria }).format(d); // "2026-10-05"
  const hoy = dia(ahora);
  return fechasIso.filter((f) => dia(new Date(f)) === hoy).length;
}

export interface EntradaXpGasto {
  /** Personas entre las que se divide el gasto (el pagador cuenta si participa). */
  participantes: number;
  /** Gastos que el usuario ya registró hoy y que sí dieron XP. */
  gastosConXpHoy: number;
}

/** XP por registrar un gasto: 0 si es de una sola persona o si ya llegó al tope del día. */
export function xpPorRegistrarGasto({ participantes, gastosConXpHoy }: EntradaXpGasto): number {
  if (!Number.isSafeInteger(participantes) || participantes < 1) throw new RangeError("participantes debe ser un entero >= 1");
  if (!Number.isSafeInteger(gastosConXpHoy) || gastosConXpHoy < 0) throw new RangeError("gastosConXpHoy debe ser un entero >= 0");
  if (participantes < MIN_PARTICIPANTES_XP || gastosConXpHoy >= MAX_GASTOS_CON_XP_POR_DIA) return 0;
  return XP.REGISTRAR_GASTO;
}

export interface EntradaXpSemana {
  /** Hubo al menos un gasto registrado o un pago en la semana. */
  huboActividad: boolean;
  /** Deudas sin saldar al cierre de la semana. */
  deudasPendientes: number;
}

/** XP de "semana completa sin deudas": solo si hubo actividad (no se regala a quien no usó la app). */
export function xpSemanaSinDeudas({ huboActividad, deudasPendientes }: EntradaXpSemana): number {
  if (!Number.isSafeInteger(deudasPendientes) || deudasPendientes < 0) throw new RangeError("deudasPendientes debe ser un entero >= 0");
  return huboActividad && deudasPendientes === 0 ? XP.SEMANA_SIN_DEUDAS : 0;
}
