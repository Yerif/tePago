export interface EntradaReporte {
  ruta: string;
  mensaje: string;
  /** Identificador que Next pone a los errores de servidor (sirve para buscarlos en los logs de Vercel). */
  digest?: string;
  ahora: Date;
  agente?: string;
}

const MAX_MENSAJE = 300;

/**
 * Texto que la persona pega en el chat del grupo cuando algo se rompe (CLAUDE.md §12). Solo lleva datos
 * técnicos: ruta, mensaje recortado, digest, hora y navegador. Sin ids de usuario, sin cuerpos ni cookies.
 */
export function armarReporte({ ruta, mensaje, digest, ahora, agente }: EntradaReporte): string {
  const recortado = mensaje.length > MAX_MENSAJE ? `${mensaje.slice(0, MAX_MENSAJE)}…` : mensaje;
  return [
    "Reporte de Cuentas Conmigo",
    `Ruta: ${ruta}`,
    `Error: ${recortado || "(sin mensaje)"}`,
    `Digest: ${digest ?? "—"}`,
    `Hora: ${ahora.toISOString()}`,
    `Navegador: ${agente ?? "—"}`,
  ].join("\n");
}
