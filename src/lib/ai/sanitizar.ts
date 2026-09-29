const MAX_POR_DEFECTO = 500;

/**
 * Deja un texto de usuario listo para ir dentro de un prompt (CLAUDE.md §8, PROMPTS.md B0 punto 5):
 * NFC, sin caracteres de control ni de formato invisibles (salvo ZWJ/ZWNJ, que emojis y algunos alfabetos
 * necesitan), sin `<` ni `>` (para que nadie cierre una etiqueta), espacios colapsados y recortado.
 */
export function limpiarParaPrompt(texto: string, max: number = MAX_POR_DEFECTO): string {
  const limpio = texto
    .normalize("NFC")
    .replace(/[\t\n\r]/g, " ")
    .replace(/\p{Cc}/gu, "")
    .replace(/\p{Cf}/gu, (c) => (c === "‍" || c === "‌" ? c : ""))
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...limpio].slice(0, max).join("").trim();
}

/** Igual que `limpiarParaPrompt` pero también quita `|`, que separa columnas en las listas de miembros y renglones. */
export function limpiarCampo(texto: string, max: number): string {
  return limpiarParaPrompt(texto.replace(/\|/g, " "), max);
}
