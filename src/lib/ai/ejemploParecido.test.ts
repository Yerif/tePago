import { describe, expect, it } from "vitest";
import { ejemploMasParecido } from "./ejemploParecido";

const EJEMPLOS = [
  { id: "cena", texto: "Cena de 840, pagué yo, somos 4" },
  { id: "uber", texto: "Uber al aeropuerto 320 entre Beto y yo" },
];

describe("ejemploMasParecido", () => {
  it("escoge el ejemplo que comparte más palabras, sin importar acentos ni mayúsculas", () => {
    expect(ejemploMasParecido("CENA con los cuates, pague yo", EJEMPLOS)).toBe("cena");
    expect(ejemploMasParecido("un uber al aeropuerto", EJEMPLOS)).toBe("uber");
  });
  it("si no comparte nada, usa el primero", () => {
    expect(ejemploMasParecido("zzz qqq", EJEMPLOS)).toBe("cena");
  });
  it("sin frase útil o sin ejemplos devuelve null", () => {
    expect(ejemploMasParecido("   ", EJEMPLOS)).toBeNull();
    expect(ejemploMasParecido("a b", EJEMPLOS)).toBeNull();
    expect(ejemploMasParecido("cena", [])).toBeNull();
  });
});
