import { describe, expect, it } from "vitest";
import { resumenPersona } from "./resumen";

const gasto = (id: string, pagadoPor: string, partes: [string, number][]) => ({
  id,
  pagadoPor,
  totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
  partes: partes.map(([userId, centavos]) => ({ userId, centavos, saldado: userId === pagadoPor })),
});

const grupos = [
  { id: "g1", nombre: "Viaje", icono: "🌮", gastos: [gasto("1", "b", [["a", 200], ["b", 0]]), gasto("2", "a", [["b", 50], ["a", 0]])] },
  { id: "g2", nombre: "Roomies", icono: "🏠", gastos: [gasto("3", "c", [["a", 300], ["c", 0]])] },
  { id: "g3", nombre: "Ajeno", icono: "🎲", gastos: [gasto("4", "b", [["c", 100], ["b", 0]])] },
];

describe("resumenPersona", () => {
  it("A le debe 200 a B y B 50 a A → A paga 150; en otro grupo debe 300; no se compensan entre grupos", () => {
    const r = resumenPersona(grupos, "a");
    expect(r.debesCentavos).toBe(450);
    expect(r.teDebenCentavos).toBe(0);
    expect(r.porGrupo.map((g) => g.grupoId)).toEqual(["g1", "g2"]);
    expect(r.porGrupo[0]?.debes).toEqual([{ deId: "a", aId: "b", centavos: 150 }]);
  });
  it("lo que te deben", () => {
    const r = resumenPersona(grupos, "b");
    expect(r.teDebenCentavos).toBe(250); // 150 del viaje + 100 del grupo ajeno
    expect(r.debesCentavos).toBe(0);
    expect(r.porGrupo[0]?.teDeben).toEqual([{ deId: "a", aId: "b", centavos: 150 }]);
  });
  it("sin deudas ni cobros: vacío", () => {
    expect(resumenPersona(grupos, "z")).toEqual({ debesCentavos: 0, teDebenCentavos: 0, porGrupo: [] });
    expect(resumenPersona([], "a")).toEqual({ debesCentavos: 0, teDebenCentavos: 0, porGrupo: [] });
  });
});
