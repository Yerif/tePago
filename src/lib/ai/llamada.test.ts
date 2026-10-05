import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, ErrorCode } from "@/lib/errors";
import { createLogger, type LogEntry } from "@/lib/logger";
import { B5 } from "./prompts";
import { crearLlamada, ejecutarPrompt, estimarCostoUsd, MODELO_RUNTIME, type ClienteMensajes, type ParametrosLlamada, type RespuestaCruda } from "./llamada";

const Esquema = z.object({ categoria: z.enum(["comida", "otros"]) });
const valores = { descripcion: "Tacos", items: "(sin detalle)" };
const uso = { input_tokens: 400, output_tokens: 10 };

function respuesta(texto: string, extra: Partial<RespuestaCruda> = {}): RespuestaCruda {
  return { stop_reason: "end_turn", content: [{ type: "text", text: texto }], usage: uso, ...extra };
}
/** Cliente falso: entrega las respuestas en orden y guarda lo que recibió. */
function falso(...respuestas: (RespuestaCruda | Error)[]) {
  const recibidos: ParametrosLlamada[] = [];
  const cliente: ClienteMensajes = {
    async create(p) {
      recibidos.push(structuredClone(p));
      const r = respuestas.shift();
      if (!r) throw new Error("sin más respuestas");
      if (r instanceof Error) throw r;
      return r;
    },
  };
  return { cliente, recibidos };
}
function logs() {
  const entradas: LogEntry[] = [];
  return { log: createLogger("ai", { sink: (e) => entradas.push(e), debugConfig: () => "*" }, { requestId: "req-1" }), entradas };
}

describe("estimarCostoUsd", () => {
  it("cobra entrada y salida y pondera el caché", () => {
    expect(estimarCostoUsd({ input_tokens: 1_000_000, output_tokens: 0 })).toBe(1);
    expect(estimarCostoUsd({ input_tokens: 0, output_tokens: 1_000_000 })).toBe(5);
    expect(estimarCostoUsd({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBeCloseTo(1.35, 10);
  });
  it("trata los campos de caché nulos como cero", () => {
    expect(estimarCostoUsd({ input_tokens: 1000, output_tokens: 100, cache_creation_input_tokens: null, cache_read_input_tokens: null })).toBeCloseTo(0.0015, 10);
  });
});

describe("crearLlamada", () => {
  it("manda el snapshot fijo, system con cache_control, structured outputs y los límites del prompt", async () => {
    const { cliente, recibidos } = falso(respuesta('{"categoria":"comida"}'));
    const { log } = logs();
    const r = await crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log })(null);
    expect(r).toEqual({ stopReason: "end_turn", salida: { categoria: "comida" } });
    const p = recibidos[0] as ParametrosLlamada;
    expect(p.model).toBe(MODELO_RUNTIME);
    expect(p.max_tokens).toBe(50);
    expect(p.temperature).toBe(0);
    expect(p.system).toEqual([{ type: "text", text: B5.system, cache_control: { type: "ephemeral" } }]);
    expect(p.messages).toHaveLength(1);
    expect(p.messages[0]?.content).toContain("descripcion: Tacos");
    expect(p.output_config.format.type).toBe("json_schema");
    expect(p.output_config.format.schema).toMatchObject({ type: "object", additionalProperties: false });
  });

  it("omite temperature cuando el prompt usa el valor por defecto", async () => {
    const { cliente, recibidos } = falso(respuesta('{"categoria":"otros"}'));
    await crearLlamada({ cliente, prompt: { ...B5, temperature: undefined }, schema: Esquema, valores, log: logs().log })(null);
    expect("temperature" in (recibidos[0] as object)).toBe(false);
  });

  it("registra tokens, latencia, costo y stop_reason, sin el texto del usuario", async () => {
    const { cliente } = falso(respuesta('{"categoria":"comida"}', { usage: { ...uso, cache_read_input_tokens: 5 } }));
    const { log, entradas } = logs();
    const reloj = vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1250);
    await crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log, reloj })(null);
    expect(entradas).toHaveLength(1);
    expect(entradas[0]).toMatchObject({ ns: "ai", msg: "llamada", requestId: "req-1", prompt: "B5@v1", modelo: MODELO_RUNTIME, uso_in: 400, uso_out: 10, uso_cache_lectura: 5, latencia_ms: 250, stop_reason: "end_turn" });
    expect(entradas[0]?.costo_usd).toBeCloseTo((400 + 0.5 + 50) / 1_000_000, 10);
    expect(JSON.stringify(entradas)).not.toContain("Tacos");
  });

  it("en el retry reenvía la respuesta anterior como turno del asistente y los problemas como nuevo turno", async () => {
    const { cliente, recibidos } = falso(respuesta('{"categoria":"comida"}'), respuesta('{"categoria":"otros"}'));
    const llamar = crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log });
    await llamar(null);
    await llamar({ problemas: [{ ruta: "categoria", regla: "enum" }] });
    const m = (recibidos[1] as ParametrosLlamada).messages;
    expect(m.map((x) => x.role)).toEqual(["user", "assistant", "user"]);
    expect(m[1]?.content).toBe('{"categoria":"comida"}');
    expect(m[2]?.content).toContain("- categoria: enum");
  });

  it("si no había texto previo, el turno del asistente es un objeto vacío", async () => {
    const { cliente, recibidos } = falso({ stop_reason: "end_turn", content: [{ type: "thinking" }], usage: uso }, respuesta('{"categoria":"comida"}'));
    const llamar = crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log });
    await llamar(null);
    await llamar({ problemas: [{ ruta: "(salida)", regla: "x" }] });
    expect((recibidos[1] as ParametrosLlamada).messages[1]?.content).toBe("{}");
  });

  it("devuelve salida null si no es JSON o no cumple el schema", async () => {
    const { cliente } = falso(respuesta("no es json"), respuesta('{"categoria":"nada"}'), respuesta('{"categoria":"comida"}', { content: [{ type: "text" }] }));
    const llamar = crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log });
    expect((await llamar(null)).salida).toBeNull();
    expect((await llamar(null)).salida).toBeNull();
    expect((await llamar(null)).salida).toBeNull(); // bloque de texto sin `text`
  });

  it("convierte cualquier fallo de la API en AI_UNAVAILABLE y lo registra sin filtrar datos", async () => {
    const { cliente } = falso(new Error("429 rate limit"));
    const { log, entradas } = logs();
    const error = await crearLlamada({ cliente, prompt: B5, schema: Esquema, valores, log })(null).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(entradas[0]).toMatchObject({ level: "warn", msg: "llamada fallida" });
  });
});

