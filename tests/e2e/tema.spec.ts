import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("tema claro/oscuro (UX2-09)", () => {
  test("se cambia desde Yo → Ajustes con un texto claro, y ya no vive en el Home del grupo", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    const ajustes = page.getByTestId(ids.yo.ajustes);
    await expect(ajustes).toContainText("Pasar a tema claro"); // dark es el default
    await expect(page.locator("html")).toHaveClass(/dark/);
    await ajustes.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(ajustes).toContainText("Pasar a tema oscuro");
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/); // se recuerda

    await page.goto("/dev/demo/g/oaxaca?u=ana");
    await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  });
});
