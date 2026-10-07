import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("Yo reordenada: el personaje primero (PX-05)", () => {
  test("al abrir, ves tu personaje 3D, tu nivel, tu XP y la próxima meta, sin hacer scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dev/demo/yo?u=ana");
    const heroe = page.getByTestId(ids.yo.heroe);
    await expect(heroe.getByTestId(ids.personaje.raiz)).toBeInViewport({ ratio: 1 });
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(heroe.getByTestId("xp-nivel")).toBeInViewport();
    await expect(page.getByTestId(ids.yo.meta)).toBeInViewport();
    await expect(page.getByTestId(ids.yo.meta)).toContainText("Explorador (nivel 5) · faltan 455 XP");
  });

  test("«Probar como» ya no está en el flujo: vive plegado en las herramientas de prueba", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await expect(page.getByTestId(ids.pagos.herramientas)).not.toHaveAttribute("open", "");
    await expect(page.getByTestId("probar-nico")).toBeHidden();
    await page.getByTestId(ids.pagos.herramientas).locator("summary").click();
    await expect(page.getByTestId("probar-nico")).toBeVisible();
  });

  test("elegir un animal cambia el héroe en el mismo lugar (y brinca); los del selector se ven siempre radiantes", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana"); // Ana está bajo la lluvia
    const personaje = page.getByTestId(ids.yo.heroe).getByTestId(ids.personaje.raiz);
    await expect(personaje).toHaveAttribute("aria-label", "Personaje Oso");
    await page.getByTestId(ids.perfil.base("zorro")).click();
    await expect(personaje).toHaveAttribute("aria-label", "Personaje Zorro");
    await expect(personaje).toHaveAttribute(ids.personaje.celebraciones, "1");
    await expect(page.getByTestId(ids.perfil.base("gato")).locator("img")).toHaveAttribute("src", /gato-clean\.png/); // neutro: sin lluvia ni aro de estado
  });

  test("una skin bloqueada se puede probar 3 s sin activarla ni guardarla", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana"); // Ana tiene Jardinero; Explorador pide nivel 5
    await expect(page.getByTestId(ids.yo.skinActiva)).toHaveText("Jardinero");
    await expect(page.getByTestId("skin-explorador")).toBeDisabled();
    await page.getByTestId(ids.yo.probar("explorador")).click();
    await expect(page.getByTestId(ids.yo.skinActiva)).toHaveText("Explorador · vista previa");
    await expect(page.getByTestId("skin-explorador")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId(ids.yo.skinActiva)).toHaveText("Jardinero", { timeout: 6000 }); // vuelve sola
  });

  test("«Así te ve tu banda» dice qué ven los demás", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    const banda = page.getByTestId(ids.yo.banda);
    await expect(banda).toContainText("Tu banda ve tu personaje, tu nivel, tus badges y tu saldo del grupo");
    await expect(banda.getByTestId("mis-badges")).toContainText("Jardinero");
  });
});