describe("ejecutarPrompt", () => {
  it("ok al primer intento, con el log final", async () => {
    const { cliente } = falso(respuesta('{"categoria":"comida"}'));
    const { log, entradas } = logs();
    const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log, validar: () => [] });
    expect(r).toEqual({ estado: "ok", datos: { categoria: "comida" } });
    expect(entradas.at(-1)).toMatchObject({ msg: "resultado", resultado: "ok" });
  });

  it("ok tras un retry cuando la primera respuesta no pasa la validación", async () => {
    const { cliente } = falso(respuesta('{"categoria":"otros"}'), respuesta('{"categoria":"comida"}'));
    const validar = (d: z.infer<typeof Esquema>) => (d.categoria === "otros" ? [{ ruta: "categoria", regla: "no vale 'otros'" }] : []);
    const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log, validar });
    expect(r).toEqual({ estado: "ok_tras_retry", datos: { categoria: "comida" } });
  });

  it("fallback inválido tras dos intentos, y el log lista las rutas de los problemas sin valores", async () => {
    const { cliente } = falso(respuesta('{"categoria":"otros"}'), respuesta('{"categoria":"otros"}'));
    const { log, entradas } = logs();
    const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log, validar: () => [{ ruta: "categoria", regla: "siempre falla" }] });
    expect(r).toMatchObject({ estado: "fallback", motivo: "invalido" });
    expect(entradas.at(-1)).toMatchObject({ resultado: "fallback", motivo: "invalido", problemas: ["categoria"] });
  });

  it("una respuesta que no es JSON se reintenta y, si se repite, cae a fallback", async () => {
    const { cliente, recibidos } = falso(respuesta("hola"), respuesta("sigo sin JSON"));
    const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log, validar: () => [] });
    expect(r).toMatchObject({ estado: "fallback", motivo: "invalido", problemas: [{ ruta: "(salida)" }] });
    expect(recibidos).toHaveLength(2);
  });

  it("refusal y max_tokens no se reintentan", async () => {
    for (const stop of ["refusal", "max_tokens"]) {
      const { cliente, recibidos } = falso(respuesta("", { stop_reason: stop }));
      const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log, validar: () => [] });
      expect(r).toMatchObject({ estado: "fallback", motivo: stop });
      expect(recibidos).toHaveLength(1);
    }
  });

  it("API caída: fallback no_disponible sin lanzar", async () => {
    const { cliente } = falso(new Error("timeout"));
    const r = await ejecutarPrompt({ cliente, prompt: B5, schema: Esquema, valores, log: logs().log, validar: () => [] });
    expect(r).toEqual({ estado: "fallback", motivo: "no_disponible", problemas: [] });
  });
});
