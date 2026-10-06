import { expect, test } from "@playwright/test";

test.describe("spike PX-17: el modelo procedural se puede exportar a .glb", () => {
  test("cada base exporta un glTF binario válido y de peso razonable", async ({ page }) => {
    for (const base of ["oso", "persona-nube", "conejo"]) {
      await page.goto(`/dev/personaje/exportar?base=${base}&estado=clean`);
      await page.waitForFunction(() => typeof window.__exportarGlb === "function");
      await page.waitForTimeout(1200); // espera el primer cuadro: ahí se entrega la escena
      const b64 = await page.evaluate(() => window.__exportarGlb!());
      const bytes = Buffer.from(b64, "base64");
      expect(bytes.subarray(0, 4).toString("ascii"), base).toBe("glTF"); // cabecera del formato binario
      expect(bytes.length, base).toBeGreaterThan(50_000);
      expect(bytes.length, base).toBeLessThan(400_000);
    }
  });
});
