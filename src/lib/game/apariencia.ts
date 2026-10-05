import type { EstadoAvatar } from "./avatar";
import { SKIN_SLUGS, type SkinSlug } from "./skins";

/**
 * Cómo se ve un personaje, en términos del juego y sin nada de React ni Three (CLAUDE.md §7, "Personaje").
 * El render 3D (components/personaje), el avatar 2D de las listas y la app nativa de v2 dibujan esta
 * misma descripción; así los diseños cambian sin tocar las reglas.
 */

export const BASE_SLUGS = ["persona-sol", "persona-luna", "persona-nube", "oso", "zorro", "conejo", "rana", "gato", "buho"] as const;
export type BaseSlug = (typeof BASE_SLUGS)[number];

export interface DefinicionBase {
  nombre: string;
  tipo: "persona" | "animal";
  /** Respaldo 2D: listas, carga del 3D y navegadores sin WebGL. */
  emoji: string;
}

export const BASES: Record<BaseSlug, DefinicionBase> = {
  "persona-sol": { nombre: "Sol", tipo: "persona", emoji: "🧑🏽" },
  "persona-luna": { nombre: "Luna", tipo: "persona", emoji: "👩🏻" },
  "persona-nube": { nombre: "Nube", tipo: "persona", emoji: "🧑🏾" },
  oso: { nombre: "Oso", tipo: "animal", emoji: "🐻" },
  zorro: { nombre: "Zorro", tipo: "animal", emoji: "🦊" },
  conejo: { nombre: "Conejo", tipo: "animal", emoji: "🐰" },
  rana: { nombre: "Rana", tipo: "animal", emoji: "🐸" },
  gato: { nombre: "Gato", tipo: "animal", emoji: "🐱" },
  buho: { nombre: "Búho", tipo: "animal", emoji: "🦉" },
};

export const BASE_INICIAL: BaseSlug = "persona-sol";

/** Dónde se engancha un accesorio. Un modelo nuevo solo tiene que definir estos puntos. */
export type PuntoEnganche = "cabeza" | "pecho" | "mano";

export interface Accesorio {
  slug: "sombrero-paja" | "medalla" | "brujula" | "corona";
  punto: PuntoEnganche;
}

/** Cada skin (CLAUDE.md §7) es un accesorio; la clásica no lleva ninguno. */
export const ACCESORIO_DE_SKIN: Record<SkinSlug, Accesorio | null> = {
  clasico: null,
  jardinero: { slug: "sombrero-paja", punto: "cabeza" },
  alcalde: { slug: "medalla", punto: "pecho" },
  explorador: { slug: "brujula", punto: "mano" },
  leyenda: { slug: "corona", punto: "cabeza" },
};

export type Efecto = "brillos" | "gota" | "nube" | "aura";

export interface Apariencia {
  base: BaseSlug;
  accesorios: Accesorio[];
  /** Ánimo que lleva la animación y la cara. */
  animo: "contento" | "preocupado" | "triste";
  postura: "erguido" | "ladeado" | "encorvado";
  /** 1 = colores vivos; menos = más deslavado (el deterioro aplica sobre cualquier skin). */
  saturacion: number;
  /** Velocidad relativa de la animación; 0 = quieto (movimiento reducido). */
  ritmo: number;
  efectos: Efecto[];
}

const POR_ESTADO: Record<EstadoAvatar, Pick<Apariencia, "animo" | "postura" | "saturacion" | "ritmo" | "efectos">> = {
  clean: { animo: "contento", postura: "erguido", saturacion: 1, ritmo: 1, efectos: ["brillos"] },
  mild: { animo: "preocupado", postura: "ladeado", saturacion: 0.7, ritmo: 0.6, efectos: ["gota"] },
  rekt: { animo: "triste", postura: "encorvado", saturacion: 0.3, ritmo: 0.35, efectos: ["nube"] },
};

/** Nivel desde el que el personaje lleva aura (presume su constancia, sin importar la skin). */
export const NIVEL_AURA = 10;

export interface EntradaApariencia {
  /** Lo que viene de la base de datos: si no es un slug válido, se usa la base inicial (nunca falla con datos viejos). */
  base: string | null | undefined;
  estado: EstadoAvatar;
  /** Skin ya efectiva (`skinEfectiva`): solo se dibuja lo que está desbloqueado. */
  skin: SkinSlug;
  nivel: number;
  movimientoReducido?: boolean;
}

export function baseValida(base: string | null | undefined): BaseSlug {
  return BASE_SLUGS.find((b) => b === base) ?? BASE_INICIAL;
}

export function apariencia({ base, estado, skin, nivel, movimientoReducido = false }: EntradaApariencia): Apariencia {
  if (!Number.isSafeInteger(nivel) || nivel < 1) throw new RangeError("nivel debe ser un entero >= 1");
  if (!SKIN_SLUGS.includes(skin)) throw new RangeError("skin desconocida");
  const deEstado = POR_ESTADO[estado];
  const accesorio = ACCESORIO_DE_SKIN[skin];
  return {
    base: baseValida(base),
    accesorios: accesorio ? [accesorio] : [],
    ...deEstado,
    ritmo: movimientoReducido ? 0 : deEstado.ritmo,
    // El aura no tapa el estado: un nivel alto que debe sigue viéndose triste.
    efectos: nivel >= NIVEL_AURA ? [...deEstado.efectos, "aura"] : [...deEstado.efectos],
  };
}
