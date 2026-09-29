const ENTERO_MX = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });

/** Centavos enteros → "$1,240.50". La conversión a pesos solo ocurre al mostrar (CLAUDE.md §7). */
export function formatoMXN(centavos: number): string {
  if (!Number.isSafeInteger(centavos)) throw new RangeError("centavos debe ser un entero seguro");
  const signo = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const pesos = Math.floor(abs / 100);
  const resto = String(abs % 100).padStart(2, "0");
  return `${signo}$${ENTERO_MX.format(pesos)}.${resto}`;
}

/**
 * Texto → centavos enteros, sin `parseFloat`. Acepta "850", "1240.5" y "$1,240.50".
 * Devuelve null si no es un monto válido (hasta 7 dígitos enteros y 2 decimales).
 */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(limpio)) return null;
  const [entero = "0", decimales = ""] = limpio.split(".");
  return Number(entero) * 100 + Number(decimales.padEnd(2, "0"));
}
