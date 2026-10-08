import { describe, expect, it } from "vitest";
import { balancesNetos } from "@/lib/splits/balances";
import { declararPagoDirecto, declararPagoPlan, planQueAhorra, xpAlConfirmar } from "./pagarPlan";

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

describe("declararPagoDirecto", () => {
  const g = [gasto("1", "b", "a", 200, 5)];
  it("paga el total o un abono", () => {
    expect(declararPagoDirecto(g, [], "a", "b", 200)).toEqual({ ok: true, pares: [{ deudorId: "a", acreedorId: "b", centavos: 200 }] });
    expect(declararPagoDirecto(g, [], "a", "b", 50)).toMatchObject({ ok: true });
  });
  it("no deja pagar de más ni lo que ya está en camino, y dice cuánto queda", () => {
    expect(declararPagoDirecto(g, [], "a", "b", 201)).toEqual({ ok: false, disponibleCentavos: 200 });
    const camino = [{ deudorId: "a", acreedorId: "b", centavos: 150 }];
    expect(declararPagoDirecto(g, camino, "a", "b", 100)).toEqual({ ok: false, disponibleCentavos: 50 });
  });
  it("monto inválido o sin deuda", () => {
    expect(declararPagoDirecto(g, [], "a", "b", 0)).toEqual({ ok: false, disponibleCentavos: 200 });
    expect(declararPagoDirecto(g, [], "a", "b", 1.5)).toEqual({ ok: false, disponibleCentavos: 200 });
    expect(declararPagoDirecto(g, [], "b", "a", 10)).toEqual({ ok: false, disponibleCentavos: 0 });
  });
});

describe("declararPagoPlan", () => {
  it("pago directo: un solo par", () => {
    expect(declararPagoPlan([gasto("1", "b", "a", 200, 5)], [], "a", "b", 150)).toEqual({ ok: true, pares: [{ deudorId: "a", acreedorId: "b", centavos: 150 }] });
  });
  it("lo que ya está en camino no se puede pagar otra vez", () => {
    const vigentes = [{ deudorId: "a", acreedorId: "b", centavos: 150 }];
    expect(declararPagoPlan([gasto("1", "b", "a", 200, 5)], vigentes, "a", "b", 100)).toEqual({ ok: false });
    expect(declararPagoPlan([gasto("1", "b", "a", 200, 5)], vigentes, "a", "b", 50)).toMatchObject({ ok: true });
  });
  it("cadena A→B→C en dos pares", () => {
    const gastos = [gasto("1", "b", "a", 100, 5), gasto("2", "c", "b", 100, 5)];
    expect(declararPagoPlan(gastos, [], "a", "c", 100)).toEqual({
      ok: true,
      pares: [
        { deudorId: "a", acreedorId: "b", centavos: 100 },
        { deudorId: "b", acreedorId: "c", centavos: 100 },
      ],
    });
  });
  it("sin cadena no se puede", () => {
    expect(declararPagoPlan([gasto("1", "b", "a", 100, 5)], [], "a", "c", 100)).toEqual({ ok: false });
  });
});

describe("xpAlConfirmar", () => {
  const registro = (pares: { deudorId: string; acreedorId: string; centavos: number }[], haceHoras: number) => ({ deId: "a", pares, creadoIso: horas(haceHoras) });
  it("saldar por completo: XP según la antigüedad al declarar", () => {
    const g = [gasto("1", "b", "a", 200, 30)];
    // La deuda tenía 30 h cuando se declaró el pago (hace 5 h → 25 h al declarar) → 30 XP (< 48 h).
    expect(xpAlConfirmar(g, [], registro([{ deudorId: "a", acreedorId: "b", centavos: 200 }], 5))).toBe(30);
  });
  it("un abono no da XP", () => {
    expect(xpAlConfirmar([gasto("1", "b", "a", 200, 5)], [], registro([{ deudorId: "a", acreedorId: "b", centavos: 100 }], 1))).toBe(0);
  });
  it("respeta los pagos ya confirmados", () => {
    const previos = [{ deudorId: "a", acreedorId: "b", centavos: 100 }];
    expect(xpAlConfirmar([gasto("1", "b", "a", 200, 5)], previos, registro([{ deudorId: "a", acreedorId: "b", centavos: 100 }], 1))).toBe(50);
  });
  it("cadena: solo cuentan las deudas de quien pagó", () => {
    const gastos = [gasto("1", "b", "a", 100, 5), gasto("2", "c", "b", 100, 5)];
    const pares = [
      { deudorId: "a", acreedorId: "b", centavos: 100 },
      { deudorId: "b", acreedorId: "c", centavos: 100 },
    ];
    expect(xpAlConfirmar(gastos, [], registro(pares, 1))).toBe(50);
  });
});

describe("planQueAhorra (UX2-04)", () => {
  // a le debe 100 a b y b le debe 100 a c: a tiene 1 deuda directa; el plan "a→c 100" también es 1 → no ahorra.
  const cadena = [gasto("1", "b", "a", 100, 5), gasto("2", "c", "b", 100, 5)];
  it("si no reduce los pagos de quien mira, no ofrece nada", () => {
    expect(planQueAhorra(cadena, [], "a", balancesNetos(cadena))).toEqual([]);
  });
  // a le debe 100 a b y 100 a d; b le debe 100 a c... a: directas = 2 (b y d). Con d = c, el plan puede dar a→c 200?
  const triangulo = [gasto("1", "b", "a", 100, 5), gasto("2", "c", "b", 100, 5), gasto("3", "c", "a", 100, 5)];
  it("ofrece el plan cuando a quien mira le toca pagar menos veces", () => {
    // a debe 100 a b y 100 a c (2 directas); saldos: a −200, b 0, c +200 → el plan es a→c 200 (1 pago, cadena posible)
    expect(planQueAhorra(triangulo, [], "a", balancesNetos(triangulo))).toEqual([{ deId: "a", aId: "c", centavos: 200 }]);
  });
  it("quien no debe nada no tiene oferta", () => {
    expect(planQueAhorra(triangulo, [], "c", balancesNetos(triangulo))).toEqual([]);
  });
  it("si alguna transferencia del plan no se puede hacer como cadena, no se ofrece nada (nunca un botón que falla)", () => {
    // El saldo neto dice que a le paga a c 200, pero con la deuda de a→c ya en camino no hay cadena que cubra los 200.
    const vigentes = [{ deudorId: "a", acreedorId: "c", centavos: 100 }];
    expect(planQueAhorra(triangulo, vigentes, "a", balancesNetos(triangulo))).toEqual([]);
  });
});
