import { describe, expect, it } from "vitest";
import {
  AppError,
  DEFINICIONES,
  ErrorCode,
  errorBody,
  errorResponse,
  generarRequestId,
  normalizarError,
} from "./errors";

describe("catálogo", () => {
  it("todo código tiene status HTTP de error y mensaje", () => {
    for (const code of Object.values(ErrorCode)) {
      const def = DEFINICIONES[code];
      expect(def.status).toBeGreaterThanOrEqual(400);
      expect(def.status).toBeLessThan(600);
      expect(def.message.length).toBeGreaterThan(0);
    }
  });

  it("mapea los status esperados", () => {
    expect(new AppError(ErrorCode.UNAUTHENTICATED).status).toBe(401);
    expect(new AppError(ErrorCode.VALIDATION).status).toBe(400);
    expect(new AppError(ErrorCode.NOT_FOUND).status).toBe(404);
    expect(new AppError(ErrorCode.RATE_LIMITED).status).toBe(429);
    expect(new AppError(ErrorCode.AI_INVALID_OUTPUT).status).toBe(502);
    expect(new AppError(ErrorCode.INTERNAL).status).toBe(500);
  });
});

describe("normalizarError", () => {
  it("deja pasar un AppError", () => {
    const e = new AppError(ErrorCode.FORBIDDEN);
    expect(normalizarError(e)).toBe(e);
  });

  it("vuelve INTERNAL cualquier otra cosa sin filtrar su mensaje", () => {
    const app = normalizarError(new Error("password=hunter2 en la fila 3"));
    expect(app.code).toBe(ErrorCode.INTERNAL);
    expect(app.message).toBe(DEFINICIONES.INTERNAL.message);
    expect((app.cause as Error).message).toContain("hunter2");
    expect(normalizarError("texto suelto").code).toBe(ErrorCode.INTERNAL);
  });
});

describe("respuesta", () => {
  it("tiene la forma { error: { code, message, requestId } }", () => {
    const body = errorBody(new AppError(ErrorCode.NOT_FOUND), "req_1");
    expect(body).toEqual({ error: { code: "NOT_FOUND", message: DEFINICIONES.NOT_FOUND.message, requestId: "req_1" } });
  });

  it("errorResponse usa el status y devuelve el requestId en JSON y header", async () => {
    const res = errorResponse(new AppError(ErrorCode.VALIDATION), "req_2");
    expect(res.status).toBe(400);
    expect(res.headers.get("x-request-id")).toBe("req_2");
    expect((await res.json()).error.requestId).toBe("req_2");
  });

  it("RATE_LIMITED manda Retry-After redondeado hacia arriba", () => {
    const res = errorResponse(new AppError(ErrorCode.RATE_LIMITED, { retryAfterSec: 12.2 }), "req_3");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("13");
  });

  it("un error desconocido responde 500 sin detalles", async () => {
    const res = errorResponse(new Error("secreto interno"), "req_4");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secreto");
  });
});

describe("generarRequestId", () => {
  it("tiene prefijo y es distinto cada vez", () => {
    const a = generarRequestId();
    expect(a).toMatch(/^req_[0-9a-f]{16}$/);
    expect(generarRequestId()).not.toBe(a);
  });
});
