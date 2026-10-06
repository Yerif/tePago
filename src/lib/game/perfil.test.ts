import { describe, expect, it } from "vitest";
import { MAX_NOMBRE, validarNombre } from "./perfil";

describe("validarNombre", () => {
  it("recorta y junta los espacios repetidos", () => {
    expect(validarNombre("  Ana   María ")).toEqual({ ok: true, nombre: "Ana María" });
  });
  it("acepta acentos y emojis", () => {
    expect(validarNombre("Ñoño 🌻")).toEqual({ ok: true, nombre: "Ñoño 🌻" });
  });
  it("rechaza vacío y solo espacios o caracteres de control", () => {
    expect(validarNombre("")).toEqual({ ok: false, error: "Escribe tu nombre" });
    expect(validarNombre("   ")).toEqual({ ok: false, error: "Escribe tu nombre" });
    expect(validarNombre("\n\t")).toEqual({ ok: false, error: "Escribe tu nombre" });
  });
  it("cuenta caracteres, no bytes: 24 es válido y 25 no", () => {
    expect(validarNombre("a".repeat(MAX_NOMBRE)).ok).toBe(true);
    expect(validarNombre("🌻".repeat(MAX_NOMBRE)).ok).toBe(true);
    expect(validarNombre("a".repeat(MAX_NOMBRE + 1))).toEqual({ ok: false, error: "Máximo 24 letras" });
  });
  it("los caracteres de control dentro del texto se vuelven espacios", () => {
    expect(validarNombre("Ana\u0000Pau")).toEqual({ ok: true, nombre: "Ana Pau" });
  });
});
