import { describe, expect, it } from "vitest";
import { senalesPublicas } from "./reputacion";

describe("senalesPublicas", () => {
  it("Beto (bajo la lluvia + Fantasma + debe): solo UNA señal negativa, el Fantasma, y su monto va en neutro", () => {
    expect(senalesPublicas({ estado: "rekt", badges: ["fantasma"], balanceCentavos: -184_512, esYo: false })).toEqual({
      badges: ["fantasma"],
      negativa: "fantasma",
      mostrarEstado: false,
      colorMonto: "neutro",
    });
  });
  it("lo positivo va primero y el Fantasma al final", () => {
    expect(senalesPublicas({ estado: "mild", badges: ["fantasma", "rayo", "generoso"], balanceCentavos: 0, esYo: false }).badges).toEqual(["rayo", "generoso", "fantasma"]);
  });
  it("sin Fantasma, el clima negativo es la única señal y sí se muestra", () => {
    expect(senalesPublicas({ estado: "mild", badges: ["jardinero"], balanceCentavos: -100, esYo: false })).toMatchObject({ negativa: "estado", mostrarEstado: true });
  });
  it("radiante sin Fantasma: no hay señal negativa y se muestra «Radiante»", () => {
    expect(senalesPublicas({ estado: "clean", badges: ["rayo"], balanceCentavos: 5_000, esYo: false })).toEqual({ badges: ["rayo"], negativa: null, mostrarEstado: true, colorMonto: "neutro" });
  });
  it("radiante con Fantasma (se esfuma al pagar): muestra Radiante y el badge", () => {
    expect(senalesPublicas({ estado: "clean", badges: ["fantasma"], balanceCentavos: 0, esYo: false })).toMatchObject({ negativa: "fantasma", mostrarEstado: true });
  });
  it("tu propio monto sí lleva color: deuda y favor; en cero, neutro", () => {
    expect(senalesPublicas({ estado: "clean", badges: [], balanceCentavos: -1, esYo: true }).colorMonto).toBe("deuda");
    expect(senalesPublicas({ estado: "clean", badges: [], balanceCentavos: 1, esYo: true }).colorMonto).toBe("favor");
    expect(senalesPublicas({ estado: "clean", badges: [], balanceCentavos: 0, esYo: true }).colorMonto).toBe("neutro");
  });
});
