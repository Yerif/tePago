import { describe, expect, it } from "vitest";
import { pagarDelPlan } from "./pagarPlan";

const ahora = new Date("2026-10-06T12:00:00Z");
const horas = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
const gasto = (id: string, pagadoPor: string, deudor: string, centavos: number, haceHoras: number) => ({
  id,
  pagadoPor,
  totalCentavos: centavos,
  fecha: horas(haceHoras),
  partes: [
    { userId: pagadoPor, centavos: 0, saldado: true },
    { userId: deudor, centavos, saldado: false },
  ],
});

describe("pagarDelPlan", () => {
  it("pago directo que salda la deuda: da el XP de la antigüedad (< 24 h = 50)", () => {
    const r = pagarDelPlan([gasto("1", "b", "a", 200, 5)], [], "a", "b", 200, ahora);
    expect(r).toEqual({ ok: true, pagos: [{ deudorId: "a", acreedorId: "b", centavos: 200 }], xp: 50 });
  });
  it("un abono no da XP", () => {
    const r = pagarDelPlan([gasto("1", "b", "a", 200, 5)], [], "a", "b", 100, ahora);
    expect(r).toMatchObject({ ok: true, xp: 0 });
  });
  it("respeta los pagos previos", () => {
    const previos = [{ deudorId: "a", acreedorId: "b", centavos: 100 }];
    const r = pagarDelPlan([gasto("1", "b", "a", 200, 5)], previos, "a", "b", 100, ahora);
    expect(r).toMatchObject({ ok: true, xp: 50 });
  });
  it("cadena A→B→C: paga en dos tramos y el XP solo cuenta las deudas de A", () => {
    const gastos = [gasto("1", "b", "a", 100, 5), gasto("2", "c", "b", 100, 5)];
    const r = pagarDelPlan(gastos, [], "a", "c", 100, ahora);
    expect(r).toEqual({
      ok: true,
      pagos: [
        { deudorId: "a", acreedorId: "b", centavos: 100 },
        { deudorId: "b", acreedorId: "c", centavos: 100 },
      ],
      xp: 50,
    });
  });
  it("sin cadena que lo cubra no se puede", () => {
    expect(pagarDelPlan([gasto("1", "b", "a", 100, 5)], [], "a", "c", 100, ahora)).toEqual({ ok: false });
  });
});
