import { describe, expect, it } from "vitest";
import {
  avisosParaPagador,
  centavosPendientes,
  declararPago,
  marcarAvisado,
  paresConfirmados,
  paresVigentes,
  porConfirmar,
  resolverPago,
  xpPorPagosConfirmados,
  type NuevoPago,
} from "./confirmacion";

const nuevo = (id: string, extra: Partial<NuevoPago> = {}): NuevoPago => ({
  id,
  grupoId: "g1",
  deId: "ana",
  aId: "luis",
  centavos: 300,
  pares: [{ deudorId: "ana", acreedorId: "luis", centavos: 300 }],
  creadoIso: "2026-10-06T10:00:00Z",
  ...extra,
});

describe("declararPago", () => {
  it("nace pendiente, sin XP y sin avisar", () => {
    expect(declararPago([], nuevo("p1"))).toEqual([{ ...nuevo("p1"), estado: "pendiente", xp: 0, avisado: false }]);
  });
  it("valida monto, personas, pares e id repetido", () => {
    expect(() => declararPago([], nuevo("p", { centavos: 0 }))).toThrow(RangeError);
    expect(() => declararPago([], nuevo("p", { centavos: 1.5 }))).toThrow(RangeError);
    expect(() => declararPago([], nuevo("p", { aId: "ana" }))).toThrow(/uno mismo/);
    expect(() => declararPago([], nuevo("p", { pares: [] }))).toThrow(/par/);
    expect(() => declararPago(declararPago([], nuevo("p")), nuevo("p"))).toThrow(/id/);
  });
});

describe("pendiente: no salda nada", () => {
  const registros = declararPago([], nuevo("p1"));
  it("no cuenta como confirmado, pero sí como vigente y pendiente", () => {
    expect(paresConfirmados(registros, "g1")).toEqual([]);
    expect(paresVigentes(registros, "g1")).toHaveLength(1);
    expect(centavosPendientes(registros, "g1", "ana", "luis")).toBe(300);
    expect(centavosPendientes(registros, "g1", "luis", "ana")).toBe(0);
    expect(centavosPendientes(registros, "g2", "ana", "luis")).toBe(0);
    expect(xpPorPagosConfirmados(registros, "ana")).toBe(0);
  });
  it("quien recibe lo ve por confirmar; quien paga, no", () => {
    expect(porConfirmar(registros, "luis").map((r) => r.id)).toEqual(["p1"]);
    expect(porConfirmar(registros, "ana")).toEqual([]);
    expect(avisosParaPagador(registros, "ana")).toEqual([]);
  });
  it("los por confirmar salen del más viejo al más nuevo", () => {
    const r = declararPago(declararPago([], nuevo("nuevo", { creadoIso: "2026-10-06T12:00:00Z" })), nuevo("viejo", { creadoIso: "2026-10-06T08:00:00Z" }));
    expect(porConfirmar(r, "luis").map((x) => x.id)).toEqual(["viejo", "nuevo"]);
  });
});

describe("resolverPago", () => {
  const registros = declararPago([], nuevo("p1"));
  it("confirmar: salda, da el XP y avisa a quien pagó", () => {
    const r = resolverPago(registros, "p1", "luis", "confirmar", 50);
    expect(paresConfirmados(r, "g1")).toHaveLength(1);
    expect(xpPorPagosConfirmados(r, "ana")).toBe(50);
    expect(centavosPendientes(r, "g1", "ana", "luis")).toBe(0);
    expect(porConfirmar(r, "luis")).toEqual([]);
    expect(avisosParaPagador(r, "ana").map((x) => x.id)).toEqual(["p1"]);
  });
  it("rechazar: no salda ni da XP, libera el monto y avisa", () => {
    const r = resolverPago(registros, "p1", "luis", "rechazar", 50);
    expect(paresConfirmados(r, "g1")).toEqual([]);
    expect(paresVigentes(r, "g1")).toEqual([]);
    expect(xpPorPagosConfirmados(r, "ana")).toBe(0);
    expect(avisosParaPagador(r, "ana")).toHaveLength(1);
  });
  it("solo cambia el pago indicado, no los demás", () => {
    const dos = declararPago(registros, nuevo("p2", { centavos: 100 }));
    const r = resolverPago(dos, "p1", "luis", "confirmar", 10);
    expect(r.map((x) => x.estado)).toEqual(["confirmado", "pendiente"]);
  });
  it("sin XP indicado, confirmar deja 0 (un abono)", () => {
    expect(resolverPago(registros, "p1", "luis", "confirmar")[0]).toMatchObject({ estado: "confirmado", xp: 0 });
  });
  it("solo quien recibe puede resolver, una sola vez", () => {
    expect(() => resolverPago(registros, "p1", "ana", "confirmar")).toThrow(/quien recibe/);
    expect(() => resolverPago(registros, "p1", "mari", "confirmar")).toThrow(/quien recibe/);
    expect(() => resolverPago(registros, "nada", "luis", "confirmar")).toThrow(/No existe/);
    expect(() => resolverPago(resolverPago(registros, "p1", "luis", "confirmar"), "p1", "luis", "rechazar")).toThrow(/ya se resolvió/);
    expect(() => resolverPago(registros, "p1", "luis", "confirmar", -1)).toThrow(RangeError);
  });
  it("los avisos salen del más viejo al más nuevo", () => {
    let r = declararPago(declararPago([], nuevo("nuevo", { creadoIso: "2026-10-06T12:00:00Z" })), nuevo("viejo", { creadoIso: "2026-10-06T08:00:00Z" }));
    r = resolverPago(resolverPago(r, "nuevo", "luis", "confirmar"), "viejo", "luis", "rechazar");
    expect(avisosParaPagador(r, "ana").map((x) => x.id)).toEqual(["viejo", "nuevo"]);
  });
  it("marcarAvisado quita el aviso", () => {
    const r = marcarAvisado(resolverPago(registros, "p1", "luis", "confirmar", 10), ["p1"]);
    expect(avisosParaPagador(r, "ana")).toEqual([]);
    expect(marcarAvisado(registros, ["otro"])).toEqual(registros);
  });
});
