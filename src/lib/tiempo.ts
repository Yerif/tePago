/** "hace 5 h", "hace 3 días"… para mostrar la edad de un gasto o una deuda. */
export function tiempoRelativo(fechaIso: string, ahora: Date): string {
  const horas = Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 3_600_000);
  if (horas < 1) return "hace un momento";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}
