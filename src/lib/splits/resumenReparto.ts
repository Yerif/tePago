import { formatoMXN } from "./formato";

/**
 * Una línea que responde "¿cuánto le toca a cada quien?" y cabe junto al botón de confirmar: "$212.50 c/u" si todos pagan
 * lo mismo y "de $200.00 a $225.00 por persona" si no. Sin reparto (o vacío) no hay nada que decir.
 */
export function resumenReparto(partes: Record<string, number> | null): string | null {
  const montos = Object.values(partes ?? {});
  if (montos.length === 0) return null;
  const min = Math.min(...montos);
  const max = Math.max(...montos);
  return min === max ? `${formatoMXN(min)} c/u` : `de ${formatoMXN(min)} a ${formatoMXN(max)} por persona`;
}

/** Qué falta para poder confirmar, dicho como la etiqueta del botón deshabilitado. */
export function queFaltaParaConfirmar(centavos: number | null, participantes: number): string {
  if (centavos === null || centavos <= 0) return "Escribe el monto";
  if (participantes === 0) return "Elige a quién se divide";
  return "Completa el reparto";
}
