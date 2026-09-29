import { describe, expect, it } from "vitest";
import { parsearPorcentaje } from "./formato";
import { importeRenglon, repartirItemizado, type Ajuste, type RenglonAsignado } from "./itemizado";

const r = (importeCentavos: number, ...reparto: [string, number][]): RenglonAsignado => ({
  importeCentavos,
  reparto: reparto.map(([userId, partes]) => ({ userId, partes })),
});
const propina = (puntosBase: number): Ajuste => ({ tipo: "porcentaje", puntosBase });
const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** PRNG con semilla fija: los casos aleatorios son reproducibles. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("repartirItemizado", () => {
  // Ejemplo de B3 calculado a mano. Paga ferni. Consumos:
  //   ana 13500 + 3166 + 2333 = 18999 · ferni 4500 + (3166+2) + (2333+1) = 10002 · caro 16500 + 3166 + 2333 = 21999
  //   propina 10 % de 51000 = 5100 → ana 1899, ferni 1000 (+2 de residuo = 1002), caro 2199
  const ticket = [
    r(18000, ["ana", 3], ["ferni", 1]), // 4 cervezas
    r(16500, ["caro", 1]), // pozole
    r(9500, ["ana", 1], ["ferni", 1], ["caro", 1]), // guacamole
    r(7000, ["ana", 1], ["ferni", 1], ["caro", 1]), // agua
  ];

  it("reparte por partes y el residuo de cada renglón lo absorbe el pagador", () => {
    const res = repartirItemizado(ticket, [], "ferni");
    expect(res.subtotalCentavos).toBe(51000);
    expect(res.porPersona).toEqual({
      ana: { consumoCentavos: 18999, ajustesCentavos: 0, totalCentavos: 18999 },
      ferni: { consumoCentavos: 10002, ajustesCentavos: 0, totalCentavos: 10002 },
      caro: { consumoCentavos: 21999, ajustesCentavos: 0, totalCentavos: 21999 },
    });
  });

  it("la propina es proporcional al consumo, no en partes iguales", () => {
    const res = repartirItemizado(ticket, [propina(1000)], "ferni");
    expect(res.ajustesCentavos).toEqual([5100]);
    expect(res.totalCentavos).toBe(56100);
    expect(res.porPersona).toEqual({
      ana: { consumoCentavos: 18999, ajustesCentavos: 1899, totalCentavos: 20898 },
      ferni: { consumoCentavos: 10002, ajustesCentavos: 1002, totalCentavos: 11004 },
      caro: { consumoCentavos: 21999, ajustesCentavos: 2199, totalCentavos: 24198 },
    });
  });

  it("quien no consumió nada no paga propina", () => {
    const res = repartirItemizado([r(10000, ["a", 1]), r(0, ["x", 1])], [{ tipo: "monto", centavos: 1000 }], "a");
    expect(res.porPersona.a).toEqual({ consumoCentavos: 10000, ajustesCentavos: 1000, totalCentavos: 11000 });
    expect(res.porPersona.x).toEqual({ consumoCentavos: 0, ajustesCentavos: 0, totalCentavos: 0 });
  });

  it("varios ajustes (IVA 16 % y propina 10 %) sobre el mismo subtotal", () => {
    const res = repartirItemizado([r(60000, ["a", 1]), r(40000, ["b", 1])], [propina(1600), propina(1000)], "a");
    expect(res.ajustesCentavos).toEqual([16000, 10000]);
    expect(res.totalCentavos).toBe(126000);
    expect(res.porPersona.a?.totalCentavos).toBe(75600); // 60000 + 9600 + 6000
    expect(res.porPersona.b?.totalCentavos).toBe(50400); // 40000 + 6400 + 4000
  });

  it("los porcentajes redondean a la mitad hacia arriba", () => {
    const monto = (subtotal: number, bp: number) =>
      repartirItemizado([r(subtotal, ["a", 1])], [propina(bp)], "a").ajustesCentavos[0];
    expect(monto(123456, 1000)).toBe(12346); // 123.456 → 123.46
    expect(monto(5, 1000)).toBe(1); // 0.5 → 1
    expect(monto(4, 1000)).toBe(0); // 0.4 → 0
    expect(monto(100000, 0)).toBe(0);
    expect(monto(100000, 10000)).toBe(100000);
  });

  it("si el pagador no consumió, aparece solo con el residuo", () => {
    const res = repartirItemizado([r(10000, ["a", 1], ["b", 1], ["c", 1])], [], "p");
    expect(res.porPersona.p).toEqual({ consumoCentavos: 1, ajustesCentavos: 0, totalCentavos: 1 });
    expect(res.porPersona.a?.consumoCentavos).toBe(3333);
    expect(repartirItemizado([r(9000, ["a", 1], ["b", 1], ["c", 1])], [], "p").porPersona.p).toBeUndefined();
  });

  it("el residuo del ajuste va al pagador, con o sin consumo propio", () => {
    const base = [r(100, ["a", 1]), r(100, ["b", 1])];
    const conPagador = repartirItemizado(base, [{ tipo: "monto", centavos: 101 }], "a");
    expect(conPagador.porPersona.a?.ajustesCentavos).toBe(51);
    expect(conPagador.porPersona.b?.ajustesCentavos).toBe(50);
    const sinPagador = repartirItemizado(base, [{ tipo: "monto", centavos: 101 }], "p");
    expect(sinPagador.porPersona.p).toEqual({ consumoCentavos: 0, ajustesCentavos: 1, totalCentavos: 1 });
  });

  it("fracciones de 1/3 y montos de 1 centavo", () => {
    const res = repartirItemizado([r(1, ["a", 1], ["b", 1], ["c", 1])], [], "c");
    expect(res.porPersona).toEqual({
      a: { consumoCentavos: 0, ajustesCentavos: 0, totalCentavos: 0 },
      b: { consumoCentavos: 0, ajustesCentavos: 0, totalCentavos: 0 },
      c: { consumoCentavos: 1, ajustesCentavos: 0, totalCentavos: 1 },
    });
    expect(repartirItemizado([r(10000, ["a", 1], ["b", 1], ["c", 1])], [], "b").porPersona.b?.consumoCentavos).toBe(3334);
  });

  it("sin renglones ni ajustes el total es 0", () => {
    expect(repartirItemizado([], [], "a")).toEqual({ subtotalCentavos: 0, ajustesCentavos: [], totalCentavos: 0, porPersona: {} });
  });

  it("propina 0 no cambia nada, y un ajuste sobre subtotal 0 solo falla si el monto es > 0", () => {
    const sinPropina = repartirItemizado(ticket, [propina(0), { tipo: "monto", centavos: 0 }], "ferni");
    expect(sinPropina.totalCentavos).toBe(51000);
    expect(repartirItemizado([r(0, ["a", 1])], [propina(1000)], "a").totalCentavos).toBe(0);
    expect(() => repartirItemizado([r(0, ["a", 1])], [{ tipo: "monto", centavos: 5 }], "a")).toThrow(RangeError);
    expect(() => repartirItemizado([], [{ tipo: "monto", centavos: 5 }], "a")).toThrow(RangeError);
  });

  it("rechaza entradas inválidas", () => {
    const malo = (fn: () => unknown) => expect(fn).toThrow(RangeError);
    malo(() => repartirItemizado([r(100)], [], "a")); // renglón sin personas
    malo(() => repartirItemizado([r(100, ["a", 0])], [], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1.5])], [], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1], ["a", 2])], [], "a")); // repetida
    malo(() => repartirItemizado([r(-1, ["a", 1])], [], "a"));
    malo(() => repartirItemizado([r(10.5, ["a", 1])], [], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1])], [propina(-1)], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1])], [propina(10001)], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1])], [propina(1.5)], "a"));
    malo(() => repartirItemizado([r(100, ["a", 1])], [{ tipo: "monto", centavos: -1 }], "a"));
    const enorme = 2 ** 52;
    malo(() => repartirItemizado([r(enorme, ["a", 1]), r(enorme, ["a", 1])], [], "a")); // subtotal fuera de rango seguro
  });

  it("invariante: Σ totales = subtotal + Σ ajustes en 500 casos aleatorios", () => {
    const azar = mulberry32(2026);
    const pool = ["u0", "u1", "u2", "u3", "u4", "u5"];
    for (let i = 0; i < 500; i++) {
      const renglones: RenglonAsignado[] = Array.from({ length: 1 + Math.floor(azar() * 8) }, () => {
        const n = 1 + Math.floor(azar() * 5);
        const personas = [...pool].sort(() => azar() - 0.5).slice(0, n);
        return r(Math.floor(azar() * 500_000), ...personas.map((p): [string, number] => [p, 1 + Math.floor(azar() * 4)]));
      });
      const ajustes: Ajuste[] = Array.from({ length: Math.floor(azar() * 4) }, () =>
        azar() < 0.5 ? propina(Math.floor(azar() * 3001)) : { tipo: "monto", centavos: Math.floor(azar() * 50_000) },
      );
      const pagador = azar() < 0.2 ? "externo" : (pool[Math.floor(azar() * pool.length)] as string);
      const subtotal = suma(renglones.map((x) => x.importeCentavos));

      let res;
      try {
        res = repartirItemizado(renglones, ajustes, pagador);
      } catch (e) {
        // Único fallo permitido: ajuste con monto > 0 sobre un consumo total de 0.
        expect(e).toBeInstanceOf(RangeError);
        expect(subtotal).toBe(0);
        continue;
      }
      const personas = Object.values(res.porPersona);
      expect(res.subtotalCentavos).toBe(subtotal);
      expect(suma(personas.map((p) => p.consumoCentavos))).toBe(subtotal);
      expect(suma(personas.map((p) => p.ajustesCentavos))).toBe(suma(res.ajustesCentavos));
      expect(suma(personas.map((p) => p.totalCentavos))).toBe(res.totalCentavos);
      expect(res.totalCentavos).toBe(subtotal + suma(res.ajustesCentavos));
      for (const p of personas) {
        expect(p.consumoCentavos).toBeGreaterThanOrEqual(0);
        expect(p.ajustesCentavos).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("importeRenglon", () => {
  it("precio × cantidad en centavos", () => {
    expect(importeRenglon(2500, 3)).toBe(7500);
    expect(importeRenglon(0, 5)).toBe(0);
  });

  it("rechaza precios, cantidades y productos inválidos", () => {
    expect(() => importeRenglon(-1, 1)).toThrow(RangeError);
    expect(() => importeRenglon(100, 0)).toThrow(RangeError);
    expect(() => importeRenglon(100, 1.5)).toThrow(RangeError);
    expect(() => importeRenglon(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
  });
});

describe("parsearPorcentaje", () => {
  it.each([
    ["10", 1000],
    ["10%", 1000],
    [" 10 % ", 1000],
    ["10.5", 1050],
    ["7.25", 725],
    ["0", 0],
    ["100", 10000],
    ["16", 1600],
  ])("%j → %i puntos base", (texto, bp) => {
    expect(parsearPorcentaje(texto)).toBe(bp);
  });

  it.each(["", "abc", "100.01", "101", "-5", "10.555", "1e2", "%", "10,5"])("%j no es un porcentaje válido", (texto) => {
    expect(parsearPorcentaje(texto)).toBeNull();
  });
});
