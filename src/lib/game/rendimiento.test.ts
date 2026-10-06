import { describe, expect, it } from "vitest";
import { percentil, resumenFps } from "./rendimiento";

describe("percentil", () => {
  it("interpola y acota", () => {
    expect(percentil([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentil([10, 20], 50)).toBe(15);
    expect(percentil([1, 2, 3], 0)).toBe(1);
    expect(percentil([1, 2, 3], 100)).toBe(3);
    expect(percentil([1, 2, 3], -5)).toBe(1);
    expect(percentil([1, 2, 3], 500)).toBe(3);
  });
  it("sin valores es 0 y no depende del orden", () => {
    expect(percentil([], 50)).toBe(0);
    expect(percentil([5, 1, 3], 50)).toBe(3);
  });
});

describe("resumenFps", () => {
  it("60 fps constantes", () => {
    expect(resumenFps(Array(100).fill(1 / 60))).toEqual({ fpsMediana: 60, fpsP5: 60 });
  });
  it("el p5 refleja los cuadros lentos", () => {
    const deltas = [...Array(95).fill(1 / 60), ...Array(5).fill(1 / 20)];
    const r = resumenFps(deltas);
    expect(r.fpsMediana).toBe(60);
    expect(r.fpsP5).toBeLessThan(60);
  });
  it("ignora tiempos no positivos y sin datos da 0", () => {
    expect(resumenFps([0, -1])).toEqual({ fpsMediana: 0, fpsP5: 0 });
    expect(resumenFps([])).toEqual({ fpsMediana: 0, fpsP5: 0 });
  });
});
