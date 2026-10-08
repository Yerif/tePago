import { expect, test } from "@playwright/test";

// Todo lo que se pliega debe parecer tocable (UX2-08): cada <summary> visible lleva su flechita.
const PANTALLAS = [
  "/dev/demo?u=ana",
  "/dev/demo?u=ferni",
  "/dev/demo/yo?u=ana",
  "/dev/demo/g/playa/detalle?u=ana",
  "/dev/demo/g/roomies/detalle?u=mari",
];

test.describe("plegables con indicador visible", () => {
  for (const ruta of PANTALLAS) {
    test(ruta, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      const summaries = page.locator("summary:visible");
      const total = await summaries.count();
      expect(total).toBeGreaterThan(0);
      await expect(page.locator("summary:visible:not(:has([data-testid=chevron]))")).toHaveCount(0);
    });
  }

  test("la flechita gira al abrir", async ({ page }) => {
    await page.goto("/dev/demo?u=ferni");
    const resumen = page.getByTestId("herramientas-demo").locator("summary");
    const flecha = resumen.getByTestId("chevron");
    const girado = () => flecha.evaluate((e) => getComputedStyle(e).transform);
    expect(await girado()).toBe("none");
    await resumen.click();
    await expect.poll(girado).not.toBe("none");
  });
});
