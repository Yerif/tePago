/** Percentil `p` (0–100) por interpolación lineal; 0 si no hay valores. */
export function percentil(valores: readonly number[], p: number): number {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const pos = (Math.min(Math.max(p, 0), 100) / 100) * (orden.length - 1);
  const bajo = Math.floor(pos);
  const alto = Math.ceil(pos);
  return (orden[bajo] as number) + ((orden[alto] as number) - (orden[bajo] as number)) * (pos - bajo);
}

/**
 * FPS de un render a partir del tiempo entre cuadros (segundos): mediana y p5 (el 5 % de los cuadros más lentos).
 * Ignora tiempos no positivos. Sirve para el medidor de `?debug=1` y para cerrar PJ-02 en celulares reales.
 */
export function resumenFps(deltasSegundos: readonly number[]): { fpsMediana: number; fpsP5: number } {
  const fps = deltasSegundos.filter((d) => d > 0).map((d) => 1 / d);
  return { fpsMediana: Math.round(percentil(fps, 50)), fpsP5: Math.round(percentil(fps, 5)) };
}
