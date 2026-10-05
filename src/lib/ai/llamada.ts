import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ZodType } from "zod";
import { AppError, ErrorCode } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { ejecutarConReintento, mensajeRetry, type RespuestaModelo, type ResultadoIA } from "./flujo";
import type { Prompt } from "./prompts/tipos";
import { renderUsuario } from "./prompts/render";
import type { Problema } from "./validadores";

/** Snapshot fijo (el alias es `claude-haiku-4-5`) para que los evals sean reproducibles. Nunca Sonnet ni Opus (CLAUDE.md §15). */
export const MODELO_RUNTIME = "claude-haiku-4-5-20251001";

export interface UsoTokens {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Telemetría, no dinero de usuarios. Haiku 4.5: $1/M entrada, $5/M salida; caché: escritura 1.25×, lectura 0.1×. */
export function estimarCostoUsd(u: UsoTokens): number {
  const escritura = u.cache_creation_input_tokens ?? 0;
  const lectura = u.cache_read_input_tokens ?? 0;
  return (u.input_tokens + escritura * 1.25 + lectura * 0.1 + u.output_tokens * 5) / 1_000_000;
}

/** Lo mínimo de la API de mensajes que usamos; el cliente real (`client.ts`) y los tests lo implementan. */
export interface ParametrosLlamada {
  model: string;
  max_tokens: number;
  temperature?: number;
  system: { type: "text"; text: string; cache_control: { type: "ephemeral" } }[];
  messages: { role: "user" | "assistant"; content: string }[];
  output_config: { format: { type: "json_schema"; schema: Record<string, unknown> } };
}

export interface RespuestaCruda {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
  usage: UsoTokens;
}

export interface ClienteMensajes {
  create(parametros: ParametrosLlamada): Promise<RespuestaCruda>;
}

export interface OpcionesLlamada<V extends string, T> {
  cliente: ClienteMensajes;
  prompt: Prompt<V>;
  /** Solo la FORMA (tipos, enums, nulos); las reglas las valida `validar` en código. */
  schema: ZodType<T>;
  /** Valores de la plantilla de usuario, ya pasados por `limpiarParaPrompt`. */
  valores: Record<V, string>;
  /** Logger del namespace `ai` con el `requestId` de la request. */
  log: Logger;
  /** Reloj en ms; inyectable para medir latencia en tests. */
  reloj?: () => number;
}

function textoDe(r: RespuestaCruda): string {
  return r.content.map((b) => (b.type === "text" ? (b.text ?? "") : "")).join("");
}

/**
 * Arma la función `llamar` que espera `ejecutarConReintento`: structured outputs, system fijo con `cache_control`,
 * turno de retry con la respuesta anterior y logs sin texto del usuario ni imágenes (PROMPTS.md B0).
 * Cualquier fallo de la API se vuelve `AI_UNAVAILABLE` (el flujo lo traduce a fallback manual).
 */
export function crearLlamada<V extends string, T>(op: OpcionesLlamada<V, T>) {
  const reloj = op.reloj ?? Date.now;
  const formato = zodOutputFormat(op.schema as never);
  const mensajes: ParametrosLlamada["messages"] = [{ role: "user", content: renderUsuario(op.prompt, op.valores) }];
  let previo = "";

  return async (retry: { problemas: Problema[] } | null): Promise<RespuestaModelo> => {
    if (retry) {
      mensajes.push({ role: "assistant", content: previo || "{}" }, { role: "user", content: mensajeRetry(retry.problemas) });
    }
    const inicio = reloj();
    let respuesta: RespuestaCruda;
    try {
      respuesta = await op.cliente.create({
        model: MODELO_RUNTIME,
        max_tokens: op.prompt.maxTokens,
        ...(op.prompt.temperature === undefined ? {} : { temperature: op.prompt.temperature }),
        system: [{ type: "text", text: op.prompt.system, cache_control: { type: "ephemeral" } }],
        messages: [...mensajes],
        output_config: { format: { type: "json_schema", schema: formato.schema as Record<string, unknown> } },
      });
    } catch (cause) {
      op.log.warn("llamada fallida", { prompt: `${op.prompt.id}@v${op.prompt.version}`, latencia_ms: reloj() - inicio, error: cause });
      throw new AppError(ErrorCode.AI_UNAVAILABLE, { cause });
    }

    previo = textoDe(respuesta);
    op.log.info("llamada", {
      prompt: `${op.prompt.id}@v${op.prompt.version}`,
      modelo: MODELO_RUNTIME,
      // Sin la subcadena "token" en la llave: el logger redacta cualquier campo que la contenga (sanitizar).
      uso_in: respuesta.usage.input_tokens,
      uso_out: respuesta.usage.output_tokens,
      uso_cache_lectura: respuesta.usage.cache_read_input_tokens ?? 0,
      latencia_ms: reloj() - inicio,
      costo_usd: estimarCostoUsd(respuesta.usage),
      stop_reason: respuesta.stop_reason,
    });

    let salida: unknown = null;
    try {
      const parseo = op.schema.safeParse(JSON.parse(previo));
      salida = parseo.success ? parseo.data : null;
    } catch {
      salida = null; // no era JSON: el flujo lo trata como "no cumple el formato" y reintenta una vez
    }
    return { stopReason: respuesta.stop_reason, salida };
  };
}

export interface OpcionesPrompt<V extends string, T> extends OpcionesLlamada<V, T> {
  /** Reglas de código del prompt (`validarB1`, …); lista vacía = válido. */
  validar: (datos: T) => Problema[];
}

/** Camino completo de un prompt: llamada → validación → 1 retry → fallback, con el log final de PROMPTS.md B0. */
export async function ejecutarPrompt<V extends string, T>(op: OpcionesPrompt<V, T>): Promise<ResultadoIA<T>> {
  const resultado = await ejecutarConReintento<T>({
    llamar: crearLlamada(op),
    parsear: (salida) => (salida === null ? null : (salida as T)),
    validar: op.validar,
  });
  op.log.info("resultado", {
    prompt: `${op.prompt.id}@v${op.prompt.version}`,
    resultado: resultado.estado,
    ...(resultado.estado === "fallback" ? { motivo: resultado.motivo, problemas: resultado.problemas.map((p) => p.ruta) } : {}),
  });
  return resultado;
}
