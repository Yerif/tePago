/** Contraste WCAG 2.x entre dos colores hex (#rrggbb). TS puro. */
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Lee los tokens `--nombre: valor;` de un bloque CSS y resuelve `var(--otro)`. */
export function leerTokens(bloque: string, base: Record<string, string> = {}): Record<string, string> {
  const tokens: Record<string, string> = { ...base };
  for (const m of bloque.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1] as string] = (m[2] as string).trim();
  for (const [k, v] of Object.entries(tokens)) {
    const ref = v.match(/^var\(--([\w-]+)\)$/);
    if (ref) tokens[k] = tokens[ref[1] as string] ?? v;
  }
  return tokens;
}
