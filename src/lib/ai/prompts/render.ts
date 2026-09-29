import type { Prompt } from "./tipos";

/**
 * Rellena `{{variable}}` en una sola pasada: lo que trae un valor nunca se vuelve a interpretar
 * como plantilla. Los valores deben venir ya limpios (`limpiarParaPrompt`).
 */
export function renderUsuario<V extends string>(prompt: Prompt<V>, valores: Record<V, string>): string {
  const permitidas: readonly string[] = prompt.variables;
  return prompt.userTemplate.replace(/\{\{(\w+)\}\}/g, (_, nombre: string) => {
    if (!permitidas.includes(nombre)) throw new Error(`${prompt.id}: la plantilla usa {{${nombre}}}, que no es una variable declarada`);
    return valores[nombre as V];
  });
}
