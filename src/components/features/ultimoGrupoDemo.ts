/**
 * El último grupo en el que cada persona registró un gasto, para que Dividir arranque ahí (CLAUDE.md §4: la cookie
 * `cc_last_group` en el producto real; en el demo, `localStorage`, solo dev/preview). Siempre tolera que falte el almacenamiento.
 */
const LLAVE = "cc_demo_ultimo_grupo_v1";

function leerTodo(): Record<string, string> {
  try {
    const datos: unknown = JSON.parse(window.localStorage.getItem(LLAVE) ?? "{}");
    return typeof datos === "object" && datos !== null && !Array.isArray(datos) ? (datos as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function leerUltimoGrupo(personaId: string): string | null {
  const id = leerTodo()[personaId];
  return typeof id === "string" ? id : null;
}

export function guardarUltimoGrupo(personaId: string, grupoId: string): void {
  try {
    window.localStorage.setItem(LLAVE, JSON.stringify({ ...leerTodo(), [personaId]: grupoId }));
  } catch {
    /* sin almacenamiento: simplemente no se recuerda */
  }
}
