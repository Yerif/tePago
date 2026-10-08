import { describe, expect, it } from "vitest";
import type { GrupoDemo } from "./tipos";
import { aplicarGastosGuardados, crearGastoGuardado, limpiarGastosGuardados, xpDeGastosGuardados, type EntradaGastoGuardado } from "./gastosGuardados";

const ahora = new Date("2026-10-08T18:00:00Z");
const entrada = (cambio: Partial<EntradaGastoGuardado> = {}): EntradaGastoGuardado => ({
  grupoId: "oaxaca",
  descripcion: "  Tacos ",
  totalCentavos: 85000,
  pagadoPor: "ana",
  creadoPor: "ana",
  partes: { ana: 21250, ferni: 21250, caro: 21250, beto: 21250 },
  sinAsignarCentavos: 0,
  ahora,
  ...cambio,
});

describe("crearGastoGuardado", () => {
  it("da +10 XP con 2+ personas y limpia la descripción", () => {
    const g = crearGastoGuardado(entrada(), []);
    expect(g.xp).toBe(10);
    expect(g.descripcion).toBe("Tacos");
    expect(g.fechaIso).toBe(ahora.toISOString());
  });
  it("una sola persona no da XP (D5)", () => {
    expect(crearGastoGuardado(entrada({ partes: { ana: 85000 } }), []).xp).toBe(0);
  });
  it("máximo 5 gastos con XP por día y por persona; otra persona sigue ganando", () => {
    let previos = [] as ReturnType<typeof crearGastoGuardado>[];
    for (let i = 0; i < 6; i++) previos = [...previos, crearGastoGuardado(entrada({ ahora: new Date(ahora.getTime() + i * 1000) }), previos)];
    expect(previos.map((g) => g.xp)).toEqual([10, 10, 10, 10, 10, 0]);
    expect(crearGastoGuardado(entrada({ creadoPor: "ferni" }), previos).xp).toBe(10);
  });
  it("sin descripción se llama «Gasto»", () => {
    expect(crearGastoGuardado(entrada({ descripcion: "  " }), []).descripcion).toBe("Gasto");
  });
});

describe("aplicarGastosGuardados / xpDeGastosGuardados", () => {
  const grupos: Pick<GrupoDemo, "id" | "gastos">[] = [
    { id: "oaxaca", gastos: [] },
    { id: "playa", gastos: [] },
  ];
  it("sin gastos devuelve los mismos grupos", () => expect(aplicarGastosGuardados(grupos, [])).toBe(grupos));
  it("agrega el gasto solo a su grupo, con el pagador saldado", () => {
    const g = crearGastoGuardado(entrada(), []);
    const r = aplicarGastosGuardados(grupos, [g]);
    expect(r[0]?.gastos).toHaveLength(1);
    expect(r[0]?.gastos[0]?.partes.find((p) => p.userId === "ana")?.saldado).toBe(true);
    expect(r[0]?.gastos[0]?.partes.find((p) => p.userId === "ferni")?.saldado).toBe(false);
    expect(r[1]).toBe(grupos[1]);
    expect(grupos[0]?.gastos).toHaveLength(0);
  });
  it("suma la XP de quien registró", () => {
    const g = crearGastoGuardado(entrada(), []);
    expect(xpDeGastosGuardados([g], "ana")).toBe(10);
    expect(xpDeGastosGuardados([g], "ferni")).toBe(0);
  });
});

describe("limpiarGastosGuardados", () => {
  it("conserva lo válido y descarta basura", () => {
    const bueno = crearGastoGuardado(entrada(), []);
    expect(limpiarGastosGuardados([bueno, 5, null, { id: "x" }, { ...bueno, totalCentavos: 1.5 }, { ...bueno, partes: [] }])).toEqual([bueno]);
  });
  it("lo que no es una lista no rompe", () => {
    expect(limpiarGastosGuardados(null)).toEqual([]);
    expect(limpiarGastosGuardados({})).toEqual([]);
  });
});
