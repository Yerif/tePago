import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("guardar un gasto se nota (UX2-02)", () => {
  test("el aviso se ve sin scroll, el gasto aparece en el grupo y la XP del Inicio sube lo que dice", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const xpAntes = await page.getByTestId("xp-valor").first().innerText();

    await page.goto("/dev/demo/dividir?u=ana");
    await page.getByTestId(ids.dividir.monto).fill("850");
    await page.getByTestId("dividir-descripcion").fill("Tacos de prueba");
    await page.getByTestId(ids.dividir.confirmar).click();

    const aviso = page.getByTestId(ids.dividir.aviso);
    await expect(aviso).toContainText("¡Listo! Guardado en Viaje a Oaxaca · +10 XP");
    const caja = await aviso.boundingBox();
    expect(caja).toBeTruthy();
    if (caja) expect(caja.y + caja.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0); // a la vista, sin scroll

    await page.getByTestId(ids.dividir.verGrupo).click();
    await expect(page.getByText("Tacos de prueba").first()).toBeVisible(); // aparece en el grupo

    await page.goto("/dev/demo?u=ana");
    const xpDespues = await page.getByTestId("xp-valor").first().innerText();
    expect(Number(xpDespues.match(/\d+/)?.[0]) - Number(xpAntes.match(/\d+/)?.[0])).toBe(10);
  });

  test("un gasto de una sola persona no da XP y el aviso no la promete", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await page.getByTestId(ids.dividir.monto).fill("100");
    for (const id of ["ferni", "caro", "beto"]) await page.getByTestId(`miembro-${id}`).click();
    await page.getByTestId(ids.dividir.confirmar).click();
    await expect(page.getByTestId(ids.dividir.aviso)).toContainText("¡Listo!");
    await expect(page.getByTestId(ids.dividir.aviso)).not.toContainText("XP");
  });
});
