import { describe, expect, it } from "vitest";
import { contarDelDia, MAX_GASTOS_CON_XP_POR_DIA, xpPorRegistrarGasto, xpSemanaSinDeudas } from "./xp";

describe("xpPorRegistrarGasto", () => {
  it("da 10 XP si lo comparten al menos 2 personas y hay cupo", () => {
    expect(xpPorRegistrarGasto({ participantes: 2, gastosConXpHoy: 0 })).toBe(10);
    expect(xpPorRegistrarGasto({ participantes: 6, gastosConXpHoy: MAX_GASTOS_CON_XP_POR_DIA - 1 })).toBe(10);
  });
  it("no da XP si es de una sola persona", () => {
    expect(xpPorRegistrarGasto({ participantes: 1, gastosConXpHoy: 0 })).toBe(0);
  });
  it("no da XP al llegar al tope de 5 por día", () => {
    expect(xpPorRegistrarGasto({ participantes: 3, gastosConXpHoy: 5 })).toBe(0);
    expect(xpPorRegistrarGasto({ participantes: 3, gastosConXpHoy: 40 })).toBe(0);
  });
  it("valida las entradas", () => {
    for (const participantes of [0, -1, 1.5, Number.NaN]) expect(() => xpPorRegistrarGasto({ participantes, gastosConXpHoy: 0 })).toThrow(RangeError);
    for (const gastosConXpHoy of [-1, 0.5, Number.NaN]) expect(() => xpPorRegistrarGasto({ participantes: 2, gastosConXpHoy })).toThrow(RangeError);
  });
});

describe("xpSemanaSinDeudas", () => {
  it("da 25 XP con actividad y sin deudas", () => {
    expect(xpSemanaSinDeudas({ huboActividad: true, deudasPendientes: 0 })).toBe(25);
  });
  it("no se regala sin actividad", () => {
    expect(xpSemanaSinDeudas({ huboActividad: false, deudasPendientes: 0 })).toBe(0);
  });
  it("no da XP con deudas pendientes", () => {
    expect(xpSemanaSinDeudas({ huboActividad: true, deudasPendientes: 2 })).toBe(0);
  });
  it("valida las deudas pendientes", () => {
    for (const deudasPendientes of [-1, 1.2, Number.NaN]) expect(() => xpSemanaSinDeudas({ huboActividad: true, deudasPendientes })).toThrow(RangeError);
  });
});

describe("contarDelDia", () => {
  const ahora = new Date("2026-10-05T20:00:00Z"); // 14:00 en CDMX
  it("cuenta solo los del mismo día calendario de la zona del grupo", () => {
    const fechas = [
      "2026-10-05T07:00:00Z", // 01:00 CDMX del 5 → hoy
      "2026-10-05T05:59:00Z", // 23:59 CDMX del 4 → ayer
      "2026-10-06T05:59:00Z", // 23:59 CDMX del 5 → hoy (aunque sea 6 en UTC)
      "2026-10-06T06:00:00Z", // 00:00 CDMX del 6 → mañana
    ];
    expect(contarDelDia(fechas, ahora)).toBe(2);
  });
  it("sin fechas, cero; y respeta otra zona", () => {
    expect(contarDelDia([], ahora)).toBe(0);
    expect(contarDelDia(["2026-10-05T05:59:00Z"], ahora, "UTC")).toBe(1);
  });
});
