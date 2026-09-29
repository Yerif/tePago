import { describe, expect, it } from "vitest";
import { avisosDeB1, textoProblema } from "./avisos";
import { borradorDesdeB1 } from "./aBorrador";
import { calcularBorrador } from "@/lib/splits/borrador";
import type { B1SalidaT } from "./schemas/b1";

const ids = { m1: "u-ana", m2: "u-ferni", m3: "u-caro", m4: "u-beto" };
const ok: B1SalidaT = {
  descripcion: "Cena",
  categoria: "comida",
  moneda: "MXN",
  total: "1240",
  pagado_por: "m1",
  items: [{ nombre: "Vino", cantidad: 2, precio_unitario: "240", importe: null, reparto: [{ persona: "m3", partes: 1 }, { persona: "m1", partes: 1 }] }],
  resto_entre: ["m2", "m3", "m1"],
  propina: { tipo: "porcentaje", valor: "10" },
  impuestos: { tipo: "monto", valor: "198.40" },
  no_reconocidos: ["Luis"],
  advertencias: [],
};

describe("borradorDesdeB1", () => {
  it("traduce alias a ids, montos a centavos y porcentajes a puntos base", () => {
    expect(borradorDesdeB1(ok, ids)).toEqual({
      descripcion: "Cena",
      categoria: "comida",
      moneda: "MXN",
      totalCentavos: 124000,
      pagadorId: "u-ana",
      renglones: [
        { nombre: "Vino", cantidad: 2, precioUnitarioCentavos: 24000, importeCentavos: null, reparto: [{ userId: "u-caro", partes: 1 }, { userId: "u-ana", partes: 1 }] },
      ],
      restoEntre: ["u-ferni", "u-caro", "u-ana"],
      propina: { tipo: "porcentaje", puntosBase: 1000 },
      impuestos: { tipo: "monto", centavos: 19840 },
    });
  });

  it("los null se quedan null", () => {
    const b = borradorDesdeB1({ ...ok, total: null, pagado_por: null, resto_entre: null, propina: null, impuestos: null, items: [] }, ids);
    expect(b).toMatchObject({ totalCentavos: null, pagadorId: null, restoEntre: null, propina: null, impuestos: null, renglones: [] });
  });

  it("de punta a punta con calcularBorrador", () => {
    const r = calcularBorrador(borradorDesdeB1({ ...ok, impuestos: null, items: [{ ...(ok.items[0] as B1SalidaT["items"][number]), precio_unitario: null, importe: "480" }] }, ids), "u-ana");
    expect(r.resultado?.totalCentavos).toBe(136400);
  });

  it("rechaza lo que el validador debió impedir", () => {
    expect(() => borradorDesdeB1({ ...ok, pagado_por: "m9" }, ids)).toThrow(RangeError);
    expect(() => borradorDesdeB1({ ...ok, total: "abc" }, ids)).toThrow(RangeError);
    expect(() => borradorDesdeB1({ ...ok, propina: { tipo: "porcentaje", valor: "diez" } }, ids)).toThrow(RangeError);
    expect(() => borradorDesdeB1({ ...ok, impuestos: { tipo: "monto", valor: "x" } }, ids)).toThrow(RangeError);
  });
});

describe("avisosDeB1", () => {
  it("una línea por persona fuera del grupo y por advertencia, en tono cálido", () => {
    const avisos = avisosDeB1({ ...ok, moneda: "USD", no_reconocidos: ["Luis", "Mari"], advertencias: ["moneda_extranjera", "persona_ambigua"] });
    expect(avisos).toEqual([
      "¿Quién es Luis? No está en el grupo",
      "¿Quién es Mari? No está en el grupo",
      "El gasto está en USD: se guarda en esa moneda",
      "Hay un nombre que puede ser de dos personas: revísalo",
    ]);
  });

  it("traduce todas las advertencias y no deja ningún código crudo", () => {
    const todas = ["participantes_ambiguos", "persona_ambigua", "monto_ambiguo", "no_es_gasto", "instrucciones_ignoradas", "moneda_extranjera"] as const;
    for (const a of avisosDeB1({ moneda: "MXN", no_reconocidos: [], advertencias: [...todas] })) expect(a).not.toMatch(/_/);
    expect(avisosDeB1({ moneda: "MXN", no_reconocidos: [], advertencias: ["monto_ambiguo", "no_es_gasto", "participantes_ambiguos", "instrucciones_ignoradas"] })).toHaveLength(4);
    expect(avisosDeB1({ moneda: "MXN", no_reconocidos: [], advertencias: [] })).toEqual([]);
  });
});

describe("textoProblema", () => {
  it.each([
    [{ codigo: "sin_monto", bloqueante: true }, "Falta el monto 💸"],
    [{ codigo: "sin_participantes", bloqueante: true }, "¿Entre quiénes se divide?"],
    [{ codigo: "resto_sin_asignar", bloqueante: true, centavos: 60000 }, "Faltan $600.00 por asignar: elige entre quiénes va el resto"],
    [{ codigo: "renglon_sin_monto", bloqueante: true, renglon: 1 }, "Al renglón 2 le falta el monto"],
    [{ codigo: "renglon_sin_personas", bloqueante: true, renglon: 0 }, "Elige quién consumió el renglón 1"],
    [{ codigo: "items_exceden_total", bloqueante: false, centavos: 2000 }, "Los renglones suman $20.00 más que el total: usé la suma de los renglones"],
  ] as const)("%j", (problema, texto) => {
    expect(textoProblema(problema)).toBe(texto);
  });

  it("sin cifra ni renglón usa 0 y renglón 1 por defecto", () => {
    expect(textoProblema({ codigo: "resto_sin_asignar", bloqueante: true })).toContain("$0.00");
    expect(textoProblema({ codigo: "renglon_sin_monto", bloqueante: true })).toContain("renglón 1");
  });
});
