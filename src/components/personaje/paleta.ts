import { Color } from "three";
import type { BaseSlug } from "@/lib/game/apariencia";

/** Colores del personaje (diseño, no reglas). Tonos de nuestra paleta cozy; `saturacion` viene de `Apariencia`. */
export interface ColoresBase {
  cuerpo: string;
  panza: string;
  /** Pelo (personas) o detalle de orejas y cola (animales). */
  detalle: string;
}

export const COLORES: Record<BaseSlug, ColoresBase> = {
  "persona-sol": { cuerpo: "#E0AC69", panza: "#FFB085", detalle: "#3D2B1F" },
  "persona-luna": { cuerpo: "#F1C9A5", panza: "#C4A8E8", detalle: "#8A5A44" },
  "persona-nube": { cuerpo: "#8D5A3C", panza: "#7DDEC8", detalle: "#1F1A17" },
  oso: { cuerpo: "#B9855B", panza: "#E8CBA8", detalle: "#8A5E3C" },
  zorro: { cuerpo: "#F08A4B", panza: "#FFF1DC", detalle: "#8A3D1E" },
  conejo: { cuerpo: "#EDE3F5", panza: "#FFD6E0", detalle: "#FF8FAB" },
  rana: { cuerpo: "#7DC67E", panza: "#E5F5C8", detalle: "#4A9E6A" },
  gato: { cuerpo: "#A0A8C8", panza: "#E8EAF2", detalle: "#606880" },
  buho: { cuerpo: "#A9825A", panza: "#F3E3C3", detalle: "#6B4E2E" },
};

/** Baja la saturación y un poco la luz: así el deterioro aplica sobre cualquier base o skin (CLAUDE.md §7). */
export function tono(hex: string, saturacion: number): Color {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return c.setHSL(hsl.h, hsl.s * saturacion, hsl.l * (0.78 + 0.22 * saturacion));
}
