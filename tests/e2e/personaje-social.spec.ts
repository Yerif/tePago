import { expect, test } from "@playwright/test";

test.describe("reputación pública con humor, sin exhibir (PX-07)", () => {
  test("El grupo: una sola señal negativa por persona (Fantasma o clima), lo positivo primero y montos de otros en neutro", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca?u=ana");
    const beto = page.getByTestId("friend-beto"); // bajo la lluvia + Fantasma + debe
    await expect(beto.getByTestId("friend-badge-fantasma")).toBeVisible();
    await expect(beto.getByTestId("friend-estado")).toHaveCount(0); // no se apila "Bajo la lluvia" sobre el Fantasma
    await expect(beto.getByTestId("friend-fantasma-hint")).toHaveText("Se esfuma al pagar 🌬️");
    const colorTexto = await page.evaluate(() => getComputedStyle(document.body).color);
    await expect(beto.getByTestId("friend-balance")).toHaveCSS("color", colorTexto); // neutro, no rojo

    const ferni = page.getByTestId("friend-ferni"); // radiante con badges positivos
    await expect(ferni.getByTestId("friend-estado")).toHaveText("Radiante");
    await expect(ferni.getByTestId("friend-fantasma-hint")).toHaveCount(0);
  });

  test("sin Fantasma, el clima es la única señal y se dice con palabras de clima", async ({ page }) => {
    await page.goto("/dev/demo/g/playa?u=ana");
    await expect(page.getByTestId("friend-nico").getByTestId("friend-estado")).toHaveText("Nublado");
    await expect(page.getByTestId("friend-rafa").getByTestId("friend-estado")).toHaveCount(0); // Rafa tiene Fantasma
    await expect(page.getByTestId("friend-rafa").getByTestId("friend-badge-fantasma")).toBeVisible();
  });

  test("tu propio monto sí lleva color", async ({ page }) => {
    await page.goto("/dev/demo/g/playa?u=ana"); // Ana debe en la playa
    const colorTexto = await page.evaluate(() => getComputedStyle(document.body).color);
    const color = await page.getByTestId("friend-ana").getByTestId("friend-balance").evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe(colorTexto);
  });

  test("avatares neutros donde no se habla de reputación: Dividir muestra a Ana radiante aunque esté bajo la lluvia", async ({ page }) => {
    await page.goto("/dev/demo/dividir?u=ana");
    await expect(page.getByTestId("miembro-ana").locator("img")).toHaveAttribute("src", /oso-clean\.png/);
    await expect(page.getByTestId("miembro-beto").locator("img")).toHaveAttribute("src", /rana-clean\.png/);
  });
});

test.describe("las skins que ganaste las ve el grupo (PX-09)", () => {
  test("un sello con el accesorio sobre la miniatura en El grupo y en el Inicio; sin skin no hay sello", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca?u=ana");
    await expect(page.getByTestId("friend-ana").getByTestId("avatar-skin")).toHaveText("👒"); // Jardinero
    await expect(page.getByTestId("friend-ferni").getByTestId("avatar-skin")).toHaveText("🧭"); // Explorador
    await expect(page.getByTestId("friend-caro").getByTestId("avatar-skin")).toHaveCount(0); // Clásico
    await page.goto("/dev/demo?u=ana");
    await expect(page.getByTestId("inicio-te-toca").getByTestId("cuenta-pau").getByTestId("avatar-skin")).toHaveText("👒");
  });
});

test.describe("Tu camino: la meta siempre visible y en números (PX-08)", () => {
  test("nivel, skin, semana limpia y cómo se gana cada badge", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await expect(page.getByTestId("camino-nivel")).toContainText("Nivel 4: faltan 130 XP");
    await expect(page.getByTestId("camino-skin")).toContainText("Explorador (nivel 5): faltan 455 XP");
    await expect(page.getByTestId("camino-semana")).toContainText("salda tus 7 deudas");
    await expect(page.getByTestId("camino-badge-jardinero")).toContainText("✅");
    await expect(page.getByTestId("camino-badge-alcalde")).toContainText("10 pagos a tiempo");
    await expect(page.getByTestId("camino-badge-alcalde")).toContainText("▫️");
    await expect(page.getByTestId("camino-badge-fantasma")).toContainText("se esfuma al pagar");
  });

  test("al saldar todo, la semana limpia dice que vas bien", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ferni"); // Ferni no debe nada
    await expect(page.getByTestId("camino-semana")).toContainText("vas bien, sin deudas");
  });
});
