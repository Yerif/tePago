import { describe, expect, it } from "vitest";
import { badgesValidos, estaDesbloqueada, requisitoSkin, SKIN_SLUGS, SKINS, skinEfectiva, skinsDesbloqueadas, skinsNuevas } from "./skins";

const nuevo = { nivel: 1, badges: [] as const };

describe("catálogo", () => {
  it("son 5 skins con nombre propio, y solo la clásica no lleva accesorio", () => {
    expect([...SKIN_SLUGS]).toEqual(["clasico", "jardinero", "alcalde", "explorador", "leyenda"]);
    for (const s of SKIN_SLUGS) expect(SKINS[s].nombre.length).toBeGreaterThan(0);
    expect(SKIN_SLUGS.filter((s) => SKINS[s].accesorio === "")).toEqual(["clasico"]);
  });

  it("Jardinero y Alcalde se desbloquean con sus badges (CLAUDE.md §7)", () => {
    expect(SKINS.jardinero.regla).toEqual({ tipo: "badge", badge: "jardinero" });
    expect(SKINS.alcalde.regla).toEqual({ tipo: "badge", badge: "alcalde" });
  });

  it("ninguna skin se compra: no existe una regla de pago", () => {
    for (const s of SKIN_SLUGS) expect(["siempre", "badge", "nivel"]).toContain(SKINS[s].regla.tipo);
  });
});

describe("desbloqueo", () => {
  it("una persona nueva solo tiene la clásica", () => {
    expect(skinsDesbloqueadas(nuevo)).toEqual(["clasico"]);
  });

  it("por badge", () => {
    expect(estaDesbloqueada("jardinero", { nivel: 1, badges: ["jardinero"] })).toBe(true);
    expect(estaDesbloqueada("jardinero", { nivel: 50, badges: ["rayo"] })).toBe(false);
    expect(estaDesbloqueada("alcalde", { nivel: 1, badges: ["alcalde"] })).toBe(true);
  });

  it("por nivel, con bordes en 4/5 y 9/10", () => {
    expect(estaDesbloqueada("explorador", { nivel: 4, badges: [] })).toBe(false);
    expect(estaDesbloqueada("explorador", { nivel: 5, badges: [] })).toBe(true);
    expect(estaDesbloqueada("leyenda", { nivel: 9, badges: [] })).toBe(false);
    expect(estaDesbloqueada("leyenda", { nivel: 10, badges: [] })).toBe(true);
  });

  it("devuelve las desbloqueadas en el orden del catálogo", () => {
    expect(skinsDesbloqueadas({ nivel: 10, badges: ["alcalde", "jardinero"] })).toEqual(["clasico", "jardinero", "alcalde", "explorador", "leyenda"]);
    expect(skinsDesbloqueadas({ nivel: 5, badges: ["jardinero"] })).toEqual(["clasico", "jardinero", "explorador"]);
  });

  it("skinsNuevas: lo ganado que aún no está guardado", () => {
    expect(skinsNuevas(["clasico"], { nivel: 5, badges: ["jardinero"] })).toEqual(["jardinero", "explorador"]);
    expect(skinsNuevas(["clasico", "jardinero", "explorador"], { nivel: 5, badges: ["jardinero"] })).toEqual([]);
    expect(skinsNuevas([], nuevo)).toEqual(["clasico"]);
  });
});

describe("skinEfectiva", () => {
  const progreso = { nivel: 5, badges: ["jardinero" as const] };

  it("respeta la elegida si está desbloqueada", () => {
    expect(skinEfectiva("jardinero", progreso)).toBe("jardinero");
    expect(skinEfectiva("explorador", progreso)).toBe("explorador");
  });

  it("cae a la clásica si está bloqueada, no existe o no hay ninguna", () => {
    expect(skinEfectiva("leyenda", progreso)).toBe("clasico");
    expect(skinEfectiva("dragon", progreso)).toBe("clasico");
    expect(skinEfectiva(null, progreso)).toBe("clasico");
    expect(skinEfectiva(undefined, progreso)).toBe("clasico");
  });
});

describe("requisitoSkin y badgesValidos", () => {
  it("dice cómo se consigue cada una", () => {
    expect(requisitoSkin("clasico")).toBe("Viene con tu personaje");
    expect(requisitoSkin("jardinero")).toBe("Gana el badge Jardinero 🌱");
    expect(requisitoSkin("alcalde")).toBe("Gana el badge Alcalde 🏅");
    expect(requisitoSkin("explorador")).toBe("Llega al nivel 5");
    expect(requisitoSkin("leyenda")).toBe("Llega al nivel 10");
  });

  it("badgesValidos descarta lo que no es un badge y conserva el orden del catálogo", () => {
    expect(badgesValidos(["mecenas", "otro", "rayo"])).toEqual(["rayo", "mecenas"]);
    expect(badgesValidos([])).toEqual([]);
  });
});
