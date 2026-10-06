import { describe, expect, it } from "vitest";
import {
  avisosParaPagador,
  cancelarPago,
  centavosEnDisputa,
  centavosPendientes,
  declararPago,
  marcarAvisado,
  paresConfirmados,
  paresVigentes,
  porConfirmar,
  porRevisar,
  responderPago,
  responderVarios,
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

/** Ana le paga a Nico y, por la cadena Nico → Sofi, también debe aceptar Sofi. */
const reencaminado = (id = "r1") =>
  nuevo(id, {
    aId: "nico",
    centavos: 1000,
    pares: [
      { deudorId: "ana", acreedorId: "nico", centavos: 1000 },
      { deudorId: "nico", acreedorId: "sofi", centavos: 600 },
    ],
  });

describe("declararPago", () => {
  it("nace pendiente, sin respuestas, sin XP y sin avisar; los requeridos son los acreedores de los pares", () => {
    expect(declararPago([], nuevo("p1"))).toEqual([{ ...nuevo("p1"), loteId: "p1", requeridos: ["luis"], respuestas: {}, estado: "pendiente", xp: 0, avisado: false }]);
    expect(declararPago([], reencaminado())[0]?.requeridos).toEqual(["nico", "sofi"]);
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
    expect(centavosEnDisputa(registros, "g1", "ana", "luis")).toBe(0);
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

describe("responderPago", () => {
  const registros = declararPago([], nuevo("p1"));
  it("confirmar: salda, da el XP y avisa a quien pagó", () => {
    const r = responderPago(registros, "p1", "luis", "confirmado", 50);
    expect(paresConfirmados(r, "g1")).toHaveLength(1);
    expect(xpPorPagosConfirmados(r, "ana")).toBe(50);
    expect(centavosPendientes(r, "g1", "ana", "luis")).toBe(0);
    expect(porConfirmar(r, "luis")).toEqual([]);
    expect(avisosParaPagador(r, "ana").map((x) => x.id)).toEqual(["p1"]);
  });
  it("rechazar: en disputa, no salda ni da XP, sigue reservado y avisa", () => {
    const r = responderPago(registros, "p1", "luis", "rechazado", 50);
    expect(r[0]).toMatchObject({ estado: "rechazado", xp: 0 });
    expect(paresConfirmados(r, "g1")).toEqual([]);
    expect(paresVigentes(r, "g1")).toHaveLength(1);
    expect(centavosEnDisputa(r, "g1", "ana", "luis")).toBe(300);
    expect(centavosPendientes(r, "g1", "ana", "luis")).toBe(0);
    expect(avisosParaPagador(r, "ana")).toHaveLength(1);
    expect(porConfirmar(r, "luis")).toEqual([]);
    expect(porRevisar(r, "luis").map((x) => x.id)).toEqual(["p1"]);
    expect(porRevisar(r, "ana")).toEqual([]);
  });
  it("quien rechazó puede aprobar más tarde: se confirma, da el XP y se vuelve a avisar", () => {
    const rechazado = marcarAvisado(responderPago(registros, "p1", "luis", "rechazado"), ["p1"]);
    expect(avisosParaPagador(rechazado, "ana")).toEqual([]);
    const r = responderPago(rechazado, "p1", "luis", "confirmado", 30);
    expect(r[0]).toMatchObject({ estado: "confirmado", xp: 30, avisado: false });
    expect(xpPorPagosConfirmados(r, "ana")).toBe(30);
    expect(porRevisar(r, "luis")).toEqual([]);
    expect(avisosParaPagador(r, "ana")).toHaveLength(1);
  });
  it("valida quién responde y en qué estado", () => {
    expect(() => responderPago(registros, "p1", "ana", "confirmado")).toThrow(/pueden confirmarlo/);
    expect(() => responderPago(registros, "p1", "mari", "confirmado")).toThrow(/pueden confirmarlo/);
    expect(() => responderPago(registros, "nada", "luis", "confirmado")).toThrow(/No existe/);
    expect(() => responderPago(responderPago(registros, "p1", "luis", "confirmado"), "p1", "luis", "rechazado")).toThrow(/ya se confirmó/);
    expect(() => responderPago(cancelarPago(registros, "p1", "ana"), "p1", "luis", "confirmado")).toThrow(/cancelado/);
    expect(() => responderPago(registros, "p1", "luis", "confirmado", -1)).toThrow(RangeError);
  });
  it("solo cambia el pago indicado, no los demás", () => {
    const dos = declararPago(registros, nuevo("p2", { centavos: 100 }));
    expect(responderPago(dos, "p1", "luis", "confirmado", 10).map((x) => x.estado)).toEqual(["confirmado", "pendiente"]);
  });
  it("sin XP indicado, confirmar deja 0 (un abono)", () => {
    expect(responderPago(registros, "p1", "luis", "confirmado")[0]).toMatchObject({ estado: "confirmado", xp: 0 });
  });
  it("los avisos salen del más viejo al más nuevo", () => {
    let r = declararPago(declararPago([], nuevo("nuevo", { creadoIso: "2026-10-06T12:00:00Z" })), nuevo("viejo", { creadoIso: "2026-10-06T08:00:00Z" }));
    r = responderPago(responderPago(r, "nuevo", "luis", "confirmado"), "viejo", "luis", "rechazado");
    expect(avisosParaPagador(r, "ana").map((x) => x.id)).toEqual(["viejo", "nuevo"]);
  });
});

describe("pagar menos veces: todas las personas requeridas deben confirmar", () => {
  const registros = declararPago([], reencaminado());
  it("con una sola confirmación sigue pendiente y no avisa", () => {
    const r = responderPago(registros, "r1", "nico", "confirmado", 40);
    expect(r[0]).toMatchObject({ estado: "pendiente", xp: 0, avisado: false });
    expect(porConfirmar(r, "nico")).toEqual([]);
    expect(porConfirmar(r, "sofi").map((x) => x.id)).toEqual(["r1"]);
    expect(avisosParaPagador(r, "ana")).toEqual([]);
    expect(paresConfirmados(r, "g1")).toEqual([]);
  });
  it("cuando confirman todos se salda y se da el XP", () => {
    const r = responderPago(responderPago(registros, "r1", "nico", "confirmado"), "r1", "sofi", "confirmado", 40);
    expect(r[0]).toMatchObject({ estado: "confirmado", xp: 40 });
    expect(paresConfirmados(r, "g1")).toHaveLength(2);
  });
  it("si uno rechaza queda en disputa aunque otro ya haya confirmado, y lo puede aprobar luego", () => {
    let r = responderPago(registros, "r1", "nico", "confirmado");
    r = responderPago(r, "r1", "sofi", "rechazado");
    expect(r[0]?.estado).toBe("rechazado");
    expect(porRevisar(r, "sofi")).toHaveLength(1);
    expect(porRevisar(r, "nico")).toEqual([]);
    r = responderPago(r, "r1", "sofi", "confirmado", 20);
    expect(r[0]).toMatchObject({ estado: "confirmado", xp: 20 });
  });
});

describe("lotes y responderVarios", () => {
  const lote = declararPago(declararPago([], nuevo("a1", { loteId: "L", grupoId: "g1" })), nuevo("a2", { loteId: "L", grupoId: "g2" }));
  it("comparten loteId y se responden juntos", () => {
    expect(lote.map((r) => r.loteId)).toEqual(["L", "L"]);
    const r = responderVarios(lote, [{ id: "a1", xp: 10 }, { id: "a2", xp: 20 }], "luis", "confirmado");
    expect(r.map((x) => [x.estado, x.xp])).toEqual([["confirmado", 10], ["confirmado", 20]]);
  });
  it("todo o nada: si uno falla no cambia ninguno", () => {
    expect(() => responderVarios(lote, [{ id: "a1", xp: 10 }, { id: "nada", xp: 0 }], "luis", "confirmado")).toThrow(/No existe/);
    expect(lote.every((x) => x.estado === "pendiente")).toBe(true);
  });
});

describe("cancelarPago", () => {
  const registros = declararPago([], nuevo("p1"));
  it("libera el monto y sale de todas las bandejas", () => {
    const r = cancelarPago(registros, "p1", "ana");
    expect(r[0]).toMatchObject({ estado: "cancelado", xp: 0 });
    expect(paresVigentes(r, "g1")).toEqual([]);
    expect(porConfirmar(r, "luis")).toEqual([]);
    expect(avisosParaPagador(r, "ana")).toEqual([]);
  });
  it("solo cancela el indicado", () => {
    const dos = declararPago(registros, nuevo("p2"));
    expect(cancelarPago(dos, "p1", "ana").map((x) => x.estado)).toEqual(["cancelado", "pendiente"]);
  });
  it("también se puede cancelar un pago en disputa", () => {
    expect(cancelarPago(responderPago(registros, "p1", "luis", "rechazado"), "p1", "ana")[0]?.estado).toBe("cancelado");
  });
  it("solo quien pagó, y no uno confirmado o ya cancelado", () => {
    expect(() => cancelarPago(registros, "p1", "luis")).toThrow(/quien pagó/);
    expect(() => cancelarPago(registros, "nada", "ana")).toThrow(/No existe/);
    expect(() => cancelarPago(responderPago(registros, "p1", "luis", "confirmado"), "p1", "ana")).toThrow(/ya se confirmó/);
    expect(() => cancelarPago(cancelarPago(registros, "p1", "ana"), "p1", "ana")).toThrow(/ya estaba cancelado/);
  });
});

describe("marcarAvisado", () => {
  it("quita el aviso y no toca los demás", () => {
    const r = marcarAvisado(responderPago(declararPago([], nuevo("p1")), "p1", "luis", "confirmado", 10), ["p1"]);
    expect(avisosParaPagador(r, "ana")).toEqual([]);
    expect(marcarAvisado(r, ["otro"])).toEqual(r);
  });
});
