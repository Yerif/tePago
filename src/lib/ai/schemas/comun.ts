import { z } from "zod";

/** Solo la FORMA: structured outputs garantiza tipos y enums; las reglas se validan en código (validadores.ts). */
export const Reparto = z.array(z.object({ persona: z.string(), partes: z.number().int() }));
export const Ajuste = z.object({ tipo: z.enum(["porcentaje", "monto"]), valor: z.string() });
export type RepartoT = z.infer<typeof Reparto>;
export type AjusteT = z.infer<typeof Ajuste>;
