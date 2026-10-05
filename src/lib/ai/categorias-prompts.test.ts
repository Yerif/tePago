import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/lib/categorias";
import { B1, B2, B5 } from "./prompts";

// IA-07: la lista de categorías vive en lib/categorias.ts y está copiada en los prompts B1, B2 y B5.
// Si se agrega o quita una categoría, los prompts deben cambiar de versión (CLAUDE.md §7); este test lo avisa.
describe("categorías en los prompts", () => {
  for (const prompt of [B1, B2, B5]) {
    it(`${prompt.id}: menciona todas las categorías del catálogo`, () => {
      for (const categoria of CATEGORIAS) expect(prompt.system, `${prompt.id} no menciona "${categoria}"`).toContain(categoria);
    });
  }

  it("B1 y B2 listan las categorías en una sola línea, en el orden del catálogo", () => {
    const lista = CATEGORIAS.slice(0, -1).join(", ") + " u " + CATEGORIAS[CATEGORIAS.length - 1];
    expect(B1.system).toContain(lista);
    expect(B2.system).toContain(lista);
  });

  it("B5 define cada categoría como una línea '- categoria:'", () => {
    for (const categoria of CATEGORIAS) expect(B5.system).toContain(`- ${categoria}:`);
  });
});
