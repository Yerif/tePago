import { z } from "zod";
import { CATEGORIAS } from "@/lib/categorias";

export const ADVERTENCIAS_B2 = [
  "renglones_ilegibles",
  "ilegible",
  "no_es_ticket",
  "descuento_detectado",
  "instrucciones_ignoradas",
  "moneda_extranjera",
  "varios_tickets",
] as const;

export const B2Salida = z.object({
  descripcion: z.string(),
  categoria: z.enum(CATEGORIAS),
  moneda: z.string(),
  items: z.array(
    z.object({
      nombre: z.string(),
      cantidad: z.number().int(),
      precio_unitario: z.string().nullable(),
      importe: z.string(),
    }),
  ),
  subtotal_impreso: z.string().nullable(),
  impuestos_impresos: z.array(z.string()),
  propina_cobrada: z.string().nullable(),
  total_impreso: z.string().nullable(),
  advertencias: z.array(z.enum(ADVERTENCIAS_B2)),
});
export type B2SalidaT = z.infer<typeof B2Salida>;
