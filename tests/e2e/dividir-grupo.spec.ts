import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("Dividir recuerda el último grupo (UX2-11)", () => {
  test("tras registrar un gasto en otro grupo, Dividir arranca ahí; con ?g= manda la URL", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await expect(page.getByTestId("dividir-grupo")).toHaveValue("oaxaca"); // sin historial: el primero
    await page.getByTestId("dividir-grupo").selectOption("roomies");
    await page.getByTestId(ids.dividir.monto).fill("300");
    await page.getByTestId(ids.dividir.confirmar).click();
    await expect(page.getByTestId(ids.dividir.aviso)).toContainText("Roomies");

    await page.goto("/dev/demo/dividir?u=ana");
    await expect(page.getByTestId("dividir-grupo")).toHaveValue("roomies"); // recordado
    await page.goto("/dev/demo/dividir?u=ana&g=playa");
    await expect(page.getByTestId("dividir-grupo")).toHaveValue("playa"); // lo pedido gana
    await page.goto("/dev/demo/dividir?u=beto");
    await expect(page.getByTestId("dividir-grupo")).toHaveValue("oaxaca"); // cada persona, su historial
  });
});
