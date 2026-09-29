import { AppError, ErrorCode } from "@/lib/errors";
import { PLANTILLA_RETRY } from "./prompts/retry";
import type { Problema } from "./validadores";

/** Lo que devuelve una llamada al modelo, ya reducido a lo que el flujo necesita. */
export interface RespuestaModelo {
  stopReason: string | null;
  /** Salida ya parseada con Zod; null si no pasó el schema. */
  salida: unknown;
}

export type MotivoFallback = "refusal" | "max_tokens" | "invalido" | "no_disponible";

export type ResultadoIA<T> =
  | { estado: "ok" | "ok_tras_retry"; datos: T }
  | { estado: "fallback"; motivo: MotivoFallback; problemas: Problema[] };

export interface OpcionesFlujo<T> {
  /** `retry` trae los problemas del intento anterior (null en el primer intento). Lanza AppError(AI_UNAVAILABLE) si la API falla. */
  llamar: (retry: { problemas: Problema[] } | null) => Promise<RespuestaModelo>;
  /** Devuelve los datos tipados si la salida cumple el schema, o null. */
  parsear: (salida: unknown) => T | null;
  /** Reglas de código; lista vacía = válido. */
  validar: (datos: T) => Problema[];
}

/**
 * Flujo de PROMPTS.md B0: 1 intento + 1 retry con los problemas de validación, y fallback a captura manual.
 * `refusal` y `max_tokens` no se reintentan (se repetirían igual y solo gastarían dinero).
 */
export async function ejecutarConReintento<T>(op: OpcionesFlujo<T>): Promise<ResultadoIA<T>> {
  let problemas: Problema[] = [];
  for (const intento of [1, 2]) {
    let respuesta: RespuestaModelo;
    try {
      respuesta = await op.llamar(intento === 1 ? null : { problemas });
    } catch (e) {
      if (e instanceof AppError && e.code === ErrorCode.AI_UNAVAILABLE) {
        return { estado: "fallback", motivo: "no_disponible", problemas: [] };
      }
      throw e;
    }
    if (respuesta.stopReason === "refusal") return { estado: "fallback", motivo: "refusal", problemas: [] };
    if (respuesta.stopReason === "max_tokens") return { estado: "fallback", motivo: "max_tokens", problemas: [] };

    const datos = op.parsear(respuesta.salida);
    problemas = datos === null ? [{ ruta: "(salida)", regla: "no cumple el formato esperado" }] : op.validar(datos);
    if (datos !== null && problemas.length === 0) return { estado: intento === 1 ? "ok" : "ok_tras_retry", datos };
  }
  return { estado: "fallback", motivo: "invalido", problemas };
}

/** Texto del turno de retry: describe campo y regla, nunca valores. */
export function mensajeRetry(problemas: readonly Problema[]): string {
  return PLANTILLA_RETRY.replace("{{problemas}}", () => problemas.map((p) => `- ${p.ruta}: ${p.regla}`).join("\n"));
}
