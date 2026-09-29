import type { Categoria } from "@/lib/categorias";
import type { EstadoAvatar } from "@/lib/game/avatar";
import type { SkinSlug } from "@/lib/game/skins";
import type { GastoCalculable } from "@/lib/splits/tipos";

export interface MiembroDemo {
  id: string;
  nombre: string;
  usuario: string;
  /** Personaje base (emoji propio, sin IP de terceros). */
  emoji: string;
  nivel: number;
  /** Derivados de la XP total con `lib/game` (progresoNivel). */
  xp: number;
  xpSiguiente: number;
  /** Derivado de las deudas con `lib/game` (estadoAvatar). */
  estado: EstadoAvatar;
  badges: string[];
  /** Skin efectiva: la elegida si está desbloqueada, si no la clásica (`skinEfectiva`). */
  skinActivo: SkinSlug;
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
