import { xpAcumuladaParaNivel, progresoNivel } from "./levels";
import { SKIN_SLUGS, SKINS, type SkinSlug } from "./skins";

export interface MetaDeSkin {
  skin: SkinSlug;
  nombre: string;
  accesorio: string;
  nivelObjetivo: number;
  /** XP que faltan para llegar a ese nivel. */
  xpFaltante: number;
}

/**
 * La próxima skin que se gana por nivel (Explorador, Leyenda) y cuánta XP falta, para mostrar la meta en números.
 * Las que se ganan con badges necesitan contadores de pagos a tiempo (aún no existen): no entran aquí. null si ya se
 * ganaron todas las de nivel.
 */
export function proximaMetaDeSkin(xpTotal: number): MetaDeSkin | null {
  const nivel = progresoNivel(xpTotal).nivel;
  const metas = SKIN_SLUGS.flatMap((slug) => {
    const regla = SKINS[slug].regla;
    return regla.tipo === "nivel" && regla.nivel > nivel ? [{ slug, nivelObjetivo: regla.nivel }] : [];
  }).sort((a, b) => a.nivelObjetivo - b.nivelObjetivo);
  const meta = metas[0];
  if (!meta) return null;
  return {
    skin: meta.slug,
    nombre: SKINS[meta.slug].nombre,
    accesorio: SKINS[meta.slug].accesorio,
    nivelObjetivo: meta.nivelObjetivo,
    xpFaltante: xpAcumuladaParaNivel(meta.nivelObjetivo) - xpTotal,
  };
}
