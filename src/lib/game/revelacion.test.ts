import { describe, expect, it } from "vitest";
import { revelacion, sinDuplicarXp } from "./revelacion";

describe("revelacion", () => {
  it("sin cambios no hay nada que revelar", () => {
    expect(revelacion({ estado: "rekt", xpTotal: 30 }, { estado: "rekt", xpTotal: 30 })).toBeNull();
  });
  it("Beto: confirma Ferni (+50 XP) y sigue bajo la lluvia → festeja la XP", () => {
    expect(revelacion({ estado: "rekt", xpTotal: 30 }, { estado: "rekt", xpTotal: 80 })).toEqual({
      estadoAntes: "rekt",
      estadoDespues: "rekt",
      xpGanada: 50,
      nivelAntes: 1,
      nivelDespues: 1,
      subioNivel: false,
      mejoro: false,
      empeoro: false,
      festejar: true,
    });
  });
  it("mejora de estado y subida de nivel (30 → 150 XP cruza el nivel 2)", () => {
    expect(revelacion({ estado: "rekt", xpTotal: 30 }, { estado: "clean", xpTotal: 150 })).toMatchObject({ mejoro: true, subioNivel: true, nivelAntes: 1, nivelDespues: 2, xpGanada: 120, festejar: true });
  });
  it("mejora de estado sin XP nueva también festeja", () => {
    expect(revelacion({ estado: "mild", xpTotal: 100 }, { estado: "clean", xpTotal: 100 })).toMatchObject({ mejoro: true, xpGanada: 0, festejar: true });
  });
  it("si empeoró (una deuda envejeció) no festeja", () => {
    expect(revelacion({ estado: "clean", xpTotal: 100 }, { estado: "mild", xpTotal: 100 })).toMatchObject({ empeoro: true, mejoro: false, festejar: false });
  });
  it("si la XP bajó (demo reiniciado) no hay revelación", () => {
    expect(revelacion({ estado: "clean", xpTotal: 300 }, { estado: "rekt", xpTotal: 30 })).toBeNull();
  });
});

describe("sinDuplicarXp", () => {
  const ganoXp = revelacion({ estado: "rekt", xpTotal: 30 }, { estado: "rekt", xpTotal: 80 });
  it("si toda la XP ya se avisó y nada más cambió, no hay segunda tarjeta", () => {
    expect(ganoXp).not.toBeNull();
    if (ganoXp) expect(sinDuplicarXp(ganoXp, 50)).toBeNull();
  });
  it("si solo se avisó una parte, queda el resto", () => {
    if (ganoXp) expect(sinDuplicarXp(ganoXp, 20)?.xpGanada).toBe(30);
  });
  it("un cambio de estado o un nivel nuevo siguen mereciendo su tarjeta", () => {
    const mejora = revelacion({ estado: "rekt", xpTotal: 30 }, { estado: "clean", xpTotal: 80 });
    if (mejora) expect(sinDuplicarXp(mejora, 50)).toMatchObject({ xpGanada: 0, mejoro: true });
    const nivel = revelacion({ estado: "clean", xpTotal: 90 }, { estado: "clean", xpTotal: 140 });
    if (nivel) expect(sinDuplicarXp(nivel, 50)).toMatchObject({ subioNivel: true });
  });
  it("una XP avisada negativa se ignora", () => {
    if (ganoXp) expect(sinDuplicarXp(ganoXp, -5)?.xpGanada).toBe(50);
  });
});
