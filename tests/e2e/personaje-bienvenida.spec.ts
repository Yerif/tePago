import { expect, test } from "@playwright/test";

test.describe("Conoce a tu personaje (PX-11)", () => {
  test("tres pasos: el personaje cambia según cómo pagas, se gana XP y qué ve tu banda", async ({ page }) => {
    await page.goto("/dev/demo?u=ana&bienvenida=1");
    const dialogo = page.getByTestId("bienvenida");
    await expect(dialogo).toContainText("Hola, Ana");
    await expect(dialogo.getByTestId("bienvenida-paso")).toContainText("1 de 3");
    await expect(dialogo.locator("img")).toHaveCount(3); // los tres climas de su personaje
    await expect(dialogo).toContainText("Bajo la lluvia");
    await dialogo.getByTestId("bienvenida-siguiente").click();
    await expect(dialogo).toContainText("XP cada vez que saldas una deuda");
    await dialogo.getByTestId("bienvenida-siguiente").click();
    await expect(dialogo).toContainText("Tu banda ve tu personaje, tu nivel, tus badges y tu saldo del grupo");
    await dialogo.getByTestId("bienvenida-empezar").click();
    await expect(dialogo).toHaveCount(0);
  });

  test("se puede saltar y «Elegir mi personaje» lleva a Yo", async ({ page }) => {
    await page.goto("/dev/demo?u=ana&bienvenida=1");
    await page.getByTestId("bienvenida-saltar").click();
    await expect(page.getByTestId("bienvenida")).toHaveCount(0);
    await page.goto("/dev/demo?u=ana&bienvenida=1");
    await page.getByTestId("bienvenida-siguiente").click();
    await page.getByTestId("bienvenida-siguiente").click();
    await page.getByTestId("bienvenida-elegir").click();
    await expect(page).toHaveURL(/\/dev\/demo\/yo\?u=ana/);
  });

  test("a una persona real (no automatizada) se le muestra la primera vez y ya no se repite", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
    await page.goto("/dev/demo?u=ferni");
    await expect(page.getByTestId("bienvenida")).toBeVisible();
    await page.getByTestId("bienvenida-saltar").click();
    await page.reload();
    await expect(page.getByTestId("bienvenida")).toHaveCount(0);
  });

  test("los navegadores automatizados no la ven sola: no estorba a las demás pruebas", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    await expect(page.getByTestId("bienvenida")).toHaveCount(0);
  });

  test("desde «Herramientas de prueba» se puede volver a ver", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    await page.getByTestId("herramientas-demo").locator("summary").click();
    await page.getByTestId("demo-bienvenida").click();
    await expect(page.getByTestId("bienvenida")).toBeVisible();
  });
});
