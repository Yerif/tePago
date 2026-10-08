import { expect, test, type Page } from "@playwright/test";
import { ids } from "./selectors";

const inicio = (page: Page, u: string) => page.goto(`/dev/demo?u=${u}`);

/** Ana le paga a Nico, Nico confirma y Ana vuelve a su inicio. */
async function anaPagaYNicoConfirma(page: Page) {
  await inicio(page, "ana");
  await page.getByTestId(ids.cuenta.pagar("nico")).click();
  await page.getByTestId(ids.hoja.confirmar).click();
  await inicio(page, "nico");
  await page.locator(ids.pagos.confirmar).click();
  await inicio(page, "ana");
}

test.describe("avisos del Inicio: un solo aviso por evento y «Pagar» a la vista (UX2-03)", () => {
  test("al confirmarse un pago sale UNA tarjeta con la XP, sin una revelación repetida, y el primer «Pagar» sigue en pantalla", async ({ page }) => {
    await anaPagaYNicoConfirma(page);
    const avisos = page.getByTestId(ids.pagos.avisos).locator("> li");
    await expect(avisos).toHaveCount(1);
    await expect(page.locator(ids.pagos.avisoXp)).toContainText("XP");
    await expect(page.getByTestId(ids.revelacion.raiz)).toHaveCount(0); // la XP ya se dijo en el aviso

    const primerPagar = page.locator('[data-testid^="cuenta-pagar-"]').first();
    await expect(primerPagar).toBeVisible();
    const caja = await primerPagar.boundingBox();
    const alto = page.viewportSize()?.height ?? 0;
    const nav = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
    expect(caja && nav).toBeTruthy();
    if (caja && nav) expect(caja.y + caja.height).toBeLessThanOrEqual(Math.min(alto, nav.y));
  });
});
