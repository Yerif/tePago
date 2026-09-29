import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { B1 } from "./prompts/b1";
import { B3 } from "./prompts/b3";
import { B1Salida, type B1SalidaT } from "./schemas/b1";
import { B2Salida, type B2SalidaT } from "./schemas/b2";
import { B3Salida, type B3SalidaT } from "./schemas/b3";
import { B4Salida, type B4SalidaT } from "./schemas/b4";
import { B5Salida } from "./schemas/b5";
import { numerosDe, textoLibreSeguro, validarB1, validarB2, validarB3, validarB4 } from "./validadores";

const miembros = ["m1", "m2", "m3", "m4"];
const rutas = (p: { ruta: string }[]) => p.map((x) => x.ruta);

describe("los ejemplos de los propios prompts pasan schema y validador", () => {
  const ejemplos = (texto: string) => [...texto.matchAll(/<salida>(.*?)<\/salida>/g)].map((m) => JSON.parse(m[1] as string));

  it.each(ejemplos(B1.system).map((e, i) => [i + 1, e] as const))("B1 ejemplo %i", (_i, ejemplo) => {
    const salida = B1Salida.parse(ejemplo);
    expect(validarB1(salida, { miembros })).toEqual([]);
  });

  it("B3 ejemplo", () => {
    const [ejemplo] = ejemplos(B3.system);
    const salida = B3Salida.parse(ejemplo);
    expect(validarB3(salida, { miembros: ["m1", "m2", "m3"], items: ["i1", "i2", "i3", "i4"] })).toEqual([]);
  });

  it("los ejemplos existen (el test no pasa en vacío)", () => {
    expect(ejemplos(B1.system)).toHaveLength(2);
    expect(ejemplos(B3.system)).toHaveLength(1);
  });

  it("el archivo del documento sigue trayendo esos ejemplos", () => {
    expect(readFileSync("docs/PROMPTS.md", "utf8")).toContain("<salida>");
  });
});

