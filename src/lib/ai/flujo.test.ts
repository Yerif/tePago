import { describe, expect, it, vi } from "vitest";
import { AppError, ErrorCode } from "@/lib/errors";
import { ejecutarConReintento, mensajeRetry, type RespuestaModelo } from "./flujo";
import type { Problema } from "./validadores";

const fin = (salida: unknown, stopReason: string | null = "end_turn"): RespuestaModelo => ({ stopReason, salida });
const parsear = (s: unknown) => (typeof s === "object" && s !== null && "n" in s ? (s as { n: number }) : null);
const validar = (d: { n: number }): Problema[] => (d.n > 0 ? [] : [{ ruta: "n", regla: "mayor que 0" }]);

describe("ejecutarConReintento", () => {
  it("ok al primer intento, sin retry", async () => {
    const llamar = vi.fn().mockResolvedValue(fin({ n: 1 }));
    expect(await ejecutarConReintento({ llamar, parsear, validar })).toEqual({ estado: "ok", datos: { n: 1 } });
    expect(llamar).toHaveBeenCalledTimes(1);
    expect(llamar).toHaveBeenCalledWith(null);
  });

  it("si falla la validación, reintenta UNA vez pasándole los problemas", async () => {
    const llamar = vi.fn().mockResolvedValueOnce(fin({ n: 0 })).mockResolvedValueOnce(fin({ n: 2 }));
    expect(await ejecutarConReintento({ llamar, parsear, validar })).toEqual({ estado: "ok_tras_retry", datos: { n: 2 } });
    expect(llamar).toHaveBeenCalledTimes(2);
    expect(llamar).toHaveBeenNthCalledWith(2, { problemas: [{ ruta: "n", regla: "mayor que 0" }] });
  });

  it("si el schema no se cumple también reintenta", async () => {
    const llamar = vi.fn().mockResolvedValueOnce(fin(null)).mockResolvedValueOnce(fin({ n: 3 }));
    const r = await ejecutarConReintento({ llamar, parsear, validar });
    expect(r.estado).toBe("ok_tras_retry");
    expect(llamar).toHaveBeenNthCalledWith(2, { problemas: [{ ruta: "(salida)", regla: "no cumple el formato esperado" }] });
  });

  it("dos fallos seguidos → fallback a captura manual, con los problemas del último intento", async () => {
    const llamar = vi.fn().mockResolvedValue(fin({ n: 0 }));
    expect(await ejecutarConReintento({ llamar, parsear, validar })).toEqual({
      estado: "fallback",
      motivo: "invalido",
      problemas: [{ ruta: "n", regla: "mayor que 0" }],
    });
    expect(llamar).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["refusal", "refusal"],
    ["max_tokens", "max_tokens"],
  ] as const)("%s → fallback directo, sin retry (se repetiría igual)", async (stopReason, motivo) => {
    const llamar = vi.fn().mockResolvedValue(fin({ n: 1 }, stopReason));
    expect(await ejecutarConReintento({ llamar, parsear, validar })).toEqual({ estado: "fallback", motivo, problemas: [] });
    expect(llamar).toHaveBeenCalledTimes(1);
  });

  it("también en el retry: refusal en el segundo intento corta ahí", async () => {
    const llamar = vi.fn().mockResolvedValueOnce(fin({ n: 0 })).mockResolvedValueOnce(fin({ n: 1 }, "refusal"));
    expect((await ejecutarConReintento({ llamar, parsear, validar })).estado).toBe("fallback");
    expect(llamar).toHaveBeenCalledTimes(2);
  });

  it("AI_UNAVAILABLE → fallback no_disponible; cualquier otro error se propaga", async () => {
    const caida = vi.fn().mockRejectedValue(new AppError(ErrorCode.AI_UNAVAILABLE));
    expect(await ejecutarConReintento({ llamar: caida, parsear, validar })).toEqual({ estado: "fallback", motivo: "no_disponible", problemas: [] });
    const bug = vi.fn().mockRejectedValue(new Error("bug de programación"));
    await expect(ejecutarConReintento({ llamar: bug, parsear, validar })).rejects.toThrow("bug de programación");
    const otro = vi.fn().mockRejectedValue(new AppError(ErrorCode.VALIDATION));
    await expect(ejecutarConReintento({ llamar: otro, parsear, validar })).rejects.toBeInstanceOf(AppError);
  });
});

describe("mensajeRetry", () => {
  it("lista campo y regla por línea, sin valores", () => {
    const m = mensajeRetry([
      { ruta: "items[1].importe", regla: "formato de monto" },
      { ruta: "total", regla: "formato de monto" },
    ]);
    expect(m).toContain("- items[1].importe: formato de monto\n- total: formato de monto");
    expect(m).toContain("Responde otra vez con el JSON completo");
    expect(m).not.toContain("{{");
  });

  it("no reinterpreta `$&` ni `$1` que vengan en una regla", () => {
    expect(mensajeRetry([{ ruta: "a", regla: "$& $1" }])).toContain("- a: $& $1");
  });
});
