import { describe, expect, it } from "vitest";
import { armarReporte } from "./reporte";

const ahora = new Date("2026-10-05T12:00:00Z");

describe("armarReporte", () => {
  it("incluye ruta, error, digest, hora y navegador", () => {
    const r = armarReporte({ ruta: "/dev/demo", mensaje: "boom", digest: "abc123", ahora, agente: "Safari" });
    expect(r).toBe(["Reporte de Cuentas Conmigo", "Ruta: /dev/demo", "Error: boom", "Digest: abc123", "Hora: 2026-10-05T12:00:00.000Z", "Navegador: Safari"].join("\n"));
  });

  it("usa guiones cuando faltan datos opcionales", () => {
    const r = armarReporte({ ruta: "/", mensaje: "", ahora });
    expect(r).toContain("Error: (sin mensaje)");
    expect(r).toContain("Digest: —");
    expect(r).toContain("Navegador: —");
  });

  it("recorta mensajes largos", () => {
    const r = armarReporte({ ruta: "/", mensaje: "x".repeat(1000), ahora });
    expect(r).toContain(`Error: ${"x".repeat(300)}…`);
    expect(r).not.toContain("x".repeat(301));
  });
});
