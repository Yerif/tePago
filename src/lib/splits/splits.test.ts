import { describe, expect, it } from "vitest";
import { balancesNetos } from "./balances";
import { formatoMXN, parsearMonto } from "./formato";
import { repartirIgual } from "./igual";
import type { GastoCalculable } from "./tipos";

const suma = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

/** PRNG con semilla fija: los casos aleatorios son reproducibles. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("repartirIgual", () => {
  it("reparte parejo cuando divide exacto", () => {
    expect(repartirIgual(9000, ["a", "b", "c"], "a")).toEqual({ a: 3000, b: 3000, c: 3000 });
  });

  it("el residuo lo absorbe el pagador", () => {
    expect(repartirIgual(10000, ["a", "b", "c"], "b")).toEqual({ a: 3333, b: 3334, c: 3333 });
  });

  it("si el pagador no participa, aparece solo con el residuo", () => {
    const r = repartirIgual(10000, ["a", "b", "c"], "p");
    expect(r).toEqual({ a: 3333, b: 3333, c: 3333, p: 1 });
    expect(suma(r)).toBe(10000);
    expect(repartirIgual(9000, ["a", "b", "c"], "p")).toEqual({ a: 3000, b: 3000, c: 3000 });
  });

  it("una sola persona paga todo", () => {
    expect(repartirIgual(85000, ["a"], "a")).toEqual({ a: 85000 });
  });

  it("montos de 1 centavo y total 0", () => {
    expect(repartirIgual(1, ["a", "b", "c"], "c")).toEqual({ a: 0, b: 0, c: 1 });
    expect(repartirIgual(0, ["a", "b"], "a")).toEqual({ a: 0, b: 0 });
  });

  it("rechaza entradas inválidas", () => {
    expect(() => repartirIgual(-1, ["a"], "a")).toThrow(RangeError);
    expect(() => repartirIgual(10.5, ["a"], "a")).toThrow(RangeError);
    expect(() => repartirIgual(100, [], "a")).toThrow(RangeError);
    expect(() => repartirIgual(100, ["a", "a"], "a")).toThrow(RangeError);
  });

  it("invariante: Σ partes = total en 500 casos aleatorios", () => {
    const azar = mulberry32(2026);
    for (let i = 0; i < 500; i++) {
      const total = Math.floor(azar() * 5_000_000);
      const n = 1 + Math.floor(azar() * 12);
      const ids = Array.from({ length: n }, (_, k) => `u${k}`);
      const pagador = azar() < 0.2 ? "externo" : (ids[Math.floor(azar() * n)] as string);
      const partes = repartirIgual(total, ids, pagador);
      expect(suma(partes)).toBe(total);
      const base = Math.floor(total / n);
      for (const id of ids) expect(partes[id]).toBeGreaterThanOrEqual(base);
    }
  });
});

describe("formatoMXN", () => {
  it.each([
    [124050, "$1,240.50"],
    [5, "$0.05"],
    [0, "$0.00"],
    [100, "$1.00"],
    [123456789, "$1,234,567.89"],
    [-1500, "-$15.00"],
  ])("%i → %s", (centavos, esperado) => {
    expect(formatoMXN(centavos)).toBe(esperado);
  });

  it("rechaza no enteros", () => {
    expect(() => formatoMXN(10.5)).toThrow(RangeError);
  });
});

describe("parsearMonto", () => {
  it.each([
    ["850", 85000],
    ["1240.5", 124050],
    ["1240.50", 124050],
    ["$1,240.50", 124050],
    [" 0.05 ", 5],
    ["0", 0],
  ])("%j → %i", (texto, centavos) => {
    expect(parsearMonto(texto)).toBe(centavos);
  });

  it.each(["", "abc", "12.345", "1e3", "-5", "12345678", "1..2", "."])("%j no es un monto", (texto) => {
    expect(parsearMonto(texto)).toBeNull();
  });

  it("ida y vuelta con formatoMXN", () => {
    expect(parsearMonto(formatoMXN(987654).replace("$", ""))).toBe(987654);
  });
});

describe("balancesNetos", () => {
  const gasto = (
    id: string,
    pagadoPor: string,
    partes: [string, number, boolean?][],
  ): GastoCalculable => ({
    id,
    pagadoPor,
    totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
    partes: partes.map(([userId, centavos, saldado]) => ({ userId, centavos, saldado: saldado ?? false })),
  });

  it("quien paga es acreedor de lo que deben los demás", () => {
    const n = balancesNetos([gasto("e1", "a", [["a", 3000], ["b", 3000], ["c", 3000]])]);
    expect(n).toEqual({ a: 6000, b: -3000, c: -3000 });
  });

  it("lo saldado no cuenta", () => {
    const n = balancesNetos([gasto("e1", "a", [["a", 3000], ["b", 3000, true], ["c", 3000]])]);
    expect(n).toEqual({ a: 3000, b: 0, c: -3000 });
  });

  it("la suma de saldos es siempre 0", () => {
    const n = balancesNetos([
      gasto("e1", "a", [["a", 3334], ["b", 3333], ["c", 3333]]),
      gasto("e2", "b", [["a", 100], ["b", 101], ["c", 100, true]]),
      gasto("e3", "c", [["a", 5], ["c", 5]]),
    ]);
    expect(suma(n)).toBe(0);
  });

  it("sin gastos no hay saldos", () => {
    expect(balancesNetos([])).toEqual({});
  });
});

describe("centavosATexto", () => {
  it("pesos enteros sin decimales y con 2 decimales si hay centavos", async () => {
    const { centavosATexto } = await import("./formato");
    expect(centavosATexto(150000)).toBe("1500");
    expect(centavosATexto(228335)).toBe("2283.35");
    expect(centavosATexto(5)).toBe("0.05");
    expect(centavosATexto(0)).toBe("0");
    expect(() => centavosATexto(-1)).toThrow(RangeError);
    expect(() => centavosATexto(1.5)).toThrow(RangeError);
  });
});
