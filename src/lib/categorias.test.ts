import { describe, expect, it } from "vitest";
import { CATEGORIAS, EMOJI_CATEGORIA } from "./categorias";

describe("categorías", () => {
  it("son las 9 aprobadas y cada una tiene emoji", () => {
    expect(CATEGORIAS).toHaveLength(9);
    for (const c of CATEGORIAS) expect(EMOJI_CATEGORIA[c].length).toBeGreaterThan(0);
  });
});
