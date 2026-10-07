import { describe, expect, it } from "vitest";
import { balancesNetos } from "./balances";
import { deudasEntrePersonas } from "./deudas";
import { aplicarPagos } from "./pagos";
import { planDePagos } from "./plan";
import { rutaDePago } from "./ruta";

const d = (deudorId: string, acreedorId: string, centavos: number) => ({ deudorId, acreedorId, centavos });

describe("rutaDePago", () => {
  it("pago directo", () => {
    expect(rutaDePago([d("a", "b", 200)], "a", "b", 150)).toEqual({ pagos: [{ deudorId: "a", acreedorId: "b", centavos: 150 }], sobranteCentavos: 0 });
  });
  it("triangular: A→B→C se paga A→B y B→C", () => {
    const r = rutaDePago([d("a", "b", 100), d("b", "c", 100)], "a", "c", 100);
    expect(r.sobranteCentavos).toBe(0);
    expect(r.pagos).toEqual([
      { deudorId: "a", acreedorId: "b", centavos: 100 },
      { deudorId: "b", acreedorId: "c", centavos: 100 },
    ]);
  });
  it("combina directo y triangular, y deja sobrante si no alcanza", () => {
    const deudas = [d("a", "c", 50), d("a", "b", 100), d("b", "c", 30)];
    const r = rutaDePago(deudas, "a", "c", 200);
    expect(r.sobranteCentavos).toBe(120);
    expect(r.pagos).toContainEqual({ deudorId: "a", acreedorId: "c", centavos: 50 });
    expect(r.pagos).toContainEqual({ deudorId: "a", acreedorId: "b", centavos: 30 });
    expect(r.pagos).toContainEqual({ deudorId: "b", acreedorId: "c", centavos: 30 });
  });
  it("sin camino todo es sobrante", () => {
    expect(rutaDePago([d("x", "y", 10)], "a", "c", 70)).toEqual({ pagos: [], sobranteCentavos: 70 });
  });
  it("ignora aristas agotadas y repetidas", () => {
    const r = rutaDePago([d("a", "b", 100), d("a", "b", 50)], "a", "b", 150);
    expect(r.pagos).toEqual([{ deudorId: "a", acreedorId: "b", centavos: 150 }]);
  });
  it("valida entradas", () => {
    expect(() => rutaDePago([], "a", "b", 0)).toThrow(RangeError);
    expect(() => rutaDePago([], "a", "b", 1.5)).toThrow(RangeError);
    expect(() => rutaDePago([], "a", "a", 10)).toThrow(RangeError);
  });
});

describe("rutaDePago + plan: los saldos netos quedan como una transferencia directa", () => {
  it("cadena con gastos reales", () => {
    const gastos = [
      { id: "1", fecha: "2026-01-01", pagadoPor: "b", totalCentavos: 100, partes: [{ userId: "a", centavos: 100, saldado: false }, { userId: "b", centavos: 0, saldado: true }] },
      { id: "2", fecha: "2026-01-02", pagadoPor: "c", totalCentavos: 100, partes: [{ userId: "b", centavos: 100, saldado: false }, { userId: "c", centavos: 0, saldado: true }] },
    ];
    const plan = planDePagos(balancesNetos(gastos));
    expect(plan).toEqual([{ deId: "a", aId: "c", centavos: 100 }]);
    const ruta = rutaDePago(deudasEntrePersonas(gastos), "a", "c", 100);
    expect(ruta.sobranteCentavos).toBe(0);
    const despues = aplicarPagos(gastos, ruta.pagos);
    expect(planDePagos(balancesNetos(despues))).toEqual([]);
  });
});
