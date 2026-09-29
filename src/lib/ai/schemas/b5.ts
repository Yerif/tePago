import { z } from "zod";
import { CATEGORIAS } from "@/lib/categorias";

export const B5Salida = z.object({ categoria: z.enum(CATEGORIAS) });
export type B5SalidaT = z.infer<typeof B5Salida>;
