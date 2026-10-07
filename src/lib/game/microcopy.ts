import type { EstadoAvatar } from "./avatar";

/**
 * Lo que "dice" el personaje según su estado (CLAUDE.md §7, etiquetas de clima): cálido, español de México, la broma es del
 * personaje y nunca de la persona.
 */
export function fraseDelPersonaje(estado: EstadoAvatar, tieneDeudas: boolean): string {
  if (estado === "clean") return tieneDeudas ? "Voy al día 🌻 Si saldas lo que falta, brillo más." : "¡Todo en orden! Hoy brillo gracias a ti 🌻";
  if (estado === "mild") return "Ando un poquito nublado ☁️ Un pago más y vuelvo a brillar.";
  return "Llueve por aquí 🌧️ ¿Me ayudas con un pago para que salga el sol?";
}

export const FRASES_REACCION = {
  pendiente: (nombre: string) => `Avisé a ${nombre} ⏳ Te cuento cuando confirme.`,
  abono: (nombre: string, faltaTexto: string) => `¡Buen abono a ${nombre}! Faltan ${faltaTexto} para saldar.`,
  cancelado: "Pago cancelado, aquí sigo 🌱",
  rechazado: (nombre: string) => `${nombre} dice que no le llegó. Platícalo con ${nombre}, ¡sin pena!`,
} as const;
