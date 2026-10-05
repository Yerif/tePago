import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("flujos críticos del demo", () => {
  test("dividir un gasto simple en 3 interacciones", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(ids.inicio.dividir).click(); // 1
    await page.getByTestId(ids.dividir.monto).fill("850"); // 2
    await page.getByTestId(ids.dividir.confirmar).click(); // 3
    await expect(page.getByTestId(ids.dividir.aviso)).toBeVisible();
    await expect(page.getByTestId(ids.dividir.guardados)).toContainText("$850.00");
  });

  test("confirmar lo que entendió la app y guardar", async ({ page }) => {
    await page.goto("/dev/demo/ia?c=b1-05-cena-detalle");
    await expect(page.getByTestId(ids.confirmar.resultado)).toBeVisible();
    await page.getByTestId(ids.confirmar.confirmar).click();
    await expect(page.getByTestId(ids.confirmar.guardado)).toBeVisible();
  });

  test("saldar: un abono no da XP; pagar todo sí y el personaje reacciona", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Deteriorado");

    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("100");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.reaccion)).toContainText("Te faltan $210.00");
    await expect(page.getByTestId(ids.saldar.xp)).toHaveCount(0);

    await page.getByTestId(ids.saldar.todo("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.xp)).toHaveText("+50 XP ⚡");

    await page.getByTestId(ids.saldar.todo("beto", "caro")).click();
    await page.getByTestId(ids.saldar.todo("beto", "ana")).click();
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Radiante");
  });

  test("saldar valida el monto", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("12.345");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.error)).toContainText("monto válido");
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("99999");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.error)).toContainText("no pagues de más");
  });
});
