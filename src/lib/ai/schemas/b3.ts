import { z } from "zod";
import { Ajuste, Reparto } from "./comun";

export const ADVERTENCIAS_B3 = ["persona_ambigua", "item_ambiguo", "instrucciones_ignoradas"] as const;

export const B3Salida = z.object({
  asignaciones: z.array(z.object({ item: z.string(), reparto: Reparto })),
  sin_asignar: z.array(z.string()),
  pagado_por: z.string().nullable(),
  propina: Ajuste.nullable(),
  no_reconocidos: z.array(z.string()),
  advertencias: z.array(z.enum(ADVERTENCIAS_B3)),
});
export type B3SalidaT = z.infer<typeof B3Salida>;
