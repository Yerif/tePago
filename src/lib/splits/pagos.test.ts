import { describe, expect, it } from "vitest";
import { xpPorPago } from "@/lib/game/xp";
import { balancesNetos } from "./balances";
import { deudasEntrePersonas } from "./deudas";
import { aplicarPagos, partesQueSeSaldan } from "./pagos";
import type { GastoCalculable } from "./tipos";

type G = GastoCalculable & { fecha: string };
const gasto = (id: string, pagadoPor: string, fecha: string, partes: [string, number, boolean?][]): G => ({
  id,
  pagadoPor,
  fecha,
  totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
  partes: partes.map(([userId, centavos, saldado]) => ({ userId, centavos, saldado: saldado ?? userId === pagadoPor })),
});

// Ana debe $100 de un gasto viejo y $60 de uno nuevo a Ferni.
const viejo = gasto("viejo", "ferni", "2026-10-01T00:00:00Z", [["ferni", 5000], ["ana", 10000]]);
const nuevo = gasto("nuevo", "ferni", "2026-10-03T00:00:00Z", [["ferni", 3000], ["ana", 6000]]);

describe("aplicarPagos", () => {
  it("sin pagos deja todo igual", () => {
    expect(aplicarPagos([viejo, nuevo], [])).toEqual([viejo, nuevo]);
  });

  it("un abono baja la deuda más vieja primero, sin importar el orden del arreglo", () => {
    const r = aplicarPagos([nuevo, viejo], [{ deudorId: "ana", acreedorId: "ferni", centavos: 4000 }]);
    const deAna = (id: string) => r.find((g) => g.id === id)?.partes.find((p) => p.userId === "ana");
    expect(deAna("viejo")).toMatchObject({ centavos: 6000, saldado: false });
    expect(deAna("nuevo")).toMatchObject({ centavos: 6000, saldado: false });
    expect(r.map((g) => g.id)).toEqual(["nuevo", "viejo"]);
  });

  it("un pago que cubre una deuda completa la marca saldada y sigue con la siguiente", () => {
    const [v, n] = aplicarPagos([viejo, nuevo], [{ deudorId: "ana", acreedorId: "ferni", centavos: 12000 }]) as [G, G];
    expect(v.partes.find((p) => p.userId === "ana")).toMatchObject({ centavos: 0, saldado: true });
    expect(n.partes.find((p) => p.userId === "ana")).toMatchObject({ centavos: 4000, saldado: false });
  });

  it("varios abonos se acumulan", () => {
    const r = aplicarPagos([viejo, nuevo], [
      { deudorId: "ana", acreedorId: "ferni", centavos: 5000 },
      { deudorId: "ana", acreedorId: "ferni", centavos: 5000 },
    ]) as [G, G];
    expect(r[0].partes.find((p) => p.userId === "ana")).toMatchObject({ centavos: 0, saldado: true });
  });

  it("el excedente se ignora y las deudas ya saldadas no se tocan", () => {
    const yaSaldado = gasto("s", "ferni", "2026-09-01T00:00:00Z", [["ferni", 100], ["ana", 100, true]]);
    const r = aplicarPagos([yaSaldado, viejo], [{ deudorId: "ana", acreedorId: "ferni", centavos: 999999 }]);
    expect(r[0]).toEqual(yaSaldado);
    expect(balancesNetos(r)).toEqual({ ferni: 0, ana: 0 });
  });

  it("un pago solo cuenta en su dirección: no toca lo que el acreedor debe", () => {
    const inverso = gasto("i", "ana", "2026-10-02T00:00:00Z", [["ana", 1000], ["ferni", 2000]]);
    const [, i] = aplicarPagos([viejo, inverso], [{ deudorId: "ana", acreedorId: "ferni", centavos: 10000 }]) as [G, G];
    expect(i.partes.find((p) => p.userId === "ferni")).toMatchObject({ centavos: 2000, saldado: false });
    expect(deudasEntrePersonas(aplicarPagos([viejo, inverso], [{ deudorId: "ana", acreedorId: "ferni", centavos: 10000 }]))).toEqual([
      { deudorId: "ferni", acreedorId: "ana", centavos: 2000 },
    ]);
  });

  it("invariante: lo pendiente baja exactamente lo pagado (hasta cubrir cada deuda) y los saldos suman 0", () => {
    const pendiente = (gs: G[]) => gs.reduce((t, g) => t + g.partes.filter((p) => !p.saldado && p.userId !== g.pagadoPor).reduce((s, p) => s + p.centavos, 0), 0);
    let semilla = 7;
    const azar = (n: number) => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) % n) + 1;
    for (let caso = 0; caso < 300; caso++) {
      const gastos = [1, 2, 3].map((k) => gasto(`g${k}`, k % 2 ? "ferni" : "ana", `2026-10-0${k}T00:00:00Z`, [["ferni", azar(5000)], ["ana", azar(5000)], ["caro", azar(5000)]]));
      const pagos = [
        { deudorId: "caro", acreedorId: "ferni", centavos: azar(9000) },
        { deudorId: "ana", acreedorId: "ferni", centavos: azar(9000) },
      ];
      const despues = aplicarPagos(gastos, pagos);
      const debia = (p: (typeof pagos)[number]) => gastos.filter((g) => g.pagadoPor === p.acreedorId).reduce((s, g) => s + (g.partes.find((x) => x.userId === p.deudorId)?.centavos ?? 0), 0);
      const esperado = pagos.reduce((t, p) => t + Math.min(debia(p), p.centavos), 0);
      expect(pendiente(gastos) - pendiente(despues)).toBe(esperado);
      expect(Object.values(balancesNetos(despues)).reduce((s, v) => s + v, 0)).toBe(0);
    }
  });

  it("valida los centavos del pago", () => {
    for (const centavos of [0, -5, 1.5, Number.NaN]) {
      expect(() => aplicarPagos([viejo], [{ deudorId: "ana", acreedorId: "ferni", centavos }])).toThrow(RangeError);
    }
  });
});

