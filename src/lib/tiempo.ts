/** "hace 5 h", "hace 3 días"… a partir de las horas transcurridas. */
export function tiempoDesdeHoras(horasTranscurridas: number): string {
  const horas = Math.floor(horasTranscurridas);
  if (horas < 1) return "hace un momento";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

/** "hace 5 h", "hace 3 días"… para mostrar la edad de un gasto o una deuda. */
export function tiempoRelativo(fechaIso: string, ahora: Date): string {
  return tiempoDesdeHoras((ahora.getTime() - new Date(fechaIso).getTime()) / 3_600_000);
}

/** Versión corta para filas apretadas: "ahora", "hace 5 h", "hace 3 d". */
export function tiempoCorto(horasTranscurridas: number): string {
  const horas = Math.floor(horasTranscurridas);
  if (horas < 1) return "ahora";
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}
