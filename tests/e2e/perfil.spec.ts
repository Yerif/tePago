import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("pestaña Yo: editar nombre y personaje", () => {
  test("cambiar el nombre se ve en toda la app y para los demás", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await expect(page.getByTestId(ids.perfil.actual)).toHaveText("Ana");
    await page.getByTestId(ids.perfil.nombre).fill("  Anita   Banana ");
    await page.getByTestId(ids.perfil.guardar).click();
    await expect(page.getByTestId(ids.perfil.actual)).toHaveText("Anita Banana");
    await expect(page.getByTestId(ids.perfil.guardado)).toContainText("Anita Banana");

    // En su inicio…
    await page.goto("/dev/demo?u=ana");
    await expect(page.getByRole("heading", { name: /Hola, Anita Banana/ })).toBeVisible();
    // …y cuando paga, Nico ve el nombre nuevo.
    await page.getByTestId(ids.cuenta.pagar("nico")).click();
    await page.getByTestId(ids.hoja.confirmar).click();
    await page.goto("/dev/demo?u=nico");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Anita Banana dice que ya te pagó");
  });

  test("el nombre se valida: no vacío y máximo 24", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await page.getByTestId(ids.perfil.nombre).fill("   ");
    await page.getByTestId(ids.perfil.guardar).click();
    await expect(page.getByTestId(ids.perfil.error)).toHaveText("Escribe tu nombre");
    await page.getByTestId(ids.perfil.nombre).fill("a".repeat(25));
    await page.getByTestId(ids.perfil.guardar).click();
    await expect(page.getByTestId(ids.perfil.error)).toHaveText("Máximo 24 letras");
    await expect(page.getByTestId(ids.perfil.actual)).toHaveText("Ana"); // no se guardó
  });

  test("cambiar de personaje se queda al recargar y no pierde nivel ni badges", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await expect(page.getByTestId(ids.perfil.base("oso"))).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId(ids.perfil.base("gato")).click();
    await expect(page.getByTestId(ids.perfil.guardado)).toContainText("Gato");
    await expect(page.getByTestId(ids.perfil.base("gato"))).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId(ids.perfil.base("oso"))).toHaveAttribute("aria-pressed", "false");

    await page.reload();
    await expect(page.getByTestId(ids.perfil.base("gato"))).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("mis-badges")).toContainText("Jardinero");
    await expect(page.getByTestId("skin-jardinero")).toBeEnabled(); // las skins siguen siendo suyas
    await expect(page.getByTestId("xp-nivel")).toHaveText("Nivel 3");
  });

  test("«Reiniciar» también borra los perfiles editados", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await page.getByTestId(ids.perfil.nombre).fill("Nana");
    await page.getByTestId(ids.perfil.guardar).click();
    await page.goto("/dev/demo?u=ana");
    await page.getByTestId(ids.pagos.herramientas).locator("summary").click();
    await page.getByTestId(ids.pagos.reiniciar).click();
    await expect(page.getByRole("heading", { name: /Hola, Ana/ })).toBeVisible();
  });
});
