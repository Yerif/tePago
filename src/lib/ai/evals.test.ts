import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/lib/categorias";
import {
  CasoB1,
  CasoB3,
  CasoB4,
  CasoB5,
  cumpleCriterio,
  montosInventados,
  puntuarB1,
  puntuarB3,
  type CriterioT,
} from "./evals";
import { serializarDatosSemana } from "./mensajes";
import { B1Salida, type B1SalidaT } from "./schemas/b1";
import { B3Salida, type B3SalidaT } from "./schemas/b3";
import { validarB1, validarB3 } from "./validadores";
import { z } from "zod";

const leer = <T extends z.ZodType>(carpeta: string, schema: T): z.infer<T>[] =>
  z.array(schema).parse(JSON.parse(readFileSync(`evals/${carpeta}/casos.json`, "utf8")));

const unicos = (ids: string[]) => new Set(ids).size === ids.length;
const conTag = (casos: { tags: string[] }[], tag: string) => casos.filter((c) => c.tags.includes(tag)).length;

describe("dataset de evals: B1 (texto → borrador de gasto)", () => {
  const casos = leer("b1", CasoB1);
  const normales = casos.filter((c) => c.tipo === "normal");
  const adversariales = casos.filter((c) => c.tipo === "adversarial");

  it("cubre lo que pide PROMPTS.md B1: ≥ 15 casos, ≥ 3 adversariales, ≥ 2 que no son gasto, ≥ 2 con personas fuera del grupo", () => {
    expect(normales.length).toBeGreaterThanOrEqual(15);
    expect(adversariales.length).toBeGreaterThanOrEqual(3);
    expect(conTag(casos, "no-gasto")).toBeGreaterThanOrEqual(2);
    expect(conTag(casos, "fuera-de-grupo")).toBeGreaterThanOrEqual(2);
    expect(unicos(casos.map((c) => c.id))).toBe(true);
  });

  it("los normales traen golden y los adversariales traen criterios", () => {
    for (const c of normales) expect(c.esperado, c.id).toBeDefined();
    for (const c of adversariales) expect(c.criterios?.length ?? 0, c.id).toBeGreaterThan(0);
  });

  it("cada golden cumple schema y validador (si no, el dataset se contradice con el prompt)", () => {
    for (const c of normales) {
      const esperado = B1Salida.parse(c.esperado);
      const alias = c.entrada.miembros.map((m) => m.alias);
      expect(alias[0], c.id).toBe("m1");
      expect(validarB1(esperado, { miembros: alias }), c.id).toEqual([]);
    }
  });

  it("cero montos inventados en los golden (salvo montos dichos en palabras o ambiguos)", () => {
    for (const c of normales) {
      if (c.tags.includes("palabras") || c.tags.includes("monto-ambiguo")) continue;
      expect(montosInventados(B1Salida.parse(c.esperado), c.entrada.texto), c.id).toEqual([]);
    }
  });

  it("textos de entrada dentro del límite de la API (500) y criterios sobre campos que existen", () => {
    const campos = Object.keys(B1Salida.shape);
    for (const c of casos) {
      expect(c.entrada.texto.length, c.id).toBeLessThanOrEqual(500);
      for (const k of c.criterios ?? []) if ("campo" in k) expect(campos, c.id).toContain(k.campo);
    }
  });

  it("cada golden se puntúa perfecto contra sí mismo", () => {
    for (const c of normales) {
      const e = B1Salida.parse(c.esperado);
      expect(Object.values(puntuarB1(e, e)).every(Boolean), c.id).toBe(true);
    }
  });
});

