import { describe, expect, it } from "vitest";
import { estadoAvatar, ETIQUETA_ESTADO, situacionEnGrupo, UMBRAL_REKT_CENTAVOS, UMBRAL_REKT_HORAS } from "./avatar";
import { progresoNivel, xpAcumuladaParaNivel, xpParaSubir } from "./levels";
import { XP, xpPorSaldar } from "./xp";

describe("niveles (100 + (n-1)*75)", () => {
  it.each([
    [1, 100],
    [2, 175],
    [3, 250],
    [5, 400],
    [10, 775],
  ])("xpParaSubir(%i) = %i", (nivel, xp) => {
    expect(xpParaSubir(nivel)).toBe(xp);
  });

  it("xpAcumuladaParaNivel suma los niveles anteriores", () => {
    expect(xpAcumuladaParaNivel(1)).toBe(0);
    expect(xpAcumuladaParaNivel(2)).toBe(100);
    expect(xpAcumuladaParaNivel(3)).toBe(275);
    expect(xpAcumuladaParaNivel(5)).toBe(850);
    for (let n = 1; n <= 60; n++) {
      let suma = 0;
      for (let i = 1; i < n; i++) suma += xpParaSubir(i);
      expect(xpAcumuladaParaNivel(n)).toBe(suma);
    }
  });

  it("usuario nuevo: nivel 1 con 0 XP", () => {
    expect(progresoNivel(0)).toEqual({ nivel: 1, xpEnNivel: 0, xpSiguiente: 100 });
  });

  it("bordes: justo antes y justo en el umbral", () => {
    expect(progresoNivel(99)).toEqual({ nivel: 1, xpEnNivel: 99, xpSiguiente: 100 });
    expect(progresoNivel(100)).toEqual({ nivel: 2, xpEnNivel: 0, xpSiguiente: 175 });
    expect(progresoNivel(274)).toEqual({ nivel: 2, xpEnNivel: 174, xpSiguiente: 175 });
    expect(progresoNivel(275)).toEqual({ nivel: 3, xpEnNivel: 0, xpSiguiente: 250 });
  });

  it("ida y vuelta: acumulada(n) cae exactamente en el nivel n, y -1 en el anterior", () => {
    for (let n = 2; n <= 80; n++) {
      const a = xpAcumuladaParaNivel(n);
      expect(progresoNivel(a).nivel).toBe(n);
      expect(progresoNivel(a - 1).nivel).toBe(n - 1);
    }
  });

  it("el nivel nunca baja al ganar XP", () => {
    let anterior = 1;
    for (let xp = 0; xp < 20_000; xp += 37) {
      const { nivel } = progresoNivel(xp);
      expect(nivel).toBeGreaterThanOrEqual(anterior);
      anterior = nivel;
    }
  });

  it("rechaza entradas inválidas", () => {
    expect(() => progresoNivel(-1)).toThrow(RangeError);
    expect(() => progresoNivel(1.5)).toThrow(RangeError);
    expect(() => xpParaSubir(0)).toThrow(RangeError);
    expect(() => xpAcumuladaParaNivel(1.2)).toThrow(RangeError);
  });
});

