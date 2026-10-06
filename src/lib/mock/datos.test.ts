import { describe, expect, it } from "vitest";
import { badgesValidos, estaDesbloqueada } from "@/lib/game/skins";
import { balancesNetos } from "@/lib/splits/balances";
import { BADGES_DEMO, crearGrupos, YO } from "./datos";

const ahora = new Date("2026-09-29T12:00:00Z");
const grupos = crearGrupos(ahora);

describe("datos de ejemplo", () => {
  it("es determinista para la misma fecha", () => {
    expect(crearGrupos(ahora)).toEqual(grupos);
  });

  it("hay 2 grupos y yo estoy en ambos", () => {
    expect(grupos).toHaveLength(2);
    for (const g of grupos) expect(g.miembros.map((m) => m.id)).toContain(YO);
  });

  it("en cada gasto Σ partes = total y todos son miembros del grupo", () => {
    for (const g of grupos) {
      const ids = g.miembros.map((m) => m.id);
      for (const e of g.gastos) {
        expect(e.partes.reduce((s, p) => s + p.centavos, 0), e.id).toBe(e.totalCentavos);
        expect(ids).toContain(e.pagadoPor);
        for (const p of e.partes) expect(ids, `${e.id}:${p.userId}`).toContain(p.userId);
      }
    }
  });

  it("los saldos de cada grupo suman 0", () => {
    for (const g of grupos) {
      const suma = Object.values(balancesNetos(g.gastos)).reduce((a, b) => a + b, 0);
      expect(suma, g.id).toBe(0);
    }
  });

  it("nivel y XP derivados de la XP total (calculados a mano)", () => {
    const ana = grupos[0]?.miembros.find((m) => m.id === "ana");
    const ferni = grupos[0]?.miembros.find((m) => m.id === "ferni");
    expect(ana).toMatchObject({ nivel: 3, xp: 120, xpSiguiente: 250 }); // 395 = 100 + 175 + 120
    expect(ferni).toMatchObject({ nivel: 5, xp: 90, xpSiguiente: 400 }); // 940 = 850 + 90
  });

  it("todos los badges existen en el catálogo de la demo", () => {
    for (const m of grupos.flatMap((g) => g.miembros)) {
      for (const b of m.badges) expect(BADGES_DEMO[b], b).toBeDefined();
    }
  });

  it("estado del avatar derivado de las deudas (esperado a mano, CLAUDE.md §7)", () => {
    // ana: en Roomies debe $218.04 netos (200 de internet + 400 de cumple − 381.96 del súper), hace ≤ 12 h → mild.
    // ferni y caro: saldo a favor. beto: debe $1,725.12 (y una deuda de 120 h). luis: saldo a favor. mari: debe $3,381.96 → rekt.
    const estado = (id: string) => grupos.flatMap((g) => g.miembros).find((m) => m.id === id)?.estado;
    expect(["ana", "ferni", "caro", "beto", "luis", "mari"].map(estado)).toEqual([
      "mild",
      "clean",
      "clean",
      "rekt",
      "clean",
      "rekt",
    ]);
  });

  it("una persona tiene el mismo estado en todos sus grupos", () => {
    const anas = grupos.flatMap((g) => g.miembros).filter((m) => m.id === "ana");
    expect(new Set(anas.map((m) => m.estado)).size).toBe(1);
  });

  it("los badges de la demo respetan la jerarquía real: Rayo y Alcalde implican Jardinero", () => {
    for (const m of grupos.flatMap((g) => g.miembros)) {
      if (m.badges.includes("rayo") || m.badges.includes("alcalde")) expect(m.badges, m.id).toContain("jardinero");
    }
  });

  it("la skin activa de cada persona está desbloqueada por su nivel y sus badges", () => {
    for (const m of grupos.flatMap((g) => g.miembros)) {
      expect(estaDesbloqueada(m.skinActivo, { nivel: m.nivel, badges: badgesValidos(m.badges) }), m.id).toBe(true);
    }
    const skin = (id: string) => grupos.flatMap((g) => g.miembros).find((m) => m.id === id)?.skinActivo;
    expect(["ana", "ferni", "caro", "luis"].map(skin)).toEqual(["jardinero", "explorador", "clasico", "alcalde"]);
  });

  it("cubre los 3 estados del avatar", () => {
    const estados = new Set(grupos.flatMap((g) => g.miembros.map((m) => m.estado)));
    expect(estados).toEqual(new Set(["clean", "mild", "rekt"]));
  });
});
