/** Sin acentos, en minúsculas y solo palabras de 3+ letras: lo que sirve para comparar dos frases. */
function palabras(texto: string): Set<string> {
  return new Set(
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 3),
  );
}

/**
 * Mientras no haya llamadas reales a la API (necesitan Supabase y la llave de Anthropic), la demo "entiende" una frase
 * escogiendo el ejemplo de `evals/` que más palabras comparte con ella. Si no comparte ninguna, el primero.
 * Devuelve `null` si la frase está vacía o no hay ejemplos.
 */
export function ejemploMasParecido(texto: string, ejemplos: readonly { id: string; texto: string }[]): string | null {
  const mias = palabras(texto);
  if (mias.size === 0) return null;
  let mejor: { id: string; puntos: number } | null = null;
  for (const e of ejemplos) {
    let puntos = 0;
    for (const p of palabras(e.texto)) if (mias.has(p)) puntos += 1;
    if (mejor === null || puntos > mejor.puntos) mejor = { id: e.id, puntos };
  }
  return mejor?.id ?? null;
}
