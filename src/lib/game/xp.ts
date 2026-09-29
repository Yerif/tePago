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
