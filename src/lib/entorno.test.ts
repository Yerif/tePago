import { describe, expect, it } from "vitest";
import { esEntornoDev } from "./entorno";

describe("esEntornoDev", () => {
  it("es true en desarrollo local", () => {
    expect(esEntornoDev({ NODE_ENV: "development" })).toBe(true);
  });
  it("es true en un preview de Vercel (NODE_ENV=production)", () => {
    expect(esEntornoDev({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
  });
  it("es false en producción de Vercel", () => {
    expect(esEntornoDev({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
  });
  it("es false en un build de producción fuera de Vercel", () => {
    expect(esEntornoDev({ NODE_ENV: "production" })).toBe(false);
  });
});
