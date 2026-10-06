import type { EstadoAvatar } from "./avatar";

export type ColorMonto = "neutro" | "deuda" | "favor";

export interface SenalesPublicas {
  /** Badges en el orden en que se muestran: lo positivo primero y el Fantasma al final. */
  badges: string[];
  /** La única señal negativa que se muestra: el badge Fantasma, o el clima si no hay Fantasma; ninguna si no hay. */
  negativa: "fantasma" | "estado" | null;
  /** Se muestra la etiqueta del clima: siempre si es positiva (Radiante) y, si es negativa, solo cuando es la única señal. */
  mostrarEstado: boolean;
  /** Los montos de otras personas van en neutro; solo el tuyo lleva color (CLAUDE.md §7, "Reputación pública"). */
  colorMonto: ColorMonto;
}

/**
 * Qué se muestra de una persona en las listas que ve toda la banda, con las salvaguardas de reputación: una sola señal
 * negativa (Fantasma o clima, nunca ambas junto al monto en rojo), lo positivo primero y el color del dinero solo en lo tuyo.
 */
export function senalesPublicas(entrada: { estado: EstadoAvatar; badges: readonly string[]; balanceCentavos: number; esYo: boolean }): SenalesPublicas {
  const { estado, badges, balanceCentavos, esYo } = entrada;
  const tieneFantasma = badges.includes("fantasma");
  const ordenados = [...badges.filter((b) => b !== "fantasma"), ...(tieneFantasma ? ["fantasma"] : [])];
  const negativa = tieneFantasma ? "fantasma" : estado !== "clean" ? "estado" : null;
  const colorMonto: ColorMonto = !esYo || balanceCentavos === 0 ? "neutro" : balanceCentavos > 0 ? "favor" : "deuda";
  return { badges: ordenados, negativa, mostrarEstado: estado === "clean" || negativa === "estado", colorMonto };
}