describe("validarB1", () => {
  const ok: B1SalidaT = {
    descripcion: "Cena",
    categoria: "comida",
    moneda: "MXN",
    total: "1240",
    pagado_por: "m1",
    items: [
      { nombre: "Vino", cantidad: 2, precio_unitario: "240", importe: "480", reparto: [{ persona: "m3", partes: 1 }, { persona: "m1", partes: 1 }] },
    ],
    resto_entre: ["m2", "m3", "m1"],
    propina: { tipo: "porcentaje", valor: "10" },
    impuestos: { tipo: "monto", valor: "198.40" },
    no_reconocidos: ["Luis"],
    advertencias: [],
  };
  const con = (cambios: Partial<B1SalidaT>) => validarB1({ ...ok, ...cambios }, { miembros });

  it("una salida correcta no tiene problemas", () => {
    expect(validarB1(ok, { miembros })).toEqual([]);
  });

  it("montos con formato inválido", () => {
    expect(rutas(con({ total: "1,240" }))).toEqual(["total"]);
    expect(rutas(con({ total: "12.345" }))).toEqual(["total"]);
    expect(rutas(con({ impuestos: { tipo: "monto", valor: "abc" } }))).toEqual(["impuestos.valor"]);
  });

  it("textos libres: longitud, enlaces, etiquetas y control", () => {
    expect(rutas(con({ descripcion: "x".repeat(61) }))).toEqual(["descripcion"]);
    expect(rutas(con({ descripcion: "ver https://malo.mx" }))).toEqual(["descripcion"]);
    expect(rutas(con({ descripcion: "hola <b>" }))).toEqual(["descripcion"]);
    expect(rutas(con({ descripcion: "a\u0000b" }))).toEqual(["descripcion"]);
    expect(rutas(con({ no_reconocidos: ["www.malo.mx"] }))).toEqual(["no_reconocidos[0]"]);
    expect(rutas(con({ no_reconocidos: Array.from({ length: 11 }, () => "Luis") }))).toEqual(["no_reconocidos"]);
  });

  it("moneda, alias y repeticiones", () => {
    expect(rutas(con({ moneda: "mxn" }))).toEqual(["moneda"]);
    expect(rutas(con({ pagado_por: "m9" }))).toEqual(["pagado_por"]);
    expect(rutas(con({ resto_entre: ["m1", "m1", "m9"] }))).toEqual(["resto_entre[1]", "resto_entre[2]"]);
    expect(con({ pagado_por: null, resto_entre: null, propina: null, impuestos: null })).toEqual([]);
  });

  it("items: cantidad, reparto, precio × cantidad y faltantes", () => {
    const item = ok.items[0] as B1SalidaT["items"][number];
    expect(rutas(con({ items: [{ ...item, cantidad: 0 }] }))).toContain("items[0].cantidad");
    expect(rutas(con({ items: [{ ...item, reparto: [] }] }))).toEqual(["items[0].reparto"]);
    expect(rutas(con({ items: [{ ...item, reparto: [{ persona: "m1", partes: 100 }] }] }))).toEqual(["items[0].reparto[0].partes"]);
    expect(rutas(con({ items: [{ ...item, reparto: [{ persona: "m1", partes: 1 }, { persona: "m1", partes: 1 }] }] }))).toEqual(["items[0].reparto[1].persona"]);
    expect(rutas(con({ items: [{ ...item, reparto: [{ persona: "m8", partes: 1 }] }] }))).toEqual(["items[0].reparto[0].persona"]);
    expect(rutas(con({ items: [{ ...item, importe: "500" }] }))).toEqual(["items[0]"]); // 2 × 240 ≠ 500
    expect(rutas(con({ items: [{ ...item, precio_unitario: null, importe: null }] }))).toEqual(["items[0]"]);
    expect(con({ items: [{ ...item, precio_unitario: null }] })).toEqual([]);
    expect(rutas(con({ items: [{ ...item, precio_unitario: "x", importe: "480" }] }))).toEqual(["items[0].precio_unitario"]);
    expect(rutas(con({ items: Array.from({ length: 31 }, () => ({ ...item, importe: "480" })) }))).toEqual(["items"]);
  });

  it("ajustes: porcentaje entre 0 (exclusivo) y 100", () => {
    expect(rutas(con({ propina: { tipo: "porcentaje", valor: "0" } }))).toEqual(["propina.valor"]);
    expect(rutas(con({ propina: { tipo: "porcentaje", valor: "101" } }))).toEqual(["propina.valor"]);
    expect(rutas(con({ propina: { tipo: "porcentaje", valor: "diez" } }))).toEqual(["propina.valor"]);
    expect(con({ propina: { tipo: "porcentaje", valor: "10.5" } })).toEqual([]);
  });

  it("no_es_gasto exige items vacíos y total null", () => {
    expect(rutas(con({ advertencias: ["no_es_gasto"] }))).toEqual(["advertencias"]);
    expect(con({ advertencias: ["no_es_gasto"], items: [], total: null })).toEqual([]);
  });

  it("los problemas nombran campo y regla, nunca el valor ofensivo", () => {
    const problemas = con({ descripcion: "https://secreto.example/abc", total: "MONTO-SECRETO" });
    expect(JSON.stringify(problemas)).not.toMatch(/secreto|SECRETO|example/);
  });
});

