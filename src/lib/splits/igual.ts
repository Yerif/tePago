/**
 * Reparte `totalCentavos` en partes iguales entre `participantes`.
 * El residuo de redondeo lo absorbe el pagador (CLAUDE.md §7), así Σ partes = total siempre.
 * Si el pagador no participa, aparece con una parte igual al residuo (solo si es > 0).
 */
export function repartirIgual(
  totalCentavos: number,
  participantes: readonly string[],
  pagadorId: string,
): Record<string, number> {
  if (!Number.isSafeInteger(totalCentavos) || totalCentavos < 0) {
    throw new RangeError("totalCentavos debe ser un entero >= 0");
  }
  if (participantes.length === 0) throw new RangeError("Se necesita al menos un participante");
  if (new Set(participantes).size !== participantes.length) throw new RangeError("Participantes repetidos");

  const base = Math.floor(totalCentavos / participantes.length);
  const residuo = totalCentavos - base * participantes.length;

  const partes: Record<string, number> = {};
  for (const id of participantes) partes[id] = base;
  if (residuo > 0) partes[pagadorId] = (partes[pagadorId] ?? 0) + residuo;
  return partes;
}