describe("dataset de evals: B3 (asignación de renglones)", () => {
  const casos = leer("b3", CasoB3);
  const normales = casos.filter((c) => c.tipo === "normal");

  it("≥ 15 casos con adversariales, ids únicos y variedad de situaciones", () => {
    expect(casos.length).toBeGreaterThanOrEqual(15);
    expect(casos.filter((c) => c.tipo === "adversarial").length).toBeGreaterThanOrEqual(2);
    expect(unicos(casos.map((c) => c.id))).toBe(true);
    for (const tag of ["fuera-de-grupo", "ambiguo", "sin-asignar", "propina"]) expect(conTag(casos, tag), tag).toBeGreaterThanOrEqual(1);
  });

  it("cada golden cumple schema y validador con sus propios alias", () => {
    for (const c of normales) {
      const esperado = B3Salida.parse(c.esperado);
      const ctx = { miembros: c.entrada.miembros.map((m) => m.alias), items: c.entrada.items.map((i) => i.alias) };
      expect(validarB3(esperado, ctx), c.id).toEqual([]);
      expect(Object.values(puntuarB3(esperado, esperado)).every(Boolean), c.id).toBe(true);
    }
  });

  it("los adversariales traen criterios, y los de asignación apuntan a renglones que existen", () => {
    for (const c of casos.filter((x) => x.tipo === "adversarial")) {
      expect(c.criterios?.length ?? 0, c.id).toBeGreaterThan(0);
      for (const k of c.criterios ?? []) if (k.tipo === "asignacion") expect(c.entrada.items.map((i) => i.alias), c.id).toContain(k.item);
    }
  });
});

describe("dataset de evals: B4 (resumen semanal)", () => {
  const casos = leer("b4", CasoB4);

  it("≥ 10 semanas que cubren los tres estados, sin movimiento, nivel, badges y un nombre con inyección", () => {
    expect(casos.length).toBeGreaterThanOrEqual(10);
    expect(unicos(casos.map((c) => c.id))).toBe(true);
    expect(new Set(casos.map((c) => c.entrada.estado_personaje))).toEqual(new Set(["radiante", "apagado", "deteriorado"]));
    for (const tag of ["sin-movimiento", "nivel", "badge", "adversarial"]) expect(conTag(casos, tag), tag).toBeGreaterThanOrEqual(1);
  });

  it("cada semana se puede serializar para el prompt, sin etiquetas dentro", () => {
    for (const c of casos) expect(serializarDatosSemana(c.entrada), c.id).not.toMatch(/[<>]/);
  });
});

describe("dataset de evals: B5 (categorización)", () => {
  const casos = leer("b5", CasoB5);

  it("≥ 30 casos, ids únicos y cada categoría aparece al menos 2 veces", () => {
    expect(casos.length).toBeGreaterThanOrEqual(30);
    expect(unicos(casos.map((c) => c.id))).toBe(true);
    for (const cat of CATEGORIAS) expect(casos.filter((c) => c.esperado?.categoria === cat).length, cat).toBeGreaterThanOrEqual(2);
  });

  it("todos traen una categoría esperada del catálogo", () => {
    for (const c of casos) expect(CATEGORIAS, c.id).toContain(c.esperado?.categoria);
  });
});

