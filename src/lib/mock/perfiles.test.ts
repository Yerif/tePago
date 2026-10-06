import { describe, expect, it } from "vitest";
import { aplicarPerfiles, limpiarPerfiles } from "./perfiles";

const grupos = [
  { id: "g1", miembros: [{ id: "ana", nombre: "Ana", base: "oso", emoji: "🐻" }, { id: "beto", nombre: "Beto", base: "rana", emoji: "🐸" }] },
  { id: "g2", miembros: [{ id: "ana", nombre: "Ana", base: "oso" }] },
];

describe("aplicarPerfiles", () => {
  it("sin cambios devuelve los mismos grupos", () => {
    expect(aplicarPerfiles(grupos, {})).toBe(grupos);
  });
  it("cambia nombre y personaje (y el emoji de respaldo) en todos los grupos, sin tocar a los demás ni los originales", () => {
    const r = aplicarPerfiles(grupos, { ana: { nombre: "Anita", base: "gato" } });
    expect(r[0]?.miembros[0]).toEqual({ id: "ana", nombre: "Anita", base: "gato", emoji: "🐱" });
    expect(r[0]?.miembros[1]).toBe(grupos[0]?.miembros[1]);
    expect(r[1]?.miembros[0]).toEqual({ id: "ana", nombre: "Anita", base: "gato" }); // sin emoji si el original no lo traía
    expect(grupos[0]?.miembros[0]?.nombre).toBe("Ana");
  });
  it("solo nombre o solo personaje", () => {
    expect(aplicarPerfiles(grupos, { ana: { nombre: "Nana" } })[0]?.miembros[0]).toEqual({ id: "ana", nombre: "Nana", base: "oso", emoji: "🐻" });
    expect(aplicarPerfiles(grupos, { ana: { base: "buho" } })[0]?.miembros[0]).toMatchObject({ nombre: "Ana", base: "buho", emoji: "🦉" });
  });
});

describe("limpiarPerfiles", () => {
  it("conserva lo válido y descarta basura", () => {
    expect(limpiarPerfiles({ ana: { nombre: "  Ana  ", base: "gato" }, beto: { nombre: "", base: "dragon" }, x: 5, y: null, z: { nombre: 3 } })).toEqual({ ana: { nombre: "Ana", base: "gato" } });
  });
  it("lo que no es un objeto no rompe", () => {
    expect(limpiarPerfiles(null)).toEqual({});
    expect(limpiarPerfiles([1])).toEqual({});
    expect(limpiarPerfiles("hola")).toEqual({});
  });
});
