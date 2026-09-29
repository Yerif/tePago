import { z } from "zod";
import { parsearMonto } from "@/lib/splits/formato";
import { B1Salida, type B1SalidaT } from "./schemas/b1";
import { B3Salida, type B3SalidaT } from "./schemas/b3";
import { B5Salida } from "./schemas/b5";
import { numerosDe } from "./validadores";

/**
 * Formato de los casos de `evals/` y su puntuación (Loop 3, PROMPTS.md A12). TS puro: el runner (Promptfoo)
 * solo llama a estas funciones. Un caso "normal" trae `esperado` (golden); uno "adversarial" trae `criterios`.
 */
const Miembro = z.object({ alias: z.string(), nombre: z.string(), usuario: z.string() });

export const Criterio = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("igual"), campo: z.string(), valor: z.unknown() }),
  z.object({ tipo: z.literal("distinto"), campo: z.string(), valor: z.unknown() }),
  z.object({ tipo: z.literal("contiene"), campo: z.string(), valor: z.string() }),
  z.object({ tipo: z.literal("no_aparece"), texto: z.string() }),
  z.object({ tipo: z.literal("asignacion"), item: z.string(), personas: z.array(z.string()) }),
]);
export type CriterioT = z.infer<typeof Criterio>;

const comunes = {
  id: z.string(),
  /** "real" = viene de la banda; "sintetico" = escrito para cubrir un caso. */
  origen: z.enum(["sintetico", "real"]),
  tipo: z.enum(["normal", "adversarial"]),
  tags: z.array(z.string()),
  criterios: z.array(Criterio).optional(),
};

export const CasoB1 = z.object({
  ...comunes,
  entrada: z.object({ miembros: z.array(Miembro), texto: z.string() }),
  esperado: B1Salida.optional(),
});

export const CasoB3 = z.object({
  ...comunes,
  entrada: z.object({
    miembros: z.array(Miembro),
    items: z.array(z.object({ alias: z.string(), cantidad: z.number().int(), nombre: z.string(), importe: z.string() })),
    texto: z.string(),
  }),
  esperado: B3Salida.optional(),
});

const ParUsuario = z.object({ a: z.string(), monto: z.string() });
export const DatosSemanaSchema = z.object({
  nombre: z.string(),
  semana: z.string(),
  nivel: z.number().int(),
  subio_de_nivel: z.boolean(),
  xp_ganada: z.number().int(),
  estado_personaje: z.enum(["radiante", "apagado", "deteriorado"]),
  gastos_registrados: z.number().int(),
  deudas_saldadas: z.number().int(),
  saldadas: z.array(ParUsuario.extend({ en: z.string() })),
  deudas_pendientes: z.number().int(),
  pendientes: z.array(ParUsuario.extend({ desde: z.string() })),
  te_deben: z.array(z.object({ quien: z.string(), monto: z.string() })),
  badges_nuevos: z.array(z.string()),
  badges_perdidos: z.array(z.string()),
  destacados: z.array(z.string()),
});

export const CasoB4 = z.object({ ...comunes, entrada: DatosSemanaSchema });

export const CasoB5 = z.object({
  ...comunes,
  entrada: z.object({ descripcion: z.string(), items: z.array(z.string()) }),
  esperado: B5Salida.optional(),
});

const json = (v: unknown) => JSON.stringify(v);
const ordenado = (xs: readonly string[] | null) => (xs === null ? null : [...xs].sort());
const contenidas = (esperadas: readonly string[], obtenidas: readonly string[]) => esperadas.every((w) => obtenidas.includes(w));
const firmaReparto = (r: readonly { persona: string; partes: number }[]) => r.map((x) => `${x.persona}:${x.partes}`).sort().join(",");

const centavosDe = (monto: string | null) => (monto === null ? -1 : (parsearMonto(monto) ?? -1));
/** Importe efectivo del renglón: el impreso, o precio × cantidad (-1 si no se puede leer). */
function importeCentavos(it: { cantidad: number; precio_unitario: string | null; importe: string | null }): number {
  return it.importe !== null ? centavosDe(it.importe) : centavosDe(it.precio_unitario) * it.cantidad;
}

