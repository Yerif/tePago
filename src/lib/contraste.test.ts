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

  it("campos: borde ≥ 3:1 contra card, fondo y superficie suave; placeholder AA (UX2-17)", () => {
    for (const fondo of ["card", "background", "muted"]) expect(c("input-border", fondo), `borde vs ${fondo}`).toBeGreaterThanOrEqual(3);
    for (const fondo of ["card", "background"]) expect(c("placeholder", fondo), `placeholder vs ${fondo}`).toBeGreaterThanOrEqual(AA);
  });

  it("barra de XP: relleno (grass-text) ≥ 3:1 contra su pista; botón deshabilitado legible (AA)", () => {
    expect(c("grass-text", "muted")).toBeGreaterThanOrEqual(3);
    expect(c("muted-foreground", "muted")).toBeGreaterThanOrEqual(AA);
  });

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

describe("rose-text y grass-text distinguibles en light (debes / te deben)", () => {
  it("son colores propios, no el texto normal, y cumplen AA sobre card, fondo y su fondo suave", () => {
    expect(light["rose-text"]).not.toBe(light.foreground);
    expect(light["grass-text"]).not.toBe(light.foreground);
    expect(light["rose-text"]).not.toBe(light["grass-text"]);
    for (const color of ["rose-text", "grass-text"]) {
      for (const fondo of ["card", "background", "muted"]) expect(contraste(light[color] as string, light[fondo] as string), `${color}/${fondo}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe("subtle (solo decorativo)", () => {
  it("documenta que no alcanza AA: no debe usarse para texto", () => {
    expect(contraste(light.subtle as string, light.background as string)).toBeLessThan(AA);
    expect(contraste(dark.subtle as string, dark.background as string)).toBeLessThan(AA);
  });
});
