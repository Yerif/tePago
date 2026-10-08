import { BASES, baseValida, type BaseSlug } from "@/lib/game/apariencia";
import { validarNombre } from "@/lib/game/perfil";
import { SKIN_SLUGS, type SkinSlug } from "@/lib/game/skins";

/** Lo que cada persona cambió de su perfil en el demo (solo dev/preview): nombre, personaje y/o skin activa. */
export type PerfilEditado = { nombre?: string; base?: BaseSlug; skin?: SkinSlug };
export type PerfilesEditados = Readonly<Record<string, PerfilEditado>>;

interface ConMiembros<M> {
  miembros: M[];
}
type Miembro = { id: string; nombre: string; base: string; emoji?: string; skinActivo?: string };

/** Devuelve los mismos grupos con el nombre y el personaje que cada persona eligió (sin tocar los originales). */
export function aplicarPerfiles<G extends ConMiembros<Miembro>>(grupos: readonly G[], perfiles: PerfilesEditados): G[] {
  if (Object.keys(perfiles).length === 0) return grupos as G[];
  return grupos.map((g) => ({
    ...g,
    miembros: g.miembros.map((m) => {
      const p = perfiles[m.id];
      if (!p) return m;
      const base = p.base ?? m.base;
      return { ...m, nombre: p.nombre ?? m.nombre, base, ...(p.skin !== undefined ? { skinActivo: p.skin } : {}), ...(m.emoji !== undefined && p.base ? { emoji: BASES[p.base].emoji } : {}) };
    }),
  }));
}

/** Lee lo guardado con tolerancia: ignora entradas inválidas en lugar de romper la pantalla. */
export function limpiarPerfiles(datos: unknown): PerfilesEditados {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return {};
  const limpio: Record<string, PerfilEditado> = {};
  for (const [id, valor] of Object.entries(datos)) {
    if (typeof valor !== "object" || valor === null) continue;
    const v = valor as { nombre?: unknown; base?: unknown; skin?: unknown };
    const nombre = typeof v.nombre === "string" ? validarNombre(v.nombre) : null;
    const entrada: PerfilEditado = {};
    if (nombre?.ok) entrada.nombre = nombre.nombre;
    if (typeof v.base === "string" && v.base in BASES) entrada.base = baseValida(v.base);
    const skin = SKIN_SLUGS.find((x) => x === v.skin);
    if (skin) entrada.skin = skin;
    if (Object.keys(entrada).length > 0) limpio[id] = entrada;
  }
  return limpio;
}
