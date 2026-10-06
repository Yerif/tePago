import { describe, expect, it } from "vitest";
import { badgesValidos, estaDesbloqueada } from "@/lib/game/skins";
import { balancesNetos } from "@/lib/splits/balances";
import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { planDePagos } from "@/lib/splits/plan";
import { resumenPersona } from "@/lib/splits/resumen";
import { BADGES_DEMO, crearGrupos, YO } from "./datos";

const ahora = new Date("2026-09-29T12:00:00Z");
const grupos = crearGrupos(ahora);

describe("datos de ejemplo", () => {
  it("es determinista para la misma fecha", () => {
    expect(crearGrupos(ahora)).toEqual(grupos);
  });

  it("hay 7 grupos y yo estoy en todos", () => {
    expect(grupos.map((g) => g.id)).toEqual(["oaxaca", "roomies", "playa", "peda", "oficina", "cocina", "abuela"]);
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
    // ana: debe $4,821.39 repartidos en 4 grupos (con deudas de hasta 100 h) → rekt.
    // beto: debe $1,845.12 en Oaxaca (y una deuda de 120 h) → rekt. mari: debe $3,381.96 → rekt.
    // pau (−$1,033.33), rafa (−$1,733.33) y dani (−$1,108.33) en la playa, con deudas de ≥ 70 h → rekt.
    // nico: solo debe $125 en Oficina (60 h) y en la playa va a favor → mild. sofi: debe $75 en Oficina (18 h) → mild.
    // ferni, caro y luis: saldo a favor en todos sus grupos → clean.
    const estado = (id: string) => grupos.flatMap((g) => g.miembros).find((m) => m.id === id)?.estado;
    expect(["ana", "ferni", "caro", "beto", "luis", "mari", "nico", "pau", "rafa", "sofi", "dani"].map(estado)).toEqual([
      "rekt",
      "clean",
      "clean",
      "rekt",
      "clean",
      "rekt",
      "mild",
      "rekt",
      "rekt",
      "mild",
      "rekt",
    ]);
  });

  it("escenarios para probar a fondo", () => {
    const grupo = (id: string) => grupos.find((g) => g.id === id)!;
    const plan = (id: string) => planDePagos(balancesNetos(grupo(id).gastos));
    // Ana le debe (en el plan) a gente de 4 grupos distintos y le deben en 2.
    const resumen = resumenPersona(grupos, YO);
    expect(resumen.porGrupo.map((g) => g.grupoId)).toEqual(["oaxaca", "roomies", "playa", "peda", "oficina", "abuela"]);
    expect(resumen.debesCentavos).toBe(482_139);
    expect(resumen.teDebenCentavos).toBe(224_000);
    // La playa tiene 6 personas con deudas cruzadas: el plan nunca pide más de n − 1 pagos.
    expect(plan("playa").length).toBeLessThanOrEqual(5);
    // Peda: Ana y Dani se deben $120 mutuamente; el neteo por pares los deja a mano.
    const entre = deudasEntrePersonas(grupo("peda").gastos);
    expect(entre.some((d) => [d.deudorId, d.acreedorId].sort().join() === "ana,dani" && d.centavos > 4000)).toBe(false);
    // Clases de cocina está al corriente.
    expect(plan("cocina")).toEqual([]);
    // Abuela: Ana le debe a 3 personas distintas.
    expect(plan("abuela").map((t) => t.aId).sort()).toEqual(["caro", "ferni", "luis"]);
    // Hay deudas viejas (> 72 h) y recientes (< 24 h).
    const horas = grupos.flatMap((g) => g.gastos.map((e) => (ahora.getTime() - new Date(e.fecha).getTime()) / 3_600_000));
    expect(Math.max(...horas)).toBeGreaterThan(120);
    expect(Math.min(...horas)).toBeLessThan(10);
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
