import { describe, expect, it } from "vitest";
import { FRASES_REACCION, fraseDelPersonaje } from "./microcopy";

describe("fraseDelPersonaje", () => {
  it("una frase por estado, sin llamar 'deteriorada' a la persona", () => {
    expect(fraseDelPersonaje("clean", false)).toContain("Todo en orden");
    expect(fraseDelPersonaje("clean", true)).toContain("Voy al día");
    expect(fraseDelPersonaje("mild", true)).toContain("nublado");
    expect(fraseDelPersonaje("rekt", true)).toContain("Llueve");
    for (const e of ["clean", "mild", "rekt"] as const) expect(fraseDelPersonaje(e, true).toLowerCase()).not.toContain("deteriorad");
  });
});

describe("FRASES_REACCION", () => {
  it("reacciones pequeñas del viaje de pago", () => {
    expect(FRASES_REACCION.pendiente("Nico")).toBe("Avisé a Nico ⏳ Te cuento cuando confirme.");
    expect(FRASES_REACCION.abono("Nico", "$335.12")).toBe("¡Buen abono a Nico! Faltan $335.12 para saldar.");
    expect(FRASES_REACCION.cancelado).toContain("cancelado");
    expect(FRASES_REACCION.rechazado("Nico")).toContain("sin pena");
  });
});
