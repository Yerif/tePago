import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROMPTS } from "./index";
import { PLANTILLA_RETRY } from "./retry";

// docs/PROMPTS.md es la fuente de verdad (CLAUDE.md §8): estos archivos son copias literales.
const doc = readFileSync("docs/PROMPTS.md", "utf8");
const bloques = new Map([...doc.matchAll(/```text (\S+)\n([\s\S]*?)\n```/g)].map((m) => [m[1], m[2]]));

describe("sincronía entre docs/PROMPTS.md y src/lib/ai/prompts", () => {
  it.each(PROMPTS.map((p) => [p.id, p] as const))("%s: system y user idénticos al documento", (_id, p) => {
    expect(bloques.get(`${p.id}/system@v${p.version}`)).toBe(p.system);
    expect(bloques.get(`${p.id}/user@v${p.version}`)).toBe(p.userTemplate);
  });

  it("la plantilla de retry es idéntica", () => {
    expect(bloques.get("comun/retry@v1")).toBe(PLANTILLA_RETRY);
  });

  it("cada variable declarada aparece en la plantilla y viceversa", () => {
    for (const p of PROMPTS) {
      const usadas = new Set([...p.userTemplate.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
      expect([...usadas].sort()).toEqual([...p.variables].sort());
    }
  });

  it("el system prompt es fijo: no interpola nada", () => {
    for (const p of PROMPTS) expect(p.system).not.toMatch(/\{\{|\$\{/);
  });

  it("los max_tokens y la temperatura respetan CLAUDE.md §8 y PROMPTS.md B0", () => {
    const por = Object.fromEntries(PROMPTS.map((p) => [p.id, p]));
    expect(por.B1?.maxTokens).toBe(1024);
    expect(por.B2?.maxTokens).toBe(1024);
    expect(por.B3?.maxTokens).toBe(1024);
    expect(por.B4?.maxTokens).toBe(300);
    expect(por.B5?.maxTokens).toBe(50);
    for (const id of ["B1", "B2", "B3", "B5"]) expect(por[id]?.temperature).toBe(0);
    expect(por.B4?.temperature).toBeUndefined();
  });
});
