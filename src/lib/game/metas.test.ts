import { describe, expect, it } from "vitest";
import { xpAcumuladaParaNivel } from "./levels";
import { proximaMetaDeSkin } from "./metas";

describe("proximaMetaDeSkin", () => {
  it("Ana (395 XP, nivel 3): Explorador a nivel 5, faltan 455 XP", () => {
    expect(proximaMetaDeSkin(395)).toEqual({ skin: "explorador", nombre: "Explorador", accesorio: "🧭", nivelObjetivo: 5, xpFaltante: 455 });
  });
  it("con 0 XP la primera meta es el nivel 5", () => {
    expect(proximaMetaDeSkin(0)?.xpFaltante).toBe(xpAcumuladaParaNivel(5));
  });
  it("una vez en nivel 5 la meta es Leyenda (nivel 10)", () => {
    const m = proximaMetaDeSkin(xpAcumuladaParaNivel(5));
    expect(m).toMatchObject({ skin: "leyenda", nivelObjetivo: 10 });
    expect(m?.xpFaltante).toBe(xpAcumuladaParaNivel(10) - xpAcumuladaParaNivel(5));
  });
  it("al llegar al nivel 10 ya no hay metas de nivel", () => {
    expect(proximaMetaDeSkin(xpAcumuladaParaNivel(10))).toBeNull();
  });
});
