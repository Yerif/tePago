import { z } from "zod";
import { CATEGORIAS } from "@/lib/categorias";
import { Ajuste, Reparto } from "./comun";

export const ADVERTENCIAS_B1 = [
  "participantes_ambiguos",
  "persona_ambigua",
  "monto_ambiguo",
  "no_es_gasto",
  "instrucciones_ignoradas",
  "moneda_extranjera",
] as const;

export const B1Salida = z.object({
  descripcion: z.string(),
  categoria: z.enum(CATEGORIAS),
  moneda: z.string(),
  total: z.string().nullable(),
  pagado_por: z.string().nullable(),
  items: z.array(
    z.object({
      nombre: z.string(),
      cantidad: z.number().int(),
      precio_unitario: z.string().nullable(),
      importe: z.string().nullable(),
      reparto: Reparto,
    }),
  ),
  resto_entre: z.array(z.string()).nullable(),
  propina: Ajuste.nullable(),
  impuestos: Ajuste.nullable(),
  no_reconocidos: z.array(z.string()),
  advertencias: z.array(z.enum(ADVERTENCIAS_B1)),
});
export type B1SalidaT = z.infer<typeof B1Salida>;
