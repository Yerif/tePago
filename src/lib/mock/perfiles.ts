import { BASES, baseValida, type BaseSlug } from "@/lib/game/apariencia";
import { validarNombre } from "@/lib/game/perfil";

/** Lo que cada persona cambió de su perfil en el demo (solo dev/preview): nombre y/o personaje. */
export type PerfilesEditados = Readonly<Record<string, { nombre?: string; base?: BaseSlug }>>;

interface ConMiembros<M> {
  miembros: M[];
}
type Miembro = { id: string; nombre: string; base: string; emoji?: string };

/** Devuelve los mismos grupos con el nombre y el personaje que cada persona eligió (sin tocar los originales). */
export function aplicarPerfiles<G extends ConMiembros<Miembro>>(grupos: readonly G[], perfiles: PerfilesEditados): G[] {
  if (Object.keys(perfiles).length === 0) return grupos as G[];
  return grupos.map((g) => ({
    ...g,
    miembros: g.miembros.map((m) => {
      const p = perfiles[m.id];
      if (!p) return m;
      const base = p.base ?? m.base;
      return { ...m, nombre: p.nombre ?? m.nombre, base, ...(m.emoji !== undefined && p.base ? { emoji: BASES[p.base].emoji } : {}) };
    }),
  }));
}

/** Lee lo guardado con tolerancia: ignora entradas inválidas en lugar de romper la pantalla. */
export function limpiarPerfiles(datos: unknown): PerfilesEditados {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return {};
  const limpio: Record<string, { nombre?: string; base?: BaseSlug }> = {};
  for (const [id, valor] of Object.entries(datos)) {
    if (typeof valor !== "object" || valor === null) continue;
    const v = valor as { nombre?: unknown; base?: unknown };
    const nombre = typeof v.nombre === "string" ? validarNombre(v.nombre) : null;
    const entrada: { nombre?: string; base?: BaseSlug } = {};
    if (nombre?.ok) entrada.nombre = nombre.nombre;
    if (typeof v.base === "string" && v.base in BASES) entrada.base = baseValida(v.base);
    if (entrada.nombre !== undefined || entrada.base !== undefined) limpio[id] = entrada;
  }
  return limpio;
}
