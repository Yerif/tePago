export interface ReglaLimite {
  /** Cuántas llamadas se permiten dentro de la ventana. */
  limite: number;
  ventanaSeg: number;
}

export interface ResultadoLimite {
  permitido: boolean;
  /** Segundos hasta que se libera un lugar (0 si se permitió). */
  reintentarEnSeg: number;
}

export type ConsumirLimite = (llave: string, regla: ReglaLimite) => Promise<ResultadoLimite>;

/**
 * Ventana deslizante en memoria: para pruebas y desarrollo. En producción el límite vive en la tabla
 * `rate_limits` de Postgres (ticket aparte): la memoria de una función serverless no se comparte entre instancias.
 */
export function crearLimitadorEnMemoria(ahora: () => number = Date.now): ConsumirLimite {
  const llamadas = new Map<string, number[]>();
  return async (llave, { limite, ventanaSeg }) => {
    const ahoraMs = ahora();
    const desde = ahoraMs - ventanaSeg * 1000;
    const vigentes = (llamadas.get(llave) ?? []).filter((t) => t > desde);
    if (vigentes.length >= limite) {
      llamadas.set(llave, vigentes);
      const liberaEn = (vigentes[0] as number) + ventanaSeg * 1000 - ahoraMs;
      return { permitido: false, reintentarEnSeg: Math.ceil(liberaEn / 1000) };
    }
    llamadas.set(llave, [...vigentes, ahoraMs]);
    return { permitido: true, reintentarEnSeg: 0 };
  };
}
