import { describe, expect, it } from "vitest";
import { agregarCargos, diferencia, repartirConAjustes, repartirPorMontos, repartirPorPartes, repartirPorPorcentajes } from "./modos";
import { planDePagos } from "./plan";

const suma = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

/** Generador determinista para pruebas de propiedades. */
function azar(semilla: number) {
  let s = semilla;
  return (max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s % max;
  };
}

describe("diferencia", () => {
  it("separa lo que falta de lo que sobra", () => {
    expect(diferencia(1000, 400)).toEqual({ faltan: 600, sobran: 0 });
    expect(diferencia(1000, 1200)).toEqual({ faltan: 0, sobran: 200 });
    expect(diferencia(1000, 1000)).toEqual({ faltan: 0, sobran: 0 });
  });
});

describe("repartirPorMontos", () => {
  it("cuadra exacto", () => {
    expect(repartirPorMontos(1000, { a: 600, b: 400 })).toEqual({ partes: { a: 600, b: 400 }, sinAsignarCentavos: 0 });
  });
  it("lo que falta queda sin asignar y no bloquea", () => {
    const r = repartirPorMontos(1000, { a: 300, b: 200 });
    expect(r.sinAsignarCentavos).toBe(500);
    expect(suma(r.partes) + r.sinAsignarCentavos).toBe(1000);
  });
  it("nadie capturado: todo sin asignar", () => {
    expect(repartirPorMontos(500, {}).sinAsignarCentavos).toBe(500);
  });
  it("rechaza pasarse, negativos y decimales", () => {
    expect(() => repartirPorMontos(1000, { a: 600, b: 401 })).toThrow(RangeError);
    expect(() => repartirPorMontos(1000, { a: -1 })).toThrow(RangeError);
    expect(() => repartirPorMontos(1000, { a: 1.5 })).toThrow(RangeError);
    expect(() => repartirPorMontos(-1, {})).toThrow(RangeError);
  });
});

describe("repartirPorPorcentajes", () => {
  it("60/40", () => {
    expect(repartirPorPorcentajes(1000, { a: 6000, b: 4000 }, "a").partes).toEqual({ a: 600, b: 400 });
  });
  it("33.33 / 33.33 / 33.34: el residuo es del pagador y suma el total", () => {
    const r = repartirPorPorcentajes(100, { a: 3333, b: 3333, c: 3334 }, "b");
    expect(suma(r.partes)).toBe(100);
    expect(r.sinAsignarCentavos).toBe(0);
  });
  it("el pagador sin porcentaje recibe el residuo", () => {
    const r = repartirPorPorcentajes(1, { a: 5000, b: 5000 }, "p");
    expect(r.partes).toEqual({ a: 0, b: 0, p: 1 });
  });
  it("exige sumar 100 %", () => {
    expect(() => repartirPorPorcentajes(1000, { a: 5000, b: 4999 }, "a")).toThrow(/100/);
    expect(() => repartirPorPorcentajes(1000, { a: 10_001 }, "a")).toThrow(RangeError);
    expect(() => repartirPorPorcentajes(1000, { a: -1, b: 10_001 }, "a")).toThrow(RangeError);
  });
});

describe("repartirPorPartes", () => {
  it("3 / 2 / 2 noches", () => {
    const r = repartirPorPartes(7000, { a: 3, b: 2, c: 2 }, "a");
    expect(r.partes).toEqual({ a: 3000, b: 2000, c: 2000 });
  });
  it("una pareja cuenta como 2", () => {
    expect(repartirPorPartes(900, { pareja: 2, solo: 1 }, "solo").partes).toEqual({ pareja: 600, solo: 300 });
  });
  it("0 partes no participa y el residuo es del pagador", () => {
    const r = repartirPorPartes(100, { a: 1, b: 1, c: 1, d: 0 }, "c");
    expect(r.partes).toEqual({ a: 33, b: 33, c: 34 });
  });
  it("1 centavo con el pagador fuera de las partes", () => {
    expect(repartirPorPartes(1, { a: 1, b: 1 }, "p").partes).toEqual({ a: 0, b: 0, p: 1 });
  });
  it("rechaza todo en 0, negativos y decimales", () => {
    expect(() => repartirPorPartes(100, { a: 0 }, "a")).toThrow(/parte/);
    expect(() => repartirPorPartes(100, { a: -1, b: 3 }, "a")).toThrow(RangeError);
    expect(() => repartirPorPartes(100, { a: 0.5 }, "a")).toThrow(RangeError);
  });
});

