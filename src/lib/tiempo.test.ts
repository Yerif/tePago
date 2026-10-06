import { describe, expect, it } from "vitest";
import { tiempoDesdeHoras, tiempoRelativo } from "./tiempo";

const ahora = new Date("2026-09-29T12:00:00Z");
const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();

describe("tiempoRelativo", () => {
  it.each([
    [0, "hace un momento"],
    [5, "hace 5 h"],
    [23, "hace 23 h"],
    [24, "hace 1 día"],
    [47, "hace 1 día"],
    [72, "hace 3 días"],
  ])("%i h → %s", (h, esperado) => {
    expect(tiempoRelativo(hace(h), ahora)).toBe(esperado);
  });
});

describe("tiempoDesdeHoras", () => {
  it("momento, horas y días", () => {
    expect(tiempoDesdeHoras(0.4)).toBe("hace un momento");
    expect(tiempoDesdeHoras(5.9)).toBe("hace 5 h");
    expect(tiempoDesdeHoras(24)).toBe("hace 1 día");
    expect(tiempoDesdeHoras(100)).toBe("hace 4 días");
  });
});
