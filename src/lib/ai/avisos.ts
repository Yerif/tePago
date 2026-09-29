import type { ProblemaBorrador } from "@/lib/splits/borrador";
import { formatoMXN } from "@/lib/splits/formato";
import type { B1SalidaT } from "./schemas/b1";

/**
 * Microcopy de la pantalla de confirmación: español mexicano, cálido, nunca regañón (CLAUDE.md §10).
 * Las advertencias de la IA son códigos cerrados (PROMPTS.md B0): este es el único lugar que los traduce.
 */
export function avisosDeB1(s: Pick<B1SalidaT, "advertencias" | "no_reconocidos" | "moneda">): string[] {
  const avisos = s.no_reconocidos.map((n) => `¿Quién es ${n}? No está en el grupo`);
  const porCodigo: Record<B1SalidaT["advertencias"][number], string> = {
    participantes_ambiguos: "No me quedó claro entre quiénes se divide: elígelos abajo",
    persona_ambigua: "Hay un nombre que puede ser de dos personas: revísalo",
    monto_ambiguo: "El monto se puede leer de dos formas: confirma que quedó bien",
    no_es_gasto: "Eso no parece un gasto. Cuéntame cuánto fue y de qué",
    instrucciones_ignoradas: "Ignoré unas instrucciones que venían en el texto 🙈",
    moneda_extranjera: `El gasto está en ${s.moneda}: se guarda en esa moneda`,
  };
  return [...avisos, ...s.advertencias.map((codigo) => porCodigo[codigo])];
}

/** Qué le falta o sobra al borrador, dicho en cristiano. */
export function textoProblema(p: ProblemaBorrador): string {
  const dinero = formatoMXN(p.centavos ?? 0);
  const renglon = (p.renglon ?? 0) + 1;
  switch (p.codigo) {
    case "sin_monto":
      return "Falta el monto 💸";
    case "sin_participantes":
      return "¿Entre quiénes se divide?";
    case "resto_sin_asignar":
      return `Faltan ${dinero} por asignar: elige entre quiénes va el resto`;
    case "renglon_sin_monto":
      return `Al renglón ${renglon} le falta el monto`;
    case "renglon_sin_personas":
      return `Elige quién consumió el renglón ${renglon}`;
    case "items_exceden_total":
      return `Los renglones suman ${dinero} más que el total: usé la suma de los renglones`;
  }
}
