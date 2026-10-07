import type { EstadoAvatar } from "./avatar";

/** El personaje parpadea cada 3–6 s (intervalo aleatorio) y el parpadeo dura 0.14 s. */
export const PARPADEO_MIN_MS = 3000;
export const PARPADEO_MAX_MS = 6000;
export const DURACION_PARPADEO_S = 0.14;

/** Entre dos reacciones al toque pasan al menos 2 s: no se puede spamear. */
export const ESPERA_TOQUE_MS = 2000;
/** Cuánto dura en el globo la frase de una reacción antes de volver a la del estado. */
export const DURACION_FRASE_TOQUE_MS = 4000;
/** Vibración del toque (si el celular la soporta). */
export const VIBRACION_TOQUE_MS = 15;

/** Cuánto esperar para el próximo parpadeo. `azar` va de 0 a 1 (se inyecta para poder probarlo). */
export function esperaParpadeo(azar: number): number {
  const a = Math.min(1, Math.max(0, azar));
  return Math.round(PARPADEO_MIN_MS + a * (PARPADEO_MAX_MS - PARPADEO_MIN_MS));
}

/** ¿Ya pasó la espera desde la última reacción? La primera vez (sin reacción previa) siempre puede. */
export function puedeReaccionar(ultimoMs: number | null, ahoraMs: number): boolean {
  return ultimoMs === null || ahoraMs - ultimoMs >= ESPERA_TOQUE_MS;
}

const FRASES_TOQUE: Record<EstadoAvatar, readonly string[]> = {
  clean: ["¡Hola! ¿Hacemos cuentas? 🌻", "¡Qué buen día para estar al día! ☀️", "¡Jiji, cosquillas! 🌼"],
  mild: ["Ahí vamos, entre nubes ☁️", "¿Un pagüito y sale el sol? 🌤️", "Me da cosquillas… con nubes ☁️"],
  rekt: ["Con este charco… ¡pero aquí sigo! 🌧️", "Un pago y secamos todo ☂️", "¡Ay, me mojas más! 🙈"],
};

/** Frase de la n-ésima reacción: da vueltas por las del estado, siempre del lado del personaje (nunca de la persona). */
export function fraseDeToque(estado: EstadoAvatar, n: number): string {
  const frases = FRASES_TOQUE[estado];
  return frases[((n % frases.length) + frases.length) % frases.length] as string;
}
