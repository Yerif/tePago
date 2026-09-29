/** XP que pide el nivel `nivel` para subir al siguiente: 100 + (n-1)*75 (CLAUDE.md §7). */
export function xpParaSubir(nivel: number): number {
  validarNivel(nivel);
  return 100 + (nivel - 1) * 75;
}

/** XP total necesaria para llegar al nivel `nivel` (el nivel 1 es 0). Suma de `xpParaSubir(1..nivel-1)`. */
export function xpAcumuladaParaNivel(nivel: number): number {
  validarNivel(nivel);
  const k = nivel - 1;
  return 100 * k + (75 * k * (k - 1)) / 2;
}

export interface ProgresoNivel {
  nivel: number;
  /** XP acumulada dentro del nivel actual. */
  xpEnNivel: number;
  /** XP que pide el nivel actual para subir. */
  xpSiguiente: number;
}

/** De la XP total (lo que guarda `profiles.xp`) al nivel y su progreso. */
export function progresoNivel(xpTotal: number): ProgresoNivel {
  if (!Number.isSafeInteger(xpTotal) || xpTotal < 0) throw new RangeError("xpTotal debe ser un entero >= 0");
  let nivel = 1;
  let restante = xpTotal;
  while (restante >= xpParaSubir(nivel)) {
    restante -= xpParaSubir(nivel);
    nivel += 1;
  }
  return { nivel, xpEnNivel: restante, xpSiguiente: xpParaSubir(nivel) };
}

function validarNivel(nivel: number): void {
  if (!Number.isSafeInteger(nivel) || nivel < 1) throw new RangeError("nivel debe ser un entero >= 1");
}