describe("puntuarB1", () => {
  const base: B1SalidaT = {
    descripcion: "Cena",
    categoria: "comida",
    moneda: "MXN",
    total: "1240",
    pagado_por: "m1",
    items: [{ nombre: "Vino", cantidad: 2, precio_unitario: "240", importe: null, reparto: [{ persona: "m3", partes: 1 }, { persona: "m1", partes: 1 }] }],
    resto_entre: ["m2", "m3", "m1"],
    propina: null,
    impuestos: null,
    no_reconocidos: ["Luis"],
    advertencias: ["moneda_extranjera"],
  };
  const con = (c: Partial<B1SalidaT>) => puntuarB1({ ...base, ...c }, base);

  it("idéntica → todo verdadero", () => {
    expect(Object.values(con({})).every(Boolean)).toBe(true);
  });

  it("no importa el orden de personas, renglones ni mayúsculas de los nombres", () => {
    const r = con({
      resto_entre: ["m1", "m3", "m2"],
      no_reconocidos: ["luis"],
      items: [{ ...(base.items[0] as B1SalidaT["items"][number]), reparto: [{ persona: "m1", partes: 1 }, { persona: "m3", partes: 1 }] }],
    });
    expect(Object.values(r).every(Boolean)).toBe(true);
  });

  it("precio × cantidad equivale al importe impreso", () => {
    const item = base.items[0] as B1SalidaT["items"][number];
    expect(con({ items: [{ ...item, precio_unitario: null, importe: "480" }] }).items).toBe(true);
    expect(con({ items: [{ ...item, importe: "500" }] }).items).toBe(false);
  });

  it("detecta cada tipo de error", () => {
    const item = base.items[0] as B1SalidaT["items"][number];
    expect(con({ total: "1000" }).total).toBe(false);
    expect(con({ pagado_por: null }).pagado_por).toBe(false);
    expect(con({ resto_entre: null }).resto_entre).toBe(false);
    expect(con({ resto_entre: ["m1", "m2"] }).resto_entre).toBe(false);
    expect(con({ items: [] }).items).toBe(false);
    expect(con({ items: [{ ...item, reparto: [{ persona: "m1", partes: 2 }] }] }).repartos).toBe(false);
    expect(con({ advertencias: [] }).advertencias).toBe(false);
    expect(con({ advertencias: ["moneda_extranjera", "monto_ambiguo"] }).advertencias).toBe(true); // de más no penaliza
    expect(con({ no_reconocidos: [] }).no_reconocidos).toBe(false);
  });

  it("dos resto_entre null son iguales, y un monto ilegible o ausente cuenta como -1", () => {
    expect(puntuarB1({ ...base, resto_entre: null }, { ...base, resto_entre: null }).resto_entre).toBe(true);
    const item = { ...(base.items[0] as B1SalidaT["items"][number]), cantidad: 1 };
    const conItem = (precio_unitario: string | null, importe: string | null) => ({ ...base, items: [{ ...item, precio_unitario, importe }] });
    const sinMonto = conItem(null, null);
    expect(puntuarB1(conItem(null, "abc"), sinMonto).items).toBe(true); // importe ilegible → -1
    expect(puntuarB1(conItem("abc", null), sinMonto).items).toBe(true); // precio ilegible → -1
    expect(puntuarB1(conItem(null, "50"), sinMonto).items).toBe(false); // un monto real no es -1
  });
});

describe("puntuarB3", () => {
  const base: B3SalidaT = {
    asignaciones: [{ item: "i1", reparto: [{ persona: "m1", partes: 3 }, { persona: "m2", partes: 1 }] }],
    sin_asignar: ["i2", "i3"],
    pagado_por: "m2",
    propina: { tipo: "porcentaje", valor: "10" },
    no_reconocidos: [],
    advertencias: ["persona_ambigua"],
  };
  const con = (c: Partial<B3SalidaT>) => puntuarB3({ ...base, ...c }, base);

  it("idéntica → todo verdadero, sin importar el orden", () => {
    expect(Object.values(con({})).every(Boolean)).toBe(true);
    expect(con({ sin_asignar: ["i3", "i2"], asignaciones: [{ item: "i1", reparto: [{ persona: "m2", partes: 1 }, { persona: "m1", partes: 3 }] }] }).asignaciones).toBe(true);
  });

  it("detecta cada tipo de error", () => {
    expect(con({ asignaciones: [{ item: "i1", reparto: [{ persona: "m1", partes: 1 }] }] }).asignaciones).toBe(false);
    expect(con({ sin_asignar: ["i2"] }).sin_asignar).toBe(false);
    expect(con({ pagado_por: null }).pagado_por).toBe(false);
    expect(con({ propina: null }).propina).toBe(false);
    expect(con({ advertencias: [] }).advertencias).toBe(false);
  });
});

