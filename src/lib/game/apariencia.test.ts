import { describe, expect, it } from "vitest";
import { ACCESORIO_DE_SKIN, apariencia, BASE_INICIAL, BASE_SLUGS, BASES, baseValida, NIVEL_AURA } from "./apariencia";
import { SKIN_SLUGS } from "./skins";

describe("catálogo de bases", () => {
  it("arranca con personitas y animalitos, cada uno con nombre y emoji de respaldo", () => {
    expect(BASE_SLUGS.filter((b) => BASES[b].tipo === "persona").length).toBeGreaterThanOrEqual(3);
    expect(BASE_SLUGS.filter((b) => BASES[b].tipo === "animal").length).toBeGreaterThanOrEqual(5);
    for (const b of BASE_SLUGS) {
      expect(BASES[b].nombre.length).toBeGreaterThan(0);
      expect(BASES[b].emoji.length).toBeGreaterThan(0);
    }
  });

  it("cada skin tiene accesorio salvo la clásica", () => {
    expect(SKIN_SLUGS.filter((s) => ACCESORIO_DE_SKIN[s] === null)).toEqual(["clasico"]);
  });

  it("una base inválida o vacía cae en la inicial", () => {
    expect(baseValida("dragon")).toBe(BASE_INICIAL);
    expect(baseValida(null)).toBe(BASE_INICIAL);
    expect(baseValida(undefined)).toBe(BASE_INICIAL);
    expect(baseValida("zorro")).toBe("zorro");
  });
});

describe("apariencia", () => {
  it("clean: contento, erguido, colores vivos y brillos", () => {
    expect(apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel: 1 })).toEqual({
      base: "oso",
      accesorios: [],
      animo: "contento",
      postura: "erguido",
      saturacion: 1,
      ritmo: 1,
      efectos: ["brillos"],
    });
  });

  it("mild: preocupado, ladeado, más lento y con gota", () => {
    expect(apariencia({ base: "gato", estado: "mild", skin: "clasico", nivel: 2 })).toMatchObject({
      animo: "preocupado",
      postura: "ladeado",
      saturacion: 0.7,
      ritmo: 0.6,
      efectos: ["gota"],
    });
  });

  it("rekt: triste, encorvado, deslavado y con nubecita, aunque lleve skin", () => {
    const a = apariencia({ base: "persona-luna", estado: "rekt", skin: "leyenda", nivel: 3 });
    expect(a).toMatchObject({ animo: "triste", postura: "encorvado", saturacion: 0.3, efectos: ["nube"] });
    expect(a.accesorios).toEqual([{ slug: "corona", punto: "cabeza" }]);
  });

  it("la saturación baja de forma estricta con el deterioro", () => {
    const s = (estado: "clean" | "mild" | "rekt") => apariencia({ base: "oso", estado, skin: "clasico", nivel: 1 }).saturacion;
    expect(s("clean")).toBeGreaterThan(s("mild"));
    expect(s("mild")).toBeGreaterThan(s("rekt"));
  });

  it("cada skin pone su accesorio en su punto", () => {
    expect(apariencia({ base: "oso", estado: "clean", skin: "jardinero", nivel: 1 }).accesorios).toEqual([{ slug: "sombrero-paja", punto: "cabeza" }]);
    expect(apariencia({ base: "oso", estado: "clean", skin: "alcalde", nivel: 1 }).accesorios).toEqual([{ slug: "medalla", punto: "pecho" }]);
    expect(apariencia({ base: "oso", estado: "clean", skin: "explorador", nivel: 1 }).accesorios).toEqual([{ slug: "brujula", punto: "mano" }]);
  });

  it(`desde el nivel ${NIVEL_AURA} suma aura sin quitar el efecto del estado`, () => {
    expect(apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel: NIVEL_AURA - 1 }).efectos).toEqual(["brillos"]);
    expect(apariencia({ base: "oso", estado: "rekt", skin: "clasico", nivel: NIVEL_AURA }).efectos).toEqual(["nube", "aura"]);
  });

  it("movimiento reducido deja el ritmo en 0", () => {
    expect(apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel: 1, movimientoReducido: true }).ritmo).toBe(0);
  });

  it("no comparte arreglos entre llamadas (el render puede mutar su copia sin afectar a otros)", () => {
    const a = apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel: 1 });
    a.efectos.push("aura");
    expect(apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel: 1 }).efectos).toEqual(["brillos"]);
  });

  it("valida nivel y skin", () => {
    for (const nivel of [0, -1, 1.5, Number.NaN]) expect(() => apariencia({ base: "oso", estado: "clean", skin: "clasico", nivel })).toThrow(RangeError);
    expect(() => apariencia({ base: "oso", estado: "clean", skin: "pirata" as never, nivel: 1 })).toThrow(RangeError);
  });
});
