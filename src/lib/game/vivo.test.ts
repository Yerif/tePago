import { describe, expect, it } from "vitest";
import { ESPERA_TOQUE_MS, PARPADEO_MAX_MS, PARPADEO_MIN_MS, esperaParpadeo, fraseDeToque, puedeReaccionar } from "./vivo";

describe("esperaParpadeo", () => {
  it("va de 3 a 6 s según el azar", () => {
    expect(esperaParpadeo(0)).toBe(PARPADEO_MIN_MS);
    expect(esperaParpadeo(1)).toBe(PARPADEO_MAX_MS);
    expect(esperaParpadeo(0.5)).toBe(4500);
  });
  it("recorta un azar fuera de rango", () => {
    expect(esperaParpadeo(-3)).toBe(PARPADEO_MIN_MS);
    expect(esperaParpadeo(9)).toBe(PARPADEO_MAX_MS);
  });
});

describe("puedeReaccionar", () => {
  it("la primera vez siempre", () => expect(puedeReaccionar(null, 0)).toBe(true));
  it("exige 2 s entre reacciones (exactos ya cuentan)", () => {
    expect(puedeReaccionar(1000, 1000 + ESPERA_TOQUE_MS - 1)).toBe(false);
    expect(puedeReaccionar(1000, 1000 + ESPERA_TOQUE_MS)).toBe(true);
  });
});

describe("fraseDeToque", () => {
  it("da vueltas por las frases del estado", () => {
    expect(fraseDeToque("clean", 0)).not.toBe(fraseDeToque("clean", 1));
    expect(fraseDeToque("clean", 0)).toBe(fraseDeToque("clean", 3));
    expect(fraseDeToque("mild", -1)).toBe(fraseDeToque("mild", 2));
  });
  it("cada estado habla distinto y nunca regaña", () => {
    const todas = (["clean", "mild", "rekt"] as const).flatMap((e) => [0, 1, 2].map((n) => fraseDeToque(e, n)));
    expect(new Set(todas).size).toBe(9);
    for (const f of todas) expect(f).not.toMatch(/debes|deuda|moroso|culpa/i);
  });
});
