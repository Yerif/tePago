import { describe, expect, it } from "vitest";
import { balancesNetos } from "./balances";
import { deudasEntrePersonas } from "./deudas";
import type { GastoCalculable } from "./tipos";

const gasto = (id: string, pagadoPor: string, partes: [string, number, boolean?][]): GastoCalculable => ({
  id,
  pagadoPor,
  totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
  partes: partes.map(([userId, centavos, saldado]) => ({ userId, centavos, saldado: saldado ?? false })),
});

describe("deudasEntrePersonas", () => {
  it("sin gastos, o todo saldado, no hay deudas", () => {
    expect(deudasEntrePersonas([])).toEqual([]);
    expect(deudasEntrePersonas([gasto("e", "a", [["a", 100], ["b", 100, true]])])).toEqual([]);
  });

  it("quien no pagó le debe su parte a quien pagó; la parte del propio pagador no cuenta", () => {
    const d = deudasEntrePersonas([gasto("e1", "ferni", [["ana", 31000, true], ["ferni", 31000], ["caro", 31000], ["beto", 31000]])]);
    expect(d).toEqual([
      { deudorId: "beto", acreedorId: "ferni", centavos: 31000 },
      { deudorId: "caro", acreedorId: "ferni", centavos: 31000 },
    ]);
  });

  it("suma varios gastos entre la misma pareja", () => {
    const d = deudasEntrePersonas([gasto("a", "x", [["y", 100]]), gasto("b", "x", [["y", 250]])]);
    expect(d).toEqual([{ deudorId: "y", acreedorId: "x", centavos: 350 }]);
  });

  it("compensa lo que se deben mutuamente y deja solo la diferencia", () => {
    const d = deudasEntrePersonas([gasto("a", "x", [["y", 1000]]), gasto("b", "y", [["x", 300]])]);
    expect(d).toEqual([{ deudorId: "y", acreedorId: "x", centavos: 700 }]);
  });

  it("si se deben exactamente lo mismo, se anulan", () => {
    expect(deudasEntrePersonas([gasto("a", "x", [["y", 500]]), gasto("b", "y", [["x", 500]])])).toEqual([]);
  });

  it("no simplifica cadenas: A→B y B→C siguen siendo dos deudas", () => {
    const d = deudasEntrePersonas([gasto("a", "b", [["a", 100]]), gasto("b", "c", [["b", 100]])]);
    expect(d).toEqual([
      { deudorId: "a", acreedorId: "b", centavos: 100 },
      { deudorId: "b", acreedorId: "c", centavos: 100 },
    ]);
  });

  it("ordena de mayor a menor y, en empate, por ids", () => {
    const d = deudasEntrePersonas([
      gasto("a", "z", [["b", 100], ["a", 100], ["c", 300]]),
      gasto("b", "y", [["a", 100]]),
    ]);
    expect(d.map((x) => `${x.deudorId}>${x.acreedorId}:${x.centavos}`)).toEqual(["c>z:300", "a>y:100", "a>z:100", "b>z:100"]);
  });

  it("las deudas de la demo de Oaxaca, calculadas a mano", () => {
    // e1 ferni 124000: caro y beto deben 31000 c/u. e2 caro 86050 (base 21512, caro +2): beto debe 21512.
    // e3 ana 480000: beto debe 120000. e4 beto 38000 entre ana, beto y ferni (ya saldados los otros).
    const d = deudasEntrePersonas([
      gasto("e1", "ferni", [["ana", 31000, true], ["ferni", 31000], ["caro", 31000], ["beto", 31000]]),
      gasto("e2", "caro", [["ana", 21512, true], ["ferni", 21512, true], ["caro", 21514], ["beto", 21512]]),
      gasto("e3", "ana", [["ana", 120000], ["ferni", 120000, true], ["caro", 120000, true], ["beto", 120000]]),
      gasto("e4", "beto", [["ana", 12666, true], ["beto", 12668], ["ferni", 12666, true]]),
    ]);
    expect(d).toEqual([
      { deudorId: "beto", acreedorId: "ana", centavos: 120000 },
      { deudorId: "beto", acreedorId: "ferni", centavos: 31000 },
      { deudorId: "caro", acreedorId: "ferni", centavos: 31000 },
      { deudorId: "beto", acreedorId: "caro", centavos: 21512 },
    ]);
  });

  it("invariante: lo que cada persona debe/le deben en las parejas coincide con su saldo neto (500 casos)", () => {
    let semilla = 42;
    const azar = () => ((semilla = (semilla * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const personas = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 500; i++) {
      const gastos = Array.from({ length: 1 + Math.floor(azar() * 6) }, (_, k) => {
        const pagador = personas[Math.floor(azar() * personas.length)] as string;
        const participantes = personas.filter(() => azar() < 0.6);
        return gasto(`g${k}`, pagador, participantes.map((p): [string, number, boolean] => [p, Math.floor(azar() * 100_000), azar() < 0.3]));
      });
      const neto = balancesNetos(gastos);
      const desdeParejas: Record<string, number> = {};
      for (const d of deudasEntrePersonas(gastos)) {
        expect(d.centavos).toBeGreaterThan(0);
        desdeParejas[d.acreedorId] = (desdeParejas[d.acreedorId] ?? 0) + d.centavos;
        desdeParejas[d.deudorId] = (desdeParejas[d.deudorId] ?? 0) - d.centavos;
      }
      for (const p of personas) expect(desdeParejas[p] ?? 0, p).toBe(neto[p] ?? 0);
    }
  });
});