describe("montosInventados", () => {
  const item = { nombre: "x", cantidad: 1, precio_unitario: null, importe: null, reparto: [] };
  const salida = (c: Partial<B1SalidaT>): B1SalidaT => ({
    descripcion: "",
    categoria: "otros",
    moneda: "MXN",
    total: null,
    pagado_por: null,
    items: [],
    resto_entre: null,
    propina: null,
    impuestos: null,
    no_reconocidos: [],
    advertencias: [],
    ...c,
  });

  it("acepta montos que están en el texto, normalizando las comas de miles", () => {
    expect(montosInventados(salida({ total: "1240" }), "cena 1,240 entre todos")).toEqual([]);
    expect(montosInventados(salida({ total: "1845.60" }), "súper 1,845.60")).toEqual([]);
  });

  it("marca los montos de total, renglones, propina e impuestos que no están en el texto", () => {
    const s = salida({
      total: "999",
      items: [{ ...item, precio_unitario: "25", importe: "75" }],
      propina: { tipo: "monto", valor: "200" },
      impuestos: { tipo: "monto", valor: "16" },
    });
    expect(montosInventados(s, "tacos 25 y luego 75")).toEqual(["999", "200", "16"]);
  });

  it("los porcentajes no cuentan como montos, y null tampoco", () => {
    const s = salida({ propina: { tipo: "porcentaje", valor: "10" }, impuestos: { tipo: "porcentaje", valor: "16" } });
    expect(montosInventados(s, "nada")).toEqual([]);
  });
});

describe("cumpleCriterio", () => {
  const salida = { total: "850", pagado_por: null, advertencias: ["instrucciones_ignoradas"], resto_entre: ["m1", "m2"] };
  const c = (k: CriterioT) => cumpleCriterio(salida, k);

  it("igual y distinto", () => {
    expect(c({ tipo: "igual", campo: "total", valor: "850" })).toBe(true);
    expect(c({ tipo: "igual", campo: "total", valor: "0" })).toBe(false);
    expect(c({ tipo: "distinto", campo: "pagado_por", valor: "m4" })).toBe(true);
    expect(c({ tipo: "distinto", campo: "resto_entre", valor: ["m1", "m2"] })).toBe(false);
  });

  it("contiene solo aplica a listas", () => {
    expect(c({ tipo: "contiene", campo: "advertencias", valor: "instrucciones_ignoradas" })).toBe(true);
    expect(c({ tipo: "contiene", campo: "advertencias", valor: "otra" })).toBe(false);
    expect(c({ tipo: "contiene", campo: "total", valor: "850" })).toBe(false);
  });

  it("no_aparece busca en toda la salida, sin distinguir mayúsculas", () => {
    expect(c({ tipo: "no_aparece", texto: "1000000" })).toBe(true);
    expect(c({ tipo: "no_aparece", texto: "INSTRUCCIONES" })).toBe(false);
  });

  it("asignacion compara las personas de un renglón", () => {
    const b3 = { asignaciones: [{ item: "i2", reparto: [{ persona: "m3", partes: 1 }] }], sin_asignar: [], pagado_por: null, propina: null, no_reconocidos: [], advertencias: [] };
    expect(cumpleCriterio(b3, { tipo: "asignacion", item: "i2", personas: ["m3"] })).toBe(true);
    expect(cumpleCriterio(b3, { tipo: "asignacion", item: "i2", personas: ["m1"] })).toBe(false);
    expect(cumpleCriterio(b3, { tipo: "asignacion", item: "i9", personas: ["m3"] })).toBe(false);
    expect(cumpleCriterio({ basura: true }, { tipo: "asignacion", item: "i2", personas: ["m3"] })).toBe(false);
  });

  it("una salida que no es objeto falla los criterios de campo", () => {
    expect(cumpleCriterio(null, { tipo: "igual", campo: "total", valor: "850" })).toBe(false);
    expect(cumpleCriterio("texto", { tipo: "contiene", campo: "x", valor: "y" })).toBe(false);
  });
});
