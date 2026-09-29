import { z } from "zod";

export const B4Salida = z.object({ titulo: z.string(), cuerpo: z.string(), emoji: z.string() });
export type B4SalidaT = z.infer<typeof B4Salida>;