describe("validarB2", () => {
  const ok: B2SalidaT = {
    descripcion: "La Casa de Toño",
    categoria: "comida",
    moneda: "MXN",
    items: [{ nombre: "POZOLE GDE", cantidad: 1, precio_unitario: null, importe: "165.00" }],
    subtotal_impreso: "165.00",
    impuestos_impresos: ["26.40"],
    propina_cobrada: null,
    total_impreso: "191.40",
    advertencias: [],
  };
  const con = (c: Partial<B2SalidaT>) => validarB2({ ...ok, ...c });

  it("una salida correcta no tiene problemas", () => {
    expect(validarB2(ok)).toEqual([]);
    expect(() => B2Salida.parse(ok)).not.toThrow();
  });

  it("montos, textos, cantidades y límites", () => {
    const item = ok.items[0] as B2SalidaT["items"][number];
    expect(rutas(con({ total_impreso: "191,40" }))).toEqual(["total_impreso"]);
    expect(rutas(con({ subtotal_impreso: "x" }))).toEqual(["subtotal_impreso"]);
    expect(rutas(con({ propina_cobrada: "x" }))).toEqual(["propina_cobrada"]);
    expect(rutas(con({ impuestos_impresos: ["x"] }))).toEqual(["impuestos_impresos[0]"]);
    expect(rutas(con({ impuestos_impresos: ["1", "1", "1", "1", "1", "1"] }))).toEqual(["impuestos_impresos"]);
    expect(rutas(con({ descripcion: "https://x.mx" }))).toEqual(["descripcion"]);
    expect(rutas(con({ moneda: "peso" }))).toEqual(["moneda"]);
    expect(rutas(con({ items: [{ ...item, cantidad: 100 }] }))).toEqual(["items[0].cantidad"]);
    expect(rutas(con({ items: [{ ...item, nombre: "<script>" }] }))).toEqual(["items[0].nombre"]);
    expect(rutas(con({ items: [{ ...item, importe: "1.234" }] }))).toEqual(["items[0].importe"]);
    expect(rutas(con({ items: [{ ...item, precio_unitario: "abc" }] }))).toEqual(["items[0].precio_unitario"]);
    expect(rutas(con({ items: Array.from({ length: 41 }, () => item) }))).toEqual(["items"]);
  });

  it("no_es_ticket e ilegible exigen items vacíos", () => {
    expect(rutas(con({ advertencias: ["no_es_ticket"] }))).toEqual(["advertencias"]);
    expect(rutas(con({ advertencias: ["ilegible"] }))).toEqual(["advertencias"]);
    expect(con({ advertencias: ["ilegible"], items: [], total_impreso: null })).toEqual([]);
    expect(con({ advertencias: ["descuento_detectado"] })).toEqual([]);
  });
});

describe("validarB3", () => {
  const ctx = { miembros: ["m1", "m2", "m3"], items: ["i1", "i2", "i3"] };
  const ok: B3SalidaT = {
    asignaciones: [
      { item: "i1", reparto: [{ persona: "m1", partes: 3 }, { persona: "m2", partes: 1 }] },
      { item: "i2", reparto: [{ persona: "m3", partes: 1 }] },
    ],
    sin_asignar: ["i3"],
    pagado_por: "m2",
    propina: { tipo: "porcentaje", valor: "10" },
    no_reconocidos: [],
    advertencias: [],
  };
  const con = (c: Partial<B3SalidaT>) => validarB3({ ...ok, ...c }, ctx);

  it("una salida correcta no tiene problemas", () => {
    expect(validarB3(ok, ctx)).toEqual([]);
    expect(() => B3Salida.parse(ok)).not.toThrow();
  });

  it("cada renglón aparece exactamente una vez", () => {
    expect(rutas(con({ sin_asignar: [] }))).toEqual(["asignaciones"]); // i3 sin cubrir
    expect(rutas(con({ sin_asignar: ["i3", "i1"] }))).toEqual(["asignaciones"]); // i1 dos veces
    expect(rutas(con({ sin_asignar: ["i3", "i9"] }))).toEqual(["sin_asignar[1]"]); // alias inexistente
    expect(rutas(con({ asignaciones: [{ item: "i7", reparto: [{ persona: "m1", partes: 1 }] }, ...ok.asignaciones] }))).toEqual(["asignaciones[0].item"]);
  });

  it("repartos, pagador, propina y nombres", () => {
    expect(rutas(con({ asignaciones: [{ item: "i1", reparto: [] }, ok.asignaciones[1] as B3SalidaT["asignaciones"][number]] }))).toEqual(["asignaciones[0].reparto"]);
    expect(rutas(con({ pagado_por: "m9" }))).toEqual(["pagado_por"]);
    expect(rutas(con({ propina: { tipo: "monto", valor: "diez" } }))).toEqual(["propina.valor"]);
    expect(rutas(con({ no_reconocidos: ["a<b"] }))).toEqual(["no_reconocidos[0]"]);
    expect(con({ pagado_por: null, propina: null })).toEqual([]);
  });
});

