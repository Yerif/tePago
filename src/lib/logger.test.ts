import { describe, expect, it } from "vitest";
import { createLogger, namespaceActivo, sanitizar, type LogEntry } from "./logger";

const ahora = () => new Date("2026-09-29T12:00:00.000Z");

function armar(debugConfig?: string) {
  const lineas: LogEntry[] = [];
  const log = createLogger("split", { sink: (e) => lineas.push(e), debugConfig: () => debugConfig, now: ahora });
  return { log, lineas };
}

describe("namespaceActivo", () => {
  it("sin config no activa nada", () => {
    expect(namespaceActivo("ai", undefined)).toBe(false);
    expect(namespaceActivo("ai", "")).toBe(false);
  });
  it("activa solo los listados, tolerando espacios", () => {
    expect(namespaceActivo("ai", "split, ai")).toBe(true);
    expect(namespaceActivo("db", "split, ai")).toBe(false);
  });
  it('"*" activa todos', () => {
    expect(namespaceActivo("tenant", "*")).toBe(true);
  });
});

describe("createLogger", () => {
  it("debug solo sale si el namespace está activo", () => {
    expect(armar().log.debug("x")).toBeUndefined();
    const apagado = armar("ai");
    apagado.log.debug("x");
    expect(apagado.lineas).toHaveLength(0);
    const encendido = armar("split");
    encendido.log.debug("x");
    expect(encendido.lineas).toHaveLength(1);
  });

  it("info, warn y error salen siempre", () => {
    const { log, lineas } = armar();
    log.info("a");
    log.warn("b");
    log.error("c");
    expect(lineas.map((l) => l.level)).toEqual(["info", "warn", "error"]);
  });

  it("agrega ts, nivel, namespace y mensaje", () => {
    const { log, lineas } = armar();
    log.info("listo", { n: 2 });
    expect(lineas[0]).toEqual({ ts: "2026-09-29T12:00:00.000Z", level: "info", ns: "split", msg: "listo", n: 2 });
  });

  it("child propaga el requestId a cada línea", () => {
    const { log, lineas } = armar();
    const hijo = log.child({ requestId: "req_1" });
    hijo.info("a");
    hijo.child({ userId: "u1" }).warn("b");
    expect(lineas[0]?.requestId).toBe("req_1");
    expect(lineas[1]).toMatchObject({ requestId: "req_1", userId: "u1" });
  });
});

describe("sanitizar", () => {
  it("redacta llaves sensibles, también anidadas", () => {
    const r = sanitizar({ apiKey: "sk-123", auth: { token: "t", ok: 1 }, imagen: "base64…" });
    expect(r).toEqual({ apiKey: "[redactado]", auth: { token: "[redactado]", ok: 1 }, imagen: "[redactado]" });
  });

  it("recorta textos largos para no loguear el texto completo del usuario", () => {
    const largo = "a".repeat(500);
    const r = sanitizar(largo) as string;
    expect(r.length).toBeLessThan(260);
    expect(r).toContain("[500 chars]");
  });

  it("serializa errores sin stack", () => {
    expect(sanitizar(new Error("boom"))).toEqual({ name: "Error", message: "boom" });
  });

  it("corta la profundidad y limita arreglos", () => {
    const profundo = { a: { b: { c: { d: { e: 1 } } } } };
    expect(JSON.stringify(sanitizar(profundo))).toContain("[profundo]");
    expect(sanitizar(Array.from({ length: 50 }, (_, i) => i))).toHaveLength(20);
  });
});
