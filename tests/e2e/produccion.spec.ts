import { expect, test } from "@playwright/test";

const PRODUCCION = "http://localhost:3101";

test.describe("producción", () => {
  for (const ruta of ["/dev/demo", "/dev/ui", "/dev/demo/g/oaxaca/detalle"]) {
    test(`${ruta} responde 404 sin contenido`, async ({ request }) => {
      const res = await request.get(PRODUCCION + ruta);
      expect(res.status()).toBe(404);
      expect(await res.text()).toBe("");
    });
  }

  test("la portada existe y no muestra el demo", async ({ page }) => {
    await page.goto(PRODUCCION + "/");
    await expect(page.getByRole("heading", { name: /Cuentas Conmigo/ })).toBeVisible();
    await expect(page.getByTestId("ir-demo")).toHaveCount(0);
    await expect(page.getByTestId("ir-dividir")).toHaveCount(0);
  });
});
