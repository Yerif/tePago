import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

// Lo que ve una persona probando no debe traer jerga de desarrollo (UX2-07). Las "Herramientas de prueba" plegadas no cuentan.
const JERGA = /Supabase|llamadas a la API|evals\/|\(demo\)|← Demo/;
const PANTALLAS = ["/", "/dev/demo?u=ana", "/dev/demo/dividir?u=ana", "/dev/demo/grupos?u=ana", "/dev/demo/g/oaxaca?u=ana", "/dev/demo/g/oaxaca/detalle?u=ana", "/dev/demo/yo?u=ana"];

test.describe("sin jerga de desarrollo en el producto", () => {
  for (const ruta of PANTALLAS) {
    test(ruta, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      expect(await page.locator("body").innerText()).not.toMatch(JERGA);
    });
  }

  test("al guardar un gasto el aviso no dice «demo»", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await page.getByTestId(ids.dividir.monto).fill("600");
    await page.getByTestId(ids.dividir.confirmar).click();
    await expect(page.getByTestId(ids.dividir.aviso)).toContainText("¡Listo!");
    await expect(page.getByTestId(ids.dividir.aviso)).not.toContainText(/demo/i);
  });

  test("lo que llega desde «Cuéntalo con tus palabras» no trae jerga", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await page.getByTestId(ids.dividir.frase).fill("cena 840");
    await page.getByTestId(ids.dividir.enviarFrase).click();
    expect(await page.locator("body").innerText()).not.toMatch(JERGA);
  });

  test("la portada dice la verdad sobre lo que se guarda", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("se guardan en este navegador");
    await expect(page.locator("body")).not.toContainText("nada se guarda");
  });
});
