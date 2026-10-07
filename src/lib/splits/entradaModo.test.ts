import { describe, expect, it } from "vitest";
import { calcularModo, completarPorcentajes, type EntradaModo } from "./entradaModo";

const base: EntradaModo = { modo: "montos", totalCentavos: 100_000, participantes: ["a", "b", "c"], pagadorId: "a", valores: {} };
const suma = (r: Record<string, number> | null) => Object.values(r ?? {}).reduce((x, y) => x + y, 0);

describe("calcularModo · general", () => {
  it("sin total o sin gente no hay nada", () => {
    expect(calcularModo({ ...base, totalCentavos: 0 }).partes).toBeNull();
    expect(calcularModo({ ...base, participantes: [] }).puedeGuardar).toBe(false);
  });
});

describe("calcularModo · montos", () => {
  it("avisa cuánto falta pero deja guardar", () => {
    const r = calcularModo({ ...base, valores: { a: "300", b: "200" } });
    expect(r.faltan).toBe(50_000);
    expect(r.sinAsignarCentavos).toBe(50_000);
    expect(r.puedeGuardar).toBe(true);
    expect(suma(r.partes) + r.sinAsignarCentavos).toBe(100_000);
  });
  it("sin capturar nada no se puede guardar", () => {
    const r = calcularModo(base);
    expect(r.puedeGuardar).toBe(false);
    expect(r.faltan).toBe(100_000);
  });
  it("cuadra exacto", () => {
    const r = calcularModo({ ...base, valores: { a: "500", b: "300", c: "200" } });
    expect(r).toMatchObject({ faltan: 0, sinAsignarCentavos: 0, puedeGuardar: true });
  });
  it("si se pasa, bloquea y dice cuánto", () => {
    const r = calcularModo({ ...base, valores: { a: "900", b: "200" } });
    expect(r).toMatchObject({ sobran: 10_000, puedeGuardar: false, partes: null });
    expect(r.mensaje).toMatch(/pasaste/);
  });
  it("texto inválido", () => {
    expect(calcularModo({ ...base, valores: { a: "abc" } }).mensaje).toMatch(/montos/);
  });
});

describe("calcularModo · porcentajes", () => {
  const p = { ...base, modo: "porcentajes" as const };
  it("60/40 y 0 para quien no puso", () => {
    const r = calcularModo({ ...p, participantes: ["a", "b"], valores: { a: "60", b: "40%" } });
    expect(r.partes).toEqual({ a: 60_000, b: 40_000 });
  });
  it("incompleto: dice cuánto falta", () => {
    const r = calcularModo({ ...p, valores: { a: "50", b: "25" } });
    expect(r).toMatchObject({ faltan: 2500, puedeGuardar: false, mensaje: null });
  });
  it("se pasa de 100", () => {
    const r = calcularModo({ ...p, valores: { a: "80", b: "30" } });
    expect(r).toMatchObject({ sobran: 1000, mensaje: expect.stringMatching(/100/) });
  });
  it("inválido", () => {
    expect(calcularModo({ ...p, valores: { a: "x" } }).mensaje).toMatch(/porcentajes/);
  });
});

describe("calcularModo · partes", () => {
  const p = { ...base, modo: "partes" as const, totalCentavos: 70_000 };
  it("vacío = 1 parte cada quien", () => {
    expect(calcularModo({ ...p, valores: {} }).partes).toEqual({ a: 23_333 + 1, b: 23_333, c: 23_333 });
  });
  it("3 / 2 / 2", () => {
    expect(calcularModo({ ...p, valores: { a: "3", b: "2", c: "2" } }).partes).toEqual({ a: 30_000, b: 20_000, c: 20_000 });
  });
  it("todo en 0 o inválido", () => {
    expect(calcularModo({ ...p, valores: { a: "0", b: "0", c: "0" } }).mensaje).toMatch(/al menos/);
    expect(calcularModo({ ...p, valores: { a: "1.5" } }).mensaje).toMatch(/enteros/);
  });
});

describe("calcularModo · ajustes", () => {
  const p = { ...base, modo: "ajustes" as const, totalCentavos: 60_000 };
  it("parejo pero Beto +$60", () => {
    const r = calcularModo({ ...p, participantes: ["a", "b", "c"], valores: { b: "+60" } });
    expect(r.partes).toEqual({ a: 18_000, b: 24_000, c: 18_000 });
  });
  it("descuento con signo menos (también el menos tipográfico)", () => {
    expect(calcularModo({ ...p, participantes: ["a", "b"], valores: { a: "-100" } }).partes).toEqual({ a: 25_000, b: 35_000 });
    expect(calcularModo({ ...p, participantes: ["a", "b"], valores: { a: "−100" } }).partes).toEqual({ a: 25_000, b: 35_000 });
  });
  it("sin ajustes es igual", () => {
    expect(suma(calcularModo({ ...p, valores: {} }).partes)).toBe(60_000);
  });
  it("inválido o que no cabe", () => {
    expect(calcularModo({ ...p, valores: { a: "zz" } }).mensaje).toMatch(/ajustes/);
    expect(calcularModo({ ...p, valores: { a: "9000" } }).mensaje).toMatch(/no caben/);
  });
});

describe("completarPorcentajes", () => {
  it("lo que falta para 100", () => {
    expect(completarPorcentajes(["a", "b", "c"], { a: "50", b: "25" }, "c")).toBe("25");
    expect(completarPorcentajes(["a", "b"], { a: "33.33" }, "b")).toBe("66.67");
    expect(completarPorcentajes(["a", "b"], { a: "33.3" }, "b")).toBe("66.7");
  });
  it("quien no tiene valor cuenta como 0", () => {
    expect(completarPorcentajes(["a", "b", "c"], { a: "40" }, "c")).toBe("60");
  });
  it("ignora vacíos y el propio destino", () => {
    expect(completarPorcentajes(["a", "b"], { a: "", b: "10" }, "b")).toBe("100");
  });
  it("null si se pasa o hay basura", () => {
    expect(completarPorcentajes(["a", "b"], { a: "120" }, "b")).toBeNull();
    expect(completarPorcentajes(["a", "b"], { a: "x" }, "b")).toBeNull();
    expect(completarPorcentajes(["a", "b", "c"], { a: "60", b: "60" }, "c")).toBeNull();
  });
});
