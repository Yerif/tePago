import { describe, expect, it } from "vitest";
import type { Prompt } from "./prompts/tipos";
import { renderUsuario } from "./prompts/render";

const prompt = (userTemplate: string): Prompt<"a" | "b"> => ({
  id: "T",
  version: 1,
  maxTokens: 10,
  temperature: 0,
  variables: ["a", "b"],
  system: "s",
  userTemplate,
});

describe("renderUsuario", () => {
  it("rellena las variables", () => {
    expect(renderUsuario(prompt("<x>{{a}}</x><y>{{b}}</y>"), { a: "1", b: "2" })).toBe("<x>1</x><y>2</y>");
  });

  it("una sola pasada: un valor con {{b}} no se vuelve a interpretar", () => {
    expect(renderUsuario(prompt("{{a}}|{{b}}"), { a: "{{b}}", b: "ok" })).toBe("{{b}}|ok");
  });

  it("falla si la plantilla usa una variable no declarada", () => {
    expect(() => renderUsuario(prompt("{{c}}"), { a: "1", b: "2" })).toThrow(/no es una variable declarada/);
  });
});
