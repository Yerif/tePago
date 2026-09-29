import { BADGE_SLUGS, BADGES, type BadgeSlug } from "./badges";

/**
 * Las 5 skins iniciales. Se ganan, no se compran (CLAUDE.md §7) y los nombres son propios. La skin es un
 * accesorio sobre el personaje; el deterioro visual se aplica encima de cualquiera. TS puro.
 * Solo Jardinero y Alcalde vienen de CLAUDE.md (badges); las de nivel son una propuesta de producto.
 */
export const SKIN_SLUGS = ["clasico", "jardinero", "alcalde", "explorador", "leyenda"] as const;
export type SkinSlug = (typeof SKIN_SLUGS)[number];

export type ReglaDesbloqueo = { tipo: "siempre" } | { tipo: "badge"; badge: BadgeSlug } | { tipo: "nivel"; nivel: number };

export interface DefinicionSkin {
  nombre: string;
  /** Emoji que se coloca sobre el personaje ("" = ninguno). */
  accesorio: string;
  regla: ReglaDesbloqueo;
}

export const SKINS: Record<SkinSlug, DefinicionSkin> = {
  clasico: { nombre: "Clásico", accesorio: "", regla: { tipo: "siempre" } },
  jardinero: { nombre: "Jardinero", accesorio: "👒", regla: { tipo: "badge", badge: "jardinero" } },
  alcalde: { nombre: "Alcalde", accesorio: "🎖️", regla: { tipo: "badge", badge: "alcalde" } },
  explorador: { nombre: "Explorador", accesorio: "🧭", regla: { tipo: "nivel", nivel: 5 } },
  leyenda: { nombre: "Leyenda", accesorio: "👑", regla: { tipo: "nivel", nivel: 10 } },
};

export const SKIN_INICIAL: SkinSlug = "clasico";

/** Lo que cuenta para desbloquear: el nivel y los badges ganados en CUALQUIER grupo (las skins son globales). */
export interface ProgresoJuego {
  nivel: number;
  badges: readonly BadgeSlug[];
}

export function estaDesbloqueada(slug: SkinSlug, progreso: ProgresoJuego): boolean {
  const regla = SKINS[slug].regla;
  if (regla.tipo === "siempre") return true;
  if (regla.tipo === "badge") return progreso.badges.includes(regla.badge);
  return progreso.nivel >= regla.nivel;
}

/** Skins desbloqueadas, en el orden del catálogo. */
export function skinsDesbloqueadas(progreso: ProgresoJuego): SkinSlug[] {
  return SKIN_SLUGS.filter((s) => estaDesbloqueada(s, progreso));
}

/** Las que ya se ganaron pero aún no están guardadas en `user_skins`: lo que el servidor debe otorgar. */
export function skinsNuevas(guardadas: readonly SkinSlug[], progreso: ProgresoJuego): SkinSlug[] {
  return skinsDesbloqueadas(progreso).filter((s) => !guardadas.includes(s));
}

/** La skin a mostrar: la elegida si existe y está desbloqueada; si no, la clásica (nunca falla con datos viejos o inválidos). */
export function skinEfectiva(elegida: string | null | undefined, progreso: ProgresoJuego): SkinSlug {
  const slug = SKIN_SLUGS.find((s) => s === elegida);
  return slug !== undefined && estaDesbloqueada(slug, progreso) ? slug : SKIN_INICIAL;
}

/** Cómo se consigue, en el tono de la app. */
export function requisitoSkin(slug: SkinSlug): string {
  const regla = SKINS[slug].regla;
  if (regla.tipo === "siempre") return "Viene con tu personaje";
  if (regla.tipo === "badge") return `Gana el badge ${BADGES[regla.badge].nombre}`;
  return `Llega al nivel ${regla.nivel}`;
}

/** Los slugs de badges válidos a partir de texto (p. ej. lo que devuelve la base de datos). */
export function badgesValidos(slugs: readonly string[]): BadgeSlug[] {
  return BADGE_SLUGS.filter((b) => slugs.includes(b));
}