describe("XP", () => {
  it("tabla de CLAUDE.md §7", () => {
    expect(XP).toEqual({
      REGISTRAR_GASTO: 10,
      SALDAR_MENOS_24H: 50,
      SALDAR_MENOS_48H: 30,
      SALDAR_MENOS_7D: 10,
      SEMANA_SIN_DEUDAS: 25,
    });
  });

  it.each([
    [0, 50],
    [23.99, 50],
    [24, 30],
    [47.99, 30],
    [48, 10],
    [167.99, 10],
    [168, 0],
    [1000, 0],
  ])("saldar a las %f h → %i XP", (horas, xp) => {
    expect(xpPorSaldar(horas)).toBe(xp);
  });

  it("rechaza horas inválidas", () => {
    expect(() => xpPorSaldar(-1)).toThrow(RangeError);
    expect(() => xpPorSaldar(Number.NaN)).toThrow(RangeError);
    expect(() => xpPorSaldar(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("estadoAvatar", () => {
  const g = (balanceCentavos: number, deudaMasAntiguaHoras: number | null = null) => ({
    balanceCentavos,
    deudaMasAntiguaHoras,
  });

  it("usuario nuevo (sin grupos) es clean", () => {
    expect(estadoAvatar([])).toBe("clean");
  });

  it("saldo 0 o a favor es clean", () => {
    expect(estadoAvatar([g(0)])).toBe("clean");
    expect(estadoAvatar([g(80_000), g(0)])).toBe("clean");
  });

  it("una deuda chica y reciente es mild", () => {
    expect(estadoAvatar([g(-100, 1)])).toBe("mild");
    expect(estadoAvatar([g(-31_000, 20)])).toBe("mild");
  });

  it("borde de dinero: $499.99 es mild y $500.00 exactos es rekt", () => {
    expect(UMBRAL_REKT_CENTAVOS).toBe(50_000);
    expect(estadoAvatar([g(-49_999, 1)])).toBe("mild");
    expect(estadoAvatar([g(-50_000, 1)])).toBe("rekt");
  });

  it("borde de tiempo: exactamente 72 h sigue mild; pasando 72 h es rekt", () => {
    expect(UMBRAL_REKT_HORAS).toBe(72);
    expect(estadoAvatar([g(-100, 72)])).toBe("mild");
    expect(estadoAvatar([g(-100, 72.001)])).toBe("rekt");
  });

  it("sin antigüedad conocida no se considera vencida", () => {
    expect(estadoAvatar([g(-100, null)])).toBe("mild");
  });

  it("las deudas de varios grupos suman, y lo que le deben en uno no compensa otro", () => {
    expect(estadoAvatar([g(-30_000, 5), g(-20_000, 5)])).toBe("rekt");
    expect(estadoAvatar([g(-30_000, 5), g(900_000)])).toBe("mild");
  });

  it("una deuda vieja en un grupo con saldo a favor no cuenta", () => {
    expect(estadoAvatar([g(10_000, 500)])).toBe("clean");
    expect(estadoAvatar([g(10_000, 500), g(-100, 1)])).toBe("mild");
  });

  it("rechaza saldos que no son enteros", () => {
    expect(() => estadoAvatar([g(-10.5)])).toThrow(RangeError);
  });
});

describe("situacionEnGrupo", () => {
  const ahora = new Date("2026-09-29T12:00:00Z");
  const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
  const gasto = (id: string, pagadoPor: string, fecha: string, partes: [string, number, boolean][]) => ({
    id,
    pagadoPor,
    fecha,
    totalCentavos: partes.reduce((s, [, c]) => s + c, 0),
    partes: partes.map(([userId, centavos, saldado]) => ({ userId, centavos, saldado })),
  });

  it("toma la deuda sin saldar más vieja y el saldo neto", () => {
    const gastos = [
      gasto("a", "x", hace(10), [["x", 100, true], ["yo", 100, false]]),
      gasto("b", "x", hace(90), [["x", 100, true], ["yo", 100, false]]),
      gasto("c", "x", hace(200), [["x", 100, true], ["yo", 100, true]]), // saldada: no cuenta
      gasto("d", "yo", hace(300), [["yo", 100, true], ["x", 100, false]]), // la pagué yo: no es deuda mía
      gasto("e", "x", hace(20), [["x", 100, true], ["yo", 100, false]]), // más reciente que la más vieja
    ];
    expect(situacionEnGrupo(gastos, "yo", ahora)).toEqual({ balanceCentavos: -300 + 100, deudaMasAntiguaHoras: 90 });
  });

  it("sin deudas: saldo a favor o 0 y sin antigüedad", () => {
    const gastos = [gasto("a", "yo", hace(5), [["yo", 50, true], ["x", 50, false]])];
    expect(situacionEnGrupo(gastos, "yo", ahora)).toEqual({ balanceCentavos: 50, deudaMasAntiguaHoras: null });
    expect(situacionEnGrupo([], "yo", ahora)).toEqual({ balanceCentavos: 0, deudaMasAntiguaHoras: null });
  });

  it("de punta a punta con estadoAvatar", () => {
    const vieja = [gasto("a", "x", hace(80), [["x", 100, true], ["yo", 100, false]])];
    expect(estadoAvatar([situacionEnGrupo(vieja, "yo", ahora)])).toBe("rekt");
    const reciente = [gasto("a", "x", hace(2), [["x", 100, true], ["yo", 100, false]])];
    expect(estadoAvatar([situacionEnGrupo(reciente, "yo", ahora)])).toBe("mild");
  });
});

describe("etiquetas de clima", () => {
  it("claves estables y etiquetas visibles de clima (nunca sobre la persona)", () => {
    expect(ETIQUETA_ESTADO).toEqual({ clean: "Radiante", mild: "Nublado", rekt: "Bajo la lluvia" });
  });
});
