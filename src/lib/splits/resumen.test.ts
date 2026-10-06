import { describe, expect, it } from "vitest";
import { repartirAbonoEntreGrupos, resumenPorPersona } from "./resumen";

const ahora = new Date("2026-10-06T12:00:00Z");
const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
const gasto = (id: string, pagadoPor: string, partes: [string, number][], haceHoras: number, saldados: string[] = []) => ({
  id,
  pagadoPor,
  fecha: hace(haceHoras),
  totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
  partes: partes.map(([userId, centavos]) => ({ userId, centavos, saldado: userId === pagadoPor || saldados.includes(userId) })),
});

const grupos = [
  // En el viaje: A le debe 200 a B y B le debe 50 a A → A le paga 150.
  { id: "g1", nombre: "Viaje", icono: "🌮", gastos: [gasto("1", "b", [["a", 200], ["b", 0]], 100), gasto("2", "a", [["b", 50], ["a", 0]], 10)] },
  // En roomies A le debe 300 a B (otra vez) y 120 a C.
  { id: "g2", nombre: "Roomies", icono: "🏠", gastos: [gasto("3", "b", [["a", 300], ["b", 0]], 20), gasto("4", "c", [["a", 120], ["c", 0]], 5)] },
  // Un grupo ajeno a A.
  { id: "g3", nombre: "Ajeno", icono: "🎲", gastos: [gasto("5", "b", [["c", 100], ["b", 0]], 1)] },
  // En la oficina a A le deben.
  { id: "g4", nombre: "Oficina", icono: "☕", gastos: [gasto("6", "a", [["d", 80], ["a", 0]], 50), gasto("7", "a", [["b", 500], ["a", 0]], 30, ["b"])] },
];

describe("resumenPorPersona", () => {
  const r = resumenPorPersona(grupos, "a", ahora);

  it("una fila por persona: B aparece una vez aunque le debas en dos grupos (150 + 300), sin netear entre grupos", () => {
    expect(r.debes.map((c) => [c.personaId, c.centavos])).toEqual([
      ["b", 450],
      ["c", 120],
    ]);
    expect(r.debes[0]?.porGrupo).toEqual([
      { grupoId: "g1", nombre: "Viaje", icono: "🌮", centavos: 150 },
      { grupoId: "g2", nombre: "Roomies", icono: "🏠", centavos: 300 },
    ]);
    expect(r.debesCentavos).toBe(570);
  });
  it("ordena por antigüedad y da la más vieja", () => {
    expect(r.debes[0]?.masViejaHoras).toBe(100);
    expect(r.debes[1]?.masViejaHoras).toBe(5);
    expect(r.masViejaHoras).toBe(100);
  });
  it("lo que te deben va aparte", () => {
    expect(r.teDeben.map((c) => [c.personaId, c.centavos])).toEqual([["d", 80]]);
    expect(r.teDebenCentavos).toBe(80);
  });
  it("quien no está en nada no debe ni le deben; sin grupos, todo en cero", () => {
    expect(resumenPorPersona(grupos, "z", ahora)).toEqual({ debesCentavos: 0, teDebenCentavos: 0, debes: [], teDeben: [], masViejaHoras: null });
    expect(resumenPorPersona([], "a", ahora).debes).toEqual([]);
  });
  it("empata por antigüedad → mayor monto → id", () => {
    const g = [{ id: "g", nombre: "G", icono: "x", gastos: [gasto("1", "m", [["a", 100], ["m", 0]], 10), gasto("2", "n", [["a", 300], ["n", 0]], 10), gasto("3", "o", [["a", 300], ["o", 0]], 10)] }];
    expect(resumenPorPersona(g, "a", ahora).debes.map((c) => c.personaId)).toEqual(["n", "o", "m"]);
  });
});

describe("repartirAbonoEntreGrupos", () => {
  const desglose = [
    { grupoId: "g1", centavos: 150 },
    { grupoId: "g2", centavos: 300 },
  ];
  it("pagar todo cubre cada grupo completo", () => {
    expect(repartirAbonoEntreGrupos(desglose, 450)).toEqual(desglose);
  });
  it("un abono llena el primer grupo y sigue con el siguiente", () => {
    expect(repartirAbonoEntreGrupos(desglose, 200)).toEqual([
      { grupoId: "g1", centavos: 150 },
      { grupoId: "g2", centavos: 50 },
    ]);
    expect(repartirAbonoEntreGrupos(desglose, 100)).toEqual([{ grupoId: "g1", centavos: 100 }]);
  });
  it("valida el monto", () => {
    expect(() => repartirAbonoEntreGrupos(desglose, 0)).toThrow(RangeError);
    expect(() => repartirAbonoEntreGrupos(desglose, 1.5)).toThrow(RangeError);
    expect(() => repartirAbonoEntreGrupos(desglose, 451)).toThrow(/excede/);
  });
});