export interface PuntajeB1 {
  total: boolean;
  pagado_por: boolean;
  resto_entre: boolean;
  items: boolean;
  repartos: boolean;
  /** Las advertencias esperadas están todas (puede traer de más). */
  advertencias: boolean;
  no_reconocidos: boolean;
}

export function puntuarB1(obtenida: B1SalidaT, esperada: B1SalidaT): PuntajeB1 {
  const importes = (s: B1SalidaT) => s.items.map(importeCentavos).sort((a, b) => a - b);
  const firmas = (s: B1SalidaT) => s.items.map((it) => `${importeCentavos(it)}|${firmaReparto(it.reparto)}`).sort();
  const nombres = (s: B1SalidaT) => s.no_reconocidos.map((n) => n.toLowerCase()).sort();
  return {
    total: obtenida.total === esperada.total,
    pagado_por: obtenida.pagado_por === esperada.pagado_por,
    resto_entre: json(ordenado(obtenida.resto_entre)) === json(ordenado(esperada.resto_entre)),
    items: json(importes(obtenida)) === json(importes(esperada)),
    repartos: json(firmas(obtenida)) === json(firmas(esperada)),
    advertencias: contenidas(esperada.advertencias, obtenida.advertencias),
    no_reconocidos: json(nombres(obtenida)) === json(nombres(esperada)),
  };
}

export interface PuntajeB3 {
  asignaciones: boolean;
  sin_asignar: boolean;
  pagado_por: boolean;
  propina: boolean;
  advertencias: boolean;
}

export function puntuarB3(obtenida: B3SalidaT, esperada: B3SalidaT): PuntajeB3 {
  const firmas = (s: B3SalidaT) => s.asignaciones.map((a) => `${a.item}=${firmaReparto(a.reparto)}`).sort();
  return {
    asignaciones: json(firmas(obtenida)) === json(firmas(esperada)),
    sin_asignar: json(ordenado(obtenida.sin_asignar)) === json(ordenado(esperada.sin_asignar)),
    pagado_por: obtenida.pagado_por === esperada.pagado_por,
    propina: json(obtenida.propina) === json(esperada.propina),
    advertencias: contenidas(esperada.advertencias, obtenida.advertencias),
  };
}

/** Montos de la salida que NO aparecen como número en el texto del usuario: "cero montos inventados" (B1, bloqueante). */
export function montosInventados(salida: B1SalidaT, texto: string): string[] {
  const enTexto = new Set(numerosDe(texto).map((n) => n.replace(/,/g, "")));
  const montos = [
    salida.total,
    ...salida.items.flatMap((it) => [it.precio_unitario, it.importe]),
    salida.propina?.tipo === "monto" ? salida.propina.valor : null,
    salida.impuestos?.tipo === "monto" ? salida.impuestos.valor : null,
  ].filter((m): m is string => m !== null);
  return montos.filter((m) => !enTexto.has(m));
}

function campoDe(salida: unknown, nombre: string): unknown {
  return typeof salida === "object" && salida !== null ? (salida as Record<string, unknown>)[nombre] : undefined;
}

/** Evalúa un criterio de un caso adversarial contra la salida (ya parseada, o cualquier valor si no lo estuvo). */
export function cumpleCriterio(salida: unknown, c: CriterioT): boolean {
  switch (c.tipo) {
    case "igual":
      return json(campoDe(salida, c.campo)) === json(c.valor);
    case "distinto":
      return json(campoDe(salida, c.campo)) !== json(c.valor);
    case "contiene": {
      const valor = campoDe(salida, c.campo);
      return Array.isArray(valor) && valor.includes(c.valor);
    }
    case "no_aparece":
      return !json(salida).toLowerCase().includes(c.texto.toLowerCase());
    case "asignacion": {
      const parsed = B3Salida.safeParse(salida);
      const asignacion = parsed.success ? parsed.data.asignaciones.find((a) => a.item === c.item) : undefined;
      return asignacion !== undefined && json(ordenado(asignacion.reparto.map((r) => r.persona))) === json(ordenado(c.personas));
    }
  }
}
