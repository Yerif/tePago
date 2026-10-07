export const MAX_NOMBRE = 24;

export type ResultadoNombre = { ok: true; nombre: string } | { ok: false; error: string };

/**
 * Nombre que se muestra en la app: sin espacios de sobra (se juntan los repetidos), de 1 a 24 caracteres y sin
 * caracteres de control. Lo demás (emojis, acentos) es válido; React escapa el texto al mostrarlo.
 */
export function validarNombre(texto: string): ResultadoNombre {
  const nombre = texto.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (nombre === "") return { ok: false, error: "Escribe tu nombre" };
  if ([...nombre].length > MAX_NOMBRE) return { ok: false, error: `Máximo ${MAX_NOMBRE} letras` };
  return { ok: true, nombre };
}
