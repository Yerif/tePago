import { describe, expect, it } from "vitest";
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

  it("XP dentro del nivel y badges existentes", () => {
    for (const m of grupos.flatMap((g) => g.miembros)) {
      expect(m.xp).toBeGreaterThanOrEqual(0);
      expect(m.xp).toBeLessThan(m.xpSiguiente);
      // Fórmula de CLAUDE.md §7: el nivel n requiere 100 + (n-1)*75 XP.
      expect(m.xpSiguiente).toBe(100 + (m.nivel - 1) * 75);
      for (const b of m.badges) expect(BADGES_DEMO[b], b).toBeDefined();
    }
  });

  it("el estado de cada persona coincide con lo que derivan las reglas de CLAUDE.md §7", () => {
    // clean: sin deudas · rekt: debe ≥ $500 en total o alguna deuda > 72 h · mild: cualquier otra deuda.
    const derivar = (userId: string) => {
      const deudas = grupos.flatMap((g) =>
        g.gastos.flatMap((e) =>
          e.partes
            .filter((p) => p.userId === userId && p.userId !== e.pagadoPor && !p.saldado)
            .map((p) => ({ centavos: p.centavos, horas: (ahora.getTime() - new Date(e.fecha).getTime()) / 3_600_000 })),
        ),
      );
      if (deudas.length === 0) return "clean";
      const total = deudas.reduce((s, d) => s + d.centavos, 0);
      return total >= 50_000 || deudas.some((d) => d.horas > 72) ? "rekt" : "mild";
    };
    for (const m of grupos.flatMap((g) => g.miembros)) expect(m.estado, m.id).toBe(derivar(m.id));
  });

  it("cubre los 3 estados del avatar", () => {
    const estados = new Set(grupos.flatMap((g) => g.miembros.map((m) => m.estado)));
    expect(estados).toEqual(new Set(["clean", "mild", "rekt"]));
  });
});