describe("repartirConAjustes", () => {
  it("parejo pero Beto +$60", () => {
    // 600 − 60 = 540 entre 3 = 180; Beto 180 + 60.
    const r = repartirConAjustes(60_000, ["a", "b", "c"], { b: 6000 }, "a");
    expect(r.partes).toEqual({ a: 18_000, b: 24_000, c: 18_000 });
  });
  it("ajuste negativo (descuento)", () => {
    const r = repartirConAjustes(1000, ["a", "b"], { a: -100 }, "a");
    expect(r.partes).toEqual({ a: 450, b: 550 });
  });
  it("el residuo de la parte igual es del pagador", () => {
    const r = repartirConAjustes(100, ["a", "b", "c"], {}, "c");
    expect(r.partes).toEqual({ a: 33, b: 33, c: 34 });
  });
  it("rechaza ajustes que exceden, de no participantes, decimales o que dejan en negativo", () => {
    expect(() => repartirConAjustes(100, ["a", "b"], { a: 200 }, "a")).toThrow(/exceden/);
    expect(() => repartirConAjustes(100, ["a", "b"], { z: 10 }, "a")).toThrow(/no participa/);
    expect(() => repartirConAjustes(100, ["a", "b"], { a: 0.5 }, "a")).toThrow(RangeError);
    expect(() => repartirConAjustes(100, ["a", "b"], { a: -300 }, "a")).toThrow(/negativo/);
    expect(() => repartirConAjustes(-5, ["a"], {}, "a")).toThrow(RangeError);
  });
});

describe("agregarCargos", () => {
  it("propina proporcional al consumo, no en partes iguales", () => {
    const r = agregarCargos({ a: 3000, b: 1000 }, [{ tipo: "porcentaje", puntosBase: 1000 }], "a");
    expect(r).toEqual({ a: 3300, b: 1100 });
  });
  it("sin partes no hay nada que repartir", () => {
    expect(agregarCargos({}, [{ tipo: "monto", centavos: 100 }], "a")).toEqual({});
  });
});

describe("invariante: Σ partes + sin asignar = total, en cada modo", () => {
  it("con 300 casos al azar", () => {
    const n = azar(7);
    const ids = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 300; i++) {
      const total = n(2) === 0 ? n(5) : n(2_000_000);
      const k = 1 + n(ids.length);
      const gente = ids.slice(0, k);
      const pagador = ids[n(ids.length)] as string;

      const partesIn = Object.fromEntries(gente.map((id) => [id, n(6)]));
      if (Object.values(partesIn).every((p) => p === 0)) partesIn[gente[0] as string] = 1;
      expect(suma(repartirPorPartes(total, partesIn, pagador).partes)).toBe(total);

      let resta = 10_000;
      const pct: Record<string, number> = {};
      for (const id of gente.slice(0, -1)) {
        const p = n(resta + 1);
        pct[id] = p;
        resta -= p;
      }
      pct[gente[gente.length - 1] as string] = resta;
      expect(suma(repartirPorPorcentajes(total, pct, pagador).partes)).toBe(total);

      const montos = Object.fromEntries(gente.map((id) => [id, n(Math.floor(total / k) + 1)]));
      const m = repartirPorMontos(total, montos);
      expect(suma(m.partes) + m.sinAsignarCentavos).toBe(total);

      const aj = repartirConAjustes(total, gente, { [gente[0] as string]: n(Math.floor(total / 2) + 1) }, pagador);
      expect(suma(aj.partes)).toBe(total);

      if (total === 0) continue;
      const conCargos = agregarCargos(aj.partes, [{ tipo: "monto", centavos: n(50_000) }], pagador);
      expect(suma(conCargos)).toBeGreaterThanOrEqual(total);
    }
  });
});

describe("planDePagos", () => {
  it("A le debe 200 a B y B le debe 50 a A → A paga 150", () => {
    expect(planDePagos({ a: -150, b: 150 })).toEqual([{ deId: "a", aId: "b", centavos: 150 }]);
  });
  it("cadena A→B→C se reduce a A→C", () => {
    expect(planDePagos({ a: -100, b: 0, c: 100 })).toEqual([{ deId: "a", aId: "c", centavos: 100 }]);
  });
  it("todos en cero: sin pagos", () => {
    expect(planDePagos({ a: 0, b: 0 })).toEqual([]);
  });
  it("rechaza saldos que no suman 0 o con decimales", () => {
    expect(() => planDePagos({ a: -100, b: 50 })).toThrow(/sumar 0/);
    expect(() => planDePagos({ a: -0.5, b: 0.5 })).toThrow(RangeError);
  });
  it("deja a todos en cero con ≤ personas − 1 pagos (200 casos)", () => {
    const n = azar(11);
    for (let i = 0; i < 200; i++) {
      const k = 2 + n(7);
      const saldos: Record<string, number> = {};
      let resto = 0;
      for (let j = 0; j < k - 1; j++) {
        const s = n(20_001) - 10_000;
        saldos[`p${j}`] = s;
        resto += s;
      }
      saldos[`p${k - 1}`] = -resto;
      const plan = planDePagos(saldos);
      expect(plan.length).toBeLessThanOrEqual(k - 1);
      const final = { ...saldos };
      for (const t of plan) {
        expect(t.centavos).toBeGreaterThan(0);
        final[t.deId] = (final[t.deId] as number) + t.centavos;
        final[t.aId] = (final[t.aId] as number) - t.centavos;
      }
      expect(Object.values(final).every((v) => v === 0)).toBe(true);
    }
  });
  it("es estable ante empates", () => {
    expect(planDePagos({ b: -100, a: -100, c: 100, d: 100 })).toEqual([
      { deId: "a", aId: "c", centavos: 100 },
      { deId: "b", aId: "d", centavos: 100 },
    ]);
  });
});
