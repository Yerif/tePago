import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import { B1Salida } from "./schemas/b1";
import { B2Salida } from "./schemas/b2";
import { B3Salida } from "./schemas/b3";
import { B4Salida } from "./schemas/b4";
import { B5Salida } from "./schemas/b5";

// IA-04: el helper del SDK debe aceptar los schemas con la versión de Zod del proyecto (Zod 4).
// Sin llamadas a la API: solo la conversión a JSON Schema y el parseo de una respuesta de ejemplo.
const SCHEMAS = { B1: B1Salida, B2: B2Salida, B3: B3Salida, B4: B4Salida, B5: B5Salida } as const;

describe("zodOutputFormat con Zod 4", () => {
  for (const [id, schema] of Object.entries(SCHEMAS)) {
    it(`${id}: se convierte a un JSON Schema cerrado`, () => {
      const formato = zodOutputFormat(schema);
      expect(formato.type).toBe("json_schema");
      const js = formato.schema as { type: string; additionalProperties?: boolean; properties: Record<string, unknown>; required?: string[] };
      expect(js.type).toBe("object");
      expect(js.additionalProperties).toBe(false);
      // Todos los campos van siempre presentes (con null en lugar de omitir), como pide PROMPTS.md B0.
      expect(js.required?.sort()).toEqual(Object.keys(js.properties).sort());
    });
  }

  it("parsea una respuesta válida y rechaza una con la forma rota", () => {
    const formato = zodOutputFormat(B5Salida);
    expect(formato.parse('{"categoria":"comida"}')).toEqual({ categoria: "comida" });
    expect(() => formato.parse('{"categoria":"nada"}')).toThrow();
  });
});
