import type { Categoria } from "@/lib/categorias";
import type { GastoCalculable } from "@/lib/splits/tipos";

/** Estado del avatar. En producción se DERIVA de las deudas (CLAUDE.md §7); aquí es un valor fijo de ejemplo. */
export type EstadoAvatar = "clean" | "mild" | "rekt";

export interface MiembroDemo {
  id: string;
  nombre: string;
  usuario: string;
  /** Personaje base (emoji propio, sin IP de terceros). */
  emoji: string;
  nivel: number;
  /** XP dentro del nivel actual y lo que falta para el siguiente (fórmula de CLAUDE.md §7). */
  xp: number;
  xpSiguiente: number;
  estado: EstadoAvatar;
  badges: string[];
}

export interface GastoDemo extends GastoCalculable {
  descripcion: string;
  categoria: Categoria;
  fecha: string;
}

export interface GrupoDemo {
  id: string;
  nombre: string;
  icono: string;
  miembros: MiembroDemo[];
  gastos: GastoDemo[];
}
