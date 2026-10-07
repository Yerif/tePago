import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("cuéntalo con tus palabras (Smart Split, texto primero)", () => {
  test("una frase abre la pantalla de revisión con el ejemplo más parecido y se puede volver a Dividir", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await page.getByTestId(ids.dividir.frase).fill("cena 840 pagué yo somos 4");
    await page.getByTestId(ids.dividir.enviarFrase).click();
    await expect(page).toHaveURL(/\/dev\/demo\/ia\?/);
    await expect(page.getByRole("heading", { name: /Confirmar gasto/ })).toBeVisible();
    await expect(page.getByText(/ejemplo más parecido/)).toBeVisible();
    await page.getByRole("link", { name: /← Dividir/ }).click();
    await expect(page.getByTestId(ids.dividir.monto)).toBeVisible();
  });

  test("no estorba el flujo normal: el monto sigue siendo lo primero y confirmar no cambia", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await expect(page.getByTestId(ids.dividir.monto)).toBeFocused();
    await page.getByTestId(ids.dividir.monto).fill("600");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeEnabled();
  });
});
