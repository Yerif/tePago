import { describe, expect, it } from "vitest";
import { queFaltaParaConfirmar, resumenReparto } from "./resumenReparto";

describe("resumenReparto", () => {
  it("todos igual → c/u", () => expect(resumenReparto({ a: 21250, b: 21250 })).toBe("$212.50 c/u"));
  it("desiguales → rango", () => expect(resumenReparto({ a: 20000, b: 22500, c: 21000 })).toBe("de $200.00 a $225.00 por persona"));
  it("una sola persona", () => expect(resumenReparto({ a: 5000 })).toBe("$50.00 c/u"));
  it("sin reparto no hay línea", () => {
    expect(resumenReparto(null)).toBeNull();
    expect(resumenReparto({})).toBeNull();
  });
});

describe("queFaltaParaConfirmar", () => {
  it("primero el monto", () => {
    expect(queFaltaParaConfirmar(null, 3)).toBe("Escribe el monto");
    expect(queFaltaParaConfirmar(0, 3)).toBe("Escribe el monto");
  });
  it("luego las personas", () => expect(queFaltaParaConfirmar(1000, 0)).toBe("Elige a quién se divide"));
  it("y si hay monto y personas, el reparto de otro modo", () => expect(queFaltaParaConfirmar(1000, 2)).toBe("Completa el reparto"));
});
