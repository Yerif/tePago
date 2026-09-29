import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contraste, leerTokens } from "./contraste";

const css = readFileSync("src/app/globals.css", "utf8");
const bloque = (selector: RegExp) => css.match(selector)?.[1] ?? "";
const light = leerTokens(bloque(/:root\s*\{([\s\S]*?)\n\}/));
const dark = leerTokens(bloque(/\n\.dark\s*\{([\s\S]*?)\n\}/), light);

const ACENTOS = ["grass", "peach", "rose", "lemon", "mint", "lavender", "water"] as const;
const AA = 4.5;

describe("contraste", () => {
  it("negro sobre blanco es 21", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});

describe.each([
  ["light", light],
  ["dark", dark],
])("tokens %s: contraste AA (CLAUDE.md §13.7)", (_nombre, t) => {
  const c = (a: string, b: string) => contraste(t[a] as string, t[b] as string);

  it("carga todos los tokens que se usan", () => {
    for (const k of ["background", "foreground", "card", "muted-foreground", "on-accent"]) expect(t[k]).toMatch(/^#/);
    for (const a of ACENTOS) for (const k of [a, `${a}-soft`, `${a}-text`]) expect(t[k], k).toMatch(/^#/);
  });

  it("texto principal y secundario sobre fondo y card", () => {
    expect(c("foreground", "background")).toBeGreaterThanOrEqual(AA);
    expect(c("foreground", "card")).toBeGreaterThanOrEqual(AA);
    expect(c("muted-foreground", "background")).toBeGreaterThanOrEqual(AA);
    expect(c("muted-foreground", "card")).toBeGreaterThanOrEqual(AA);
    expect(c("muted-foreground", "muted")).toBeGreaterThanOrEqual(AA);
  });

  it.each(ACENTOS)("texto sobre el relleno de %s (botones)", (a) => {
    expect(c("on-accent", a)).toBeGreaterThanOrEqual(AA);
  });

  it.each(ACENTOS)("texto de %s sobre su fondo suave (pills)", (a) => {
    expect(c(`${a}-text`, `${a}-soft`)).toBeGreaterThanOrEqual(AA);
  });
});

describe("subtle (solo decorativo)", () => {
  it("documenta que no alcanza AA: no debe usarse para texto", () => {
    expect(contraste(light.subtle as string, light.background as string)).toBeLessThan(AA);
    expect(contraste(dark.subtle as string, dark.background as string)).toBeLessThan(AA);
  });
});