describe("partesQueSeSaldan", () => {
  it("un abono parcial no salda nada", () => {
    expect(partesQueSeSaldan([viejo, nuevo], [], { deudorId: "ana", acreedorId: "ferni", centavos: 3000 })).toEqual([]);
  });

  it("el abono que completa una deuda la reporta con la fecha de su gasto", () => {
    const previos = [{ deudorId: "ana", acreedorId: "ferni", centavos: 7000 }];
    expect(partesQueSeSaldan([viejo, nuevo], previos, { deudorId: "ana", acreedorId: "ferni", centavos: 3000 })).toEqual([
      { gastoId: "viejo", userId: "ana", fecha: "2026-10-01T00:00:00Z" },
    ]);
  });

  it("un pago total reporta todas las deudas que cierra", () => {
    const r = partesQueSeSaldan([viejo, nuevo], [], { deudorId: "ana", acreedorId: "ferni", centavos: 16000 });
    expect(r.map((x) => x.gastoId).sort()).toEqual(["nuevo", "viejo"]);
  });
});

describe("xpPorPago", () => {
  const ahora = new Date("2026-10-04T00:00:00Z");
  it("suma el XP de cada deuda cerrada según su antigüedad", () => {
    // 72 h (+10) y 24 h exactas (+30, "< 48 h")
    expect(xpPorPago([{ fecha: "2026-10-01T00:00:00Z" }, { fecha: "2026-10-03T00:00:00Z" }], ahora)).toBe(10 + 30);
  });
  it("sin deudas cerradas no da XP", () => {
    expect(xpPorPago([], ahora)).toBe(0);
  });
  it("una fecha en el futuro cuenta como 0 h", () => {
    expect(xpPorPago([{ fecha: "2026-10-05T00:00:00Z" }], ahora)).toBe(50);
  });
});