describe("validarB4", () => {
  const datos = JSON.stringify({
    nombre: "Ana",
    semana: "22 al 28 de septiembre",
    nivel: 3,
    xp_ganada: 120,
    saldadas: [{ a: "Caro", monto: "$1,240.50", en: "menos de 24 h" }],
    pendientes: [{ a: "Ferni", monto: "$150.00", desde: "hace 3 días" }],
  });
  const ok: B4SalidaT = {
    titulo: "¡Semana redonda! 🌻",
    cuerpo: "Saldaste $1,240.50 a Caro en menos de 24 h y llegaste al nivel 3. Le debes $150.00 a Ferni desde hace 3 días.",
    emoji: "🌻",
  };
  const con = (c: Partial<B4SalidaT>) => validarB4({ ...ok, ...c }, datos);

  it("una salida correcta no tiene problemas", () => {
    expect(validarB4(ok, datos)).toEqual([]);
    expect(() => B4Salida.parse(ok)).not.toThrow();
  });

  it("longitudes, enlaces, etiquetas, markdown y hashtags", () => {
    expect(rutas(con({ titulo: "t".repeat(61) }))).toEqual(["titulo"]);
    expect(rutas(con({ cuerpo: "c".repeat(501) }))).toEqual(["cuerpo"]);
    expect(rutas(con({ cuerpo: "mira https://x.mx" }))).toEqual(["cuerpo"]);
    expect(rutas(con({ cuerpo: "**hola**" }))).toEqual(["cuerpo"]);
    expect(rutas(con({ titulo: "Semana #genial" }))).toEqual(["titulo"]);
    expect(rutas(con({ cuerpo: "[enlace](x)" }))).toEqual(["cuerpo"]);
  });

  it("emoji: uno solo", () => {
    expect(validarB4({ ...ok, emoji: "❤️" }, datos)).toEqual([]);
    expect(validarB4({ ...ok, emoji: "👨‍👩‍👧" }, datos)).toEqual([]);
    for (const emoji of ["", "ab", "🌻🌻", "7"]) expect(rutas(validarB4({ ...ok, emoji }, datos)), emoji).toEqual(["emoji"]);
  });

  it("cifras fieles: todo número debe estar en los datos", () => {
    expect(rutas(con({ cuerpo: "Saldaste $999.00 en menos de 24 h." }))).toEqual(["cuerpo"]);
    expect(rutas(con({ titulo: "Nivel 7" }))).toEqual(["titulo"]);
    expect(con({ cuerpo: "Subiste al nivel 3, ¡sigue así!" })).toEqual([]);
  });
});

describe("numerosDe y textoLibreSeguro", () => {
  it("extrae números completos, sin pegarles comas ni puntos finales", () => {
    expect(numerosDe("nivel 3, saldaste $1,240.50 y $150.00. En 24 h; 1,240,000")).toEqual(["3", "1,240.50", "150.00", "24", "1,240,000"]);
    expect(numerosDe("sin cifras")).toEqual([]);
  });

  it("textoLibreSeguro", () => {
    expect(textoLibreSeguro("Tacos al pastor")).toBe(true);
    expect(textoLibreSeguro("HTTP://x")).toBe(false);
    expect(textoLibreSeguro("a\u0001")).toBe(false);
  });
});

describe("B5", () => {
  it("solo acepta categorías del catálogo", () => {
    expect(B5Salida.parse({ categoria: "comida" })).toEqual({ categoria: "comida" });
    expect(() => B5Salida.parse({ categoria: "viajes" })).toThrow();
  });
});
