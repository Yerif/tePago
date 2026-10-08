import { expect, test } from "@playwright/test";

// WCAG 1.4.10 (reflow): a 320 px y a 188 px de ancho CSS (≈ zoom 200 % en un celular de 375) no hay scroll horizontal (UX2-22).
const PANTALLAS = ["/dev/demo?u=ana", "/dev/demo/dividir?u=ana", "/dev/demo/grupos?u=ana", "/dev/demo/g/oaxaca?u=ana", "/dev/demo/g/oaxaca/detalle?u=ana", "/dev/demo/yo?u=ana"];

for (const ancho of [320, 188]) {
  test.describe(`a ${ancho} px de ancho`, () => {
    test.use({ viewport: { width: ancho, height: 700 } });
    for (const ruta of PANTALLAS) {
      test(`${ruta} no se desborda`, async ({ page }) => {
        await page.goto(ruta);
        await page.waitForLoadState("networkidle");
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(desborde).toBeLessThanOrEqual(0);
      });
    }
  });
}

test.describe("filas del Inicio compactas (UX2-10)", () => {
  test("una fila de un solo grupo mide ≤ 120 px, con el monto una sola vez y la meta en una línea", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const fila = page.getByTestId("cuenta-pau"); // Pau: un solo grupo
    const caja = await fila.boundingBox();
    expect(caja?.height ?? 999).toBeLessThanOrEqual(120);
    await expect(fila.getByTestId("cuenta-pagar-pau")).toHaveText("Pagar"); // el monto no se repite en el botón
    await expect(fila).toContainText(/hace \d+ (h|d) · /); // meta abreviada
  });

  test("con un pago en camino, el botón sí dice cuánto queda por pagar", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    await page.getByTestId("cuenta-pagar-pau").click();
    await page.getByTestId("hoja-monto").fill("100");
    await page.getByTestId("hoja-confirmar").click();
    await expect(page.getByTestId("cuenta-pagar-pau")).toContainText("Pagar $");
  });
});
