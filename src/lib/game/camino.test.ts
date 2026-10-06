import { describe, expect, it } from "vitest";
import { caminoDeEstado, textoDelCamino } from "./camino";

const ahora = new Date("2026-10-06T12:00:00Z");
const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
const gasto = (id: string, pagadoPor: string, deudor: string, centavos: number, horas: number) => ({
  id,
  pagadoPor,
  totalCentavos: centavos,
  fecha: hace(horas),
  partes: [
    { userId: pagadoPor, centavos: 0, saldado: true },
    { userId: deudor, centavos, saldado: false },
  ],
});

// Beto debe $120 a Ana (hace 5 h), $200 a Ferni (hace 30 h) y $300 a Caro (hace 100 h → vencida): $620 en total.
const grupos = [{ id: "g", gastos: [gasto("1", "ana", "beto", 12_000, 5), gasto("2", "ferni", "beto", 20_000, 30), gasto("3", "caro", "beto", 30_000, 100)] }];
const cuentas = [
  { personaId: "caro", porGrupo: [{ grupoId: "g", centavos: 30_000 }] },
  { personaId: "ferni", porGrupo: [{ grupoId: "g", centavos: 20_000 }] },
  { personaId: "ana", porGrupo: [{ grupoId: "g", centavos: 12_000 }] },
];

describe("caminoDeEstado", () => {
  it("Beto bajo la lluvia: pagar a Caro (la vencida) lo deja en $320 → Nublado; todo → Radiante", () => {
    expect(caminoDeEstado(grupos, "beto", ahora, cuentas)).toEqual({
      actual: "rekt",
      alConfirmar: "rekt",
      siguiente: { personas: ["caro"], estado: "mild" },
      todo: "clean",
    });
  });
  it("si pagar a la primera no basta, pide a las dos primeras", () => {
    const otras = [
      { personaId: "ana", porGrupo: [{ grupoId: "g", centavos: 12_000 }] },
      { personaId: "ferni", porGrupo: [{ grupoId: "g", centavos: 20_000 }] },
      { personaId: "caro", porGrupo: [{ grupoId: "g", centavos: 30_000 }] },
    ];
    // Pagando a Ana: sigue debiendo $500 y una deuda de 100 h → rekt. Con Ferni: debe $300 pero la de 100 h → rekt. Hasta Caro.
    expect(caminoDeEstado(grupos, "beto", ahora, otras).siguiente).toEqual({ personas: ["ana", "ferni", "caro"], estado: "clean" });
  });
  it("lo que ya está en camino se da por pagado y no se vuelve a pedir", () => {
    const r = caminoDeEstado(grupos, "beto", ahora, cuentas, ["caro"]);
    expect(r.actual).toBe("rekt");
    expect(r.alConfirmar).toBe("mild"); // al confirmarse el pago a Caro
    expect(r.siguiente).toEqual({ personas: ["ferni", "ana"], estado: "clean" });
  });
  it("quien ya está radiante no tiene siguiente mejora", () => {
    expect(caminoDeEstado(grupos, "ana", ahora, [])).toEqual({ actual: "clean", alConfirmar: "clean", siguiente: null, todo: "clean" });
  });
  it("sin nadie a quien pagar todo queda como está", () => {
    expect(caminoDeEstado(grupos, "beto", ahora, [])).toMatchObject({ actual: "rekt", siguiente: null, todo: "rekt" });
  });
});

describe("textoDelCamino", () => {
  const nombre = (id: string) => ({ caro: "Caro", ferni: "Ferni", ana: "Ana" })[id] ?? id;
  it("el siguiente pago y el estado final", () => {
    expect(textoDelCamino(caminoDeEstado(grupos, "beto", ahora, cuentas), nombre)).toEqual(["Paga a Caro → «Nublado» · Todo → «Radiante»"]);
  });
  it("si un solo grupo de pagos ya lleva al estado final no repite", () => {
    expect(textoDelCamino({ actual: "mild", alConfirmar: "mild", siguiente: { personas: ["ferni", "ana"], estado: "clean" }, todo: "clean" }, nombre)).toEqual(["Paga a Ferni y Ana → «Radiante»"]);
    expect(textoDelCamino({ actual: "rekt", alConfirmar: "rekt", siguiente: { personas: ["caro", "ferni", "ana"], estado: "clean" }, todo: "clean" }, nombre)).toEqual(["Paga a Caro, Ferni y Ana → «Radiante»"]);
  });
  it("con más de 3 personas resume: «Nico, Pau y 5 más»", () => {
    const l = textoDelCamino({ actual: "rekt", alConfirmar: "rekt", siguiente: { personas: ["a", "b", "c", "d", "e", "f", "g"], estado: "clean" }, todo: "clean" }, (id) => id.toUpperCase());
    expect(l).toEqual(["Paga a A, B y 5 más → «Radiante»"]);
  });
  it("avisa lo que pasará al confirmarse lo que ya está en camino", () => {
    const l = textoDelCamino(caminoDeEstado(grupos, "beto", ahora, cuentas, ["caro"]), nombre);
    expect(l[0]).toBe("Cuando confirmen tus pagos pasarás a «Nublado» ⏳");
    expect(l[1]).toBe("Paga a Ferni y Ana → «Radiante»");
  });
  it("nada que decir si ya está radiante", () => {
    expect(textoDelCamino(caminoDeEstado(grupos, "ana", ahora, []), nombre)).toEqual([]);
  });
  it("personas sin nombre conocido y lista vacía", () => {
    expect(textoDelCamino({ actual: "rekt", alConfirmar: "rekt", siguiente: { personas: [], estado: "mild" }, todo: "mild" }, nombre)).toEqual(["Paga a  → «Nublado»"]);
  });
});
