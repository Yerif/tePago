import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("Dividir: el reparto se ve junto al botón (UX2-01)", () => {
  test("sin monto el botón dice qué falta; con monto, la línea de reparto y el botón se ven sin scroll y sin tapar", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    const boton = page.getByTestId(ids.dividir.confirmar);
    await expect(boton).toBeDisabled();
    await expect(boton).toHaveText("Escribe el monto");

    await page.getByTestId(ids.dividir.monto).fill("850");
    const resumen = page.getByTestId(ids.dividir.resumen);
    await expect(resumen).toContainText("c/u");
    await expect(boton).toHaveText("Confirmar gasto");
    await expect(boton).toBeEnabled();

    // Todo a la vista, por encima de la barra inferior.
    const nav = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
    const r = await resumen.boundingBox();
    const b = await boton.boundingBox();
    const alto = page.viewportSize()?.height ?? 0;
    expect(nav && r && b).toBeTruthy();
    if (nav && r && b) {
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y + r.height).toBeLessThanOrEqual(b.y);
      expect(b.y + b.height).toBeLessThanOrEqual(nav.y + 1);
      expect(nav.y + nav.height).toBeLessThanOrEqual(alto + 1);
    }
  });
});
