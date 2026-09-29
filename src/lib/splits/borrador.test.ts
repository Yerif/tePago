import { describe, expect, it } from "vitest";
import { calcularBorrador, type BorradorGasto, type RenglonBorrador } from "./borrador";
import { repartirIgual } from "./igual";

const base: BorradorGasto = {
  descripcion: "Cena",
  categoria: "comida",
  moneda: "MXN",
  totalCentavos: 85000,
  pagadorId: null,
  renglones: [],
  restoEntre: ["m1", "m2", "m3", "m4"],
  propina: null,
  impuestos: null,
};
const con = (c: Partial<BorradorGasto>) => ({ ...base, ...c });
const renglon = (c: Partial<RenglonBorrador>): RenglonBorrador => ({
  nombre: "x",
  cantidad: 1,
  precioUnitarioCentavos: null,
  importeCentavos: 1000,
  reparto: [{ userId: "m1", partes: 1 }],
  ...c,
});
const totales = (r: ReturnType<typeof calcularBorrador>) =>
  Object.fromEntries(Object.entries(r.resultado?.porPersona ?? {}).map(([id, p]) => [id, p.totalCentavos]));
const codigos = (r: ReturnType<typeof calcularBorrador>) => r.problemas.map((p) => p.codigo);

describe("modo igual", () => {
  it("850 entre 4 = 212.50 c/u, y si no se dijo quién pagó se propone a quien escribe", () => {
    const r = calcularBorrador(base, "m1");
    expect(r.modo).toBe("igual");
    expect(r.pagadorId).toBe("m1");
    expect(r.pagadorPropuesto).toBe(true);
    expect(r.problemas).toEqual([]);
    expect(totales(r)).toEqual({ m1: 21250, m2: 21250, m3: 21250, m4: 21250 });
  });

  it("respeta al pagador que venía en el texto y le deja el residuo", () => {
    const r = calcularBorrador(con({ totalCentavos: 10000, restoEntre: ["m1", "m2", "m3"], pagadorId: "m2" }), "m1");
    expect(r.pagadorPropuesto).toBe(false);
    expect(totales(r)).toEqual({ m1: 3333, m2: 3334, m3: 3333 });
  });

  it("coincide con repartirIgual en 300 casos aleatorios", () => {
    let semilla = 7;
    const azar = () => ((semilla = (semilla * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let i = 0; i < 300; i++) {
      const total = 1 + Math.floor(azar() * 900_000);
      const n = 1 + Math.floor(azar() * 8);
      const ids = Array.from({ length: n }, (_, k) => `u${k}`);
      const pagador = azar() < 0.25 ? "ext" : (ids[Math.floor(azar() * n)] as string);
      const r = calcularBorrador(con({ totalCentavos: total, restoEntre: ids, pagadorId: pagador }), "u0");
      expect(totales(r)).toEqual(repartirIgual(total, ids, pagador));
    }
  });

  it("sin monto (null o ≤ 0) o sin participantes no se puede confirmar", () => {
    for (const totalCentavos of [null, 0, -5]) {
      const r = calcularBorrador(con({ totalCentavos }), "m1");
      expect(codigos(r)).toEqual(["sin_monto"]);
      expect(r.resultado).toBeNull();
    }
    const sinGente = calcularBorrador(con({ restoEntre: null }), "m1");
    expect(sinGente.problemas).toEqual([{ codigo: "sin_participantes", bloqueante: true, centavos: 85000 }]);
    expect(calcularBorrador(con({ restoEntre: [] }), "m1").resultado).toBeNull();
  });
});

describe("modo itemizado", () => {
  // Cena de B1: 1,240 con propina 10 %; el vino de 480 fue de m3 y m1; lo demás entre m2, m3 y m1; paga m1. Calculado a mano:
  //   vino 24000/24000 · resto 76000 → 25333 c/u + 1 al pagador → consumo m3 49333, m1 49334, m2 25333 (Σ 124000)
  //   propina 12400 → m3 4933, m1 4933 (+1 residuo = 4934), m2 2533 → totales m3 54266, m1 54268, m2 27866 (Σ 136400)
  const cena = con({
    totalCentavos: 124000,
    pagadorId: "m1",
    renglones: [renglon({ nombre: "Vino", importeCentavos: 48000, reparto: [{ userId: "m3", partes: 1 }, { userId: "m1", partes: 1 }] })],
    restoEntre: ["m2", "m3", "m1"],
    propina: { tipo: "porcentaje", puntosBase: 1000 },
  });

  it("renglones + resto entre los demás + propina proporcional (caso de B1 calculado a mano)", () => {
    const r = calcularBorrador(cena, "m1");
    expect(r.modo).toBe("itemizado");
    expect(r.problemas).toEqual([]);
    expect(r.resultado?.subtotalCentavos).toBe(124000);
    expect(r.resultado?.totalCentavos).toBe(136400);
    expect(totales(r)).toEqual({ m3: 54266, m1: 54268, m2: 27866 });
  });

  it("impuestos y propina se suman, ambos sobre el subtotal", () => {
    const r = calcularBorrador(con({ ...cena, impuestos: { tipo: "monto", centavos: 1000 } }), "m1");
    expect(r.resultado?.totalCentavos).toBe(137400);
  });

  it("precio unitario × cantidad cuando no hay importe", () => {
    const r = calcularBorrador(
      con({ totalCentavos: null, restoEntre: null, renglones: [renglon({ cantidad: 3, precioUnitarioCentavos: 2500, importeCentavos: null })] }),
      "m1",
    );
    expect(r.resultado?.subtotalCentavos).toBe(7500);
    expect(r.problemas).toEqual([]);
  });

  it("sin total se usa la suma de los renglones", () => {
    const r = calcularBorrador(
      con({ totalCentavos: null, restoEntre: null, renglones: [renglon({ importeCentavos: 4000 }), renglon({ importeCentavos: 6000, reparto: [{ userId: "m2", partes: 1 }] })] }),
      "m1",
    );
    expect(totales(r)).toEqual({ m1: 4000, m2: 6000 });
  });

  it("renglones que suman más que el total: aviso, y se usa la suma", () => {
    const r = calcularBorrador(con({ totalCentavos: 10000, restoEntre: null, renglones: [renglon({ importeCentavos: 12000 })] }), "m1");
    expect(r.problemas).toEqual([{ codigo: "items_exceden_total", bloqueante: false, centavos: 2000 }]);
    expect(r.resultado?.subtotalCentavos).toBe(12000);
  });

  it("renglones que suman exactamente el total no dejan resto", () => {
    const r = calcularBorrador(con({ totalCentavos: 12000, restoEntre: null, renglones: [renglon({ importeCentavos: 12000 })] }), "m1");
    expect(r.problemas).toEqual([]);
    expect(r.resultado?.totalCentavos).toBe(12000);
  });

  it("falta asignar el resto: bloquea y dice cuánto", () => {
    const r = calcularBorrador(con({ totalCentavos: 10000, restoEntre: null, renglones: [renglon({ importeCentavos: 4000 })] }), "m1");
    expect(r.problemas).toEqual([{ codigo: "resto_sin_asignar", bloqueante: true, centavos: 6000 }]);
    expect(r.resultado).toBeNull();
  });

  it("renglones sin monto o sin personas bloquean y señalan cuál", () => {
    const r = calcularBorrador(
      con({
        totalCentavos: null,
        restoEntre: null,
        renglones: [renglon({}), renglon({ importeCentavos: null }), renglon({ reparto: [] })],
      }),
      "m1",
    );
    expect(r.problemas).toEqual([
      { codigo: "renglon_sin_monto", bloqueante: true, renglon: 1 },
      { codigo: "renglon_sin_personas", bloqueante: true, renglon: 2 },
    ]);
    expect(r.resultado).toBeNull();
  });

  it("sin total y con renglones en 0 pide el monto; con un renglón ya inválido no lo repite", () => {
    const enCero = calcularBorrador(con({ totalCentavos: null, restoEntre: null, renglones: [renglon({ importeCentavos: 0 })] }), "m1");
    expect(codigos(enCero)).toEqual(["sin_monto"]);
    const invalido = calcularBorrador(con({ totalCentavos: null, restoEntre: null, renglones: [renglon({ importeCentavos: null })] }), "m1");
    expect(codigos(invalido)).toEqual(["renglon_sin_monto"]);
  });
});
