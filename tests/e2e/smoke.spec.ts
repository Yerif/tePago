import { expect, test, type Page } from "@playwright/test";
import { ids } from "./selectors";

/** Los modos distintos de "igual" viven tras "Otras formas de dividir". */
async function elegirModo(page: Page, modo: string) {
  const chip = page.getByTestId(ids.modos.modo(modo));
  if (!(await chip.isVisible())) await page.getByTestId(ids.modos.otras).click();
  await chip.click();
}

test.describe("flujos críticos del demo", () => {
  test("dividir un gasto simple en 3 interacciones", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(ids.inicio.dividir).click(); // 1
    await page.getByTestId(ids.dividir.monto).fill("850"); // 2
    await page.getByTestId(ids.dividir.confirmar).click(); // 3
    await expect(page.getByTestId(ids.dividir.aviso)).toBeVisible();
    await expect(page.getByTestId(ids.dividir.guardados)).toContainText("$850.00");
  });

  test("montos: avisa cuánto falta, deja guardar y el pagador absorbe lo que quedó sin asignar", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await elegirModo(page, "montos");
    await page.getByTestId(ids.modos.valor("ana")).fill("300");
    await page.getByTestId(ids.modos.valor("beto")).fill("200");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Faltan $500.00");
    await expect(page.getByTestId(ids.modos.sinAsignar)).toContainText("$500.00");
    await page.getByTestId(ids.dividir.confirmar).click();
    await page.getByTestId(ids.modos.absorber(1)).click();
    await expect(page.getByTestId(ids.dividir.guardados)).toContainText("absorbió $500.00");
  });

  test("montos: pasarse del total bloquea guardar", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("100");
    await elegirModo(page, "montos");
    await page.getByTestId(ids.modos.valor("ana")).fill("150");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Te pasaste $50.00");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeDisabled();
  });

  test("porcentajes: deben sumar 100 y hay atajo para repartir lo que falta", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await elegirModo(page, "porcentajes");
    await page.getByTestId(ids.modos.valor("ana")).fill("50");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Llevan 50 %");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeDisabled();
    await page.getByTestId(ids.modos.completar).click();
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Suma 100 %");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$500.00");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeEnabled();
  });

  test("partes y ajustes; al cambiar de modo se conserva lo capturado", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("700");
    await elegirModo(page, "partes");
    await page.getByTestId(ids.modos.valor("ana")).fill("3");
    await page.getByTestId(ids.modos.valor("beto")).fill("2");
    await page.getByTestId(ids.modos.valor("caro")).fill("2");
    await page.getByTestId(ids.modos.valor("ferni")).fill("0");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$300.00");
    await elegirModo(page, "ajustes");
    await elegirModo(page, "partes");
    await expect(page.getByTestId(ids.modos.valor("ana"))).toHaveValue("3");
  });

  test("por producto: lo que pidió uno solo se le carga a él y lo demás se reparte", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await elegirModo(page, "producto");
    await page.getByTestId(ids.modos.productoNombre).fill("Postre");
    await page.getByTestId(ids.modos.productoPrecio).fill("200");
    await page.getByTestId(ids.modos.productoQuien("beto")).click();
    await page.getByTestId(ids.modos.productoAgregar).click();
    // 800 restantes entre 4 = 200 c/u; Beto además el postre.
    await expect(page.getByTestId(ids.modos.parte("beto"))).toContainText("$400.00");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$200.00");
  });

  test("confirmar lo que entendió la app y guardar", async ({ page }) => {
    await page.goto("/dev/demo/ia?c=b1-05-cena-detalle");
    await expect(page.getByTestId(ids.confirmar.resultado)).toBeVisible();
    await page.getByTestId(ids.confirmar.confirmar).click();
    await expect(page.getByTestId(ids.confirmar.guardado)).toBeVisible();
  });

});
